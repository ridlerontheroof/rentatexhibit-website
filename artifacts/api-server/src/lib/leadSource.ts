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

/** Attribution AppFolio shows the leasing team when a visit has no campaign tags. */
export const DEFAULT_LEAD_SOURCE = "Website (Exhibit)";

/** Max length of a full source label — it renders in AppFolio's lead list. */
export const LEAD_SOURCE_MAX_LENGTH = 80;

/**
 * The only accepted shape: `Website (Token)` where Token is alphanumerics,
 * hyphens and underscores — no spaces or other special characters inside the
 * parentheses. (Underscore admits the contact-link label
 * "Website (Exhibit_ContactUs)".)
 */
const LABEL_RE = /^Website \([A-Za-z0-9_-]+\)$/;

/**
 * Validate a client-supplied lead source. Returns the label unchanged when
 * it matches the `Website (UTM-HERE)` convention, otherwise
 * DEFAULT_LEAD_SOURCE — attribution is best-effort and must never block or
 * pollute a lead.
 */
export function sanitizeLeadSource(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_LEAD_SOURCE;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > LEAD_SOURCE_MAX_LENGTH) return DEFAULT_LEAD_SOURCE;
  if (!LABEL_RE.test(trimmed)) return DEFAULT_LEAD_SOURCE;
  return trimmed;
}
