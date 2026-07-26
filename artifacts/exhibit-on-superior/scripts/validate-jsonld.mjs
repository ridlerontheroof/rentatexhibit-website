// Structured-data validator shared by the build-time prerenderer and the
// vitest suite. Given the raw payloads of every
// <script type="application/ld+json"> block on a page, it checks that:
//   1. every block parses as JSON;
//   2. every top-level block declares @context (schema.org);
//   3. every node — top-level, inside an @graph, or nested as a property
//      value — declares an @type (pure `{ "@id": ... }` reference nodes are
//      the only exception);
//   4. no internal @id reference (site-URL-prefixed) dangles — every
//      `{ "@id": "<site>#x" }` pointer must resolve to a node that DEFINES
//      that @id (with an @type) somewhere on the same page.
// Returns a list of human-readable problems; empty means the page is clean.

/** Extract raw JSON-LD payload strings from an HTML string. */
export function extractJsonLdPayloads(html) {
  return [
    ...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
}

/**
 * @param {string[]} payloads raw JSON-LD script contents for one page
 * @param {string} siteUrl origin prefix that marks an @id as internal
 * @returns {string[]} problems (empty when valid)
 */
export function validateJsonLdPayloads(payloads, siteUrl) {
  // Note: an empty payload list is NOT an error here — noindex pages ship no
  // JSON-LD by design. Callers enforce presence on indexable pages themselves.
  const problems = [];

  const definedIds = new Set();
  const referencedIds = new Set();

  /** A node "defines" its @id when it carries any property beyond @id itself. */
  const walk = (value, where) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${where}[${i}]`));
      return;
    }
    if (value === null || typeof value !== 'object') return;

    const keys = Object.keys(value);
    const id = value['@id'];
    if (typeof id === 'string' && keys.length === 1) {
      // Pure reference node: { "@id": "..." } — the only untyped node allowed.
      referencedIds.add(id);
      return;
    }
    if (typeof id === 'string') {
      // Multiple blocks may deliberately re-define the same @id (crawlers
      // merge nodes by @id), so re-definition is not an error.
      definedIds.add(id);
    }
    // Every non-reference node — nested property values included — must be
    // typed, or Google treats it as an anonymous blob it cannot classify.
    if (typeof value['@type'] !== 'string' || value['@type'].length === 0) {
      problems.push(`missing @type on node at ${where}${id ? ` (id ${id})` : ''}`);
    }
    for (const k of keys) {
      if (k.startsWith('@')) continue;
      walk(value[k], `${where}.${k}`);
    }
  };

  payloads.forEach((raw, i) => {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      problems.push(`block ${i}: unparseable JSON (${e.message})`);
      return;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      problems.push(`block ${i}: top-level JSON-LD must be an object`);
      return;
    }
    const context = parsed['@context'];
    if (typeof context !== 'string' || !/schema\.org/.test(context)) {
      problems.push(`block ${i}: missing or non-schema.org @context`);
    }
    const nodes = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
    nodes.forEach((node, j) => {
      if (typeof node !== 'object' || node === null || Array.isArray(node)) {
        problems.push(`block ${i} node ${j}: not an object`);
        return;
      }
      walk(node, `block ${i} node ${j}`);
    });
  });

  // Dangling internal references: only enforced for site-URL @ids — external
  // ids (e.g. a Google Maps URL used as an identifier) resolve elsewhere.
  for (const id of referencedIds) {
    if (id.startsWith(siteUrl) && !definedIds.has(id)) {
      problems.push(`dangling internal @id reference "${id}" (no node defines it on this page)`);
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Soft check: recommended properties per schema.org @type.
//
// Beyond structural validity, Google's rich-result eligibility depends on
// *recommended* properties (e.g. FAQPage Questions need acceptedAnswer text;
// an ApartmentComplex listing is far stronger with address/telephone/image).
// This layer reports where the site's structured data could be strengthened.
// It returns WARNINGS, never build failures — callers print them (prerender)
// or assert them against an explicit allowlist (tests).
// ---------------------------------------------------------------------------

/**
 * Per-@type checklist of recommended properties for the types this site emits.
 * Each entry is either a property name (must be present and non-empty) or an
 * array of alternatives (at least ONE must be present, e.g. VideoObject needs
 * contentUrl OR embedUrl).
 *
 * Types not listed here are never warned about.
 * @type {Record<string, Array<string | string[]>>}
 */
export const RECOMMENDED_PROPERTIES = {
  WebSite: ['name', 'url', 'publisher'],
  Organization: ['name', 'url', 'logo', ['telephone', 'contactPoint'], 'email'],
  ApartmentComplex: [
    'name',
    'url',
    'address',
    'telephone',
    'image',
    'description',
    'geo',
    'petsAllowed',
    'sameAs',
    'amenityFeature',
  ],
  // Reviews enrichment node on /reviews: LocalBusiness (same @id as the
  // ApartmentComplex) because Google review snippets reject Residence/Place
  // subtypes as the reviewed parent. Address etc. live on the merged
  // ApartmentComplex node, so only the review payload is checked here.
  LocalBusiness: ['name', 'url', 'aggregateRating', 'review'],
  WebPage: ['name', 'description', 'url', 'isPartOf', 'breadcrumb'],
  // /about page — a WebPage subtype; same recommended set applies.
  AboutPage: ['name', 'description', 'url', 'isPartOf', 'breadcrumb'],
  BreadcrumbList: ['itemListElement'],
  // A ListItem either names its target inline (breadcrumbs: name + item URL)
  // or nests a typed item that carries its own name (carousels) — so `name`
  // and `item` are alternatives, not both required.
  ListItem: ['position', ['name', 'item']],
  FAQPage: ['mainEntity'],
  Question: ['name', 'acceptedAnswer'],
  Answer: ['text'],
  ItemList: ['name', 'itemListElement'],
  ImageGallery: ['name', 'image'],
  ImageObject: [['contentUrl', 'url']],
  VideoObject: [
    'name',
    'description',
    'thumbnailUrl',
    'uploadDate',
    ['contentUrl', 'embedUrl'],
    'duration',
  ],
  // Matterport tours ship as MediaObject (VideoObject would demand
  // uploadDate/thumbnail we cannot source truthfully).
  MediaObject: ['name', 'description', ['contentUrl', 'embedUrl']],
  // Floor-plan groups on /floor-plans.
  Apartment: ['name', 'image', 'floorSize'],
  // Residence lines on /available-units, linked from the property entity via
  // accommodationFloorPlan.
  FloorPlan: ['name', 'numberOfBedrooms', 'numberOfBathroomsTotal', 'floorSize', 'image'],
  // Lease offers on available units: rent, currency, and availability are the
  // facts Bing/Copilot and AI answer engines extract.
  Offer: ['price', 'priceCurrency', 'availability'],
  // Review snippets on /reviews. No datePublished checklist entry: quotes are
  // curated + live-merged without reliable per-review dates.
  Review: ['author', 'reviewRating', 'reviewBody'],
  AggregateRating: ['ratingValue', ['reviewCount', 'ratingCount'], 'bestRating', 'worstRating'],
  Rating: ['ratingValue', 'bestRating', 'worstRating'],
};

/**
 * @types the site emits that deliberately carry NO recommended-property
 * checklist — small leaf/value nodes where schema.org recommends nothing
 * beyond what the structural validator already enforces. Every emitted @type
 * must appear either in RECOMMENDED_PROPERTIES or here; the vitest suite
 * fails when a brand-new type ships without that decision being made.
 * @type {string[]}
 */
export const NO_CHECKLIST_TYPES = [
  // Value/leaf nodes: the structural validator already requires @type, and
  // schema.org recommends nothing further for how this site uses them.
  'PostalAddress',
  'GeoCoordinates',
  'LocationFeatureSpecification',
  'QuantitativeValue',
  'OpeningHoursSpecification',
  // containedInPlace chain (Place → City → State → Country): name-only by design.
  'Place',
  'City',
  'State',
  'Country',
  // potentialAction entries carry only a target URL + name.
  'ScheduleAction',
  'ViewAction',
  // Review authors: name-only Person nodes per Google review-snippet docs.
  'Person',
];

/**
 * Intentional omissions for THIS site, as "Type.prop" entries (any-of groups
 * use "Type.propA|propB"). Shared by scripts/prerender.mjs (which silences
 * them in build output) and the vitest suite (which asserts nothing beyond
 * this list is missing, and that no entry here is stale).
 * @type {string[]}
 */
export const SITE_RECOMMENDED_ALLOWLIST = [];

/** True when a property value is meaningfully present (not null/''/[]). */
function hasValue(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/**
 * Report missing recommended properties across all JSON-LD payloads of a page.
 *
 * @param {string[]} payloads raw JSON-LD script contents for one page
 * @param {object} [opts]
 * @param {string[]} [opts.allowlist] intentional omissions, as "Type.prop"
 *   entries (for alternative groups, "Type.propA|propB"). Allowlisted pairs
 *   are silenced everywhere they occur.
 * @param {Record<string, Array<string | string[]>>} [opts.checklist]
 * @returns {string[]} human-readable warnings; empty when nothing is missing
 */
export function checkRecommendedProperties(payloads, opts = {}) {
  const allow = new Set(opts.allowlist ?? []);
  const checklist = opts.checklist ?? RECOMMENDED_PROPERTIES;
  const warnings = [];

  // Crawlers merge every node carrying the same @id across ALL blocks on a
  // page into one entity (e.g. a reviews block re-opens the ApartmentComplex
  // @id just to attach aggregateRating). Mirror that: collect id-keyed nodes
  // first, merge their properties, then check the merged view. Anonymous
  // (id-less) nodes are checked individually where they appear.
  /** @type {Map<string, {type: string, props: Record<string, unknown>}>} */
  const byId = new Map();
  /** @type {Array<{node: Record<string, unknown>, where: string}>} */
  const anonymous = [];

  const collect = (node, where) => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => collect(v, `${where}[${i}]`));
      return;
    }
    if (node === null || typeof node !== 'object') return;
    const keys = Object.keys(node);
    const id = node['@id'];
    // Pure { "@id" } reference nodes are pointers, not definitions — the
    // recommended props live on the defining node, which is checked there.
    if (typeof id === 'string' && keys.length === 1) return;

    if (typeof id === 'string') {
      const entry = byId.get(id) ?? { type: '', props: {} };
      if (typeof node['@type'] === 'string') entry.type = entry.type || node['@type'];
      for (const k of keys) {
        if (!k.startsWith('@') && hasValue(node[k])) entry.props[k] = node[k];
      }
      byId.set(id, entry);
    } else {
      anonymous.push({ node, where });
    }
    for (const k of keys) {
      if (k.startsWith('@')) continue;
      collect(node[k], `${where}.${k}`);
    }
  };

  payloads.forEach((raw, i) => {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return; // structural validation reports unparseable blocks; skip here
    }
    const nodes = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
    nodes.forEach((node, j) => collect(node, `block ${i} node ${j}`));
  });

  const check = (type, props, label) => {
    const recommended = checklist[type];
    if (!recommended) return;
    for (const entry of recommended) {
      const alternatives = Array.isArray(entry) ? entry : [entry];
      if (alternatives.some((prop) => hasValue(props[prop]))) continue;
      const propLabel = alternatives.join('|');
      if (allow.has(`${type}.${propLabel}`)) continue;
      warnings.push(`${type} ${label}: missing recommended property "${propLabel}"`);
    }
  };

  for (const [id, entry] of byId) {
    check(entry.type, entry.props, `(id ${id})`);
  }
  for (const { node, where } of anonymous) {
    if (typeof node['@type'] === 'string') check(node['@type'], node, `at ${where}`);
  }

  return warnings;
}
