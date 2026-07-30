import { describe, expect, it } from 'vitest';
import { render } from './entry-server';
import { knowledgeHubJsonLd, KNOWLEDGE_ARTICLES, knowledgePath } from './data/knowledge';
import { SITE_URL } from './data/seo';

// Guards that the Knowledge Center hub page ships an ItemList in its prerendered
// head that is identical to what the client-side <Seo extraJsonLd> emits via
// knowledgeHubJsonLd(). If the EXTRA_JSONLD wiring in entry-server.tsx ever
// diverges from the Knowledge.tsx extraJsonLd prop, this test fails loudly so
// crawlers never silently index a mismatched or absent hub schema.

/** Pull every <script type="application/ld+json"> payload out of a head string. */
function extractJsonLd(head: string): Record<string, unknown>[] {
  const scripts = [
    ...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
  // renderHeadTags escapes "<" as \u003c inside the JSON; JSON.parse restores it.
  return scripts.map((s) => JSON.parse(s) as Record<string, unknown>);
}

describe('prerendered /knowledge hub JSON-LD matches knowledgeHubJsonLd()', () => {
  it('ships exactly one ItemList that deep-equals knowledgeHubJsonLd()', async () => {
    const { head } = await render('/knowledge');

    const jsonLdBlocks = extractJsonLd(head);
    // Base @graph block plus the hub ItemList extra block.
    expect(jsonLdBlocks.length).toBeGreaterThanOrEqual(2);

    const itemLists = jsonLdBlocks.filter((b) => b['@type'] === 'ItemList');
    expect(itemLists).toHaveLength(1);

    expect(itemLists[0]).toEqual(knowledgeHubJsonLd());
  });

  it('lists every knowledge article exactly once, in order, with canonical URLs', async () => {
    const { head } = await render('/knowledge');
    const itemList = extractJsonLd(head).find((b) => b['@type'] === 'ItemList')!;
    const items = itemList.itemListElement as { position: number; name: string; url: string }[];

    expect(items).toHaveLength(KNOWLEDGE_ARTICLES.length);
    items.forEach((li, i) => {
      expect(li.position).toBe(i + 1);
      expect(li.url).toBe(`${SITE_URL}${knowledgePath(KNOWLEDGE_ARTICLES[i].slug)}`);
      expect(li.name).toBe(KNOWLEDGE_ARTICLES[i].question);
    });
  });
});
