/**
 * Low-friction bot detection for the public lead-capture forms.
 *
 * Two invisible signals, both supplied by the real form pages:
 *
 *  - `company` — a honeypot field rendered off-screen. Humans never see it;
 *    form-filling bots fill every input, so any non-empty value marks a bot.
 *  - `elapsedMs` — how long the visitor had the form open before submitting.
 *    Real people take many seconds to type five fields; scripted submits
 *    arrive near-instantly. Only an implausibly fast *present* value marks a
 *    bot — the field being absent is tolerated so older cached bundles (and
 *    curl-driven leasing-team tests) keep working.
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

  const honeypot = b.company;
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
  const { company: _company, elapsedMs: _elapsedMs, ...rest } = body as Record<string, unknown>;
  return rest;
}
