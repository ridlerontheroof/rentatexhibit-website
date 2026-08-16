/**
 * Visit-scoped lead-source attribution.
 *
 * When a visitor lands with UTM tags or ad click-IDs, we remember a source
 * label for the whole visit in sessionStorage, and every lead pathway —
 * the tour scheduler, the contact form, and the AppFolio Apply links —
 * sends it along so the leasing team sees which campaign produced the prospect.
 *
 * Label format: `Website (Token)` — same prefix as DEFAULT_LEAD_SOURCE in
 * api-server/src/lib/leadSource.ts, with the campaign token restricted to
 * letters, digits, hyphens, and underscores. Examples:
 * "Website (GoogleAds)", "Website (GoogleAds-SpringPromo)".
 *
 * The label is validated on write AND read; the server re-validates before
 * anything reaches AppFolio — this module is convenience, not the trust boundary.
 *
 * WOODS-CROSSING: update STORAGE_KEY (1 value marked below).
 */

import { LEGACY_REDIRECTS } from '../data/legacyRedirects';

// WOODS-CROSSING: rename this key to match your property, e.g. 'woodscrossing-visit-source'
const STORAGE_KEY = 'exhibit-visit-source'; // WOODS-CROSSING: rename

/** Max length of a full source label — it renders in AppFolio's lead list. */
export const VISIT_SOURCE_MAX_LENGTH = 80;

/**
 * The only accepted shape: `Website (Token)` where Token is alphanumerics,
 * hyphens, and underscores.
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
 * Hidden channel short URLs (QR codes, print ads): when the landing path is a
 * channel redirect (e.g. /go/lobby-qr → /available-units?source=LobbyQR in
 * legacyRedirects.ts), derive the source label from the redirect target's
 * `?source=` tag.
 */
function channelSourceFromPath(pathname: string): string | null {
  const bare = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const target = LEGACY_REDIRECTS[bare];
  if (!target || /^https?:\/\//i.test(target)) return null;
  const qIdx = target.indexOf('?');
  if (qIdx === -1) return null;
  const token = new URLSearchParams(target.slice(qIdx)).get('source')?.trim();
  return token ? sanitizeVisitSource(`Website (${token})`) : null;
}

/**
 * Build the visit source label from a landing URL's UTM params / click-IDs,
 * or null when the URL carries no usable campaign tags.
 */
export function visitSourceFromUrl(url: string): string | null {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  const params = parsed.searchParams;
  // Explicit ?source= token — e.g. from Google Ads final URL custom parameters
  const explicit = params.get('source')?.trim() ?? '';
  if (explicit) {
    const verbatim = sanitizeVisitSource(`Website (${explicit})`);
    if (verbatim) return verbatim;
    const tokenized = tokenize(explicit).slice(0, VISIT_SOURCE_MAX_LENGTH - 'Website ()'.length);
    const cleaned = sanitizeVisitSource(`Website (${tokenized})`);
    if (cleaned) return cleaned;
  }
  const utmSource = params.get('utm_source')?.trim().toLowerCase() ?? '';
  if (!utmSource) {
    // Google Ads auto-tagging appends only gclid/gbraid/wbraid — no utm_source.
    for (const clickId of ['gclid', 'gbraid', 'wbraid']) {
      if (params.get(clickId)?.trim()) return sanitizeVisitSource('Website (GoogleAds)');
    }
    return channelSourceFromPath(parsed.pathname);
  }
  const base = GOOGLE_SOURCES.has(utmSource) ? 'GoogleAds' : tokenize(utmSource);
  if (!base) return channelSourceFromPath(parsed.pathname);
  const campaign = tokenize(params.get('utm_campaign') ?? '');
  let token = campaign ? `${base}-${campaign}` : base;
  token = token.slice(0, VISIT_SOURCE_MAX_LENGTH - 'Website ()'.length).replace(/-+$/, '');
  return sanitizeVisitSource(`Website (${token})`);
}

/**
 * Capture the visit source from the landing URL into sessionStorage.
 * Call once on app boot (browser only).
 */
export function captureVisitSource(url?: string): void {
  try {
    const landing = url ?? window.location.href;
    const source = visitSourceFromUrl(landing);
    if (source) window.sessionStorage.setItem(STORAGE_KEY, source);
  } catch {
    // Storage unavailable — attribution silently defaults.
  }
}

/**
 * The remembered visit source, re-validated on read, or null when the visit
 * has no campaign attribution.
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
  } catch { /* ignore */ }
}
