// FloorPlan + per-unit Apartment/Offer structured data for /available-units.
//
// Machines (Google, Bing/Copilot, AI answer engines) get the same facts the
// page displays: every floor-plan line as a schema.org FloorPlan linked to the
// property entity, and every currently available unit as an Apartment with a
// lease Offer (rent, availability date) sourced from the SAME baked
// availability snapshot the page renders from.
import { SITE_URL } from './seo';
import {
  floorDisplayLabel,
  groupKey,
  parseUnitNumber,
  planGroups,
  type PlanGroup,
} from './floorPlans';
import { FLOOR_PLAN_PAGES, floorPlanPagePath } from './floorPlanPages';
import { getBakedAvailability } from './availabilitySnapshot';
import type { AvailableUnit } from '../hooks/use-availability';
import { adaDesignation, ADA_DISCLAIMER, type AdaDesignation } from './ada';
import { resolveUnitSqft } from './unitSqft';

const COMPLEX_ID = `${SITE_URL}#apartmentcomplex`;
const PAGE_URL = `${SITE_URL}/available-units`;

export function floorPlanId(g: PlanGroup): string {
  return `${PAGE_URL}#floorplan-${g.id}`;
}

/**
 * Canonical layout landing page for a plan group (the group's first plan
 * sheet on the /floor-plans hub). The old `/available-units?plan=` deep link
 * now client-redirects there, so schema URLs point straight at the target.
 */
export function floorPlanPageUrlForGroup(g: PlanGroup): string | null {
  const page = FLOOR_PLAN_PAGES.find((fp) => groupKey(fp.plan) === g.id);
  return page ? `${SITE_URL}${floorPlanPagePath(page.slug)}` : null;
}

/** One schema.org FloorPlan node per residence line (plan group). */
export function floorPlanNode(g: PlanGroup): Record<string, unknown> {
  return {
    '@type': 'FloorPlan',
    '@id': floorPlanId(g),
    name: `${g.typeLabel} \u2013 Unit ${g.unit}`,
    url: floorPlanPageUrlForGroup(g) ?? `${SITE_URL}/floor-plans`,
    numberOfBedrooms: g.beds,
    numberOfBathroomsTotal: g.baths,
    floorSize: {
      '@type': 'QuantitativeValue',
      minValue: g.sqftMin,
      maxValue: g.sqftMax,
      unitCode: 'FTK',
      unitText: 'sq ft',
    },
    image: `${SITE_URL}${g.images.detail}`,
  };
}

/**
 * The plan group a live unit number belongs to: matching unit line with the
 * unit's floor inside one of the group's floor ranges. Accepts both the
 * regular "FFUU" form ("0606") and AppFolio's mezzanine form ("04M02").
 */
export function planGroupForUnitNumber(unitNumber: string): PlanGroup | null {
  const parsed = parseUnitNumber(unitNumber);
  if (!parsed) return null;
  return (
    planGroups.find((g) => g.unit === parsed.line && g.floors.includes(parsed.floor)) ?? null
  );
}

/**
 * One schema.org Apartment node (with a lease Offer) per available unit.
 * `opts` lets the per-unit page (data/unitPageSeo.ts) re-key the node onto its
 * own canonical URL while keeping the identical fact payload. Facts missing
 * from the feed (sqft, photo) fall back to the unit's residence-line plan so
 * the Apartment node always carries the image/floorSize crawlers reward —
 * never invented, always the plan sheet the unit is built from.
 */
/**
 * Offer expiry hint: the snapshot's own timestamp plus seven days. Prices are
 * baked into the published HTML and can go stale between publishes; a
 * priceValidUntil bounded to the data's actual age tells engines and AI
 * assistants exactly how long the quoted rent may be trusted.
 */
export function offerPriceValidUntil(updatedAtIso: string): string | null {
  const updated = Date.parse(updatedAtIso);
  if (!Number.isFinite(updated)) return null;
  return new Date(updated + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * amenityFeature accessibility nodes for a designated (A)/(AC) apartment, per
 * the as-built accessibility matrix. Designations only — no specific installed
 * features are claimed; the disclaimer rides along in the description.
 */
export function adaAmenityFeatures(designation: AdaDesignation): Record<string, unknown>[] {
  const features: Record<string, unknown>[] = [
    {
      '@type': 'LocationFeatureSpecification',
      name: 'ADA Type A accessible/adaptable',
      value: true,
      description:
        `Type A accessible/adaptable residence (${designation}) per the building's as-built accessibility matrix. ` +
        `Features and installed accessibility components may vary. ${ADA_DISCLAIMER}`,
    },
  ];
  if (designation === 'AC') {
    features.push({
      '@type': 'LocationFeatureSpecification',
      name: 'Conduit line (AC)',
      value: true,
      description: 'Type A unit with conduit line, per as-built accessibility matrix.',
    });
  }
  return features;
}

export function apartmentNode(
  u: AvailableUnit,
  opts: { id?: string; url?: string; priceValidUntil?: string | null } = {},
): Record<string, unknown> {
  const group = planGroupForUnitNumber(u.unit);
  // Floor-plan database is authoritative over the AppFolio feed — see unitSqft.ts.
  const sqft = resolveUnitSqft(u);
  const image = u.photoUrl ?? (group ? `${SITE_URL}${group.images.detail}` : null);
  const ada = adaDesignation(u.unit);
  // Floor parsed from the apartment number (pad2(floor)+pad2(line), e.g.
  // "0208" -> "2"; mezzanine "04M02" -> "4M") — same fact the page displays.
  const parsed = parseUnitNumber(u.unit);
  const floorLevel = parsed && parsed.floor > 0 ? floorDisplayLabel(parsed.floor) : null;
  return {
    '@type': 'Apartment',
    '@id': opts.id ?? `${PAGE_URL}#unit-${u.unit}`,
    name: `Apartment ${u.unit} at Exhibit On Superior`,
    url: opts.url ?? PAGE_URL,
    containedInPlace: { '@id': COMPLEX_ID },
    ...(floorLevel ? { floorLevel } : {}),
    ...(group ? { accommodationFloorPlan: { '@id': floorPlanId(group) } } : {}),
    ...(u.bedrooms !== null ? { numberOfBedrooms: u.bedrooms } : {}),
    ...(u.bathrooms !== null ? { numberOfBathroomsTotal: u.bathrooms } : {}),
    ...(sqft !== null
      ? {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: sqft,
            unitCode: 'FTK',
            unitText: 'sq ft',
          },
        }
      : {}),
    ...(image ? { image } : {}),
    ...(ada ? { amenityFeature: adaAmenityFeatures(ada) } : {}),
  };
}

/**
 * The unit's lease Offer as a standalone @graph node linked back to its
 * Apartment via `itemOffered`. schema.org's core vocabulary has no `offers`
 * property on Apartment (Accommodation) — validator.schema.org flags it as
 * UNKNOWN_FIELD — so the Offer/Apartment link is expressed from the Offer
 * side, which crawlers resolve identically. Returns null when the feed
 * carries no rent for the unit.
 */
export function unitOfferNode(
  u: AvailableUnit,
  opts: { apartmentId?: string; priceValidUntil?: string | null } = {},
): Record<string, unknown> | null {
  if (u.rent === null) return null;
  const apartmentId = opts.apartmentId ?? `${PAGE_URL}#unit-${u.unit}`;
  return {
    '@type': 'Offer',
    '@id': `${apartmentId}-offer`,
    name: `Lease Apartment ${u.unit} at Exhibit On Superior`,
    itemOffered: { '@id': apartmentId },
    price: u.rent,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
    ...(opts.priceValidUntil ? { priceValidUntil: opts.priceValidUntil } : {}),
    ...(u.availableOn ? { availabilityStarts: u.availableOn } : {}),
    ...(u.listingUrl ? { url: u.listingUrl } : {}),
    offeredBy: { '@id': COMPLEX_ID },
  };
}

/**
 * Plan groups with at least one unit in `units`, in catalog order. Only these
 * groups' FloorPlan nodes ship on /available-units — the full 27-line catalog
 * schema lives on the /floor-plans hub and its landing pages, so this page
 * carries just the plan sheets its live Apartment nodes reference.
 */
export function liveUnitPlanGroups(units: AvailableUnit[]): PlanGroup[] {
  const liveIds = new Set(
    units
      .map((u) => planGroupForUnitNumber(u.unit))
      .filter((g): g is PlanGroup => g !== null)
      .map((g) => g.id),
  );
  return planGroups.filter((g) => liveIds.has(g.id));
}

/**
 * Build the FloorPlan/Apartment/Offer @graph for /available-units. FloorPlan
 * nodes are emitted only for residence lines with a live unit (so every
 * Apartment's accommodationFloorPlan @id resolves on-page); the full layout
 * catalog schema lives on /floor-plans, not here.
 */
export function unitAvailabilityJsonLd(
  units: AvailableUnit[] | null = getBakedAvailability()?.units ?? null,
  updatedAt: string | null = getBakedAvailability()?.updatedAt ?? null,
): Record<string, unknown> {
  const priceValidUntil = updatedAt ? offerPriceValidUntil(updatedAt) : null;
  const liveGroups = liveUnitPlanGroups(units ?? []);
  const graph: Record<string, unknown>[] = [
    // Re-open the property entity (crawlers merge nodes by @id) to attach the
    // floor-plan links; the full definition lives in the base page @graph.
    {
      '@type': 'ApartmentComplex',
      '@id': COMPLEX_ID,
      accommodationFloorPlan: liveGroups.map((g) => ({ '@id': floorPlanId(g) })),
    },
    ...liveGroups.map(floorPlanNode),
    // Explicit lambda: Array#map's index argument must not leak into `opts`.
    ...(units ?? []).map((u) => apartmentNode(u, { priceValidUntil })),
    // Standalone lease Offers, linked back to their Apartments via itemOffered.
    ...(units ?? []).flatMap((u) => {
      const offer = unitOfferNode(u, { priceValidUntil });
      return offer ? [offer] : [];
    }),
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}
