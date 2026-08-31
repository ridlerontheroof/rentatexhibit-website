/**
 * Lead-source validation for AppFolio guest cards and leasing emails.
 *
 * The web app sends a visit-scoped source label captured from the landing
 * URL's UTM tags. The leasing team's convention is `Website (UTM-HERE)` —
 * the same "Website (…)" prefix as the default label, with the token inside
 * the parentheses restricted to letters, digits and hyphens (no spaces or
 * special characters). Examples: "Website (GoogleAds)",
 * "Website (GoogleAds-SpringPromo)".
 *
 * The value is visitor-controlled input rendered on the leasing team's
 * AppFolio screens and in notification emails, so the server is the trust
 * boundary: strict format match with a hard fallback to the long-standing
 * default label. Nothing unexpected may pass through.
 */
import { createHash } from "node:crypto";

// Read from APPFOLIO_LEAD_SOURCE_DEFAULT env var (property-config appfolio.leadSourceDefault).
// Must match the pattern "Website (Token)" — the schema enforces this.
// Example: "Website (ExampleProperty)"
const _DEFAULT_LEAD_SOURCE = process.env.APPFOLIO_LEAD_SOURCE_DEFAULT?.trim();
if (!_DEFAULT_LEAD_SOURCE) {
  throw new Error(
    "APPFOLIO_LEAD_SOURCE_DEFAULT env var is required but not set. " +
    'Set it to your default AppFolio lead-source label, e.g. "Website (PropertyName)" ' +
    "(appfolio.leadSourceDefault from property-config.json).",
  );
}
/** Attribution AppFolio shows the leasing team when a visit has no campaign tags. */
export const DEFAULT_LEAD_SOURCE = _DEFAULT_LEAD_SOURCE;

/** Max length of a full source label — it renders in AppFolio's lead list. */
export const LEAD_SOURCE_MAX_LENGTH = 80;

/**
 * The only accepted shape: `Website (Token)` where Token is alphanumerics,
 * hyphens and underscores — no spaces or other special characters inside the
 * parentheses. (Underscore admits the contact-link label
 * "Website (ExampleProperty_ContactUs)".)
 */
const LABEL_RE = /^Website \([A-Za-z0-9_-]+\)$/;

/**
 * Validate a client-supplied lead source. Returns the label unchanged when
 * it matches the `Website (UTM-HERE)` convention, otherwise
 * DEFAULT_LEAD_SOURCE — attribution is best-effort and must never block or
 * pollute a lead.
 */
/**
 * PII-safe rendering of the raw client-sent source for attribution audit
 * logs. The returned marker NEVER contains client content — raw values are
 * summarized, not echoed:
 *
 *  - null           → the browser sent no source at all (client capture is
 *                     the fault domain);
 *  - "<accepted>"   → the raw value passed the sanitizer unchanged; the
 *                     adjacent `source` field (sanitizer output, the same
 *                     value already shown in AppFolio and leasing emails)
 *                     carries the label;
 *  - "<rejected …>" → a bounded fingerprint (length, digit count, @/space
 *                     presence, whether it resembled a "Website (…)" label)
 *                     that pins a mangled label to transit or capture
 *                     without persisting names/emails/phones/free text;
 *  - "<empty>" / "<non-string …>" → degenerate payloads, summarized.
 */
/**
 * Contentless audit rendering of the SANITIZED source for the attribution
 * audit log line. "default" for the site-wide label; for campaign labels a
 * non-reversible identifier (truncated SHA-256 + length) — enough to check
 * whether a booking carried the expected campaign label (compare against the
 * hash of the expected label computed offline) and to correlate leads from
 * the same campaign, without persisting client-influenced text in logs.
 */
export function auditSourceLabel(source: string): string {
  if (source === DEFAULT_LEAD_SOURCE) return "default";
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 12);
  return `campaign sha256=${hash} len=${source.length}`;
}

export function auditRawSource(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return `<non-string ${typeof value}>`;
  const trimmed = value.trim();
  if (trimmed.length === 0) return "<empty>";
  if (sanitizeLeadSource(trimmed) === trimmed) return "<accepted>";
  const digitCount = (trimmed.match(/\d/g) ?? []).length;
  return (
    `<rejected len=${trimmed.length} digits=${digitCount}` +
    ` hasAt=${trimmed.includes("@")} hasSpace=${/\s/.test(trimmed)}` +
    ` labelPrefixed=${trimmed.startsWith("Website (")}>`
  );
}

export function sanitizeLeadSource(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_LEAD_SOURCE;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > LEAD_SOURCE_MAX_LENGTH) return DEFAULT_LEAD_SOURCE;
  if (!LABEL_RE.test(trimmed)) return DEFAULT_LEAD_SOURCE;
  return trimmed;
}
