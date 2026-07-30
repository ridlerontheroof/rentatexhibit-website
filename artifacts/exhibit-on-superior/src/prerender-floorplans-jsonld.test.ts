import { describe, expect, it } from 'vitest';
import { render } from './entry-server';
import { getBakedAvailability } from './data/availabilitySnapshot';
import { liveUnitPlanGroups } from './data/unitJsonLd';

// Task: the 27-plan catalog schema (ItemList + one FloorPlan per residence
// line) moved OFF /available-units and onto the /floor-plans hub and its
// per-layout landing pages. /available-units now carries only live-inventory
// structured data: Apartment/Offer nodes plus the FloorPlan sheets those live
// units reference. This suite locks that boundary — a regression that
// re-attaches the full catalog here would duplicate the hub's entities and
// re-bloat the page crawlers see.

/** Pull every <script type="application/ld+json"> payload out of a head string. */
function extractJsonLd(head: string): Record<string, unknown>[] {
  const scripts = [
    ...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
  return scripts.map((s) => JSON.parse(s) as Record<string, unknown>);
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

describe('/available-units carries no floor-plan catalog schema', () => {
  it('ships no ItemList (the catalog list lives on /floor-plans)', async () => {
    const { head } = await render('/available-units');
    const nodes = allNodes(extractJsonLd(head));
    expect(nodes.filter((n) => n['@type'] === 'ItemList')).toHaveLength(0);
  });

  it('ships FloorPlan nodes only for residence lines with a live unit', async () => {
    const { head } = await render('/available-units');
    const nodes = allNodes(extractJsonLd(head));
    const floorPlans = nodes.filter(
      (n) => n['@type'] === 'FloorPlan' && !(n['@id'] as string)?.endsWith('#floorplan-range'),
    );
    const liveGroups = liveUnitPlanGroups(getBakedAvailability()?.units ?? []);
    expect(floorPlans.map((fp) => fp['@id']).sort()).toEqual(
      liveGroups
        .map((g) => `https://www.rentatexhibit.com/available-units#floorplan-${g.id}`)
        .sort(),
    );
    // Each shipped FloorPlan links out to its layout landing page on the hub.
    for (const fp of floorPlans) {
      expect(String(fp['url'])).toMatch(/^https:\/\/www\.rentatexhibit\.com\/floor-plans\//);
    }
  });

  it('no legacy ?plan= deep-link URLs remain in the prerendered head', async () => {
    const { head } = await render('/available-units');
    expect(head).not.toContain('?plan=');
    expect(head).not.toContain('%3Fplan%3D');
  });
});
