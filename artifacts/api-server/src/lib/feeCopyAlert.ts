import { createHash } from "node:crypto";
import { logger } from "./logger";
import { mailerConfigured } from "./mailer";
import { sendFeeCopyAlert } from "./email";

/**
 * Notify the leasing team when the fee-policy sanitizer actually removes
 * copy from an AppFolio listing (description sentence or detail line item).
 *
 * The sanitizer keeps the *site* consistent with the leasing-confirmed fee
 * policy, but the contradictory text still lives in AppFolio — on its hosted
 * listing pages and in ILS syndication — so the leasing team needs to fix it
 * at the source. The availability cache warmer refetches every ~4.5 minutes,
 * which would re-detect the same unchanged text hundreds of times a day;
 * this module dedupes to at most one email per offending (unit, text) pair
 * per UTC day.
 *
 * Dedupe state is per-process (in memory). A restart may re-send one email,
 * which is acceptable: restarts are rare and the failure mode is a single
 * duplicate reminder about copy that is still wrong.
 */

/** hash(unit + removed text) → UTC day ("YYYY-MM-DD") it was last notified. */
const notifiedOn = new Map<string, string>();

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function keyFor(unit: string, text: string): string {
  return createHash("sha256").update(`${unit}\n${text}`).digest("hex");
}

/**
 * Report sanitizer-stripped listing copy for a unit. Logs every new finding
 * and emails the leasing inbox at most once per (unit, text) per UTC day.
 * Best-effort: never throws, so a mail outage can't fail the availability
 * refresh that detected the problem.
 */
export async function reportStrippedFeeCopy(
  unit: string,
  removed: string[],
  now: number = Date.now(),
): Promise<void> {
  try {
    const day = utcDay(now);
    // Only items not yet notified today trigger an email; marking happens
    // before the send so a slow send can't race a concurrent re-detection
    // into a duplicate. (A failed send is retried naturally the next day —
    // the copy is still wrong in AppFolio until a human fixes it.)
    const fresh = [...new Set(removed)].filter((text) => {
      const key = keyFor(unit, text);
      if (notifiedOn.get(key) === day) return false;
      notifiedOn.set(key, day);
      return true;
    });
    if (fresh.length === 0) return;

    logger.warn(
      { unit, removed: fresh },
      "AppFolio listing copy contradicts the published fee policy; stripped from the site — notifying leasing team",
    );

    if (!mailerConfigured()) return;
    await sendFeeCopyAlert({ unit, removed: fresh });

    // Sweep stale entries so the map can't grow unbounded across weeks.
    for (const [key, seenDay] of notifiedOn) {
      if (seenDay !== day) notifiedOn.delete(key);
    }
  } catch (err) {
    logger.error({ err, unit }, "Failed to send fee-copy contradiction alert");
  }
}

/** Test-only: clear the per-process dedupe state. */
export function __resetFeeCopyAlertForTests(): void {
  notifiedOn.clear();
}
