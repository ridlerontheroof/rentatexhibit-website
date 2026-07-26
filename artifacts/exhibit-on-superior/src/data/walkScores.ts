// Walk Score® metrics for 165 W Superior St — single source of truth.
//
// These are third-party scores from walkscore.com; every surface that cites
// them (Neighborhood strip, Map + Directions, Knowledge Center, seo.ts
// quickAnswers/FAQs, JSON-LD amenityFeature) must render from this module so
// the numbers can never drift. Attribute visibly ("per Walk Score") wherever
// the numbers appear.

export interface WalkScoreMetric {
  /** e.g. "Walk Score" */
  name: string;
  /** 0–100 score as published by walkscore.com. */
  score: number;
  /** Walk Score's own label for this score band. */
  label: string;
}

export const WALK_SCORE: WalkScoreMetric = {
  name: 'Walk Score',
  score: 99,
  label: "Walker's Paradise",
};

export const TRANSIT_SCORE: WalkScoreMetric = {
  name: 'Transit Score',
  score: 100,
  label: "Rider's Paradise",
};

export const BIKE_SCORE: WalkScoreMetric = {
  name: 'Bike Score',
  score: 86,
  label: 'Very Bikeable',
};

export const WALK_SCORES: WalkScoreMetric[] = [WALK_SCORE, TRANSIT_SCORE, BIKE_SCORE];

/** Clean source URL (no tracking params). */
export const WALK_SCORE_SOURCE_URL =
  'https://www.walkscore.com/score/165-w-superior-st-chicago-il-60654';

/** When the scores were last verified against walkscore.com. */
export const WALK_SCORES_CHECKED = 'July 2026';

/** Prose apostrophes: the site's renter-facing copy uses curly quotes. */
const curly = (s: string): string => s.replace(/'/g, '\u2019');

/** e.g. `a 99/100 Walk Score (“Walker’s Paradise”)` — curly-quoted for prose. */
export function scorePhrase(m: WalkScoreMetric): string {
  const article = m.score === 86 ? 'an' : 'a';
  const perfect = m.score === 100 ? 'perfect ' : '';
  return `${article} ${perfect}${m.score}/100 ${m.name} (\u201c${curly(m.label)}\u201d)`;
}

export const WALK_SCORE_PHRASE = scorePhrase(WALK_SCORE);
export const TRANSIT_SCORE_PHRASE = scorePhrase(TRANSIT_SCORE);
export const BIKE_SCORE_PHRASE = scorePhrase(BIKE_SCORE);

/** Full three-score citation used in article prose. */
export const WALK_SCORES_CITATION = `Per Walk Score, the address rates ${WALK_SCORE_PHRASE}, ${TRANSIT_SCORE_PHRASE}, and ${BIKE_SCORE_PHRASE}.`;

/**
 * Shared one-line citation used verbatim in visible copy and JSON-LD so the
 * two can never disagree.
 */
export const WALK_SCORES_SENTENCE = `Walk Score rates the address ${WALK_SCORE_PHRASE}, ${TRANSIT_SCORE_PHRASE}, and ${BIKE_SCORE_PHRASE}.`;
