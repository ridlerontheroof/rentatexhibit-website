/**
 * Low-friction bot detection for the public lead-capture forms.
 *
 * Two invisible signals, both supplied by the real form pages:
 *
 *  - `xh_note` — a honeypot field rendered off-screen. Humans never see it;
 *    form-filling bots fill every input, so any non-empty value marks a bot.
 *    The name is a deliberate nonsense token: the previous honeypot was named
 *    `company` with a "Company" label, and Safari's profile autofill filled it
 *    from real visitors' contact cards — rejecting genuine tour requests
 *    (production, 2026-07-27). A non-empty legacy `company` value is therefore
 *    NO LONGER treated as a bot signal (cached bundles may still send it
 *    autofilled); it is only stripped.
 *  - `elapsedMs` — milliseconds between the visitor's first typing in the form
 *    and the submit. Real people take seconds; scripted submits arrive
 *    near-instantly. Only an implausibly fast *present* value marks a bot —
 *    the field being absent is tolerated: pure-autofill visitors never type,
 *    and older cached bundles / curl-driven leasing-team tests don't send it.
 *
 * Both signals are advisory: they stop the dumb, high-volume form spam the
 * audit flagged. Rate limiting (already on every route) handles the rest.
 */

/** Minimum plausible time (ms) between form render and submit. */
export const MIN_HUMAN_FILL_MS = 2_000;

export type BotVerdict = { bot: false } | { bot: true; reason: "honeypot" | "too_fast" };

export function inspectSubmission(body: unknown): BotVerdict {
  if (!body || typeof body !== "object") return { bot: false };
  const b = body as Record<string, unknown>;

  const honeypot = b.xh_note;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { bot: true, reason: "honeypot" };
  }
  // A non-string honeypot value is also nothing a real form would send, but
  // don't punish it — schema validation will reject malformed bodies anyway.

  const elapsed = b.elapsedMs;
  if (typeof elapsed === "number" && Number.isFinite(elapsed) && elapsed >= 0) {
    if (elapsed < MIN_HUMAN_FILL_MS) return { bot: true, reason: "too_fast" };
  }

  return { bot: false };
}

/**
 * Strip the bot-guard fields so downstream Zod schemas (generated from the
 * OpenAPI spec, which doesn't know about them) can stay strict-friendly and
 * nothing accidentally persists them.
 */
export function withoutBotGuardFields(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const {
    company: _company, // legacy honeypot name — stripped but no longer inspected
    xh_note: _xhNote,
    elapsedMs: _elapsedMs,
    ...rest
  } = body as Record<string, unknown>;
  return rest;
}
