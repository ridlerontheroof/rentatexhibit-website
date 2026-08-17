// validateEnv MUST be the first import so its module-level side effect runs
// before express, cors, pino-http, router, and logger are evaluated. ESM
// static imports are hoisted and execute in declaration order, so placing this
// first guarantees the aggregated check fires before any other module-level
// code in the dependency graph.
import "./lib/validateEnv";

import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const DEFAULT_ALLOWED_ORIGIN = "https://exhibit-on-superior.replit.app";

/**
 * Resolve the CORS origin from the environment, validating it up front so a
 * misconfiguration fails fast at startup rather than silently weakening the
 * cross-origin policy. A wildcard ("*") or any non-HTTPS/malformed value is
 * rejected outright.
 */
function resolveAllowedOrigin(): string {
  const raw = process.env.ALLOWED_ORIGIN;

  if (raw === undefined || raw === "") {
    return DEFAULT_ALLOWED_ORIGIN;
  }

  const value = raw.trim();

  if (value === "*") {
    throw new Error(
      'ALLOWED_ORIGIN must not be "*": a wildcard disables the cross-origin ' +
        "restriction. Set it to a specific HTTPS origin (e.g. " +
        `"${DEFAULT_ALLOWED_ORIGIN}").`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      `ALLOWED_ORIGIN is not a valid URL: "${raw}". Set it to a specific ` +
        `HTTPS origin (e.g. "${DEFAULT_ALLOWED_ORIGIN}").`,
    );
  }

  if (parsed.protocol !== "https:") {
    throw new Error(
      `ALLOWED_ORIGIN must use the https:// scheme: "${raw}". Set it to a ` +
        `specific HTTPS origin (e.g. "${DEFAULT_ALLOWED_ORIGIN}").`,
    );
  }

  // An origin is scheme + host + optional port only; reject anything carrying
  // a path, query, or fragment so it matches what browsers send in the Origin
  // header and compares cleanly inside the cors middleware.
  if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "") {
    throw new Error(
      `ALLOWED_ORIGIN must be a bare origin without a path, query, or ` +
        `fragment: "${raw}". Use e.g. "${DEFAULT_ALLOWED_ORIGIN}".`,
    );
  }

  return parsed.origin;
}

const allowedOrigin = resolveAllowedOrigin();

const app: Express = express();

// The API runs behind Replit's proxy chain, so the client IP arrives in the
// X-Forwarded-For header. Trust only loopback and private-network addresses
// (the platform's internal proxy hops) rather than a fixed hop count:
//
// - A numeric hop count is fragile: the observed chain here has *multiple*
//   internal hops (e.g. "…, 10.x.x.x, 127.0.0.1"), so `trust proxy: 1`
//   resolved every visitor to 127.0.0.1 and collapsed the per-IP rate limit
//   on POST /api/leads into a single shared bucket.
// - It is also spoof-resistant: Express walks the X-Forwarded-For chain from
//   the right and stops at the first address that is NOT in a trusted range.
//   The platform proxies append the genuine (public) client IP, so the walk
//   always stops there. Any attacker-supplied X-Forwarded-For values sit
//   further left and can never be selected as req.ip, even if an upstream
//   proxy were to pass them through instead of stripping them.
app.set("trust proxy", [
  "loopback", // 127.0.0.0/8, ::1
  "linklocal", // 169.254.0.0/16, fe80::/10
  "uniquelocal", // fc00::/7 (IPv6 private)
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
]);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST"],
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
