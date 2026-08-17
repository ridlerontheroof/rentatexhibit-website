import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { announceWatchdogStarted } from "./startupSummary";
import { createDailyClaim } from "./dailyClaim";
import { createDailyHeartbeat } from "./dailyHeartbeat";
import { mailerConfigured } from "./mailer";
import { sendStartingPriceCheckAlert } from "./email";

/**
 * Watchdog for the homepage's baked starting rent (the always-on twin of
 * scripts/check-starting-price.mjs).
 *
 * The homepage FAQ bakes the minimum rent at build time from the availability
 * snapshot. If the snapshot is stale at build time — or if the fetch step is
 * skipped — the published homepage can advertise a wrong price while the live
 * /api/availability feed already shows a different minimum.
 *
 * This module is the always-on equivalent: it runs the same HTTP-only checks
 * on startup (= post-publish, because a publish restarts this server) and
 * every 6 hours, alerting the leasing inbox at most once per UTC day when a
 * mismatch is detected.
 *
 * The check is intentionally HTTP-only: the starting-rent figure lives in the
 * prerendered HTML (baked at build time), so no headless browser is required.
 * Both the visible FAQ copy and the FAQPage JSON-LD are checked.
 *
 * Alerting conventions match the other postpublish watchdogs:
 *   - Definitive mismatch → email (once/day), cluster-deduped via the shared
 *     `email_throttle_counters` table (in-memory fallback when DB unreachable).
 *   - Transient fetch/network errors → logged, never alerted.
 *   - No baked price (fallback wording used) → passes with a log note; there
 *     is no baked figure to drift.
 *
 * Checks only run in production; STARTING_PRICE_CHECK_DISABLED=1 is a kill
 * switch.
 */

const SITE = "https://www.rentatexhibit.com";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
/**
 * Delay before the startup (post-publish) run. Deployment log ingestion drops
 * the first ~25s of a fresh container's stdout, so an immediate run would
 * report its outcome into the void. One minute costs nothing at a 6-hour
 * cadence and makes the outcome visible in deploy logs.
 */
const STARTUP_DELAY_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;
const USER_AGENT = "exhibit-starting-price-check/1.0";

const dailyClaim = createDailyClaim({
  prefix: "startingpricecheck",
  claimFailedMessage:
    "Starting-price-check alert database claim failed; falling back to in-memory dedupe",
});

const heartbeat = createDailyHeartbeat({
  outcomes: ["healthy", "fallback", "unhealthy", "errored"] as const,
  message:
    "Starting-price watchdog heartbeat — still checking homepage baked rent against live feed",
  extraFields: { intervalHours: CHECK_INTERVAL_MS / 3_600_000 },
});

/** Outcome of one full check run. Exported for tests. */
export interface StartingPriceCheckResult {
  /**
   * Definitive mismatch problems (baked price ≠ live minimum, or baked
   * price present but feed is unusable).
   */
  failures: string[];
  /**
   * True when neither the visible copy nor the JSON-LD contains the
   * "Apartments currently start at $X,XXX" sentence — the build used the
   * no-price fallback wording, so there is nothing to drift.
   */
  noBakedPrice: boolean;
  /**
   * Ambiguous fetch/network errors — logged, never alerted.
   */
  fetchError?: string;
}

/**
 * Parse the "$X,XXX" figure from the canonical "Apartments currently start at
 * $X,XXX per month" sentence produced by startingRentSentence(). Returns the
 * numeric dollar amount, or null if the pattern is absent (fallback wording).
 */
export function extractStartingRentFromText(text: string): number | null {
  // Strip all <script>…</script> blocks so that prices appearing only inside
  // JSON-LD or other script content are not mistaken for visible copy.
  const stripped = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  const m = /Apartments currently start at \$(\d[\d,]+) per month/i.exec(stripped);
  if (!m) return null;
  return parseInt(m[1]!.replace(/,/g, ""), 10);
}

/**
 * Walk a parsed JSON-LD blob and extract the starting-rent figure from the
 * first FAQPage → mainEntity → acceptedAnswer that carries it. Returns null
 * when no such figure is found.
 */
export function extractStartingRentFromJsonLd(blob: unknown): number | null {
  if (!blob || typeof blob !== "object") return null;

  const isType = (node: Record<string, unknown>, type: string): boolean => {
    const t = node["@type"];
    return Array.isArray(t) ? t.includes(type) : t === type;
  };

  // Collect all nodes, including @graph children.
  const nodes: Record<string, unknown>[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) {
      v.forEach(walk);
    } else if (v && typeof v === "object") {
      nodes.push(v as Record<string, unknown>);
      const graph = (v as Record<string, unknown>)["@graph"];
      if (Array.isArray(graph)) graph.forEach(walk);
    }
  };
  walk(blob);

  for (const node of nodes) {
    if (!isType(node, "FAQPage")) continue;
    const mainEntity = node["mainEntity"];
    const entities = Array.isArray(mainEntity)
      ? mainEntity
      : mainEntity
        ? [mainEntity]
        : [];
    for (const entity of entities) {
      if (!entity || typeof entity !== "object") continue;
      const e = entity as Record<string, unknown>;
      const accepted = e["acceptedAnswer"];
      const answerText =
        accepted && typeof accepted === "object"
          ? (accepted as Record<string, unknown>)["text"] ?? accepted
          : accepted;
      const r = extractStartingRentFromText(String(answerText ?? ""));
      if (r !== null) return r;
    }
  }
  return null;
}

async function fetchText(
  url: string,
  fetchImpl: typeof fetch,
): Promise<{ status: number; body: string }> {
  const res = await fetchImpl(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": USER_AGENT },
  });
  return { status: res.status, body: await res.text() };
}

/**
 * Run one full starting-price check against production and return the outcome.
 * Exported for tests. Never throws.
 */
export async function runStartingPriceChecks(
  log: Logger = defaultLogger,
  fetchImpl: typeof fetch = fetch,
): Promise<StartingPriceCheckResult> {
  const failures: string[] = [];

  // --- 1. Live availability minimum rent (source of truth). ------------------
  // Non-200 responses and unparseable JSON are ambiguous fetch errors — they
  // don't prove anything about the baked price, so they must not trigger an
  // alert or consume the once-daily claim.
  let liveMin: number | null = null;
  let feedUnusable = false;
  try {
    const { status, body } = await fetchText(`${SITE}/api/availability`, fetchImpl);
    if (status !== 200) {
      // Ambiguous: the API may be temporarily down. Log; do not alert.
      return {
        failures: [],
        noBakedPrice: false,
        fetchError: `availability API: HTTP ${status} — cannot establish the live minimum rent.`,
      };
    }
    let feed: { units?: Array<{ rent?: unknown }> };
    try {
      feed = JSON.parse(body) as typeof feed;
    } catch {
      // Ambiguous: malformed response may be transient. Log; do not alert.
      return {
        failures: [],
        noBakedPrice: false,
        fetchError: "availability API: response was not valid JSON — cannot establish the live minimum rent.",
      };
    }
    const units = feed.units ?? [];
    if (units.length === 0) {
      log.warn(
        {},
        "Starting-price check: /api/availability returned zero units — cannot compute a live minimum; checking homepage for a baked price.",
      );
      feedUnusable = true;
    } else {
      for (const u of units) {
        const rent =
          typeof u.rent === "number" && Number.isFinite(u.rent) && u.rent > 0
            ? u.rent
            : null;
        if (rent !== null && (liveMin === null || rent < liveMin)) liveMin = rent;
      }
      if (liveMin === null) {
        log.warn(
          {},
          "Starting-price check: no units in /api/availability carry a usable rent figure — checking whether the homepage baked a price anyway.",
        );
        feedUnusable = true;
      }
    }
  } catch (err) {
    return {
      failures: [],
      noBakedPrice: false,
      fetchError: `availability API: fetch error: ${(err as Error).message}`,
    };
  }

  // --- 2. Homepage raw HTML. -------------------------------------------------
  // A non-200 homepage is an ambiguous fetch error — do not alert.
  let html: string;
  try {
    const { status, body } = await fetchText(`${SITE}/`, fetchImpl);
    if (status !== 200) {
      return {
        failures: [],
        noBakedPrice: false,
        fetchError: `homepage: HTTP ${status} — cannot inspect the baked starting price.`,
      };
    }
    html = body;
  } catch (err) {
    return {
      failures: [],
      noBakedPrice: false,
      fetchError: `homepage: fetch error: ${(err as Error).message}`,
    };
  }

  // --- 3. Extract baked price from visible copy and JSON-LD. ----------------
  const visibleRent = extractStartingRentFromText(html);

  // Parse all JSON-LD blobs.
  let faqLdRent: number | null = null;
  for (const m of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const r = extractStartingRentFromJsonLd(JSON.parse(m[1]!));
      if (r !== null) {
        faqLdRent = r;
        break;
      }
    } catch {
      /* malformed blob — skip */
    }
  }

  const anyBakedPrice = visibleRent !== null || faqLdRent !== null;

  // --- 4. Feed-unusable path: fail iff a baked price exists. ----------------
  if (feedUnusable) {
    if (!anyBakedPrice) {
      log.info(
        {},
        "Starting-price check: homepage uses no-price fallback wording and feed is empty/unusable — nothing to drift.",
      );
      return { failures: [], noBakedPrice: true };
    }
    const bakedFigures: string[] = [];
    if (visibleRent !== null) bakedFigures.push(`$${visibleRent.toLocaleString("en-US")} (visible copy)`);
    if (faqLdRent !== null) bakedFigures.push(`$${faqLdRent.toLocaleString("en-US")} (FAQPage JSON-LD)`);
    return {
      failures: [
        `Homepage bakes a starting price (${bakedFigures.join(", ")}) but the live /api/availability feed ` +
          "returned no usable minimum rent — cannot verify this figure is current. " +
          "Investigate the /api/availability feed and re-publish once it returns valid data.",
      ],
      noBakedPrice: false,
    };
  }

  // --- 5. Normal path: compare each baked figure to liveMin. ---------------
  // liveMin is guaranteed non-null here (feedUnusable === false).
  const liveMinDefined = liveMin!;

  if (!anyBakedPrice) {
    log.info(
      { liveMin: liveMinDefined },
      "Starting-price check: homepage uses no-price fallback wording — no baked figure to drift.",
    );
    return { failures: [], noBakedPrice: true };
  }

  if (visibleRent !== null) {
    if (visibleRent !== liveMinDefined) {
      failures.push(
        `visible FAQ copy: baked price $${visibleRent.toLocaleString("en-US")} ≠ live API minimum ` +
          `$${liveMinDefined.toLocaleString("en-US")} — the homepage is advertising a stale starting rent. ` +
          "Re-publish to bake the current minimum.",
      );
    }
  }

  if (faqLdRent !== null) {
    if (faqLdRent !== liveMinDefined) {
      failures.push(
        `FAQPage JSON-LD: baked price $${faqLdRent.toLocaleString("en-US")} ≠ live API minimum ` +
          `$${liveMinDefined.toLocaleString("en-US")} — the FAQPage structured data carries a stale starting rent. ` +
          "Re-publish to bake the current minimum.",
      );
    }
  }

  return { failures, noBakedPrice: false };
}

/**
 * Run one starting-price check and alert (once/day, cluster-deduped) on a
 * definitive failure. Best-effort: never throws.
 */
export async function checkStartingPriceOnce(
  log: Logger = defaultLogger,
  now: number = Date.now(),
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  let result: StartingPriceCheckResult;
  try {
    result = await runStartingPriceChecks(log, fetchImpl);
  } catch (err) {
    heartbeat.record(log, now, "errored");
    log.error(
      { err },
      "Starting-price check threw unexpectedly — this is a bug in the watchdog itself",
    );
    return;
  }

  // Transient network errors: log and skip alerting.
  if (result.fetchError && result.failures.length === 0) {
    heartbeat.record(log, now, "errored");
    log.warn(
      { fetchError: result.fetchError },
      "Starting-price check had a transient fetch error (not alert-worthy)",
    );
    return;
  }

  // No baked price: fallback wording, nothing to drift.
  if (result.noBakedPrice) {
    heartbeat.record(log, now, "fallback");
    log.info({}, "Starting-price check: no baked starting-price figure on the homepage (fallback wording) — nothing to drift.");
    return;
  }

  if (result.failures.length === 0) {
    heartbeat.record(log, now, "healthy");
    log.info({}, "Starting-price check passed — baked homepage price matches live API minimum.");
    return;
  }

  heartbeat.record(log, now, "unhealthy");
  log.error(
    { failures: result.failures },
    "Starting-price check FAILED — homepage is advertising a stale minimum rent against production",
  );

  try {
    if (!(await dailyClaim.claim(log, now))) return;
    if (!mailerConfigured()) return;
    await sendStartingPriceCheckAlert({ failures: result.failures });
  } catch (err) {
    log.error({ err }, "Failed to send starting-price check failure alert");
  }
}

/**
 * Start the periodic starting-price watchdog. Production only.
 * Runs STARTUP_DELAY_MS after boot (a publish restarts this server; the delay
 * keeps the outcome out of the log-ingestion blind spot at container start),
 * then repeats every CHECK_INTERVAL_MS.
 */
export function startStartingPriceCheck(log: Logger = defaultLogger): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.STARTING_PRICE_CHECK_DISABLED === "1") {
    log.warn(
      {},
      "Starting-price watchdog disabled via STARTING_PRICE_CHECK_DISABLED=1",
    );
    return;
  }
  const startupTimer = setTimeout(
    () => void checkStartingPriceOnce(log),
    STARTUP_DELAY_MS,
  );
  startupTimer.unref?.();
  const timer = setInterval(
    () => void checkStartingPriceOnce(log),
    CHECK_INTERVAL_MS,
  );
  timer.unref?.();
  log.info(
    {
      intervalHours: CHECK_INTERVAL_MS / 3_600_000,
      startupDelaySeconds: STARTUP_DELAY_MS / 1000,
    },
    "Starting-price watchdog started",
  );
  announceWatchdogStarted("starting-price");
}

/** Test-only: clear the per-process fallback dedupe state. */
export function __resetStartingPriceCheckForTests(): void {
  dailyClaim.reset();
  heartbeat.reset();
}
