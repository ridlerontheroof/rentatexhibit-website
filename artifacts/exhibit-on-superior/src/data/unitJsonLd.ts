// FloorPlan + per-unit Apartment/Offer structured data for /available-units.
//
// Machines (Google, Bing/Copilot, AI answer engines) get the same facts the
// page displays: every floor-plan line as a schema.org FloorPlan linked to the
// property entity, and every currently available unit as an Apartment with a
// lease Offer (rent, availability date) sourced from the SAME baked
// availability snapshot the page renders from.
import { SITE_URL } from './seo';
import { planGroups, type PlanGroup } from './floorPlans';
import { getBakedAvailability } from './availabilitySnapshot';
import type { AvailableUnit } from '../hooks/use-availability';

const COMPLEX_ID = `${SITE_URL}#apartmentcomplex`;
const PAGE_URL = `${SITE_URL}/available-units`;

function floorPlanId(g: PlanGroup): string {
  return `${PAGE_URL}#floorplan-${g.id}`;
}

/** One schema.org FloorPlan node per residence line (plan group). */
function floorPlanNode(g: PlanGroup): Record<string, unknown> {
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
 * The plan group a live unit number ("FFUU") belongs to: matching unit line
 * with the unit's floor inside one of the group's floor ranges.
 */
export function planGroupForUnitNumber(unitNumber: string): PlanGroup | null {
  if (!/^\d{4}$/.test(unitNumber)) return null;
  const floor = Number(unitNumber.slice(0, 2));
  const line = Number(unitNumber.slice(2));
  return (
    planGroups.find((g) => g.unit === line && g.floors.includes(floor)) ?? null
  );
}

/** One schema.org Apartment node (with a lease Offer) per available unit. */
function apartmentNode(u: AvailableUnit): Record<string, unknown> {
  const group = planGroupForUnitNumber(u.unit);
  return {
    '@type': 'Apartment',
    '@id': `${PAGE_URL}#unit-${u.unit}`,
    name: `Apartment ${u.unit} at Exhibit On Superior`,
    url: PAGE_URL,
    containedInPlace: { '@id': COMPLEX_ID },
    ...(group ? { accommodationFloorPlan: { '@id': floorPlanId(group) } } : {}),
    ...(u.bedrooms !== null ? { numberOfBedrooms: u.bedrooms } : {}),
    ...(u.bathrooms !== null ? { numberOfBathroomsTotal: u.bathrooms } : {}),
    ...(u.sqft !== null
      ? {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: u.sqft,
            unitCode: 'FTK',
            unitText: 'sq ft',
          },
        }
      : {}),
    ...(u.photoUrl ? { image: u.photoUrl } : {}),
    ...(u.rent !== null
      ? {
          offers: {
            '@type': 'Offer',
            price: u.rent,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
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
): Record<string, unknown> {
  const graph: Record<string, unknown>[] = [
    // Re-open the property entity (crawlers merge nodes by @id) to attach the
    // floor-plan links; the full definition lives in the base page @graph.
    {
      '@type': 'ApartmentComplex',
      '@id': COMPLEX_ID,
      accommodationFloorPlan: planGroups.map((g) => ({ '@id': floorPlanId(g) })),
    },
    ...planGroups.map(floorPlanNode),
    ...(units ?? []).map(apartmentNode),
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}
