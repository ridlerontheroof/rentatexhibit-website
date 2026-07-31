// Floor-plan landing pages (/floor-plans/<slug>): one indexable page per
// distinct plan sheet, targeting plan-level searches ("1 bed 665 sq ft river
// north" etc.). Derived entirely from the floor-plan catalog (floorPlans.ts)
// — the 769–776 SF Unit 06 sheet is a single Plan record spanning floors
// 6–29, so it gets ONE page, never two.
//
// One shared module feeds the client page (pages/FloorPlanDetail.tsx), the
// hub (pages/FloorPlansHub.tsx), AND the build-time prerenderer
// (entry-server.tsx), so the crawler-visible head and the hydrated head can
// never drift. Pure data only: no React, no hooks — availability types come
// from lib/availabilityData (the pure module), so hook-mocking tests never
// break (see the pure-data-module convention).
import {
  plans,
  planGroups,
  groupKey,
  floorDisplayLabel,
  parseUnitNumber,
  planSqftLabel,
  unitNumbersForPlan,
  bandsForFloors,
  groupMatchesQuery,
  groupMatchesFilters,
  type GroupFilterState,
  type Plan,
  type PlanGroup,
  type Category,
} from './floorPlans';
import { adaUnitsAmong, type AdaDesignation } from './ada';
import {
  SITE_URL,
  ogCardUrl,
  SITE_LAUNCH_DATE,
  WEBSITE_NODE,
  ORGANIZATION_NODE,
  APARTMENT_COMPLEX_NODE,
  type SeoModel,
  type SeoMeta,
  TWITTER_SITE,
} from './seo';
import { apartmentNode, offerPriceValidUntil, unitOfferNode } from './unitJsonLd';
import { unitCanonical } from './unitPageSeo';
import type { AvailableUnit } from '../lib/availabilityData';

/** Word form of a category + bath count used in slugs and copy. */
const BED_WORDS: Record<number, string> = { 1: 'one', 2: 'two', 3: 'three' };
const BATH_WORDS: Record<number, string> = { 1: 'one-bath', 2: 'two-bath', 3: 'three-bath' };

function baseSlug(p: Plan): string {
  const sqftPart = p.sqftMin === p.sqft ? `${p.sqft}-sf` : `${p.sqftMin}-${p.sqft}-sf`;
  if (p.category === 'studio') return `studio-${sqftPart}`;
  if (p.category === 'convertible') {
    const prefix = p.typeLabel.toLowerCase().startsWith('jr') ? 'jr-convertible' : 'convertible';
    return `${prefix}-${sqftPart}`;
  }
  const den = p.den ? '-den' : '';
  return `${BED_WORDS[p.beds]}-bedroom${den}-${BATH_WORDS[p.baths]}-${sqftPart}`;
}

/** "6-29" -> "floors-6-29"; "4M" -> "floor-4m" (slug-safe). */
function floorsSlugPart(p: Plan): string {
  const label = p.floorLabel.toLowerCase();
  return `${p.floors.length > 1 ? 'floors' : 'floor'}-${label}`;
}

export interface FloorPlanPage {
  /** URL slug under /floor-plans/, e.g. "two-bedroom-two-bath-1003-sf". */
  slug: string;
  plan: Plan;
  /** The residence-line group this plan belongs to (for related variants). */
  group: PlanGroup;
  /**
   * True when two plans share beds/baths/sqft and the slug (and title/H1)
   * carries the floor range to stay unique.
   */
  disambiguated: boolean;
  /** False only for the 02/03 stacks on floors 6–29 — the sole balcony-free homes. */
  balcony: boolean;
  /** Designated (A)/(AC) apartments within this plan's floor range. */
  adaUnits: { unit: string; designation: AdaDesignation }[];
}

export const FLOOR_PLAN_PAGES: FloorPlanPage[] = (() => {
  // Collision handling: identical beds/baths/sqft on two different sheets
  // (e.g. the 478 SF Jr. Convertible on 6–29 AND 30–34) gets a floor-range
  // suffix on EVERY colliding member, so no slug silently "wins".
  const counts = new Map<string, number>();
  for (const p of plans) counts.set(baseSlug(p), (counts.get(baseSlug(p)) ?? 0) + 1);
  return plans.map((p) => {
    const collision = (counts.get(baseSlug(p)) ?? 0) > 1;
    const slug = collision ? `${baseSlug(p)}-${floorsSlugPart(p)}` : baseSlug(p);
    return {
      slug,
      plan: p,
      group: planGroups.find((g) => g.id === groupKey(p))!,
      disambiguated: collision,
      // Balcony rule (verified building fact, same as the FAQ/Knowledge copy):
      // the ONLY homes without a private balcony are the 02 and 03 stacks on
      // floors 6–29. Every other plan — including 02/03 on the podium and the
      // 30–34 penthouse band — has one.
      balcony: !((p.unit === 2 || p.unit === 3) && p.floorMin >= 6 && p.floorMax <= 29),
      adaUnits: adaUnitsAmong(unitNumbersForPlan(p)),
    };
  });
})();

/**
 * A single-plan PlanGroup view of a hub page, so the hub's filter panel can
 * reuse the exact same matching rules (groupMatchesQuery/groupMatchesFilters)
 * as the /available-units floor-plan section — but scoped to THIS sheet's
 * floor range and square footage, not the whole residence line. Searching
 * "22" therefore matches the 22–29 sheet, not its 17–21 sibling.
 */
function pageAsSingleVariantGroup(fp: FloorPlanPage): PlanGroup {
  const p = fp.plan;
  return {
    ...fp.group,
    sqftMin: p.sqftMin,
    sqftMax: p.sqft,
    bands: bandsForFloors(p.floorMin, p.floorMax),
    floors: p.floors,
    variants: [p],
  };
}

/** True when a hub card passes the free-text search and filter state. */
export function pageMatchesFilters(
  fp: FloorPlanPage,
  search: string,
  filters: GroupFilterState,
): boolean {
  const g = pageAsSingleVariantGroup(fp);
  return groupMatchesQuery(g, search) && groupMatchesFilters(g, filters);
}

/** Hub pages narrowed by the filter panel (order preserved). */
export function filterFloorPlanPages(
  pages: FloorPlanPage[],
  search: string,
  filters: GroupFilterState,
): FloorPlanPage[] {
  return pages.filter((fp) => pageMatchesFilters(fp, search, filters));
}

export function floorPlanPage(slug: string): FloorPlanPage | null {
  return FLOOR_PLAN_PAGES.find((fp) => fp.slug === slug) ?? null;
}

export function floorPlanPagePath(slug: string): string {
  return `/floor-plans/${slug}`;
}

export function floorPlanCanonical(slug: string): string {
  return `${SITE_URL}${floorPlanPagePath(slug)}`;
}

/** "floors 6–29" / "floor 4M" — human floor-range phrase for a plan. */
export function planFloorPhrase(p: Plan): string {
  if (p.floors.length === 1) return `floor ${floorDisplayLabel(p.floors[0])}`;
  return `floors ${floorDisplayLabel(p.floorMin)}\u2013${floorDisplayLabel(p.floorMax)}`;
}

/** Short floor-range label, e.g. "6–29" or "4M". */
export function planFloorLabel(p: Plan): string {
  return p.floorLabel.replace(/-/g, '\u2013');
}

/**
 * Live available units matching this plan: same residence line, floor inside
 * this sheet's floor range. Callers pass the availability data they already
 * hold (live hook data or the baked snapshot) — this module never fetches.
 */
export function matchingUnitsForPlan(p: Plan, units: AvailableUnit[]): AvailableUnit[] {
  return units.filter((u) => {
    const parsed = parseUnitNumber(u.unit);
    return parsed !== null && parsed.line === p.unit && p.floors.includes(parsed.floor);
  });
}

/**
 * The plan landing page for a unit number — matchingUnitsForPlan in reverse.
 * Every buildable apartment number resolves to exactly ONE page because the
 * plan sheets partition each residence line by floor band (guarded by the
 * floorPlanPages test). Returns null for unparseable unit numbers.
 */
export function planPageForUnit(unitNumber: string): FloorPlanPage | null {
  const parsed = parseUnitNumber(unitNumber);
  if (parsed === null) return null;
  return (
    FLOOR_PLAN_PAGES.find(
      (fp) => fp.plan.unit === parsed.line && fp.plan.floors.includes(parsed.floor),
    ) ?? null
  );
}

/** Other pages in the same residence line (floor-band variants). */
export function variantPagesFor(page: FloorPlanPage): FloorPlanPage[] {
  return FLOOR_PLAN_PAGES.filter(
    (fp) => fp.slug !== page.slug && groupKey(fp.plan) === groupKey(page.plan),
  );
}

/** Related plans: same category, different residence line (up to `limit`). */
export function relatedPagesFor(page: FloorPlanPage, limit = 4): FloorPlanPage[] {
  const sameLine = new Set(variantPagesFor(page).map((fp) => fp.slug));
  return FLOOR_PLAN_PAGES.filter(
    (fp) =>
      fp.slug !== page.slug && !sameLine.has(fp.slug) && fp.plan.category === page.plan.category,
  ).slice(0, limit);
}

export function floorPlanTitle(page: FloorPlanPage): string {
  const p = page.plan;
  // Titles are unique per page and stay <= 65 chars (prerender-titles guard):
  // colliding sqft twins swap "Floor Plan" for their floor range instead.
  return page.disambiguated
    ? `${p.typeLabel}, ${planSqftLabel(p)} Sq Ft, Floors ${planFloorLabel(p)} | Exhibit On Superior`.replace(
        'Floors 4M',
        'Floor 4M',
      )
    : `${p.typeLabel} Floor Plan, ${planSqftLabel(p)} Sq Ft | Exhibit On Superior`;
}

export function floorPlanH1(page: FloorPlanPage): string {
  const p = page.plan;
  return page.disambiguated
    ? `${p.typeLabel} \u2014 ${planSqftLabel(p)} Sq Ft (Floors ${planFloorLabel(p)})`
    : `${p.typeLabel} \u2014 ${planSqftLabel(p)} Sq Ft`;
}

/**
 * Card/list title WITHOUT the floor range — for surfaces that render a
 * separate floor-range label right next to the title (e.g. the /floor-plans
 * hub cards). Keeps extracted text and screen-reader output from reading the
 * same floor range twice.
 */
export function floorPlanCardTitle(page: FloorPlanPage): string {
  const p = page.plan;
  return `${p.typeLabel} \u2014 ${planSqftLabel(p)} Sq Ft`;
}

const CATEGORY_PHRASE: Record<Category, string> = {
  studio: 'studio',
  convertible: 'convertible',
  '1br': 'one-bedroom',
  '2br': 'two-bedroom',
  '3br': 'three-bedroom',
};

/**
 * Fact-first summary paragraph rendered at the top of the plan page — the
 * first ~60 words answer "what is this floor plan?" directly for visitors,
 * crawlers, and AI assistants.
 */
export function floorPlanSummary(page: FloorPlanPage): string {
  const p = page.plan;
  const bathPhrase = `${p.baths}-bath`;
  const line = String(p.unit).padStart(2, '0');
  return (
    `The ${p.typeLabel} is a ${CATEGORY_PHRASE[p.category]}${p.den ? ' plus den' : ''}, ` +
    `${bathPhrase} floor plan of ${planSqftLabel(p)} square feet at Exhibit On Superior, ` +
    `offered on ${planFloorPhrase(p)} (residence line ${line}) at 165 W Superior St ` +
    `in Chicago's River North neighborhood.`
  );
}

export function floorPlanDescription(page: FloorPlanPage): string {
  const p = page.plan;
  const text =
    `${p.typeLabel} floor plan at Exhibit On Superior: ${planSqftLabel(p)} sq ft on ` +
    `${planFloorPhrase(p)}${page.balcony ? ', with private balcony' : ''}. River North, Chicago.`;
  if (text.length <= 160) return text;
  const cut = text.slice(0, 159);
  return `${cut.slice(0, cut.lastIndexOf(' '))}\u2026`;
}

/** FloorPlan node keyed to this page's canonical URL. */
export function floorPlanPageNode(page: FloorPlanPage): Record<string, unknown> {
  const p = page.plan;
  return {
    '@type': 'FloorPlan',
    '@id': `${floorPlanCanonical(page.slug)}#floorplan`,
    name: `${p.typeLabel} \u2013 ${planSqftLabel(p)} sq ft`,
    url: floorPlanCanonical(page.slug),
    numberOfBedrooms: p.beds,
    numberOfBathroomsTotal: p.baths,
    floorSize: {
      '@type': 'QuantitativeValue',
      minValue: p.sqftMin,
      maxValue: p.sqft,
      unitCode: 'FTK',
      unitText: 'sq ft',
    },
    image: `${SITE_URL}${p.images.detail}`,
  };
}

/**
 * Self-contained JSON-LD @graph for one plan page: base entities re-emitted in
 * full (no dangling @id refs when crawled in isolation), the FloorPlan node
 * tied to the ApartmentComplex via accommodationFloorPlan, plus an Apartment +
 * lease Offer node per currently available matching unit — keyed to the unit
 * pages' own canonical @ids so crawlers merge, never duplicate.
 */
export function floorPlanPageJsonLd(
  page: FloorPlanPage,
  units: AvailableUnit[],
  updatedAt?: string | null,
): Record<string, unknown> {
  const canonical = floorPlanCanonical(page.slug);
  const title = floorPlanTitle(page);
  const matching = matchingUnitsForPlan(page.plan, units);
  const priceValidUntil = updatedAt ? offerPriceValidUntil(updatedAt) : null;

  const webPage = {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: title,
    description: floorPlanDescription(page),
    isPartOf: { '@id': `${SITE_URL}#website` },
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
    // Same share card the og:image meta uses (see buildFloorPlanSeoModel).
    primaryImageOfPage: ogCardUrl('floor-plans'),
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
    datePublished: SITE_LAUNCH_DATE,
    ...(updatedAt ? { dateModified: updatedAt } : {}),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Exhibit On Superior', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Floor Plans', item: `${SITE_URL}/floor-plans` },
      { '@type': 'ListItem', position: 3, name: floorPlanH1(page), item: canonical },
    ],
  };

  const graph: Record<string, unknown>[] = [
    WEBSITE_NODE,
    ORGANIZATION_NODE,
    // The property entity carries the link to this page's FloorPlan node;
    // crawlers merge by @id with the full node emitted site-wide.
    {
      ...APARTMENT_COMPLEX_NODE,
      accommodationFloorPlan: { '@id': `${canonical}#floorplan` },
    },
    webPage,
    breadcrumb,
    floorPlanPageNode(page),
    ...matching.map((u) => ({
      ...apartmentNode(u, { id: `${unitCanonical(u.unit)}#apartment`, url: unitCanonical(u.unit) }),
      // apartmentNode links the /available-units page's plan-group node by
      // default; on THIS page the matching units are, by construction, built
      // from this page's own FloorPlan node — point there so no @id dangles.
      accommodationFloorPlan: { '@id': `${canonical}#floorplan` },
    })),
    ...matching.flatMap((u) => {
      const offer = unitOfferNode(u, {
        apartmentId: `${unitCanonical(u.unit)}#apartment`,
        priceValidUntil,
      });
      return offer ? [offer] : [];
    }),
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Full head-tag model for a plan page (client <Seo model> + prerenderer). */
export function buildFloorPlanSeoModel(
  page: FloorPlanPage,
  units: AvailableUnit[],
  updatedAt?: string | null,
): SeoModel {
  const title = floorPlanTitle(page);
  const description = floorPlanDescription(page);
  const canonical = floorPlanCanonical(page.slug);
  const ogImage = ogCardUrl('floor-plans');

  const metas: SeoMeta[] = [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Exhibit On Superior' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: title },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: TWITTER_SITE },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
    { name: 'twitter:image:alt', content: title },
  ];

  return { title, canonical, metas, jsonLd: [floorPlanPageJsonLd(page, units, updatedAt)] };
}

/**
 * ItemList of every plan landing page, emitted on the /floor-plans hub via
 * <Seo extraJsonLd>. Shared with the prerenderer (entry-server.tsx) so the
 * static HTML and the client emit identical structured data.
 */
export function floorPlanHubItemListJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Floor Plan Layouts at Exhibit On Superior',
    itemListElement: FLOOR_PLAN_PAGES.map((page, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: floorPlanH1(page),
      item: floorPlanCanonical(page.slug),
    })),
  };
}

/** Prerender path list, exported through entry-server.tsx. */
export const FLOOR_PLAN_PAGE_PATHS: string[] = FLOOR_PLAN_PAGES.map((fp) =>
  floorPlanPagePath(fp.slug),
);
