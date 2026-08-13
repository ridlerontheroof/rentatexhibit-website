// Property-facts single-source-of-truth guard (walkScores.test.ts pattern).
//
// Office hours, the credit-score requirement, the 298-unit total, and the
// building-wide square-footage range are changeable leasing facts that appear
// on many surfaces. Pages and seo.ts must render them from propertyFacts.ts;
// Knowledge Center prose (impractical to template sentence-by-sentence) is
// scanned here so ANY literal that drifts from the canonical values fails the
// suite with the offending location listed.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CREDIT_SCORE_COSIGNER_MIN,
  CREDIT_SCORE_MIN,
  OFFICE_HOURS_LINES,
  OFFICE_HOURS_SATURDAY,
  OFFICE_HOURS_WEEKDAY,
  SATURDAY_HOURS_CLOCK,
  SATURDAY_HOURS_COMPACT,
  SATURDAY_HOURS_SHORT,
  SQFT_MAX_DISPLAY,
  SQFT_MIN_DISPLAY,
  SQFT_RANGE_DISPLAY,
  UNIT_TOTAL,
  WEEKDAY_HOURS_CLOCK,
  WEEKDAY_HOURS_COMPACT,
  WEEKDAY_HOURS_SHORT,
} from './propertyFacts';
import { SQFT_MIN, SQFT_MAX } from './floorPlans';
import { KNOWLEDGE_ARTICLES } from './knowledgeArticles';
import { ALL_BLOG_ARTICLES } from './blogArticles';
import { PAGE_SEO, APARTMENT_COMPLEX_NODE } from './seo';

const pagesDir = join(__dirname, '..', 'pages');
const pageSource = (name: string): string => readFileSync(join(pagesDir, name), 'utf8');
const seoSource = readFileSync(join(__dirname, 'seo.ts'), 'utf8');
const knowledgeSource = readFileSync(join(__dirname, 'knowledgeArticles.ts'), 'utf8');
const blogSource = readFileSync(join(__dirname, 'blogArticles.ts'), 'utf8');
const allPageFiles = readdirSync(pagesDir).filter((f) => f.endsWith('.tsx'));

// The printable fact sheet (directory-listing cleanup) states the same facts;
// its generator source AND its committed outputs are scanned so a stale sheet
// can never ship after an hours/credit/sqft/unit-total change.
const artifactRoot = join(__dirname, '..', '..');
const generatorSource = readFileSync(join(artifactRoot, 'scripts', 'generate-fact-sheet.ts'), 'utf8');
const listingsDir = join(artifactRoot, 'docs', 'directory-listings');
const factSheetTxt = readFileSync(join(listingsDir, 'fact-sheet.txt'), 'utf8');
const factsJsonRaw = readFileSync(join(listingsDir, 'facts.json'), 'utf8');
const factsJson = JSON.parse(factsJsonRaw) as {
  officeHours: string[];
  sqftRange: string;
};

/** Decode \uXXXX escape sequences so source scans see the rendered characters. */
const unescapeSource = (s: string): string =>
  s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

/** Every scannable surface: [label, text]. Sources catch literals pre-render. */
const surfaces: Array<[string, string]> = [
  ['seo.ts', unescapeSource(seoSource)],
  ['knowledgeArticles.ts', unescapeSource(knowledgeSource)],
  ['blogArticles.ts', unescapeSource(blogSource)],
  ...allPageFiles.map((f): [string, string] => [`pages/${f}`, unescapeSource(pageSource(f))]),
  ['scripts/generate-fact-sheet.ts', unescapeSource(generatorSource)],
  ['docs/directory-listings/fact-sheet.txt', factSheetTxt],
  ['docs/directory-listings/facts.json', factsJsonRaw],
];

/** Rendered Knowledge Center prose (what visitors and crawlers actually read). */
const knowledgeText = KNOWLEDGE_ARTICLES.flatMap((a) => [
  a.question,
  a.answer,
  ...a.sections.flatMap((s) => [s.heading ?? '', ...s.paragraphs]),
]).join('\n');

/** Rendered seo.ts prose (quickAnswers, FAQ answers, descriptions). */
const seoText = Object.values(PAGE_SEO)
  .flatMap((p) => [p.title, p.description, p.quickAnswer, ...p.faqs.flatMap((f) => [f.q, f.a])])
  .join('\n');

/** Rendered blog prose (what visitors and crawlers actually read). */
const blogText = ALL_BLOG_ARTICLES.flatMap((a) => [
  a.title,
  a.summary,
  ...a.sections.flatMap((s) => [s.heading ?? '', ...s.paragraphs, ...(s.list ?? [])]),
  ...a.faqs.flatMap((f) => [f.question, f.answer]),
]).join('\n');

const allProse = `${knowledgeText}\n${seoText}\n${blogText}`;

// ---------------------------------------------------------------------------
// 1. Office hours
// ---------------------------------------------------------------------------

// "9am–6pm", "9 AM–6 PM", "9:00 AM – 6:00 PM", "9am to 6pm", "9:00 AM &ndash; 6:00 PM"
const HOUR_RANGE_RE =
  /\b\d{1,2}(?::\d{2})?\s?(?:am|pm|AM|PM)\s*(?:\u2013|\u2014|-|&ndash;|to)\s*\d{1,2}(?::\d{2})?\s?(?:am|pm|AM|PM)\b/g;

/** Normalize any separator style to a bare en dash for set comparison. */
const normalizeRange = (s: string): string =>
  s.replace(/\s*(?:\u2013|\u2014|-|&ndash;|to)\s*/, '\u2013');

// Every rendering of the office hours this site is allowed to use, derived
// from the canonical module — change the module and stale prose fails here.
const ALLOWED_HOUR_RANGES = new Set(
  [
    WEEKDAY_HOURS_COMPACT,
    SATURDAY_HOURS_COMPACT,
    WEEKDAY_HOURS_SHORT,
    SATURDAY_HOURS_SHORT,
    WEEKDAY_HOURS_CLOCK,
    SATURDAY_HOURS_CLOCK,
    // Non-office-hours facts that legitimately use an hour range:
    '10pm\u20136am', // outdoor-amenity quiet hours
  ].map(normalizeRange),
);

describe('office hours', () => {
  it('module values match the published leasing-office hours', () => {
    expect(OFFICE_HOURS_WEEKDAY).toMatchObject({ opens: '09:00', closes: '18:00' });
    expect(OFFICE_HOURS_SATURDAY).toMatchObject({ opens: '10:00', closes: '17:00' });
    expect(WEEKDAY_HOURS_COMPACT).toBe('9am\u20136pm');
    expect(SATURDAY_HOURS_COMPACT).toBe('10am\u20135pm');
    expect(WEEKDAY_HOURS_CLOCK).toBe('9:00 AM\u20136:00 PM');
    expect(OFFICE_HOURS_LINES).toHaveLength(3);
    expect(OFFICE_HOURS_LINES[2]).toBe('Sunday: Closed');
  });

  it('every hour-range literal on every surface matches a canonical rendering', () => {
    const bad: string[] = [];
    for (const [label, text] of surfaces) {
      for (const m of text.match(HOUR_RANGE_RE) ?? []) {
        if (!ALLOWED_HOUR_RANGES.has(normalizeRange(m))) bad.push(`${label}: "${m}"`);
      }
    }
    expect(bad, `stale office-hours literals:\n${bad.join('\n')}`).toEqual([]);
  });

  it('pages that display office hours render from the shared module', () => {
    for (const page of ['About.tsx', 'Residents.tsx', 'MapDirections.tsx', 'ContactUs.tsx']) {
      expect(pageSource(page), `${page} must import from data/propertyFacts`).toMatch(
        /from '\.\.\/data\/propertyFacts'/,
      );
    }
  });

  it('JSON-LD openingHoursSpecification comes from the module', () => {
    const spec = (APARTMENT_COMPLEX_NODE as Record<string, unknown>)
      .openingHoursSpecification as Array<Record<string, unknown>>;
    expect(spec).toMatchObject([
      { opens: OFFICE_HOURS_WEEKDAY.opens, closes: OFFICE_HOURS_WEEKDAY.closes },
      { opens: OFFICE_HOURS_SATURDAY.opens, closes: OFFICE_HOURS_SATURDAY.closes },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 2. Credit score requirement
// ---------------------------------------------------------------------------

describe('credit score requirement', () => {
  it('module values match the published policy', () => {
    expect(CREDIT_SCORE_MIN).toBe(700);
    expect(CREDIT_SCORE_COSIGNER_MIN).toBe(600);
  });

  it('every credit-score number on every surface matches the canonical values', () => {
    const allowed = new Set([CREDIT_SCORE_MIN, CREDIT_SCORE_COSIGNER_MIN]);
    const bad: string[] = [];
    for (const [label, text] of surfaces) {
      for (const line of text.split('\n')) {
        if (!/credit|co-?signer/i.test(line)) continue;
        // Standalone 3-digit scores; skip dollar amounts ($300,000) and
        // thousands groups, and skip Tailwind shade classes like gray-700.
        // Skip dollar amounts, thousands groups, phone numbers (312-450-0635),
        // and Tailwind shade classes like gray-700.
        for (const m of line.matchAll(/(?<![$\d,.\w-])([1-8]\d{2})(?![,-]?\d)\b/g)) {
          const n = parseInt(m[1], 10);
          if (!allowed.has(n)) bad.push(`${label}: "${line.trim().slice(0, 120)}" → ${n}`);
        }
      }
    }
    expect(bad, `stale credit-score literals:\n${bad.join('\n')}`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. Unit total
// ---------------------------------------------------------------------------

describe('unit total', () => {
  it('module value matches the tower', () => {
    expect(UNIT_TOTAL).toBe(298);
  });

  it('every "N residences/apartments/homes" total matches UNIT_TOTAL', () => {
    // 3-digit totals only, so plan-level counts ("27 residence lines",
    // "34 floors") never match.
    const re = /\b(\d{3})(?:[-\s])(?:residences?|apartments?|homes)\b/g;
    const bad: string[] = [];
    for (const [label, text] of surfaces) {
      for (const m of text.matchAll(re)) {
        if (parseInt(m[1], 10) !== UNIT_TOTAL) bad.push(`${label}: "${m[0]}"`);
      }
    }
    expect(bad, `stale unit-total literals:\n${bad.join('\n')}`).toEqual([]);
  });

  it('pages and seo.ts never hand-type the total; JSON-LD uses the constant', () => {
    for (const page of ['About.tsx', 'Reviews.tsx', 'VirtualTour.tsx']) {
      expect(pageSource(page), `${page} must not inline the unit total`).not.toMatch(/\b298\b/);
      expect(pageSource(page)).toMatch(/UNIT_TOTAL/);
    }
    expect(seoSource).not.toMatch(/\b298\b/);
    expect(
      (APARTMENT_COMPLEX_NODE as Record<string, unknown>).numberOfAccommodationUnits,
    ).toBe(UNIT_TOTAL);
  });
});

// ---------------------------------------------------------------------------
// 4. Square-footage range (canonical source: floorPlans.ts)
// ---------------------------------------------------------------------------

describe('square-footage range', () => {
  it('display strings derive from floorPlans.ts', () => {
    expect(SQFT_MIN_DISPLAY).toBe(SQFT_MIN.toLocaleString('en-US'));
    expect(SQFT_MAX_DISPLAY).toBe(SQFT_MAX.toLocaleString('en-US'));
    expect(SQFT_RANGE_DISPLAY).toBe(`${SQFT_MIN_DISPLAY}\u2013${SQFT_MAX_DISPLAY}`);
  });

  it('every square-footage literal on every surface stays inside the canonical range', () => {
    // Numbers directly modifying a square-feet unit, e.g. "448 square feet",
    // "1,528-square-foot", "554 sq ft".
    const re = /\b(\d{1,2},\d{3}|\d{3})(?:[-\s\u2013\u2011]|&ndash;)?\s*(?:square[-\s]f|sq\.?\s?ft)/gi;
    const bad: string[] = [];
    for (const [label, text] of surfaces) {
      for (const m of text.matchAll(re)) {
        const n = parseInt(m[1].replace(',', ''), 10);
        if (n < SQFT_MIN || n > SQFT_MAX) bad.push(`${label}: "${m[0]}" (${n})`);
      }
    }
    expect(bad, `out-of-range square-footage literals:\n${bad.join('\n')}`).toEqual([]);
  });

  it('every sqft range literal stays inside the canonical endpoints', () => {
    // Any "low to high" sqft-style span (3-digit low, comma-formatted high)
    // must sit inside [SQFT_MIN, SQFT_MAX]; a canonical-endpoint change makes
    // every stale building-wide range fall outside and fail here.
    const re = /(?<![\d,.])(\d{3})\s*(?:\u2013|-|&ndash;|to)\s*(\d{1,2},\d{3})\b/g;
    const bad: string[] = [];
    for (const [label, text] of surfaces) {
      for (const m of text.matchAll(re)) {
        const low = parseInt(m[1], 10);
        const high = parseInt(m[2].replace(',', ''), 10);
        if (low < SQFT_MIN || high > SQFT_MAX) bad.push(`${label}: "${m[0]}"`);
      }
    }
    expect(bad, `out-of-range sqft spans:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the About page derives its range from the shared module', () => {
    const about = pageSource('About.tsx');
    expect(about).toMatch(/SQFT_RANGE_DISPLAY/);
    expect(about).not.toMatch(/448|1,528/);
  });
});

// ---------------------------------------------------------------------------
// Printable fact sheet (directory-listing assets) stays locked to the source
// ---------------------------------------------------------------------------

describe('fact-sheet generator and outputs', () => {
  it('the generator sources facts from the canonical modules, never hand-typed values', () => {
    // Hours come from the JSON-LD builder (which renders propertyFacts.ts);
    // sqft range comes straight from floorPlans.ts.
    expect(generatorSource).toMatch(/buildJsonLd/);
    expect(generatorSource).toMatch(/openingHoursSpecification/);
    expect(generatorSource).toMatch(
      /import \{[^}]*SQFT_MIN[^}]*SQFT_MAX[^}]*\} from '\.\.\/src\/data\/floorPlans'/,
    );
    // No hand-typed hour or sqft-endpoint literals in the generator itself.
    expect(generatorSource).not.toMatch(/\b(?:09|10|17|18):00\b/);
    expect(generatorSource).not.toMatch(new RegExp(`\\b(?:${SQFT_MIN}|${SQFT_MAX})\\b`));
  });

  it('committed facts.json states the canonical hours and sqft range', () => {
    const allowed = new Set(
      [
        WEEKDAY_HOURS_SHORT,
        SATURDAY_HOURS_SHORT,
        WEEKDAY_HOURS_CLOCK,
        SATURDAY_HOURS_CLOCK,
        WEEKDAY_HOURS_COMPACT,
        SATURDAY_HOURS_COMPACT,
      ].map(normalizeRange),
    );
    for (const line of factsJson.officeHours) {
      const range = line.match(HOUR_RANGE_RE)?.[0];
      expect(range, `facts.json hours line "${line}" must contain an hour range`).toBeTruthy();
      expect(allowed.has(normalizeRange(range as string)), `stale hours in facts.json: "${line}"`).toBe(
        true,
      );
    }
    expect(factsJson.sqftRange).toBe(`${SQFT_MIN}\u2013${SQFT_MAX} sq ft`);
  });
});

// ---------------------------------------------------------------------------
// Rendered prose still states the canonical facts (values, not just sources)
// ---------------------------------------------------------------------------

describe('rendered prose states the canonical facts', () => {
  it('hours, credit, unit total, and sqft range all appear with canonical values', () => {
    expect(allProse).toContain(WEEKDAY_HOURS_COMPACT);
    expect(allProse).toContain(SATURDAY_HOURS_COMPACT);
    expect(allProse).toContain(`credit score of ${CREDIT_SCORE_MIN}`);
    expect(allProse).toContain(`${CREDIT_SCORE_COSIGNER_MIN}+`);
    expect(allProse).toContain(`${UNIT_TOTAL} residences`);
    expect(allProse).toContain(`${SQFT_MIN_DISPLAY} to ${SQFT_MAX_DISPLAY} square feet`);
  });
});
