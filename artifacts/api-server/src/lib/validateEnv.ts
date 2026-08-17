/**
 * Startup environment validation.
 *
 * This module is imported as the FIRST side-effecting import in app.ts so
 * that it runs before express, cors, pino-http, router, and logger are
 * evaluated. ESM static imports execute in declaration order, so placing this
 * import first guarantees the aggregated check fires before any other
 * module-level code in the dependency graph.
 *
 * Behaviour:
 *   - Production (NODE_ENV === "production"): throws with ALL missing var
 *     names in a single error. Never silently starts with broken config.
 *   - Non-production: logs a console.warn listing every missing var and
 *     continues. Local dev can start without every secret configured.
 *
 * --- Exhibit on Superior env contract ---
 *
 * Only vars with NO safe runtime default are listed below. Vars that the
 * server either hard-codes or reads with a ?? fallback (APPFOLIO_DATABASE,
 * GMAIL_SMTP_USER, LEASING_INBOX_EMAIL, SEED_ALERT_EMAIL, ALLOWED_ORIGIN, …)
 * are intentionally excluded — requiring them here would block an otherwise
 * valid deploy.
 *
 * Excluded by design:
 *   - PORT              — Replit injects it automatically
 *   - NODE_ENV          — only required in production; absence in dev is normal
 *   - APPFOLIO_DATABASE — defaults to "highlandrealestatepartners" in appfolio.ts
 *   - GMAIL_SMTP_USER   — defaults to "leasingexhibit@highlandptrs.com" in mailer.ts
 *   - LEASING_INBOX_EMAIL / SEED_ALERT_EMAIL — have hard-coded fallbacks in email.ts
 *   - ALLOWED_ORIGIN    — defaults to the deployed origin constant in app.ts
 *   - INDEXNOW_KEY      — hard-coded constant in indexnow.ts, not read from env
 *   - GOOGLE_PLACES_API_KEY — returns a 503 when absent, not a startup failure
 *   - GA4_* / SESSION_SECRET — optional features with graceful degradation
 */
const REQUIRED_VARS = [
  // AppFolio OAuth credentials — no fallback; every availability/lead/showing
  // request fails without them.
  "APPFOLIO_CLIENT_ID",
  "APPFOLIO_CLIENT_SECRET",
  // Gmail app password — no fallback; all email notifications (lead alerts,
  // showing confirmations, watchdog emails) are silently dropped without it.
  "GMAIL_APP_PASSWORD",
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
        "\n\nSet these in Replit Secrets before deploying.",
    );
  }

  // Non-production: warn loudly but allow startup so local dev without every
  // secret still works.
  console.warn(
    `[validateEnv] WARNING — missing required env var(s): ${missing.join(", ")}. ` +
      "All must be set in production.",
  );
}

// Run immediately on import so the check fires before any other module in the
// dependency graph is evaluated.
validateEnv();
