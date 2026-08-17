// Pure prose linkifier for blog article body text.
//
// Design rules (task 795):
//   1. Pure data module — no React imports, no hooks. Imported by both the
//      client page (BlogArticle.tsx) and the build-time prerenderer
//      (entry-server.tsx → BlogArticle), so they can never drift.
//   2. Each destination is linked at most once per article body. The caller
//      passes in a mutable `usedDestinations` Set that accumulates across
//      every paragraph and list item for that article.
//   3. An article never self-links (pass `selfPath`, e.g. '/blog/<slug>').
//   4. Phrases in the bottom CTA/related blocks are unaffected — only prose
//      passed to `linkifyText` is processed.
//   5. Anchor text is whatever naturally occurs in the prose (varies across
//      articles) — the linkifier never rewrites copy.

export interface ProseSegment {
  text: string;
  /** Internal href, present only when this segment is a link. */
  href?: string;
}

interface PhraseEntry {
  /** Global, case-insensitive regex. `lastIndex` is reset before each use. */
  pattern: RegExp;
  href: string;
}

// ---------------------------------------------------------------------------
// Phrase → destination map
// ---------------------------------------------------------------------------
// ORDER MATTERS: longer / more-specific patterns first so they match before a
// shorter substring pattern can grab part of them (e.g. "floor plan options"
// before "floor plans" — both map to the same href here, but specificity
// avoids partial matches if different destinations shared a substring).
//
// Each destination appears AT MOST ONCE in this list conceptually; multiple
// rows for the same href just provide synonym patterns.
// ---------------------------------------------------------------------------
export const BLOG_LINK_PHRASES: PhraseEntry[] = [
  // --- /schedule-a-tour -------------------------------------------------------
  { pattern: /\bschedule\s+a\s+(?:tour|showing)\b/gi, href: '/schedule-a-tour' },
  { pattern: /\bbook\s+a\s+(?:tour|showing)\b/gi, href: '/schedule-a-tour' },

  // --- /available-units -------------------------------------------------------
  { pattern: /\bcurrent\s+availability\b/gi, href: '/available-units' },
  { pattern: /\bavailable\s+(?:units|apartments|residences)\b/gi, href: '/available-units' },

  // --- /floor-plans -----------------------------------------------------------
  // "floor plans" is intentionally broad — it is the canonical term used on
  // the hub page and in every article that discusses apartment layouts.
  { pattern: /\bfloor\s+plans?\b/gi, href: '/floor-plans' },

  // --- /amenities -------------------------------------------------------------
  { pattern: /\bfull-floor\s+amenity\b/gi, href: '/amenities' },
  { pattern: /\bamenity\s+deck\b/gi, href: '/amenities' },
  { pattern: /\bcommunity\s+amenities\b/gi, href: '/amenities' },
  { pattern: /\bbuilding\s+amenities\b/gi, href: '/amenities' },

  // --- /pet-friendly ----------------------------------------------------------
  { pattern: /\bpet-friendly\b/gi, href: '/pet-friendly' },
  { pattern: /\bpet\s+(?:policy|policies)\b/gi, href: '/pet-friendly' },

  // --- /contact-us ------------------------------------------------------------
  // "leasing team" and "leasing office" are the natural phrases readers use to
  // refer to the on-site staff; both point to the contact page.
  { pattern: /\bleasing\s+team\b/gi, href: '/contact-us' },
  { pattern: /\bleasing\s+office\b/gi, href: '/contact-us' },

  // --- /fees ------------------------------------------------------------------
  { pattern: /\bfull\s+fee\s+(?:schedule|list)\b/gi, href: '/fees' },
  { pattern: /\bfee\s+schedule\b/gi, href: '/fees' },
  { pattern: /\bleasing\s+costs\s+and\s+charges\b/gi, href: '/fees' },

  // --- /neighborhood ----------------------------------------------------------
  { pattern: /\bneighborhood\s+guide\b/gi, href: '/neighborhood' },

  // --- /reviews ---------------------------------------------------------------
  { pattern: /\bresident\s+reviews?\b/gi, href: '/reviews' },
  { pattern: /\brenter\s+reviews?\b/gi, href: '/reviews' },
];

// ---------------------------------------------------------------------------
// Linkifier
// ---------------------------------------------------------------------------

/**
 * Split a prose string into text/link segments, respecting the
 * once-per-destination and no-self-link rules.
 *
 * @param text           Raw prose string (paragraph or list item).
 * @param usedDests      Mutable Set of hrefs already linked earlier in this
 *                       article. Mutated in-place: newly matched destinations
 *                       are added so subsequent calls skip them.
 * @param selfPath       The article's own canonical path (e.g. '/blog/slug').
 *                       Any phrase whose href matches `selfPath` is skipped.
 */
export function linkifyText(
  text: string,
  usedDests: Set<string>,
  selfPath: string,
): ProseSegment[] {
  type RawMatch = { start: number; end: number; href: string; matchText: string };

  const candidates: RawMatch[] = [];
  // Track hrefs matched within THIS single text call so a second synonym
  // pattern for the same destination doesn't race with the first.
  const matchedHrefs = new Set<string>();

  for (const { pattern, href } of BLOG_LINK_PHRASES) {
    if (usedDests.has(href) || matchedHrefs.has(href) || href === selfPath) continue;
    pattern.lastIndex = 0;
    const m = pattern.exec(text);
    if (m) {
      candidates.push({ start: m.index, end: m.index + m[0].length, href, matchText: m[0] });
      matchedHrefs.add(href);
    }
  }

  if (candidates.length === 0) return [{ text }];

  // Sort by position, then remove overlapping candidates (keep first by start).
  candidates.sort((a, b) => a.start - b.start);
  const matches: RawMatch[] = [];
  let lastEnd = 0;
  for (const c of candidates) {
    if (c.start >= lastEnd) {
      matches.push(c);
      lastEnd = c.end;
    }
  }

  // Commit: mark all winning hrefs as used for subsequent calls.
  for (const m of matches) usedDests.add(m.href);

  // Build segment array preserving the original string verbatim.
  const segments: ProseSegment[] = [];
  let pos = 0;
  for (const m of matches) {
    if (m.start > pos) segments.push({ text: text.slice(pos, m.start) });
    segments.push({ text: m.matchText, href: m.href });
    pos = m.end;
  }
  if (pos < text.length) segments.push({ text: text.slice(pos) });

  return segments;
}
