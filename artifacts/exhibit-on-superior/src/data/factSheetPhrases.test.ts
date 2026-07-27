import { describe, it, expect } from 'vitest';
import { bedroomRangePhrases, FACT_SHEET_WORDS } from './factSheetPhrases';
import { plans, CATEGORIES, type Category } from './floorPlans';

describe('fact-sheet bedroom-range phrases', () => {
  it('produces the current live wording from the actual plan dataset', () => {
    const p = bedroomRangePhrases(new Set(plans.map((pl) => pl.category)));
    expect(p.rangeTitle).toBe('Studio\u20133 Bedroom');
    expect(p.rangeBRTitle).toBe('Studio\u20133 BR');
    expect(p.rangeBRLower).toBe('studio\u20133 BR');
    expect(p.rangeLower).toBe('studio\u20133 bedroom');
    expect(p.throughPhrase).toBe('studios THROUGH THREE bedrooms');
    expect(p.summaryWords).toEqual(['Studio', 'Convertible', '1', '2', '3']);
  });

  // Table-driven: the wording must stay grammatical for any plausible future
  // unit mix, including ones that no longer start at studio.
  const cases: [Category[], Partial<ReturnType<typeof bedroomRangePhrases>>][] = [
    [
      ['studio', '1br', '2br', '3br'],
      { rangeTitle: 'Studio\u20133 Bedroom', throughPhrase: 'studios THROUGH THREE bedrooms' },
    ],
    [
      ['convertible', '1br', '2br', '3br'],
      { rangeTitle: 'Convertible\u20133 Bedroom', throughPhrase: 'convertibles THROUGH THREE bedrooms' },
    ],
    [
      ['1br', '2br', '3br'],
      {
        rangeTitle: '1\u20133 Bedroom',
        rangeBRLower: '1\u20133 BR',
        // no naïve "1s" pluralization
        throughPhrase: 'one-bedrooms THROUGH THREE bedrooms',
      },
    ],
    [
      ['studio', 'convertible'],
      { rangeTitle: 'Studio\u2013Convertible Bedroom', throughPhrase: 'studios THROUGH CONVERTIBLES' },
    ],
    [['2br'], { rangeTitle: '2\u20132 Bedroom', throughPhrase: 'two-bedrooms THROUGH TWO bedrooms' }],
  ];
  it.each(cases)('stays grammatical for mix %j', (mix, expected) => {
    const p = bedroomRangePhrases(new Set(mix));
    for (const [k, v] of Object.entries(expected)) expect(p[k as keyof typeof p]).toEqual(v);
  });

  it('the through phrase is composed from its exported parts (no string-shape coupling)', () => {
    const p = bedroomRangePhrases(new Set<Category>(['studio', '3br']));
    expect(p.throughPhrase).toBe(
      `${p.throughStart} THROUGH ${p.throughSpoken}${p.throughNoun ? ` ${p.throughNoun}` : ''}`,
    );
    expect(p.throughNoun).toBe('bedrooms');
    const noNoun = bedroomRangePhrases(new Set<Category>(['studio', 'convertible']));
    expect(noNoun.throughNoun).toBe('');
  });

  it('every declared plan category has wording parts', () => {
    for (const c of CATEGORIES) expect(FACT_SHEET_WORDS[c.id]).toBeDefined();
  });

  it('rejects an empty category set', () => {
    expect(() => bedroomRangePhrases(new Set())).toThrow();
  });
});
