import { describe, expect, it } from 'vitest';
import { render } from './entry-server';
import { floorPlansItemListJsonLd, planGroups } from './data/floorPlans';

// Task: Google must see the SAME floor-plan list in the pre-built page and the
// live page.
//
// The Floor Plans page's ItemList JSON-LD is emitted twice:
//   1. At build time by scripts/prerender.mjs, which injects the head produced
//      by entry-server's render() (EXTRA_JSONLD wiring for '/floor-plans').
//   2. Client-side by <Seo extraJsonLd> in the page component.
// Both are supposed to flow through the same shared module
// (floorPlansItemListJsonLd()). This test renders the route through the SAME
// entry-server pipeline the prerenderer uses, extracts the JSON-LD it would
// ship, and asserts it deep-equals what the shared module produces. If a
// refactor of the SEO model, the prerender wiring (EXTRA_JSONLD), or
// floorPlans.ts ever makes them diverge, this fails loudly instead of crawlers
// silently indexing a stale or mismatched floor-plan list.

/** Pull every <script type="application/ld+json"> payload out of a head string. */
function extractJsonLd(head: string): Record<string, unknown>[] {
  const scripts = [
    ...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
  // renderHeadTags escapes "<" as \u003c inside the JSON; JSON.parse restores it.
  return scripts.map((s) => JSON.parse(s) as Record<string, unknown>);
}

describe('prerendered /available-units JSON-LD matches the shared floorPlans module', () => {
  it('ships an ItemList that deep-equals floorPlansItemListJsonLd()', async () => {
    const { head } = await render('/available-units');

    const jsonLdBlocks = extractJsonLd(head);
    // Base @graph plus the floor-plans extra block — at minimum two scripts.
    expect(jsonLdBlocks.length).toBeGreaterThanOrEqual(2);

    // Find the ItemList structurally rather than by position so reordering
    // alone doesn't mask a real divergence.
    const itemLists = jsonLdBlocks.filter((b) => b['@type'] === 'ItemList');
    expect(itemLists).toHaveLength(1);

    expect(itemLists[0]).toEqual(floorPlansItemListJsonLd());
  });

  it('lists every plan group exactly once, in order, with resolvable deep links', async () => {
    const { head } = await render('/available-units');
    const itemList = extractJsonLd(head).find((b) => b['@type'] === 'ItemList')!;
    const items = itemList.itemListElement as {
      position: number;
      item: { url: string };
    }[];

    // One ListItem per plan group, positions 1..N with no gaps or duplicates.
    expect(items).toHaveLength(planGroups.length);
    items.forEach((li, i) => expect(li.position).toBe(i + 1));

    // Every schema URL must deep-link to a group id that actually exists.
    const groupIds = new Set(planGroups.map((g) => g.id));
    for (const li of items) {
      const planParam = new URL(li.item.url).searchParams.get('plan');
      expect(planParam).not.toBeNull();
      expect(groupIds.has(planParam!)).toBe(true);
    }
  });

  it('prerendered page body visibly shows the same plans the schema claims', async () => {
    const { html } = await render('/available-units');

    // Google requires structured data to reflect visible page content: every
    // group's type label and sq ft range must appear in the prerendered body.
    for (const g of planGroups) {
      const label = g.typeLabel.replace(/&/g, '&amp;');
      expect(html).toContain(label);
      // PlanCard renders sqft with toLocaleString (e.g. "1,003 sq ft").
      const sqftText =
        g.sqftMin === g.sqftMax
          ? `${g.sqftMin.toLocaleString()} sq ft`
          : `${g.sqftMin.toLocaleString()}\u2013${g.sqftMax.toLocaleString()} sq ft`;
      expect(html).toContain(sqftText);
    }
  });
});
