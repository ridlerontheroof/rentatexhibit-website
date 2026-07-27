// Bedroom-range phrasing for the directory-listing fact sheet
// (scripts/generate-fact-sheet.ts). Pure module so the wording rules are
// unit-testable: every checklist phrase ("Studio–3 Bedroom", "studio–3 BR",
// "studios THROUGH THREE bedrooms") derives from the CATEGORIES list in
// floorPlans.ts, so a new (or retired) plan category can never leave the
// printed sheet or its checklist advertising a stale bedroom mix.
import { CATEGORIES, type Category } from './floorPlans';

/**
 * Per-category wording parts. Typed as a full Record so adding a Category
 * without fact-sheet wording is a compile error, not a silent stale sheet.
 * - word:   range/summary token ("Studio–3 Bedroom", "Studio & 3 Bedroom Apartments")
 * - plural: lowercase plural noun for "<plural> THROUGH ..." sentences
 * - spoken: UPPERCASE spelled-out form for emphasis copy
 * - bedroomNoun: true when the spoken form needs a trailing "bedrooms" noun
 */
export const FACT_SHEET_WORDS: Record<
  Category,
  { word: string; plural: string; spoken: string; bedroomNoun: boolean }
> = {
  studio: { word: 'Studio', plural: 'studios', spoken: 'STUDIOS', bedroomNoun: false },
  convertible: { word: 'Convertible', plural: 'convertibles', spoken: 'CONVERTIBLES', bedroomNoun: false },
  '1br': { word: '1', plural: 'one-bedrooms', spoken: 'ONE', bedroomNoun: true },
  '2br': { word: '2', plural: 'two-bedrooms', spoken: 'TWO', bedroomNoun: true },
  '3br': { word: '3', plural: 'three-bedrooms', spoken: 'THREE', bedroomNoun: true },
};

export interface BedroomRangePhrases {
  /** Summary tokens in CATEGORIES order, e.g. ["Studio", "Convertible", "1", "2", "3"]. */
  summaryWords: string[];
  /** "Studio–3 Bedroom" */
  rangeTitle: string;
  /** "Studio–3 BR" */
  rangeBRTitle: string;
  /** "studio–3 BR" */
  rangeBRLower: string;
  /** "studio–3 bedroom" */
  rangeLower: string;
  /** "studios" — lowercase plural of the first category. */
  throughStart: string;
  /** "THREE" — uppercase spoken form of the last category. */
  throughSpoken: string;
  /** "bedrooms" when the last category needs the noun, otherwise "". */
  throughNoun: string;
  /** "studios THROUGH THREE bedrooms" — full emphasis sentence fragment. */
  throughPhrase: string;
}

/**
 * Build every bedroom-range phrase the fact sheet uses from the plan
 * categories actually present (in CATEGORIES order).
 */
export function bedroomRangePhrases(present: ReadonlySet<Category>): BedroomRangePhrases {
  const cats = CATEGORIES.filter((c) => present.has(c.id));
  if (cats.length === 0) throw new Error('bedroomRangePhrases: no plan categories present');
  const first = FACT_SHEET_WORDS[cats[0].id];
  const last = FACT_SHEET_WORDS[cats[cats.length - 1].id];
  const throughNoun = last.bedroomNoun ? 'bedrooms' : '';
  return {
    summaryWords: cats.map((c) => FACT_SHEET_WORDS[c.id].word),
    rangeTitle: `${first.word}\u2013${last.word} Bedroom`,
    rangeBRTitle: `${first.word}\u2013${last.word} BR`,
    rangeBRLower: `${first.word.toLowerCase()}\u2013${last.word} BR`,
    rangeLower: `${first.word.toLowerCase()}\u2013${last.word} bedroom`,
    throughStart: first.plural,
    throughSpoken: last.spoken,
    throughNoun,
    throughPhrase: `${first.plural} THROUGH ${last.spoken}${throughNoun ? ` ${throughNoun}` : ''}`,
  };
}
