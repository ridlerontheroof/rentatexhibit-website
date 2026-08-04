/**
 * Visit-scoped lead-source attribution.
 *
 * When a visitor lands with UTM tags (utm_source / utm_campaign — e.g. from
 * a Google Ad), we remember a source label for the whole visit in
 * sessionStorage, and every lead pathway — the tour scheduler, the contact
 * form, and the AppFolio Apply links — sends it along so the leasing team
 * sees which campaign produced the prospect.
 *
 * Label format (leasing-team convention): `Website (UTM-HERE)` — the same
 * "Website (…)" prefix as the default label, with the campaign token inside
 * the parentheses restricted to letters, digits and hyphens (no spaces or
 * other characters). Examples: "Website (GoogleAds)",
 * "Website (GoogleAds-SpringPromo)". Visitors without campaign tags keep the
 * default "Website (Exhibit)" attribution, unchanged.
 *
 * The label is validated on write AND on read, and the server independently
 * re-validates before anything reaches AppFolio — this module is
 * convenience, not the trust boundary.
 */

const STORAGE_KEY = 'exhibit-visit-source';

/** Max length of a full source label — it renders in AppFolio's lead list. */
export const VISIT_SOURCE_MAX_LENGTH = 80;

/**
 * The only accepted shape: `Website (Token)` where Token is alphanumerics
 * and hyphens — no spaces or special characters inside the parentheses.
 */
const LABEL_RE = /^Website \([A-Za-z0-9_-]+\)$/;

/** utm_source values that mean "this click came from Google Ads". */
const GOOGLE_SOURCES = new Set(['google', 'googleads', 'google_ads', 'google-ads', 'adwords']);

/** Validate a candidate source label; null when it can't be used safely. */
export function sanitizeVisitSource(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > VISIT_SOURCE_MAX_LENGTH) return null;
  if (!LABEL_RE.test(trimmed)) return null;
  return trimmed;
}

/** "spring_2026 sale!" → "Spring2026Sale" — a UTM value as a paren-safe token. */
function tokenize(raw: string): string {
  return raw
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Build the visit source label ("Website (GoogleAds-SpringPromo)") from a
 * landing URL's UTM params, or null when the URL carries no usable tags.
 */
export function visitSourceFromUrl(url: string): string | null {
  let params: URLSearchParams;
  try {
    params = new URL(url).searchParams;
  } catch {
    return null;
  }
  // The live Google Ads campaigns tag their final URLs with a ready-made
  // token — e.g. ?source=GoogleAds_IL-Chicago_Luxury-Apartments — rather
  // than UTM params (discovered 2026-08-04). When the token is already
  // label-safe, pass it through verbatim so AppFolio shows exactly the
  // label the marketing team configured on the ad.
  const explicit = params.get('source')?.trim() ?? '';
  if (explicit) {
    const verbatim = sanitizeVisitSource(`Website (${explicit})`);
    if (verbatim) return verbatim;
    const tokenized = tokenize(explicit).slice(0, VISIT_SOURCE_MAX_LENGTH - 'Website ()'.length);
    const cleaned = sanitizeVisitSource(`Website (${tokenized})`);
    if (cleaned) return cleaned;
    // Unusable ?source= value — fall through to UTM/click-ID handling.
  }
  const utmSource = params.get('utm_source')?.trim().toLowerCase() ?? '';
  if (!utmSource) {
    // Google Ads auto-tagging appends only its own click IDs (gclid, or
    // gbraid/wbraid on iOS) — no utm_source. Without this fallback, every
    // ad click from a campaign missing an explicit UTM suffix lands as the
    // default "Website (Exhibit)" and the leasing team can't tell it was
    // paid traffic (confirmed live on 2026-08-01).
    for (const clickId of ['gclid', 'gbraid', 'wbraid']) {
      if (params.get(clickId)?.trim()) return sanitizeVisitSource('Website (GoogleAds)');
    }
    return null;
  }
  const base = GOOGLE_SOURCES.has(utmSource) ? 'GoogleAds' : tokenize(utmSource);
  if (!base) return null;
  const campaign = tokenize(params.get('utm_campaign') ?? '');
  // Keep the label under the cap even with a long campaign — trim the
  // campaign token, never the base channel; a trailing hyphen is dropped.
  let token = campaign ? `${base}-${campaign}` : base;
  token = token.slice(0, VISIT_SOURCE_MAX_LENGTH - 'Website ()'.length).replace(/-+$/, '');
  return sanitizeVisitSource(`Website (${token})`);
}

/**
 * Capture the visit source from the landing URL into sessionStorage. Call
 * once on app boot (browser only). A new campaign landing overwrites any
 * earlier remembered source; a tagless navigation never clears one.
 */
export function captureVisitSource(url?: string): void {
  try {
    const landing = url ?? window.location.href;
    const source = visitSourceFromUrl(landing);
    if (source) window.sessionStorage.setItem(STORAGE_KEY, source);
  } catch {
    // Storage unavailable (privacy mode, SSR) — attribution silently defaults.
  }
}

/**
 * The remembered visit source, re-validated on read, or null when the visit
 * has no campaign attribution (callers then use the default source).
 */
export function getVisitSource(): string | null {
  try {
    return sanitizeVisitSource(window.sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Test helper: clear the remembered visit source. */
export function clearVisitSourceForTests(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
