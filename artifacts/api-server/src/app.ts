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

// The API runs behind Replit's proxy, so the client IP arrives in the
// X-Forwarded-For header. Trust a single proxy hop so rate limiting can key
// off the real visitor IP rather than the proxy's address.
app.set("trust proxy", 1);

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
