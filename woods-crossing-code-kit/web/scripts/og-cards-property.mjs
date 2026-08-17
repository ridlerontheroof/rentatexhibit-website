/**
 * Per-property OG card map — the ONLY file that carries property-specific
 * photo references, page slugs, and taglines for social share card generation.
 *
 * WOODS-CROSSING: replace every entry below with your property's pages,
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
  // WOODS-CROSSING: replace each entry with your property's photo + tagline.
  // Add or remove slugs to match your PAGE_SEO map.
  // ──────────────────────────────────────────────────────────────────────────

  home: {
    // WOODS-CROSSING: hero shot of exterior or skyline view
    src: 'REPLACE-WITH-YOUR-HERO-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: your neighborhood tagline here',
    gravity: 'center',
  },
  'available-units': {
    // WOODS-CROSSING: amenity deck, courtyard, or best unit interior
    src: 'REPLACE-WITH-YOUR-AVAILABILITY-PHOTO.jpg',
    tagline: 'Apartments available now — live pricing & move-in dates',
  },
  'floor-plans': {
    // WOODS-CROSSING: living room or kitchen interior
    src: 'REPLACE-WITH-YOUR-FLOOR-PLAN-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: bedroom mix tagline, e.g. "Studio to 3-bedroom homes"',
  },
  'photo-gallery': {
    src: 'REPLACE-WITH-YOUR-GALLERY-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: "See life at [Property Name]"',
  },
  'virtual-tour': {
    src: 'REPLACE-WITH-YOUR-TOUR-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: "Tour [Property Name] from anywhere"',
  },
  amenities: {
    src: 'REPLACE-WITH-YOUR-AMENITY-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: amenity headline, e.g. "Resort-style amenities"',
  },
  'pet-friendly': {
    src: 'REPLACE-WITH-YOUR-PET-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: pet tagline, e.g. "Pet-friendly living in [City]"',
  },
  neighborhood: {
    src: 'REPLACE-WITH-YOUR-NEIGHBORHOOD-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: location tagline',
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
    tagline: 'WOODS-CROSSING: commute/transit tagline',
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
    tagline: 'WOODS-CROSSING: address / directions tagline',
  },
  residents: {
    src: 'REPLACE-WITH-YOUR-RESIDENTS-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: "Resident services and community at [Property Name]"',
  },
  'schedule-a-tour': {
    src: 'REPLACE-WITH-YOUR-TOUR-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: "Schedule your tour of [Property Name]"',
  },
  reviews: {
    src: 'REPLACE-WITH-YOUR-REVIEWS-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: "See what residents say about [Property Name]"',
  },
  about: {
    src: 'REPLACE-WITH-YOUR-ABOUT-PHOTO.jpg',
    tagline: 'WOODS-CROSSING: short descriptor, e.g. "A [N]-story community in [City]"',
  },

  // ── Floor-plan landing pages ───────────────────────────────────────────────
  // WOODS-CROSSING: add one entry per /floor-plans/<slug> landing page.
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
  // WOODS-CROSSING: add one entry per /apartments-near-<landmark> page.

  // 'apartments-near-your-landmark': {
  //   src: 'REPLACE.jpg',
  //   tagline: 'WOODS-CROSSING: distance + landmark tagline',
  // },
};
