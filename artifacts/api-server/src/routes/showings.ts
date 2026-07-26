/**
 * Exhibit-branded showing scheduler routes.
 *
 * The web app's /schedule-showing page drives the same two-step flow as
 * AppFolio's hosted "Schedule a Showing" page through these proxies, so all
 * AppFolio calls (and unit → listable_uid resolution) stay server-side:
 *
 *   POST /showings/contact — step 1: creates the AppFolio guest card and
 *        returns the booking credentials (guest_card_id + JWT).
 *   GET  /showings/slots   — live available time slots for a unit.
 *   POST /showings/book    — books the appointment in AppFolio's scheduler.
 *
 * Every AppFolio failure is explicit (4xx/5xx with a machine-readable code):
 * the page owns the designed fallback (standard lead capture + handoff to the
 * hosted AppFolio page), so nothing here falls back silently. Outcomes are
 * counted into a daily heartbeat so a drift in AppFolio's unofficial form
 * endpoints surfaces in the logs instead of silently stranding prospects.
 */
import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { listableUidFromListingUrl } from "../lib/appfolio";
import {
  bookShowing,
  createShowingGuestCard,
  fetchShowingAvailabilities,
  hostedShowingsUrl,
  isIdentityVerificationEnabled,
  propertyTodayMMDDYYYY,
} from "../lib/showings";
import { getAvailabilitySnapshot } from "./availability";
import { createDailyHeartbeat } from "../lib/dailyHeartbeat";
import { inspectSubmission, withoutBotGuardFields } from "../lib/botGuard";
import { recordAcceptedSubmission, recordBotRejection } from "../lib/botGuardAlert";
import {
  recordLiveShowingFailure,
  recordLiveShowingSuccess,
} from "../lib/showingLiveFailureAlert";

const router: IRouter = Router();

// Same throttle rationale as /leads: these endpoints create prospect records
// and calendar appointments in the leasing team's AppFolio, so keep any one
// client from flooding them.
const showingLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a minute." },
  // The limiter's counter is module-level; without this, test requests
  // accumulate across cases and unrelated tests start seeing 429s.
  skip: () => process.env.NODE_ENV === "test",
});

const heartbeat = createDailyHeartbeat({
  outcomes: ["slots_ok", "slots_failed", "contact_ok", "contact_failed", "book_ok", "book_failed"],
  message: "Showing scheduler heartbeat",
});

export function resetShowingHeartbeatForTests(): void {
  heartbeat.reset();
}

/** Resolve an advertised unit to its posted listing UID, or null. */
async function resolveListableUid(unit: string): Promise<string | null> {
  const snapshot = await getAvailabilitySnapshot();
  const match = snapshot?.units.find((u) => u.unit === unit);
  return match?.listingUrl ? listableUidFromListingUrl(match.listingUrl) : null;
}

const UnitQuery = z.string().min(1).max(10);

router.get("/showings/slots", showingLimiter, async (req, res) => {
  const parsed = UnitQuery.safeParse(req.query.unit);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_unit" });
    return;
  }
  const unit = parsed.data;
  try {
    const listableUid = await resolveListableUid(unit);
    if (!listableUid) {
      // Not an AppFolio failure — the unit simply has no posted listing to
      // book against (e.g. pulled overnight). The page falls back to the
      // standard tour-request flow.
      res.status(404).json({ error: "unit_not_listed" });
      return;
    }
    const availabilities = await fetchShowingAvailabilities(listableUid, propertyTodayMMDDYYYY());
    heartbeat.record(req.log, Date.now(), "slots_ok");
    res.json({
      unit,
      hostedUrl: hostedShowingsUrl(listableUid),
      ...availabilities,
    });
  } catch (err) {
    heartbeat.record(req.log, Date.now(), "slots_failed");
    req.log.error({ err, unit }, "Showing slot fetch failed; page will use lead-capture fallback");
    res.status(502).json({ error: "slots_unavailable" });
  }
});

const ContactBody = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(200),
  phone: z
    .string()
    .min(1)
    .max(30)
    .refine((v) => {
      const digits = v.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }, "invalid phone"),
  unit: z.string().min(1).max(10),
});

router.post("/showings/contact", showingLimiter, async (req, res) => {
  // Invisible bot check (honeypot + fill-time) before anything creates an
  // AppFolio guest card. A generic 400 here is safe — real visitors never
  // trip it, and the flow's designed fallback only kicks in on 5xx/409.
  const verdict = inspectSubmission(req.body);
  if (verdict.bot) {
    req.log.warn({ reason: verdict.reason }, "Rejected bot showing-contact submission");
    // Count toward the daily heartbeat + spike alert. Fire-and-forget: a DB
    // or mail outage must never affect the response.
    void recordBotRejection(req.log, Date.now(), "showing_contact", verdict.reason);
    res.status(400).json({ error: "invalid_submission" });
    return;
  }
  const parsed = ContactBody.safeParse(withoutBotGuardFields(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_submission" });
    return;
  }
  const input = parsed.data;
  try {
    const listableUid = await resolveListableUid(input.unit);
    if (!listableUid) {
      res.status(404).json({ error: "unit_not_listed" });
      return;
    }
    // If the manager ever turns on identity verification, booking requires a
    // Persona ID check we cannot proxy — send the visitor to the hosted page.
    // A status-probe failure must not block the flow (IDV has been off for
    // this database); booking itself still fails loudly if IDV really gates it.
    const idvEnabled = await isIdentityVerificationEnabled().catch((err) => {
      req.log.warn({ err }, "Showing IDV status probe failed; assuming disabled");
      return false;
    });
    if (idvEnabled) {
      heartbeat.record(req.log, Date.now(), "contact_failed");
      req.log.error(
        { unit: input.unit },
        "AppFolio identity verification is now enabled — Exhibit scheduler cannot book; sending visitors to hosted page",
      );
      res.status(409).json({ error: "idv_required", hostedUrl: hostedShowingsUrl(listableUid) });
      return;
    }
    const result = await createShowingGuestCard({ ...input, listableUid });
    heartbeat.record(req.log, Date.now(), "contact_ok");
    recordAcceptedSubmission(req.log, Date.now(), "showing_contact");
    void recordLiveShowingSuccess(req.log);
    req.log.info({ unit: input.unit }, "Created showing guest card in AppFolio");
    res.status(201).json({
      guestCardId: result.guestCardId,
      jwt: result.jwt,
      hostedUrl: hostedShowingsUrl(listableUid),
    });
  } catch (err) {
    heartbeat.record(req.log, Date.now(), "contact_failed");
    // Real AppFolio call failure (validation 400s and unlisted-unit 404s
    // never reach here) — count it toward the live-traffic escalation.
    void recordLiveShowingFailure(req.log, Date.now(), {
      step: "guest card",
      message: (err as Error).message,
    });
    req.log.error(
      { err, unit: input.unit },
      "Showing guest card failed; page will use lead-capture fallback",
    );
    res.status(502).json({ error: "contact_failed" });
  }
});

const BookBody = z.object({
  unit: z.string().min(1).max(10),
  guestCardId: z.string().min(1).max(100),
  // Optional since 2026-07-26: AppFolio no longer issues X-JWT; bookings
  // authorize via guest_card_id alone. Forwarded when present.
  jwt: z.string().min(1).max(4096).nullish(),
  slotTime: z.string().regex(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/),
  agentId: z.number().int().positive(),
});

router.post("/showings/book", showingLimiter, async (req, res) => {
  const parsed = BookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_submission" });
    return;
  }
  const input = parsed.data;
  try {
    const listableUid = await resolveListableUid(input.unit);
    if (!listableUid) {
      res.status(404).json({ error: "unit_not_listed" });
      return;
    }
    // Re-fetch availabilities for the slot's date: confirms the slot is still
    // open (someone else may have just taken it) and supplies the current
    // appointment duration the booking needs.
    const [y, mo, d] = input.slotTime.slice(0, 10).split("/");
    const availabilities = await fetchShowingAvailabilities(listableUid, `${mo}/${d}/${y}`, false);
    const day = availabilities.days.find((day) => day.date === input.slotTime.slice(0, 10));
    const slot = day?.slots.find((s) => s.time === input.slotTime && s.agentId === input.agentId);
    if (!slot) {
      heartbeat.record(req.log, Date.now(), "book_failed");
      req.log.warn({ unit: input.unit, slotTime: input.slotTime }, "Showing slot no longer available");
      res.status(409).json({ error: "slot_taken", hostedUrl: hostedShowingsUrl(listableUid) });
      return;
    }
    const booked = await bookShowing({
      listableUid,
      guestCardId: input.guestCardId,
      jwt: input.jwt,
      slotTime: input.slotTime,
      agentId: input.agentId,
      durationMinutes: availabilities.durationMinutes,
    });
    heartbeat.record(req.log, Date.now(), "book_ok");
    void recordLiveShowingSuccess(req.log);
    req.log.info(
      { unit: input.unit, startAt: booked.startAt },
      "Booked showing in AppFolio scheduler",
    );
    res.status(201).json(booked);
  } catch (err) {
    heartbeat.record(req.log, Date.now(), "book_failed");
    // Real AppFolio call failure — slot-taken races (409 above) are normal
    // visitor traffic and deliberately don't count toward the escalation.
    void recordLiveShowingFailure(req.log, Date.now(), {
      step: "booking",
      message: (err as Error).message,
    });
    req.log.error(
      { err, unit: input.unit, slotTime: input.slotTime },
      "Showing booking failed; page will use lead-capture fallback",
    );
    res.status(502).json({ error: "booking_failed" });
  }
});

export default router;
