/**
 * Per-property OG card map — the ONLY file that carries property-specific
 * photo references, page slugs, and taglines for social share card generation.
 *
 * PROPERTY CONFIG: replace every entry below with the property's pages,
 * source photos (in images-src/), and taglines before running
 * `node scripts/generate-og-cards.mjs`.
 *
 * Structure of each entry:
 *   <page-slug>: {
 *     src:      filename in images-src/ (the source photo to composite)
 *     tagline:  single line of copy drawn under the wordmark
 *     gravity:  ImageMagick crop anchor — 'center' (default), 'north', 'south',
 *               'east', 'west', 'northeast', 'southeast', 'northwest', 'southwest'
 *     offsetX:  (optional) pixel offset from left when gravity is 'west'
 *   }
 *
 * Each page slug must match a key in PAGE_SEO (src/data/seo.ts) that has
 * an ogImage path pointing to public/images/og/<slug>.jpg.
 *
 * After filling this in and running generate-og-cards.mjs:
 *   1. Bump OG_CARD_VERSION in src/data/seo.ts
 *   2. Run `node scripts/stamp-og-cards.mjs`
 *   3. Confirm the freshness guard (src/data/og-cards-freshness.test.ts) passes
 *
 * Exported so the fact-drift guard (src/data/faq-knowledge-alignment.test.ts)
 * can cross-check every tagline against the Knowledge Center corpus — a stale
 * price/distance baked into a share card must fail the test suite.
 */

export const CARDS = {
  // PROPERTY CONFIG: replace each entry with an approved photo and tagline.
  // Add or remove slugs to match your PAGE_SEO map.
  // ──────────────────────────────────────────────────────────────────────────

  home: {
    // PROPERTY CONFIG: approved hero shot of exterior or skyline view
    src: 'REPLACE-WITH-YOUR-HERO-PHOTO.jpg',
    tagline: 'REPLACE: approved neighborhood tagline',
    gravity: 'center',
  },
  'available-units': {
    // PROPERTY CONFIG: approved amenity deck, courtyard, or unit interior
    src: 'REPLACE-WITH-YOUR-AVAILABILITY-PHOTO.jpg',
    tagline: 'Apartments available now — live pricing & move-in dates',
  },
  'floor-plans': {
    // PROPERTY CONFIG: approved living room or kitchen interior
    src: 'REPLACE-WITH-YOUR-FLOOR-PLAN-PHOTO.jpg',
    tagline: 'REPLACE: verified bedroom mix tagline',
  },
  'photo-gallery': {
    src: 'REPLACE-WITH-YOUR-GALLERY-PHOTO.jpg',
    tagline: 'REPLACE: approved gallery tagline',
  },
  'virtual-tour': {
    src: 'REPLACE-WITH-YOUR-TOUR-PHOTO.jpg',
    tagline: 'REPLACE: approved virtual tour tagline',
  },
  amenities: {
    src: 'REPLACE-WITH-YOUR-AMENITY-PHOTO.jpg',
    tagline: 'REPLACE: verified amenity headline',
  },
  'pet-friendly': {
    src: 'REPLACE-WITH-YOUR-PET-PHOTO.jpg',
    tagline: 'REPLACE: verified pet-policy tagline',
  },
  neighborhood: {
    src: 'REPLACE-WITH-YOUR-NEIGHBORHOOD-PHOTO.jpg',
    tagline: 'REPLACE: approved location tagline',
  },
  'apartment-guide': {
    src: 'REPLACE-WITH-YOUR-GUIDE-PHOTO.jpg',
    tagline: 'Layouts, finishes & community features',
  },
  fees: {
    src: 'REPLACE-WITH-YOUR-FEES-PHOTO.jpg',
    tagline: 'Fees, utilities & leasing costs',
  },
  'parking-transportation': {
    src: 'REPLACE-WITH-YOUR-PARKING-PHOTO.jpg',
    tagline: 'REPLACE: verified transportation tagline',
  },
  'application-guide': {
    src: 'REPLACE-WITH-YOUR-APPLICATION-PHOTO.jpg',
    tagline: 'How to apply, step by step',
  },
  faq: {
    src: 'REPLACE-WITH-YOUR-FAQ-PHOTO.jpg',
    tagline: 'Your questions, answered',
  },
  knowledge: {
    src: 'REPLACE-WITH-YOUR-KNOWLEDGE-PHOTO.jpg',
    tagline: 'Renter questions, fact-first answers',
  },
  'contact-us': {
    src: 'REPLACE-WITH-YOUR-CONTACT-PHOTO.jpg',
    tagline: 'Get in touch with our leasing team',
  },
  'map-directions': {
    src: 'REPLACE-WITH-YOUR-MAP-PHOTO.jpg',
    tagline: 'REPLACE: verified directions tagline',
  },
  residents: {
    src: 'REPLACE-WITH-YOUR-RESIDENTS-PHOTO.jpg',
    tagline: 'REPLACE: approved resident-services tagline',
  },
  'schedule-a-tour': {
    src: 'REPLACE-WITH-YOUR-TOUR-PHOTO.jpg',
    tagline: 'REPLACE: approved tour tagline',
  },
  reviews: {
    src: 'REPLACE-WITH-YOUR-REVIEWS-PHOTO.jpg',
    tagline: 'REPLACE: approved reviews tagline',
  },
  about: {
    src: 'REPLACE-WITH-YOUR-ABOUT-PHOTO.jpg',
    tagline: 'REPLACE: verified property descriptor',
  },

  // ── Floor-plan landing pages ───────────────────────────────────────────────
  // PROPERTY CONFIG: add one entry per /floor-plans/<slug> landing page.
  // Remove entries that don't apply to your property.

  // 'studio-apartments-your-city': {
  //   src: 'REPLACE.jpg',
  //   tagline: 'Studio apartments in [Your City]',
  // },
  // 'one-bedroom-apartments-your-city': {
  //   src: 'REPLACE.jpg',
  //   tagline: '1-bedroom apartments in [Your City]',
  // },

  // ── Neighborhood landing pages ────────────────────────────────────────────
  // PROPERTY CONFIG: add one entry per /apartments-near-<landmark> page.

  // 'apartments-near-your-landmark': {
  //   src: 'REPLACE.jpg',
  //   tagline: 'REPLACE: verified distance and landmark tagline',
  // },
};
