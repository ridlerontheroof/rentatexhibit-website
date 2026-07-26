// Guards against renter-facing fact drift (see the 776-vs-767 / 35-vs-27 incident):
// the two-bedroom/one-bath fee sq-ft range and the floor-plan configuration count
// must agree across the Fees page, the Apartment Guide copy, and the knowledge
// articles — and the fee tiers must match the floor-plan dataset where it is
// the source of truth.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { plans, planGroups } from './floorPlans';
import { KNOWLEDGE_ARTICLES } from './knowledgeArticles';

const read = (rel: string) =>
  // Decode \uXXXX escapes so source-level '\u2013' compares equal to a real en dash.
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8').replace(
    /\\u([0-9a-fA-F]{4})/g,
    (_, hex: string) => String.fromCharCode(parseInt(hex, 16)),
  );

const feesSource = read('../pages/Fees.tsx');
const guideSource = read('../pages/ApartmentGuide.tsx');

/** "767\u2013821 sq ft" or "983 sq ft" from a min/max pair, matching site copy formatting. */
function rangeLabel(min: number, max: number): string {
  const fmt = (n: number) => n.toLocaleString('en-US');
  return min === max ? `${fmt(min)} sq ft` : `${fmt(min)}\u2013${fmt(max)} sq ft`;
}

/** Rows of the Fees-page utility-fee table, parsed from source. */
function feeTableRows(): { type: string; size: string; fee: string }[] {
  const rows = [
    ...feesSource.matchAll(/\{ type: '([^']+)', size: '([^']+)', fee: '(\$\d+)' \}/g),
  ].map((m) => ({ type: m[1], size: m[2], fee: m[3] }));
  expect(rows.length, 'expected to parse the UTILITY_BUNDLE table from Fees.tsx').toBeGreaterThanOrEqual(8);
  return rows;
}

const utilityFeeArticle = KNOWLEDGE_ARTICLES.find((a) => a.slug === 'utility-fee-by-floor-plan');
const utilityFeeArticleText = JSON.stringify(utilityFeeArticle);

describe('two-bedroom/one-bath fee sq-ft range', () => {
  const twoBedOneBath = plans.filter((p) => p.category === '2br' && p.baths === 1 && !p.den);
  const label = rangeLabel(
    Math.min(...twoBedOneBath.map((p) => p.sqftMin)),
    Math.max(...twoBedOneBath.map((p) => p.sqft)),
  );

  it('has 2BR/1BA plans in the dataset', () => {
    expect(twoBedOneBath.length).toBeGreaterThan(0);
  });

  it('matches the Fees page table row', () => {
    const row = feeTableRows().find((r) => r.type === '2 Bedroom / 1 Bath');
    expect(row, 'Fees.tsx must keep a "2 Bedroom / 1 Bath" row').toBeDefined();
    expect(row!.size).toBe(label);
  });

  it('matches the knowledge article copy', () => {
    expect(utilityFeeArticle, 'utility-fee-by-floor-plan article must exist').toBeDefined();
    expect(utilityFeeArticleText).toContain(`Two-bedroom/one-bath (${label})`);
  });
});

describe('studio fee sq-ft range', () => {
  const studios = plans.filter((p) => p.category === 'studio');
  const label = rangeLabel(
    Math.min(...studios.map((p) => p.sqftMin)),
    Math.max(...studios.map((p) => p.sqft)),
  );

  it('has studio plans in the dataset', () => {
    expect(studios.length).toBeGreaterThan(0);
  });

  it('matches the Fees page table row', () => {
    const row = feeTableRows().find((r) => r.type === 'Studio');
    expect(row, 'Fees.tsx must keep a "Studio" row').toBeDefined();
    expect(row!.size).toBe(label);
  });

  it('matches the knowledge article copy', () => {
    expect(utilityFeeArticle, 'utility-fee-by-floor-plan article must exist').toBeDefined();
    expect(utilityFeeArticleText).toContain(`Studio (${label})`);
  });
});

describe('floor-plan configuration count', () => {
  it('Apartment Guide copy matches the dataset group count', () => {
    const m = guideSource.match(/(\d+) floor-plan\s+configurations/);
    expect(m, 'ApartmentGuide.tsx must state the "<N> floor-plan configurations" count').not.toBeNull();
    expect(Number(m![1])).toBe(planGroups.length);
  });
});

describe('utility fee tiers agree between Fees page and knowledge article', () => {
  it('every Fees table sq-ft range appears in the article with the same fee', () => {
    for (const row of feeTableRows()) {
      const idx = utilityFeeArticleText.indexOf(`(${row.size})`);
      expect(
        idx,
        `knowledge article is missing the "${row.type}" range "(${row.size})" from Fees.tsx`,
      ).toBeGreaterThanOrEqual(0);
      // Rows can share a sentence ("Studio (…) and Jr. Convertible (…): $95"),
      // so match the first fee amount that follows the range mention.
      const feeAfter = utilityFeeArticleText.slice(idx).match(/\$\d+/);
      expect(
        feeAfter?.[0],
        `knowledge article fee drifted from Fees.tsx for "${row.type}" (${row.size})`,
      ).toBe(row.fee);
    }
  });

  it('every fee amount in the Fees table appears in the article summary answer', () => {
    for (const row of feeTableRows()) {
      expect(utilityFeeArticle!.answer).toContain(row.fee);
    }
  });
});
