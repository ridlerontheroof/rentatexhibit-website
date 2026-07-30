import { describe, expect, it } from 'vitest';
import {
  render,
  PAGE_SEO,
  KNOWLEDGE_PATHS,
  FLOOR_PLAN_PAGE_PATHS,
  UNIT_PATHS,
} from './entry-server';
// Same shared extractor the build-time guard uses (scripts/prerender.mjs).
// @ts-expect-error plain-JS module shared with the build script (no d.ts)
import { extractJsonLdPayloads } from '../scripts/validate-jsonld.mjs';

// Task: Google penalizes FAQPage rich-result markup whose questions/answers
// are not visibly on the page. This guard renders EVERY prerendered route
// (content pages, FAQ hub, knowledge articles, floor-plan pages, unit pages)
// through the same entry-server pipeline the prerenderer uses, pulls each
// FAQPage node out of the shipped JSON-LD, and asserts that every Question
// name and Answer text also appears in the page's rendered, crawler-visible
// body HTML. A Q&A that exists only in markup fails the suite before publish.

type JsonLdNode = Record<string, unknown>;

/** Every route the prerenderer writes, deduplicated. */
const ALL_PATHS: string[] = [
  ...new Set([
    ...Object.keys(PAGE_SEO),
    ...KNOWLEDGE_PATHS,
    ...FLOOR_PLAN_PAGE_PATHS,
    ...UNIT_PATHS,
  ]),
];

/** Named entities React/our copy actually emit; numeric forms decoded generically. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '\u2019',
  lsquo: '\u2018',
  rdquo: '\u201d',
  ldquo: '\u201c',
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '\u2026',
  rarr: '\u2192',
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

/**
 * Collapse rendered HTML down to the text a visitor (or Google's renderer)
 * can read: drop comments (renderToString splits dynamic text with
 * `<!-- -->`), drop tags, decode entities, and normalize whitespace.
 */
function visibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--.*?-->/gs, '')
      .replace(/<script\b[^>]*>.*?<\/script>/gis, ' ')
      .replace(/<style\b[^>]*>.*?<\/style>/gis, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize a JSON-LD string the same way for comparison. */
function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function faqPageNodes(payloads: string[]): JsonLdNode[] {
  const nodes = payloads.flatMap((raw) => {
    const parsed = JSON.parse(raw) as JsonLdNode;
    return Array.isArray(parsed['@graph']) ? (parsed['@graph'] as JsonLdNode[]) : [parsed];
  });
  return nodes.filter((n) => {
    const t = n['@type'];
    return t === 'FAQPage' || (Array.isArray(t) && t.includes('FAQPage'));
  });
}

interface Qa {
  question: string;
  answer: string;
}

function questionsOf(faq: JsonLdNode): Qa[] {
  const main = faq.mainEntity;
  const list = Array.isArray(main) ? main : main ? [main] : [];
  return list.map((q: JsonLdNode) => ({
    question: String(q.name ?? ''),
    answer: String((q.acceptedAnswer as JsonLdNode | undefined)?.text ?? ''),
  }));
}

describe('FAQPage JSON-LD mirrors visible on-page Q&A', () => {
  it('covers the full prerendered route set, including all FAQ-carrying pages', () => {
    // Baseline audit found FAQPage markup on 89 pages; the route set must at
    // least span every knowledge article plus the content pages with faqs.
    expect(ALL_PATHS.length).toBeGreaterThanOrEqual(89);
    expect(KNOWLEDGE_PATHS.length).toBeGreaterThan(0);
  });

  it.each(ALL_PATHS)('%s: every FAQ question and answer is visible in the body', async (p) => {
    const { html, head } = await render(p);
    const payloads = extractJsonLdPayloads(head) as string[];
    const faqs = faqPageNodes(payloads);

    // Pages whose SEO model declares FAQs must actually ship a FAQPage node.
    const declared = PAGE_SEO[p]?.faqs?.length ?? 0;
    if (declared > 0 && !PAGE_SEO[p]?.noindex) {
      expect(faqs.length, 'page declares faqs but ships no FAQPage node').toBeGreaterThan(0);
    }
    if (faqs.length === 0) return;

    const text = visibleText(html);
    const problems: string[] = [];
    for (const faq of faqs) {
      const qas = questionsOf(faq);
      expect(qas.length, 'FAQPage node with no questions').toBeGreaterThan(0);
      for (const { question, answer } of qas) {
        expect(question).not.toEqual('');
        expect(answer).not.toEqual('');
        if (!text.includes(normalize(question))) {
          problems.push(`question not visible on page: "${question}"`);
        }
        if (!text.includes(normalize(answer))) {
          problems.push(`answer not visible on page for "${question}"`);
        }
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('the visibility check itself catches markup-only Q&A', () => {
    // Sanity-check the comparison helpers so a broken normalizer can't turn
    // the whole suite into a silent pass.
    const body = '<p>What is<!-- --> parking like?</p><div>Valet &amp; garage.</div>';
    const text = visibleText(body);
    expect(text.includes(normalize('What is parking like?'))).toBe(true);
    expect(text.includes(normalize('Valet & garage.'))).toBe(true);
    expect(text.includes(normalize('Is there a pool?'))).toBe(false);
  });
});
