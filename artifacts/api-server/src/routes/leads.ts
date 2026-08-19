import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { and, eq, isNull } from "drizzle-orm";
import { CreateLeadBody, CreateLeadResponse } from "@workspace/api-zod";
import { db, leadsTable } from "@workspace/db";
import { sendLeadNotification, sendProspectConfirmation } from "../lib/email";
import { createGuestCard, listableUidFromListingUrl } from "../lib/appfolio";
import { getAvailabilitySnapshot } from "./availability";
import { inspectSubmission, withoutBotGuardFields } from "../lib/botGuard";
import { auditRawSource, auditSourceLabel, DEFAULT_LEAD_SOURCE, sanitizeLeadSource } from "../lib/leadSource";
import { recordAcceptedSubmission, recordBotRejection } from "../lib/botGuardAlert";
import { reportGuestCardFailure } from "../lib/guestCardAlert";

const router: IRouter = Router();

/**
 * Returns true when the request carries a valid QA test token.
 *
 * The bypass is authenticated via TEST_LEAD_TOKEN: a secret env var supplied
 * only to the test runner. The header value must match that secret exactly.
 * When the env var is absent or empty (the production default) this function
 * always returns false, making the bypass permanently disabled regardless of
 * any header a caller sends — a browser or proxy cannot forge what it cannot
 * know.
 */
function isValidTestRequest(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const token = process.env.TEST_LEAD_TOKEN;
  if (!token) return false; // bypass disabled; production default
  return req.headers["x-test-lead"] === token;
}

// Every accepted lead triggers two outbound emails (leasing team + prospect),
// so this endpoint is an attractive spam/abuse vector. Throttle submissions per
// client IP to keep an attacker from flooding the leasing inbox or turning the
// app into a spam cannon aimed at arbitrary third-party addresses.
const leadLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again in a minute." },
  // Skip the limiter for unit-test runs and for authenticated QA test
  // requests so they don't consume the per-IP quota or interfere with other
  // test cases that share the same module-level counter. (Same rationale as
  // the showings limiter.)
  skip: (req) =>
    process.env.NODE_ENV === "test" ||
    isValidTestRequest(req as unknown as Parameters<typeof isValidTestRequest>[0]),
});

router.post("/leads", leadLimiter, async (req, res) => {
  // Authenticated QA bypass: when the request carries a valid TEST_LEAD_TOKEN
  // secret in the X-Test-Lead header the route returns a correctly shaped 201
  // but skips every real side-effect — no DB write, no outbound emails, no
  // AppFolio guest-card push. This lets e2e / QA harnesses exercise the full
  // form flow without polluting the production lead table.
  //
  // The bypass is gated on a server-held secret (TEST_LEAD_TOKEN env var). If
  // that var is unset — the production default — isValidTestRequest() always
  // returns false, so a forged header from a browser or proxy can never
  // suppress a real visitor's lead.
  if (isValidTestRequest(req)) {
    req.log.warn(
      { ip: req.ip },
      "Authenticated QA test request; returning fake success without DB write or notifications",
    );
    res.status(201).json({
      id: 0,
      type: "contact",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: null,
      preferredDate: null,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  // Invisible bot check (honeypot + fill-time) before anything else touches
  // the submission. Detected bots get a fake success so they don't learn to
  // adapt — but nothing is stored, no email is sent, no guest card is pushed.
  const verdict = inspectSubmission(req.body);
  if (verdict.bot) {
    req.log.warn({ reason: verdict.reason }, "Rejected bot lead submission");
    // Count toward the daily heartbeat + spike alert. Fire-and-forget: a DB
    // or mail outage must never affect the fake-success response below.
    void recordBotRejection(req.log, Date.now(), "leads", verdict.reason);
    res.status(201).json({
      id: 0,
      type: "contact",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: null,
      preferredDate: null,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  const parsed = CreateLeadBody.safeParse(withoutBotGuardFields(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid submission" });
    return;
  }

  const input = parsed.data;
  // Visit-scoped attribution (UTM capture on the web app). Sanitized here —
  // the server is the trust boundary for what reaches AppFolio and the
  // leasing team's screens; anything unexpected falls back to the default.
  const source = sanitizeLeadSource(input.source);
  // Attribution audit line (one per accepted lead, PII-free): what the
  // browser actually sent vs. the sanitized label pushed to AppFolio, so a
  // wrong label in AppFolio can be pinned to client capture vs transit vs
  // sanitizer from deployment logs alone.
  req.log.info(
    {
      type: input.type,
      rawSource: auditRawSource(input.source),
      sourceLabel: auditSourceLabel(source),
    },
    "Lead-source attribution (lead submission)",
  );
  try {
    const [row] = await db
      .insert(leadsTable)
      .values({
        type: input.type,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        message: input.message ?? null,
        preferredDate: input.preferredDate ?? null,
        // Store consent in a dedicated column for clean querying and audit
        // export — no message-text parsing required.
        smsConsent: input.smsConsent ?? null,
      })
      .returning();

    const data = CreateLeadResponse.parse({
      id: row.id,
      type: row.type,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      message: row.message,
      preferredDate: row.preferredDate,
      createdAt: row.createdAt.toISOString(),
      smsConsent: row.smsConsent,
    });

    res.status(201).json(data);
    // Fire-and-forget: counts toward the heartbeat, the shared accepted-spike
    // counter, and the silence watchdog's last-accepted timestamp.
    void recordAcceptedSubmission(req.log, Date.now(), "leads");

    // response already sent to the visitor.
    const leadForEmail = {
      type: row.type,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      message: row.message,
      preferredDate: row.preferredDate,
      createdAt: row.createdAt,
      unit: input.type === "tour" || input.type === "apply" ? (input.unit ?? null) : null,
      // Shown on the leasing notification only when it's real campaign
      // attribution — the default label would just be noise on every lead.
      source: source === DEFAULT_LEAD_SOURCE ? null : source,
      // Pass consent status through so the notification email can surface it
      // clearly without the leasing team having to parse message text.
      smsConsent: row.smsConsent,
    };

    // Notify the leasing team out-of-band. This is intentionally not awaited
    // and never throws, so a mail failure cannot affect the saved lead or the
    // response already sent to the visitor. When the send succeeds we stamp
    // notifiedAt on the lead so the team can audit which leads slipped through.
    void sendLeadNotification(leadForEmail).then(async (sent) => {
      if (!sent) return;
      try {
        // Conditional stamp (notified_at IS NULL) so that if another instance
        // (e.g. the retry sweeper on a different replica) already recorded a
        // send, we don't overwrite its timestamp.
        await db
          .update(leadsTable)
          .set({ notifiedAt: new Date() })
          .where(and(eq(leadsTable.id, row.id), isNull(leadsTable.notifiedAt)));
      } catch (err) {
        req.log.error(
          { err, leadId: row.id },
          "Sent lead notification but failed to stamp notifiedAt",
        );
      }
    });

    // Acknowledge the prospect out-of-band as well. Also fire-and-forget so a
    // mail failure cannot affect the saved lead or the response already sent.
    void sendProspectConfirmation(leadForEmail);

    // When the tour request names a specific apartment, push a guest card to
    // AppFolio so the prospect arrives in the leasing team's AppFolio lead
    // queue already attached to that unit's listing (property + unit + contact
    // info). Fire-and-forget: an AppFolio outage never affects the saved lead,
    // and the email notification above still carries everything.
    if ((input.type === "tour" || input.type === "apply") && input.unit) {
      const unit = input.unit;
      void (async () => {
        try {
          const snapshot = await getAvailabilitySnapshot();
          const match = snapshot?.units.find((u) => u.unit === unit);
          const listableUid = match?.listingUrl
            ? listableUidFromListingUrl(match.listingUrl)
            : null;
          if (!listableUid) {
            req.log.warn(
              { leadId: row.id, unit },
              "Lead names a unit with no posted AppFolio listing; skipped guest card",
            );
            return;
          }
          await createGuestCard({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            listableUid,
            source,
          });
          req.log.info(
            { leadId: row.id, unit },
            "Pushed prospect guest card to AppFolio",
          );
        } catch (err) {
          req.log.error(
            { err, leadId: row.id, unit },
            "Failed to push prospect guest card to AppFolio",
          );
          // A rejected guest card means this accepted lead silently never
          // reached AppFolio's lead queue — tell the leasing team so they
          // can enter the prospect manually. Fire-and-forget and throttled
          // (once per lead per UTC day); never affects the visitor.
          void reportGuestCardFailure(req.log, Date.now(), {
            leadId: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            unit,
            source: source === DEFAULT_LEAD_SOURCE ? null : source,
            errorMessage: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    }
  } catch (err) {
    req.log.error({ err }, "Failed to persist lead");
    res.status(500).json({ error: "Could not save your submission. Please try again." });
  }
});

export default router;
