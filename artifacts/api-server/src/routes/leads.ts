import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { and, eq, isNull } from "drizzle-orm";
import { CreateLeadBody, CreateLeadResponse } from "@workspace/api-zod";
import { db, leadsTable } from "@workspace/db";
import { sendLeadNotification, sendProspectConfirmation } from "../lib/email";
import { createGuestCard, listableUidFromListingUrl } from "../lib/appfolio";
import { getAvailabilitySnapshot } from "./availability";

const router: IRouter = Router();

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
});

router.post("/leads", leadLimiter, async (req, res) => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid submission" });
    return;
  }

  const input = parsed.data;
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
    });

    res.status(201).json(data);

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
      unit: input.type === "tour" ? (input.unit ?? null) : null,
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
    if (input.type === "tour" && input.unit) {
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
              "Tour lead names a unit with no posted AppFolio listing; skipped guest card",
            );
            return;
          }
          await createGuestCard({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            listableUid,
          });
          req.log.info(
            { leadId: row.id, unit },
            "Pushed tour prospect guest card to AppFolio",
          );
        } catch (err) {
          req.log.error(
            { err, leadId: row.id, unit },
            "Failed to push tour prospect guest card to AppFolio",
          );
        }
      })();
    }
  } catch (err) {
    req.log.error({ err }, "Failed to persist lead");
    res.status(500).json({ error: "Could not save your submission. Please try again." });
  }
});

export default router;
