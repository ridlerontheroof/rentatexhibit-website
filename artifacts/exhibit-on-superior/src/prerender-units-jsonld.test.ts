import { describe, expect, it } from 'vitest';
import { render } from './entry-server';
import { planGroups } from './data/floorPlans';
import { getBakedAvailability } from './data/availabilitySnapshot';
import { unitAvailabilityJsonLd, planGroupForUnitNumber } from './data/unitJsonLd';

// Task: /available-units must publish machine-readable inventory for AI/Bing
// crawlers — one FloorPlan node per residence line (linked from the property
// entity) and one Apartment node with a lease Offer per currently available
// unit, sourced from the SAME baked availability snapshot the page renders.
// The prerenderer (scripts/prerender.mjs) enforces the same counts against the
// written HTML; this suite proves the entry-server pipeline emits them.

function extractJsonLd(head: string): Record<string, unknown>[] {
  return [
    ...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => JSON.parse(m[1]) as Record<string, unknown>);
}

function allNodes(blocks: Record<string, unknown>[]): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  const collect = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(collect);
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o['@type'] === 'string' || Array.isArray(o['@type'])) nodes.push(o);
      for (const k of Object.keys(o)) if (!k.startsWith('@')) collect(o[k]);
      if (Array.isArray(o['@graph'])) collect(o['@graph']);
    }
  };
  blocks.forEach(collect);
  return nodes;
}

describe('/available-units unit-level structured data', () => {
  it('ships one FloorPlan per plan group, linked from the property entity', async () => {
    const { head } = await render('/available-units');
    const nodes = allNodes(extractJsonLd(head));

    // Exclude the building-wide summary FloorPlan (#floorplan-range) from the
    // base graph — it carries the tower-wide sq-ft range, not a plan sheet.
    const floorPlans = nodes.filter(
      (n) => n['@type'] === 'FloorPlan' && !(n['@id'] as string)?.endsWith('#floorplan-range'),
    );
    expect(floorPlans).toHaveLength(planGroups.length);
    for (const fp of floorPlans) {
      expect(fp['numberOfBedrooms']).toBeTypeOf('number');
      expect(fp['numberOfBathroomsTotal']).toBeTypeOf('number');
      expect(fp['floorSize']).toBeDefined();
    }

    // The re-opened ApartmentComplex node must reference every FloorPlan @id.
    const complex = nodes.find(
      (n) => n['@type'] === 'ApartmentComplex' && Array.isArray(n['accommodationFloorPlan']),
    );
    expect(complex).toBeDefined();
    const refs = (complex!['accommodationFloorPlan'] as { '@id': string }[]).map((r) => r['@id']);
    expect(new Set(refs)).toEqual(new Set(floorPlans.map((fp) => fp['@id'] as string)));
  });

  it('ships an Apartment with a lease Offer for every baked available unit', async () => {
    const baked = getBakedAvailability();
    const { head } = await render('/available-units');
    const nodes = allNodes(extractJsonLd(head));

    // Offers are standalone nodes linked back to their Apartment via
    // itemOffered (schema.org core has no `offers` property on Apartment).
    const apartments = nodes.filter((n) => n['@type'] === 'Apartment' && n['@id']);
    expect(apartments).toHaveLength(baked?.units.length ?? 0);
    const offers = nodes.filter((n) => n['@type'] === 'Offer');

    for (const unit of baked?.units ?? []) {
      const apt = apartments.find((a) => (a['@id'] as string).endsWith(`#unit-${unit.unit}`));
      expect(apt, `missing Apartment node for unit ${unit.unit}`).toBeDefined();
      expect(apt!['offers'], 'Apartment must not carry offers directly').toBeUndefined();
      const offer = offers.find(
        (o) => (o['itemOffered'] as Record<string, unknown>)?.['@id'] === apt!['@id'],
      ) as Record<string, unknown>;
      expect(offer, `missing linked Offer for unit ${unit.unit}`).toBeDefined();
      expect(offer['price']).toBe(unit.rent);
      expect(offer['priceCurrency']).toBe('USD');
      if (unit.availableOn) expect(offer['availabilityStarts']).toBe(unit.availableOn);
    }
  });

  it('the property entity carries numberOfAccommodationUnits: 298', async () => {
    const { head } = await render('/');
    const nodes = allNodes(extractJsonLd(head));
    const complex = nodes.find(
      (n) =>
        ([] as string[]).concat(n['@type'] as string[]).includes('ApartmentComplex') &&
        n['numberOfAccommodationUnits'] !== undefined,
    );
    expect(complex?.['numberOfAccommodationUnits']).toBe(298);
  });

  it('maps live unit numbers to their residence line', () => {
    // "0208" -> floor 2, unit line 8.
    const g = planGroupForUnitNumber('0208');
    expect(g?.unit).toBe(8);
    expect(g?.floors).toContain(2);
    expect(planGroupForUnitNumber('nope')).toBeNull();
    expect(planGroupForUnitNumber('9908')).toBeNull(); // no floor 99
  });

  it('omits Apartment nodes (but keeps FloorPlans) when no snapshot units exist', () => {
    const block = unitAvailabilityJsonLd([]);
    const nodes = allNodes([block]);
    expect(nodes.filter((n) => n['@type'] === 'Apartment')).toHaveLength(0);
    expect(nodes.filter((n) => n['@type'] === 'FloorPlan')).toHaveLength(planGroups.length);
  });
});
