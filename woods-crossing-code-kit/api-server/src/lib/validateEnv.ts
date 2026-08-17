/**
 * Startup environment validation.
 *
 * This module is imported as the FIRST side-effecting import in app.ts so
 * that it runs before any other module (appfolio, mailer, indexnow, …) has a
 * chance to throw its own per-var error. In CJS-compiled output each
 * `require()` executes synchronously in declaration order, so placing this
 * import first guarantees the aggregated check runs before any individual
 * module-level throw.
 *
 * Source of truth: config/env-vars.md — Required=Yes rows for the API server.
 *
 * Behaviour:
 *   - Production (NODE_ENV === "production"): throws with ALL missing var
 *     names in a single error. Never silently starts with broken config.
 *   - Non-production: logs a console.warn listing every missing var and
 *     continues. Local dev can start without every secret configured.
 *     Individual modules may still throw if they enforce their own checks —
 *     that is a pre-existing concern separate from this guard.
 */

/**
 * All Required=Yes environment variables for the API server.
 *
 * Ordering mirrors config/env-vars.md.
 *   - PORT is excluded — Replit injects it automatically.
 *   - NODE_ENV is excluded — it is only required in production and its
 *     absence in dev is expected.
 *   - Optional vars (LOG_LEVEL, GSC_SITE_URL, SESSION_SECRET, …) are
 *     excluded — they have documented defaults or are truly optional.
 */
const REQUIRED_VARS = [
  "APPFOLIO_CLIENT_ID",
  "APPFOLIO_CLIENT_SECRET",
  "APPFOLIO_DATABASE",
  "PROPERTY_TIMEZONE",
  "APPFOLIO_PROPERTY_NAME",
  "APPFOLIO_LEAD_SOURCE_DEFAULT",
  "SITE_URL",
  "ALLOWED_ORIGIN",
  "PROPERTY_NAME",
  "INDEXNOW_KEY",
  "GMAIL_APP_PASSWORD",
  "GMAIL_SMTP_USER",
  "LEASING_INBOX_EMAIL",
  "SEED_ALERT_EMAIL",
] as const;

export type RequiredEnvVar = (typeof REQUIRED_VARS)[number];

/**
 * Check that every required environment variable is present and non-empty.
 *
 * In production: throws a single Error listing all missing names.
 * In non-production: logs a warning and returns (does not throw).
 *
 * Exported for unit testing; the module-level call below runs it automatically
 * on import so callers never need to invoke it manually.
 */
export function validateEnv(
  env: Record<string, string | undefined> = process.env,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): void {
  const missing = REQUIRED_VARS.filter(
    (key) => !env[key] || env[key]!.trim() === "",
  );

  if (missing.length === 0) return;

  const isProduction = nodeEnv === "production";

  if (isProduction) {
    throw new Error(
      "API server cannot start: missing required environment variable(s):\n" +
        missing.map((k) => `  • ${k}`).join("\n") +
        "\n\nSee config/env-vars.md for the full setup checklist.",
    );
  }

  // Non-production: warn loudly but allow startup so local dev without every
  // secret still works. These vars MUST be set before deploying to production.
  console.warn(
    `[validateEnv] WARNING — missing required env var(s): ${missing.join(", ")}. ` +
      "All must be set in production. See config/env-vars.md.",
  );
}

// Run immediately on import so the check fires before any other module in the
// dependency graph (appfolio, mailer, indexnow, leadSource) is evaluated.
validateEnv();
