import { timingSafeEqual } from "node:crypto";
import express, { Router, type IRouter, type Request, type Response } from "express";
import type { Logger } from "pino";
import {
  cspProbeFromDocumentUri,
  getCspProbeEvidence,
  recordCspViolation,
  type CspProbeEvidence,
  type CspViolation,
} from "../lib/cspReportAlert";

/**
 * POST /csp-reports — receiver for browser CSP violation reports.
 *
 * The exhibit-on-superior production server points both reporting channels
 * here (`report-uri /api/csp-reports` for the legacy channel and
 * `report-to csp-endpoint` + a Reporting-Endpoints header for the modern
 * Reporting API), so a real visitor's browser blocking something the site
 * needs surfaces in the api-server logs and — deduped — in the operational
 * inbox (lib/cspReportAlert) instead of failing silently.
 *
 * Two wire formats arrive:
 *  - Legacy report-uri: `Content-Type: application/csp-report`, body
 *    `{ "csp-report": { "violated-directive": …, "blocked-uri": …, … } }`.
 *  - Reporting API: `Content-Type: application/reports+json`, body an array
 *    of `{ type: "csp-violation", body: { blockedURL, effectiveDirective,
 *    documentURL, … } }` objects (other report types may ride along and are
 *    ignored).
 *
 * The endpoint is inherently unauthenticated (browsers POST with no
 * credentials and ignore the response), so it is hardened to be cheap:
 * a small body limit, a per-request report cap, and a per-minute processing
 * cap after which reports are acknowledged but dropped.
 */

/** Max reports processed from a single request body. */
export const MAX_REPORTS_PER_REQUEST = 10;

/** Max reports processed per process per minute; the rest are dropped. */
export const MAX_REPORTS_PER_MINUTE = 60;

/**
 * Upper bound on how long a report request may spend on alert processing
 * (DB dedupe claim + SMTP send) before the response is acknowledged anyway.
 * Processing is awaited BEFORE the 204 goes out: on the autoscale runtime,
 * work left running after the response can be starved when the instance
 * idles — and a lone visitor's report during a quiet period is exactly the
 * case this endpoint exists for. Browsers fire reports asynchronously and
 * ignore the response, so holding the request open briefly costs nothing.
 * Overridable for tests.
 */
export function processingTimeoutMs(): number {
  const raw = Number(process.env.CSP_REPORT_PROCESSING_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 10_000;
}

let windowStart = 0;
let processedInWindow = 0;
let suppressionLogged = false;

/** Test-only: reset the per-minute processing window. */
export function resetCspReportWindow(): void {
  windowStart = 0;
  processedInWindow = 0;
  suppressionLogged = false;
}

function isAuthorizedProbe(req: Request): boolean {
  const expected = process.env.WATCHDOG_ALERT_TOKEN;
  const auth = req.headers.authorization;
  if (!expected || typeof auth !== "string" || !auth.startsWith("Bearer ")) {
    return false;
  }
  const token = auth.slice(7);
  if (token.length === 0 || token.length !== expected.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(token, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}

function underRateCap(log: Logger, now: number): boolean {
  if (now - windowStart >= 60_000) {
    windowStart = now;
    processedInWindow = 0;
    suppressionLogged = false;
  }
  if (processedInWindow >= MAX_REPORTS_PER_MINUTE) {
    if (!suppressionLogged) {
      suppressionLogged = true;
      log.warn(
        { cap: MAX_REPORTS_PER_MINUTE },
        "CSP report volume exceeded the per-minute cap; dropping further reports this minute",
      );
    }
    return false;
  }
  processedInWindow += 1;
  return true;
}

function setProbeEvidenceHeaders(
  res: Response,
  evidence: CspProbeEvidence,
): void {
  res.set({
    "X-CSP-Probe-Classifier-Revision": evidence.classifierRevision,
    "X-CSP-Probe-Known-Noise": String(evidence.knownNoise),
    "X-CSP-Probe-Logged": String(evidence.logged),
    "X-CSP-Probe-Suppression-Logged": String(evidence.suppressionLogged),
    "X-CSP-Probe-Alert-Status": evidence.alertStatus,
    "X-CSP-Probe-Alert-Sent": String(evidence.alertSent),
    "X-CSP-Probe-Runtime": Buffer.from(
      JSON.stringify(evidence.runtime),
      "utf8",
    ).toString("base64url"),
  });
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * `effective-directive` is a directive name, while the legacy
 * `violated-directive` fallback may contain the whole policy fragment
 * (`script-src 'self' https://…`). Normalize either shape to the directive
 * token so logs, signatures, and alerts remain stable across user agents.
 */
function directiveToken(value: unknown): string {
  return str(value).trim().split(/\s+/, 1)[0] ?? "";
}

/** Normalize one legacy `csp-report` object. Returns null when unusable. */
function fromLegacy(report: unknown): CspViolation | null {
  if (typeof report !== "object" || report === null) return null;
  const r = report as Record<string, unknown>;
  const directive =
    directiveToken(r["effective-directive"]) || directiveToken(r["violated-directive"]);
  if (!directive) return null;
  return {
    effectiveDirective: directive,
    blockedUri: str(r["blocked-uri"]),
    documentUri: str(r["document-uri"]),
    sourceFile: strOrNull(r["source-file"]),
    scriptSample: strOrNull(r["script-sample"]),
    disposition: strOrNull(r["disposition"]),
  };
}

/** Normalize one Reporting-API report object. Returns null when unusable. */
function fromReportingApi(report: unknown): CspViolation | null {
  if (typeof report !== "object" || report === null) return null;
  const r = report as Record<string, unknown>;
  if (r.type !== "csp-violation") return null;
  const body = r.body;
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const directive = directiveToken(b.effectiveDirective);
  if (!directive) return null;
  return {
    effectiveDirective: directive,
    blockedUri: str(b.blockedURL),
    documentUri: str(b.documentURL),
    sourceFile: strOrNull(b.sourceFile),
    scriptSample: strOrNull(b.sample),
    disposition: strOrNull(b.disposition),
  };
}

/** Extract every usable violation from a parsed request body. */
export function violationsFromBody(body: unknown): CspViolation[] {
  if (Array.isArray(body)) {
    return body
      .slice(0, MAX_REPORTS_PER_REQUEST)
      .map(fromReportingApi)
      .filter((v): v is CspViolation => v !== null);
  }
  if (typeof body === "object" && body !== null) {
    const legacy = fromLegacy((body as Record<string, unknown>)["csp-report"]);
    if (legacy) return [legacy];
    // Some browsers have shipped the Reporting-API body shape without the
    // array wrapper; accept a bare csp-violation object too.
    const bare = fromReportingApi(body);
    if (bare) return [bare];
  }
  return [];
}

const router: IRouter = Router();

router.post(
  "/csp-reports",
  // The app-level JSON parser only handles application/json; browsers send
  // reports as application/csp-report or application/reports+json.
  express.json({
    type: ["application/csp-report", "application/reports+json", "application/json"],
    limit: "32kb",
  }),
  async (req: Request, res: Response) => {
    const log = (req as unknown as { log: Logger }).log;
    const now = Date.now();
    const authorizedProbe = isAuthorizedProbe(req);

    const accepted: CspViolation[] = [];
    for (const violation of violationsFromBody(req.body)) {
      const probe = cspProbeFromDocumentUri(violation.documentUri);
      if (!(authorizedProbe && probe) && !underRateCap(log, now)) break;
      accepted.push(violation);
    }

    // Await processing (log + dedupe claim + email) BEFORE acknowledging,
    // bounded by a timeout so a hung SMTP/DB call cannot pin the request:
    // on autoscale, work detached from a request can be starved once the
    // response is sent, so fire-and-forget here could silently drop the
    // alert. recordCspViolation never throws.
    if (accepted.length > 0) {
      let timer: NodeJS.Timeout | undefined;
      const timedOut = await Promise.race([
        Promise.allSettled(
          accepted.map((violation) =>
            recordCspViolation(log, now, violation, {
              bypassAlertCap:
                authorizedProbe &&
                cspProbeFromDocumentUri(violation.documentUri) !== null,
            }),
          ),
        ).then(() => false),
        new Promise<true>((resolve) => {
          timer = setTimeout(() => resolve(true), processingTimeoutMs());
          timer.unref?.();
        }),
      ]);
      clearTimeout(timer);
      if (timedOut) {
        log.error(
          { reports: accepted.length, timeoutMs: processingTimeoutMs() },
          "CSP report alert processing exceeded its timeout; the alert email may not have been delivered",
        );
      }
    }

    const probe = accepted
      .map((violation) => cspProbeFromDocumentUri(violation.documentUri))
      .find((candidate) => candidate !== null);
    if (authorizedProbe && probe) {
      const evidence = getCspProbeEvidence(probe.tag, probe.kind);
      if (evidence) setProbeEvidenceHeaders(res, evidence);
    }

    // Browsers ignore the response entirely, so always acknowledge; parse
    // failures and junk shapes must not generate retry or error noise.
    res.status(204).end();
  },
);

// Body-parser failures (malformed JSON, oversized payloads) on this path are
// acknowledged like everything else: browsers ignore the response, and a
// retrying reporter observing errors would only add noise.
router.use(
  "/csp-reports",
  (err: unknown, _req: Request, res: Response, next: express.NextFunction) => {
    if (res.headersSent) return next(err);
    res.status(204).end();
  },
);

export default router;
