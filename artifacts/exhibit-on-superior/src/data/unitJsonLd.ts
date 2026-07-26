// FloorPlan + per-unit Apartment/Offer structured data for /available-units.
//
// Machines (Google, Bing/Copilot, AI answer engines) get the same facts the
// page displays: every floor-plan line as a schema.org FloorPlan linked to the
// property entity, and every currently available unit as an Apartment with a
// lease Offer (rent, availability date) sourced from the SAME baked
// availability snapshot the page renders from.
import { SITE_URL } from './seo';
import { parseUnitNumber, planGroups, type PlanGroup } from './floorPlans';
import { getBakedAvailability } from './availabilitySnapshot';
import type { AvailableUnit } from '../hooks/use-availability';
import { adaDesignation, ADA_DISCLAIMER, type AdaDesignation } from './ada';

const COMPLEX_ID = `${SITE_URL}#apartmentcomplex`;
const PAGE_URL = `${SITE_URL}/available-units`;

export function floorPlanId(g: PlanGroup): string {
  return `${PAGE_URL}#floorplan-${g.id}`;
}

/** One schema.org FloorPlan node per residence line (plan group). */
export function floorPlanNode(g: PlanGroup): Record<string, unknown> {
  return {
    '@type': 'FloorPlan',
    '@id': floorPlanId(g),
    name: `${g.typeLabel} \u2013 Unit ${g.unit}`,
    url: `${PAGE_URL}?plan=${encodeURIComponent(g.id)}`,
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
  const sqft = u.sqft ?? group?.sqftMin ?? null;
  const image = u.photoUrl ?? (group ? `${SITE_URL}${group.images.detail}` : null);
  const ada = adaDesignation(u.unit);
  return {
    '@type': 'Apartment',
    '@id': opts.id ?? `${PAGE_URL}#unit-${u.unit}`,
    name: `Apartment ${u.unit} at Exhibit On Superior`,
    url: opts.url ?? PAGE_URL,
    containedInPlace: { '@id': COMPLEX_ID },
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
    ...(u.rent !== null
      ? {
          offers: {
            '@type': 'Offer',
            price: u.rent,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
            ...(opts.priceValidUntil ? { priceValidUntil: opts.priceValidUntil } : {}),
            ...(u.availableOn ? { availabilityStarts: u.availableOn } : {}),
            ...(u.listingUrl ? { url: u.listingUrl } : {}),
            offeredBy: { '@id': COMPLEX_ID },
          },
        }
      : {}),
  };
}

/**
 * Build the FloorPlan/Apartment/Offer @graph for /available-units. When no
 * fresh baked snapshot exists (or `units` is passed explicitly), the graph
 * still carries every FloorPlan — only the per-unit Apartment nodes vary.
 */
export function unitAvailabilityJsonLd(
  units: AvailableUnit[] | null = getBakedAvailability()?.units ?? null,
  updatedAt: string | null = getBakedAvailability()?.updatedAt ?? null,
): Record<string, unknown> {
  const priceValidUntil = updatedAt ? offerPriceValidUntil(updatedAt) : null;
  const graph: Record<string, unknown>[] = [
    // Re-open the property entity (crawlers merge nodes by @id) to attach the
    // floor-plan links; the full definition lives in the base page @graph.
    {
      '@type': 'ApartmentComplex',
      '@id': COMPLEX_ID,
      accommodationFloorPlan: planGroups.map((g) => ({ '@id': floorPlanId(g) })),
    },
    ...planGroups.map(floorPlanNode),
    // Explicit lambda: Array#map's index argument must not leak into `opts`.
    ...(units ?? []).map((u) => apartmentNode(u, { priceValidUntil })),
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}
