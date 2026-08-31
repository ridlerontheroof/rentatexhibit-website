import { fileURLToPath } from "node:url";
import type { Logger } from "pino";
import { createDailyClaim } from "./dailyClaim";
import { mailerConfigured } from "./mailer";
import { sendCspViolationAlert } from "./email";

/**
 * Real-visitor CSP violation alerting.
 *
 * The prepublish check (exhibit-on-superior scripts/check-csp-violations.mjs)
 * can only exercise the pages as built. A GTM container change published
 * later (e.g. a marketer adds a "Custom HTML" tag) injects inline scripts
 * only in production, after the check has passed — and with the CSP
 * enforced, the browser silently blocks them for every visitor. The serving
 * layer therefore points the policy's `report-uri`/`report-to` at
 * POST /api/csp-reports (routes/cspReports.ts); this module turns those
 * reports into logs and a deduped operational email.
 *
 * Dedupe/rate-limiting has three layers:
 *  1. The route caps how many reports it processes per minute (an attacker
 *     can POST arbitrary "reports"; the endpoint is unauthenticated by
 *     nature, so it must be cheap to hit and bounded in effect).
 *  2. Every processed violation is logged (warn) so the full picture lives
 *     in the api-server logs.
 *  3. Emails go out at most once per UTC day per distinct violation
 *     signature (directive + blocked origin), cluster-wide via the shared
 *     dailyClaim, AND at most CSP_ALERT_EMAIL_DAILY_MAX emails per process
 *     per day as a hard backstop against signature-rotation spam.
 *
 * Everything is best-effort and fire-and-forget: a database or mail outage
 * must never affect the visitor request that delivered the report.
 */

/** Normalized shape shared by the legacy and Reporting-API report formats. */
export interface CspViolation {
  /** e.g. "script-src-elem" — the directive that blocked the load. */
  effectiveDirective: string;
  /** Blocked URL, or "inline" / "eval" for inline-script violations. */
  blockedUri: string;
  /** Page the violation happened on. */
  documentUri: string;
  /** Script/stylesheet that triggered the load, when the browser knows it. */
  sourceFile: string | null;
  /** First bytes of the offending inline script, when reported. */
  scriptSample: string | null;
  /** "enforce" or "report" — whether the browser actually blocked it. */
  disposition: string | null;
}

/** Max alert emails per process per UTC day, whatever the signatures say. */
export const CSP_ALERT_EMAIL_DAILY_MAX = 5;

/**
 * Identifies the CSP noise-classifier release in warning logs. This is scoped
 * to CSP-report evidence so a production probe can prove the API bundle that
 * handled it, without adding general deployment fingerprinting.
 */
export const CSP_ALERT_CLASSIFIER_REVISION = "csp-noise-v3";

const CSP_PROBE_PATH =
  /^\/__postpublish-csp-probe\/([A-Za-z0-9_-]{8,96})\/(known-noise|actionable)$/;
const MAX_PROBE_EVIDENCE = 32;
const PROBE_EVIDENCE_TTL_MS = 15 * 60 * 1000;

export type CspProbeKind = "known-noise" | "actionable";

export interface CspProbeEvidence {
  tag: string;
  kind: CspProbeKind;
  classifierRevision: string;
  knownNoise: boolean;
  logged: boolean;
  suppressionLogged: boolean;
  alertAttempted: boolean;
  alertSent: boolean;
  alertStatus:
    | "pending"
    | "suppressed-known-noise"
    | "mailer-unconfigured"
    | "daily-cap"
    | "deduped"
    | "sent"
    | "failed";
  capturedAt: number;
  runtime: {
    entrypoint: string;
    nodeExecutable: string;
    processArgs: string[];
    configuredEntrypoint: string | null;
    configuredClassifierRevision: string | null;
  };
}

const probeEvidence = new Map<string, CspProbeEvidence>();

function probeEvidenceKey(probe: { tag: string; kind: CspProbeKind }): string {
  return `${probe.tag}:${probe.kind}`;
}

/** Extract the opt-in post-publish probe marker from a report document URL. */
export function cspProbeFromDocumentUri(
  documentUri: string,
): { tag: string; kind: CspProbeKind } | null {
  try {
    const url = new URL(documentUri);
    const match = url.pathname.match(CSP_PROBE_PATH);
    if (!match) return null;
    return { tag: match[1], kind: match[2] as CspProbeKind };
  } catch {
    return null;
  }
}

/** Runtime provenance included with probe evidence, without exposing env vars. */
export function cspRuntimeEvidence(): CspProbeEvidence["runtime"] {
  return {
    entrypoint: fileURLToPath(import.meta.url),
    nodeExecutable: process.execPath,
    processArgs: process.argv.slice(1),
    configuredEntrypoint: process.env["API_RUNTIME_EXPECTED_ENTRYPOINT"] ?? null,
    configuredClassifierRevision:
      process.env["API_CSP_CLASSIFIER_REVISION"] ?? null,
  };
}

function rememberProbeEvidence(
  violation: CspViolation,
  patch: Partial<CspProbeEvidence> = {},
): CspProbeEvidence | null {
  const probe = cspProbeFromDocumentUri(violation.documentUri);
  if (!probe) return null;
  const key = probeEvidenceKey(probe);

  const now = Date.now();
  for (const [tag, evidence] of probeEvidence) {
    if (now - evidence.capturedAt > PROBE_EVIDENCE_TTL_MS) {
      probeEvidence.delete(tag);
    }
  }
  while (probeEvidence.size >= MAX_PROBE_EVIDENCE) {
    const oldest = probeEvidence.keys().next().value;
    if (!oldest) break;
    probeEvidence.delete(oldest);
  }

  const existing = probeEvidence.get(key);
  const evidence: CspProbeEvidence = {
    tag: probe.tag,
    kind: probe.kind,
    classifierRevision: CSP_ALERT_CLASSIFIER_REVISION,
    knownNoise: isKnownNoise(violation),
    logged: false,
    suppressionLogged: false,
    alertAttempted: false,
    alertSent: false,
    alertStatus: "pending",
    capturedAt: now,
    runtime: cspRuntimeEvidence(),
    ...existing,
    ...patch,
  };
  probeEvidence.delete(key);
  probeEvidence.set(key, evidence);
  return evidence;
}

/** Return bounded evidence for a tagged post-publish probe on this process. */
export function getCspProbeEvidence(
  tag: string,
  kind: CspProbeKind,
): CspProbeEvidence | null {
  const key = probeEvidenceKey({ tag, kind });
  const evidence = probeEvidence.get(key);
  if (!evidence) return null;
  if (Date.now() - evidence.capturedAt > PROBE_EVIDENCE_TTL_MS) {
    probeEvidence.delete(key);
    return null;
  }
  return evidence;
}

const dailyClaim = createDailyClaim({
  prefix: "cspreport",
  claimFailedMessage:
    "CSP-report alert database claim failed; falling back to in-memory dedupe",
});

/** Per-process daily email counter (the hard backstop). */
let emailDay = "";
let emailsSentToday = 0;

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * Reduce a blocked URI to a stable signature component: inline/eval keywords
 * stay as-is, URLs collapse to their origin (query strings and cache-busting
 * paths must not split the dedupe), garbage becomes "invalid".
 */
export function blockedUriSignature(blockedUri: string): string {
  const v = blockedUri.trim();
  if (v === "" ) return "empty";
  if (!v.includes(":") || /^(inline|eval|wasm-eval|data|blob|about)$/i.test(v)) {
    return v.toLowerCase().slice(0, 64);
  }
  try {
    return new URL(v).origin.toLowerCase();
  } catch {
    return "invalid";
  }
}

/** Dedupe signature: directive + blocked origin/keyword. */
export function violationSignature(v: CspViolation): string {
  return `${v.effectiveDirective.toLowerCase()}|${blockedUriSignature(v.blockedUri)}`;
}

/**
 * A report without a blocked URL/keyword cannot identify what failed and is
 * therefore not actionable by the leasing-site team. Some legacy user agents
 * emit this incomplete shape with the entire policy in `violated-directive`
 * and no `blocked-uri`. Keep it in the warning log for evidence, but do not
 * spend an operational email slot on it.
 */
export function hasActionableBlockedResource(v: CspViolation): boolean {
  return v.blockedUri.trim() !== "";
}

/**
 * Returns true for violations that are known-acceptable noise: still logged
 * at warn level for full observability, but not emailed to the operational
 * inbox. Adding a violation here must always include a rationale comment.
 *
 * Country-domain ga-audiences (connect-src): Google's remarketing tag pings
 * the visitor's country-specific Google domain (e.g. www.google.ie,
 * www.google.com.ph). CSP source lists cannot wildcard across ccTLDs, and
 * enumerating every country TLD is fragile. We accept the loss of
 * cross-country remarketing signal and suppress these daily alerts. The fix
 * is deliberate policy, not a code gap — see the connect-src comment in
 * artifacts/exhibit-on-superior/server/index.mjs.
 *
 * eval in script-src: reports with blockedUri "eval" and no source file are
 * browser-extension noise. Extensions inject eval'd code into the page JS
 * environment; the site itself and every GTM tag intentionally avoid eval.
 * No GTM Custom HTML tag known to be in the container uses eval.
 *
 * inline blocked with an eval-code source: reports with blockedUri "inline"
 * whose sourceFile is "eval code" / "sandbox eval code" are inline scripts
 * INJECTED BY eval'd extension or in-app-webview code (seen from Google
 * Business Profile in-app browser visits), not site markup. The site's own
 * inline scripts are hash-allowlisted and verified by check:csp and the
 * post-publish hydrated-SEO checks. A genuinely missing GTM tag hash reports
 * with no eval-code sourceFile and still alerts.
 *
 * Browser-extension locations: browsers may identify an extension either in
 * sourceFile or blockedUri, using chrome-extension://, moz-extension://, or
 * safari-web-extension://. Some Chrome reports shorten sourceFile to exactly
 * "chrome-extension". The extension location is conclusive visitor-side
 * evidence, so keep every resource blocked and suppress only its email.
 *
 * Google Translate stylesheet: browser-based Google Translate can inject the
 * exact https://www.gstatic.com/_/translate_http/.../*.css stylesheet. The
 * site does not depend on Google Translate, so keep that visitor-side
 * stylesheet blocked and suppress only its operational alert. This remains
 * deliberately narrower than all gstatic resources or Google-hosted styles.
 *
 * Meta Pixel script fetched through connect-src: the site and its published
 * GTM container do not contain Meta Pixel. A real Pixel loader also inserts
 * fbevents.js as a script, which browsers govern with script-src, not
 * connect-src. The exact connect-src report for the standard loader URL is
 * therefore visitor-side injection. Keep Facebook blocked and suppress only
 * that directive-and-URL pairing; a future real Pixel tag would still alert
 * under script-src until deliberately reviewed and allowlisted.
 */
export function isKnownNoise(v: CspViolation): boolean {
  const directive = v.effectiveDirective.toLowerCase();
  const blocked = v.blockedUri.trim();
  const source = (v.sourceFile ?? "").trim().toLowerCase();

  // eval in script-src — browser-extension noise, not a site or GTM issue.
  if (blocked.toLowerCase() === "eval") return true;

  // Browser-extension injection — the non-site scheme may appear in either
  // field. Keep the resource blocked; only suppress its un-actionable alert.
  const extensionLocation =
    /^(?:chrome-extension|moz-extension|safari-web-extension):\/\//;
  if (
    source === "chrome-extension" ||
    extensionLocation.test(source) ||
    extensionLocation.test(blocked.toLowerCase())
  ) {
    return true;
  }

  // Google Translate stylesheet injection — browser translation is an
  // optional visitor-side behavior, not a site dependency. Match the exact
  // HTTPS host/path plus a CSS resource, never arbitrary gstatic resources or
  // other Google-hosted stylesheets.
  if (directive === "style-src-elem") {
    try {
      const url = new URL(blocked);
      if (
        url.protocol === "https:" &&
        url.hostname.toLowerCase() === "www.gstatic.com" &&
        url.pathname.startsWith("/_/translate_http/") &&
        url.pathname.endsWith(".css")
      ) {
        return true;
      }
    } catch {
      // Non-URL blocked-uri values are handled by the other classifiers.
    }
  }

  // Visitor-side Meta Pixel injection fetched as data rather than loaded as a
  // script. Match the exact directive and canonical loader URL only; do not
  // suppress Meta scripts, beacons, other locales, or query-string variants.
  if (
    directive === "connect-src" &&
    blocked === "https://connect.facebook.net/en_US/fbevents.js"
  ) {
    return true;
  }

  // Inline script injected by eval'd (extension/webview) code — noise.
  // Only suppressed when the reported source is eval code; inline violations
  // without that fingerprint (e.g. a GTM tag missing its hash) still alert.
  if (
    blocked.toLowerCase() === "inline" &&
    /(^|\s)eval code$/.test(source)
  ) {
    return true;
  }

  // Country-domain ga-audiences: connect-src blocked on www.google.<ccTLD>
  // or google.<ccTLD>. Exclude .com (allowed in CSP) and google-analytics.com
  // (a separate allowlisted host).
  if (directive === "connect-src") {
    const isGoogleCountryDomain =
      /^https:\/\/(www\.)?google\.[a-z]/.test(blocked) &&
      !/^https:\/\/(www\.)?google\.com(\/|$)/.test(blocked) &&
      !/^https:\/\/(www\.)?google-/.test(blocked);
    if (isGoogleCountryDomain) return true;
  }

  return false;
}

/** Test-only: reset the per-process email counter and claim fallback. */
export function resetCspReportAlertState(): void {
  emailDay = "";
  emailsSentToday = 0;
  dailyClaim.reset();
  probeEvidence.clear();
}

/**
 * Record one normalized CSP violation report: log it, and — first sighting
 * of this signature today, under the daily email cap — email the
 * operational inbox. Never throws; call fire-and-forget from the route.
 */
export async function recordCspViolation(
  log: Logger,
  now: number,
  violation: CspViolation,
  options: { bypassAlertCap?: boolean } = {},
): Promise<void> {
  const signature = violationSignature(violation);
  const knownNoise = isKnownNoise(violation);
  rememberProbeEvidence(violation);
  log.warn(
    {
      signature,
      classifierRevision: CSP_ALERT_CLASSIFIER_REVISION,
      knownNoise,
      effectiveDirective: violation.effectiveDirective,
      blockedUri: violation.blockedUri.slice(0, 256),
      documentUri: violation.documentUri.slice(0, 256),
      sourceFile: violation.sourceFile?.slice(0, 256) ?? null,
      scriptSample: violation.scriptSample?.slice(0, 100) ?? null,
      disposition: violation.disposition,
    },
    "Visitor browser reported a CSP violation",
  );
  rememberProbeEvidence(violation, { logged: true });

  // A report without a blocked resource cannot identify what failed — keep
  // it in the warning log above for evidence but do not spend an email slot.
  if (!hasActionableBlockedResource(violation)) {
    log.info(
      { signature },
      "CSP violation email suppressed because the browser did not report the blocked resource",
    );
    rememberProbeEvidence(violation, {
      suppressionLogged: true,
      alertStatus: "suppressed-known-noise",
    });
    return;
  }

  // Known-noise violations (country-domain ga-audiences, eval from browser
  // extensions) are already logged above; skip the alert email so they
  // don't fill the daily budget with un-actionable reports.
  if (knownNoise) {
    log.info({ signature }, "CSP violation suppressed as known noise");
    rememberProbeEvidence(violation, {
      suppressionLogged: true,
      alertStatus: "suppressed-known-noise",
    });
    return;
  }

  if (!mailerConfigured()) {
    rememberProbeEvidence(violation, { alertStatus: "mailer-unconfigured" });
    return;
  }

  // Hard per-process daily cap first — cheaper than the DB claim, and it
  // bounds the damage of an attacker rotating signatures. The slot is
  // reserved SYNCHRONOUSLY (before any await): concurrent violations in one
  // batch would otherwise all read the counter below the cap, each win a
  // distinct dedupe claim, and blow past the bound together.
  const day = utcDay(now);
  if (emailDay !== day) {
    emailDay = day;
    emailsSentToday = 0;
  }
  if (
    !options.bypassAlertCap &&
    emailsSentToday >= CSP_ALERT_EMAIL_DAILY_MAX
  ) {
    rememberProbeEvidence(violation, { alertStatus: "daily-cap" });
    return;
  }
  if (!options.bypassAlertCap) emailsSentToday += 1;

  try {
    if (!(await dailyClaim.claim(log, now, { subKey: signature, logFields: { signature } }))) {
      // A repeat signature already alerted today — hand the reserved slot
      // back so dedupe losses never eat the budget for new signatures.
      if (!options.bypassAlertCap) emailsSentToday -= 1;
      rememberProbeEvidence(violation, { alertStatus: "deduped" });
      return;
    }
    rememberProbeEvidence(violation, {
      alertAttempted: true,
      alertStatus: "pending",
    });
    await sendCspViolationAlert({
      effectiveDirective: violation.effectiveDirective,
      blockedUri: violation.blockedUri.slice(0, 256),
      documentUri: violation.documentUri.slice(0, 256),
      sourceFile: violation.sourceFile?.slice(0, 256) ?? null,
      scriptSample: violation.scriptSample?.slice(0, 100) ?? null,
      disposition: violation.disposition,
    });
    rememberProbeEvidence(violation, {
      alertAttempted: true,
      alertSent: true,
      alertStatus: "sent",
    });
  } catch (err) {
    // The claim AND the reserved email slot are deliberately NOT released
    // on a failed send: a broken
    // mailer would otherwise burn the whole daily email budget retrying the
    // same signature, and the violation is already in the logs above. The
    // next distinct signature (or the next day) alerts again.
    log.error({ err, signature }, "Failed to send CSP violation alert email");
    rememberProbeEvidence(violation, {
      alertAttempted: true,
      alertStatus: "failed",
    });
  }
}
