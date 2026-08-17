import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

/**
 * Resolve the CORS origin from the environment.
 *
 * Set ALLOWED_ORIGIN env var to your web app's deployed HTTPS origin, e.g.
 * "https://www.woodscrossing.com". Maps to property-config identity.canonicalOrigin.
 *
 * A wildcard ("*") or any non-HTTPS/malformed value is rejected outright.
 * There is no hard-coded fallback — a missing ALLOWED_ORIGIN is a
 * misconfiguration and must be loud, not silent.
 */
function resolveAllowedOrigin(): string {
  const raw = process.env.ALLOWED_ORIGIN;
  if (raw === undefined || raw === "") {
    throw new Error(
      "ALLOWED_ORIGIN env var is required but not set. " +
      "Set it to your web artifact's deployed HTTPS origin (identity.canonicalOrigin from property-config.json).",
    );
  }
  const value = raw.trim();
  if (value === "*") throw new Error('ALLOWED_ORIGIN must not be "*"');
  let parsed: URL;
  try { parsed = new URL(value); } catch {
    throw new Error(`ALLOWED_ORIGIN is not a valid URL: "${raw}"`);
  }
  if (parsed.protocol !== "https:") throw new Error(`ALLOWED_ORIGIN must use https://: "${raw}"`);
  if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "") {
    throw new Error(`ALLOWED_ORIGIN must be a bare origin without path/query/fragment: "${raw}"`);
  }
  return parsed.origin;
}

const allowedOrigin = resolveAllowedOrigin();

const app: Express = express();

// Trust Replit's proxy chain. The platform adds multiple internal hops, so
// trusting private/loopback CIDRs is correct; a numeric hop count would
// collapse all visitors to 127.0.0.1 (seen in production, breaks rate limits).
app.set("trust proxy", [
  "loopback",    // 127.0.0.0/8, ::1
  "linklocal",   // 169.254.0.0/16, fe80::/10
  "uniquelocal", // fc00::/7
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
]);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);
app.use(cors({ origin: allowedOrigin, methods: ["GET", "POST"] }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

export default app;
