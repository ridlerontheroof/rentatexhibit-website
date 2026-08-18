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
 */
export function isKnownNoise(v: CspViolation): boolean {
  const directive = v.effectiveDirective.toLowerCase();
  const blocked = v.blockedUri.trim();

  // eval in script-src — browser-extension noise, not a site or GTM issue.
  if (blocked.toLowerCase() === "eval") return true;

  // Inline script injected by eval'd (extension/webview) code — noise.
  // Only suppressed when the reported source is eval code; inline violations
  // without that fingerprint (e.g. a GTM tag missing its hash) still alert.
  if (
    blocked.toLowerCase() === "inline" &&
    /(^|\s)eval code$/.test((v.sourceFile ?? "").trim().toLowerCase())
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
): Promise<void> {
  const signature = violationSignature(violation);
  log.warn(
    {
      signature,
      effectiveDirective: violation.effectiveDirective,
      blockedUri: violation.blockedUri.slice(0, 256),
      documentUri: violation.documentUri.slice(0, 256),
      sourceFile: violation.sourceFile?.slice(0, 256) ?? null,
      scriptSample: violation.scriptSample?.slice(0, 100) ?? null,
      disposition: violation.disposition,
    },
    "Visitor browser reported a CSP violation",
  );

  if (!mailerConfigured()) return;

  // Known-noise violations (country-domain ga-audiences, eval from browser
  // extensions) are already logged above; skip the alert email so they
  // don't fill the daily budget with un-actionable reports.
  if (isKnownNoise(violation)) {
    log.info({ signature }, "CSP violation suppressed as known noise");
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
  if (emailsSentToday >= CSP_ALERT_EMAIL_DAILY_MAX) return;
  emailsSentToday += 1;

  try {
    if (!(await dailyClaim.claim(log, now, { subKey: signature, logFields: { signature } }))) {
      // A repeat signature already alerted today — hand the reserved slot
      // back so dedupe losses never eat the budget for new signatures.
      emailsSentToday -= 1;
      return;
    }
    await sendCspViolationAlert({
      effectiveDirective: violation.effectiveDirective,
      blockedUri: violation.blockedUri.slice(0, 256),
      documentUri: violation.documentUri.slice(0, 256),
      sourceFile: violation.sourceFile?.slice(0, 256) ?? null,
      scriptSample: violation.scriptSample?.slice(0, 100) ?? null,
      disposition: violation.disposition,
    });
  } catch (err) {
    // The claim AND the reserved email slot are deliberately NOT released
    // on a failed send: a broken
    // mailer would otherwise burn the whole daily email budget retrying the
    // same signature, and the violation is already in the logs above. The
    // next distinct signature (or the next day) alerts again.
    log.error({ err, signature }, "Failed to send CSP violation alert email");
  }
}
