/**
 * One-off end-to-end SIMULATION of the near-term-day guard (task: prove the
 * loud-failure path from the 2026-07-29 incident actually reports in).
 *
 * Mounts the REAL /showings router (real pino logger, real heartbeat, real
 * daily claim in Postgres, real alert email over Gmail SMTP) and intercepts
 * ONLY AppFolio's listings availabilities endpoint with a contradiction:
 *
 *  - hinted call (find_first_available_date=true): empty window,
 *    first_available_date pointing 3 days ahead
 *  - un-hinted re-check of the same window: open slots tomorrow
 *
 * Everything else (availability snapshot / unit → listable_uid resolution)
 * hits the real AppFolio APIs. Expected output: the route serves the
 * recovered day, logs the contradiction error line, emits a heartbeat with
 * slots_recovered=1, claims neartermskip:<utc-day>, and sends the
 * "auto-recovered" alert email once.
 *
 * Usage: NODE_ENV=production node /tmp/simulate-near-term-skip.mjs
 * (bundle with esbuild --bundle --platform=node --format=esm)
 */
import express from "express";
import { pinoHttp } from "pino-http";
import http from "node:http";
import { logger } from "../src/lib/logger";
import { PROPERTY_TIMEZONE, propertyTodayMMDDYYYY } from "../src/lib/showings";
import showingsRouter from "../src/routes/showings";
import { getAvailabilitySnapshot } from "../src/routes/availability";

function keyFromMMDDYYYY(s: string): string {
  const [mo, d, y] = s.split("/");
  return `${y}-${mo}-${d}`;
}
function plusDaysDash(dashDate: string, days: number): string {
  const [y, mo, d] = dashDate.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

const todayMMDDYYYY = propertyTodayMMDDYYYY();
const todayDash = keyFromMMDDYYYY(todayMMDDYYYY);
const tomorrowDash = plusDaysDash(todayDash, 1);
const fadDash = plusDaysDash(todayDash, 3);

const realFetch = globalThis.fetch;
let hintedCalls = 0;
let recheckCalls = 0;
globalThis.fetch = (async (input: any, init?: any) => {
  const url = String(typeof input === "string" ? input : input?.url ?? input);
  if (url.includes("/listings/api/listings/") && url.includes("/availabilities")) {
    const u = new URL(url);
    const hinted = u.searchParams.get("find_first_available_date") === "true";
    const body = hinted
      ? {
          // Contradiction: claim the window is empty and point ahead...
          prospect_scheduled_showing_duration: 15,
          availabilities_by_date: [],
          future_availabilities_exist: true,
          first_available_date: fadDash,
        }
      : {
          // ...while the same window, un-hinted, has open slots tomorrow.
          prospect_scheduled_showing_duration: 15,
          availabilities_by_date: [
            {
              date: tomorrowDash,
              timeslots: [
                { time: `${tomorrowDash}T10:30:00-05:00`, agent_id: 424242 },
                { time: `${tomorrowDash}T14:00:00-05:00`, agent_id: 424242 },
              ],
            },
          ],
          future_availabilities_exist: true,
          first_available_date: null,
        };
    hinted ? hintedCalls++ : recheckCalls++;
    logger.info({ hinted, start: u.searchParams.get("start_date") }, "SIMULATION: intercepted availabilities call");
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return realFetch(input, init);
}) as typeof fetch;

async function main() {
  const snapshot = await getAvailabilitySnapshot();
  const unit = snapshot?.units.find((u) => u.listingUrl)?.unit;
  if (!unit) throw new Error("No listed unit in availability snapshot — cannot simulate");
  logger.info({ unit, todayMMDDYYYY, fadDash, tomorrowDash, tz: PROPERTY_TIMEZONE }, "SIMULATION: starting");

  const app = express();
  app.use(express.json());
  app.use(pinoHttp({ logger, autoLogging: false }));
  app.use(showingsRouter);
  const server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as any).port;

  const res = await realFetch(`http://127.0.0.1:${port}/showings/slots?unit=${unit}`);
  const json = (await res.json()) as any;
  logger.info(
    {
      status: res.status,
      days: json.days?.map((d: any) => ({ date: d.date, slots: d.slots?.length })),
      firstAvailableDate: json.firstAvailableDate,
      hintedCalls,
      recheckCalls,
    },
    "SIMULATION: /showings/slots response",
  );

  // Give the fire-and-forget alert path time to claim + send.
  await new Promise((r) => setTimeout(r, 20_000));
  server.close();
  logger.info("SIMULATION: done");
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "SIMULATION: failed");
  process.exit(1);
});
