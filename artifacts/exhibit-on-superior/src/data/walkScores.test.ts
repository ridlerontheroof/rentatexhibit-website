// Walk Score single-source-of-truth guard.
//
// The Walk/Transit/Bike Scores are third-party facts (walkscore.com) surfaced
// across the Neighborhood strip, Map + Directions, homepage, Knowledge Center
// articles, and seo.ts quickAnswers/FAQ/JSON-LD. This suite fails when:
//   - any surface hand-copies a score instead of rendering from walkScores.ts
//     (page sources must import the module, not inline the numbers),
//   - the prose in knowledgeArticles.ts / seo.ts drifts from the constants,
//   - the source URL grows tracking params.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  WALK_SCORE,
  TRANSIT_SCORE,
  BIKE_SCORE,
  WALK_SCORES,
  WALK_SCORE_SOURCE_URL,
  WALK_SCORES_SENTENCE,
} from './walkScores';
import { KNOWLEDGE_ARTICLES } from './knowledgeArticles';
import { PAGE_SEO, APARTMENT_COMPLEX_NODE } from './seo';

const pageSource = (name: string): string =>
  readFileSync(join(__dirname, '..', 'pages', name), 'utf8');

describe('Walk Score data module', () => {
  it('holds the three scores with their Walk Score labels', () => {
    expect(WALK_SCORE).toMatchObject({ score: 99, label: "Walker's Paradise" });
    expect(TRANSIT_SCORE).toMatchObject({ score: 100, label: "Rider's Paradise" });
    expect(BIKE_SCORE).toMatchObject({ score: 86, label: 'Very Bikeable' });
    expect(WALK_SCORES).toHaveLength(3);
  });

  it('source URL is clean (https, walkscore.com, no query params)', () => {
    const url = new URL(WALK_SCORE_SOURCE_URL);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('www.walkscore.com');
    expect(url.search).toBe('');
  });

  it('pages render from the shared module instead of hand-copied numbers', () => {
    for (const page of ['Neighborhood.tsx', 'MapDirections.tsx', 'Home.tsx']) {
      expect(pageSource(page), `${page} must import from data/walkScores`).toMatch(
        /from '\.\.\/data\/walkScores'/,
      );
    }
    // The strip must not inline the raw scores as literals.
    expect(pageSource('Neighborhood.tsx')).not.toMatch(/99\/100|86\/100/);
  });

  it('knowledgeArticles.ts composes score prose from the shared constants (no inline literals)', () => {
    const source = readFileSync(join(__dirname, 'knowledgeArticles.ts'), 'utf8');
    expect(source).toMatch(/from '\.\/walkScores'/);
    // Scores must come from the module, never be hand-typed into prose.
    expect(source).not.toMatch(/99\/100|100\/100|86\/100/);
    expect(source).not.toMatch(/Walker.s Paradise|Rider.s Paradise|Very Bikeable/);
  });

  it('knowledge article prose matches the constants', () => {
    const text = KNOWLEDGE_ARTICLES.flatMap((a) => [
      a.answer,
      ...a.sections.flatMap((s) => s.paragraphs),
    ])
      .join(' ')
      .replace(/\u2019/g, "'"); // prose uses curly apostrophes
    expect(text).toContain(`${WALK_SCORE.score}/100 Walk Score`);
    expect(text).toContain(`${TRANSIT_SCORE.score}/100 Transit Score`);
    expect(text).toContain(`${BIKE_SCORE.score}/100 Bike Score`);
    expect(text).toContain(WALK_SCORE.label);
    expect(text).toContain(TRANSIT_SCORE.label);
    expect(text).toContain(BIKE_SCORE.label);
  });

  it('seo.ts surfaces cite the scores and stay in sync', () => {
    const neighborhood = PAGE_SEO['/neighborhood'];
    expect(neighborhood.quickAnswer).toContain(`${WALK_SCORE.score}/100 Walk Score`);
    expect(neighborhood.quickAnswer).toContain(`${TRANSIT_SCORE.score}/100 Transit Score`);
    const faqAnswers = neighborhood.faqs.map((f) => f.a);
    expect(faqAnswers).toContain(WALK_SCORES_SENTENCE);

    const features = (
      APARTMENT_COMPLEX_NODE.amenityFeature as Array<{ name: string }>
    ).map((f) => f.name);
    expect(features).toContain(
      `${WALK_SCORE.name} ${WALK_SCORE.score} (${WALK_SCORE.label}, per Walk Score)`,
    );
    expect(features).toContain(
      `${TRANSIT_SCORE.name} ${TRANSIT_SCORE.score} (${TRANSIT_SCORE.label}, per Walk Score)`,
    );
    expect(features).toContain(
      `${BIKE_SCORE.name} ${BIKE_SCORE.score} (${BIKE_SCORE.label}, per Walk Score)`,
    );
  });
});
