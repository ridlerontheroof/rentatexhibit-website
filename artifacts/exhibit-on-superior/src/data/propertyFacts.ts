// Changeable property facts for Exhibit On Superior — single source of truth.
//
// These are leasing-office facts that appear hand-typed across many surfaces
// (pages, seo.ts quickAnswers/FAQs, JSON-LD, Knowledge Center prose). Every
// surface must render from this module — or, for Knowledge Center prose that
// is impractical to template sentence-by-sentence, is scanned by
// propertyFacts.test.ts and fails the moment a literal drifts from these
// values. Follow the walkScores.ts pattern.
//
// Covered fact families:
//   1. Leasing office hours (Mon–Fri 9–6, Sat 10–5, closed Sunday)
//   2. Credit score requirement (700, or 600+ with a qualified co-signer)
//   3. Unit total (298 residences)
//   4. Building-wide square-footage range (derived from floorPlans.ts)

import { SQFT_MIN, SQFT_MAX } from './floorPlans';

// ---------------------------------------------------------------------------
// Office hours
// ---------------------------------------------------------------------------

export interface OfficeHoursBand {
  /** schema.org dayOfWeek values for JSON-LD openingHoursSpecification. */
  dayOfWeek: string[];
  /** 24h "HH:MM" open time (JSON-LD format). */
  opens: string;
  /** 24h "HH:MM" close time (JSON-LD format). */
  closes: string;
}

export const OFFICE_HOURS_WEEKDAY: OfficeHoursBand = {
  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  opens: '09:00',
  closes: '18:00',
};

export const OFFICE_HOURS_SATURDAY: OfficeHoursBand = {
  dayOfWeek: ['Saturday'],
  opens: '10:00',
  closes: '17:00',
};

/** 12-hour formatting styles used across the site's copy. */
type HourStyle = 'compact' | 'short' | 'clock';

/** "09:00" → "9am" | "9 AM" | "9:00 AM" (site copy is always on-the-hour). */
function to12h(hhmm: string, style: HourStyle): string {
  const [h24, mm] = hhmm.split(':').map((n) => parseInt(n, 10));
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h = ((h24 + 11) % 12) + 1;
  if (style === 'compact') return `${h}${mm ? `:${String(mm).padStart(2, '0')}` : ''}${suffix.toLowerCase()}`;
  if (style === 'short') return `${h}${mm ? `:${String(mm).padStart(2, '0')}` : ''} ${suffix}`;
  return `${h}:${String(mm).padStart(2, '0')} ${suffix}`;
}

/** e.g. "9am–6pm" | "9 AM–6 PM" | "9:00 AM–6:00 PM" (en dash). */
export function hoursRange(band: OfficeHoursBand, style: HourStyle): string {
  return `${to12h(band.opens, style)}\u2013${to12h(band.closes, style)}`;
}

/** "9am–6pm" — Knowledge Center prose style. */
export const WEEKDAY_HOURS_COMPACT = hoursRange(OFFICE_HOURS_WEEKDAY, 'compact');
/** "10am–5pm" */
export const SATURDAY_HOURS_COMPACT = hoursRange(OFFICE_HOURS_SATURDAY, 'compact');
/** "9 AM–6 PM" — short display style. */
export const WEEKDAY_HOURS_SHORT = hoursRange(OFFICE_HOURS_WEEKDAY, 'short');
/** "10 AM–5 PM" */
export const SATURDAY_HOURS_SHORT = hoursRange(OFFICE_HOURS_SATURDAY, 'short');
/** "9:00 AM–6:00 PM" — full clock style. */
export const WEEKDAY_HOURS_CLOCK = hoursRange(OFFICE_HOURS_WEEKDAY, 'clock');
/** "10:00 AM–5:00 PM" */
export const SATURDAY_HOURS_CLOCK = hoursRange(OFFICE_HOURS_SATURDAY, 'clock');

/** Office-hours list rows used verbatim on About, Residents, Map + Directions. */
export const OFFICE_HOURS_LINES: string[] = [
  `Monday \u2013 Friday: ${to12h(OFFICE_HOURS_WEEKDAY.opens, 'clock')} \u2013 ${to12h(OFFICE_HOURS_WEEKDAY.closes, 'clock')}`,
  `Saturday: ${to12h(OFFICE_HOURS_SATURDAY.opens, 'clock')} \u2013 ${to12h(OFFICE_HOURS_SATURDAY.closes, 'clock')}`,
  'Sunday: Closed',
];

// ---------------------------------------------------------------------------
// Credit score requirement
// ---------------------------------------------------------------------------

/** Minimum credit score to qualify without a co-signer. */
export const CREDIT_SCORE_MIN = 700;
/** Minimum credit score to qualify WITH a qualified co-signer ("600+"). */
export const CREDIT_SCORE_COSIGNER_MIN = 600;

// ---------------------------------------------------------------------------
// Application screening & requirements (leasing questionnaire)
// ---------------------------------------------------------------------------

/**
 * Renters insurance minimum liability-to-landlord (LLI) coverage required
 * before move-in, as displayed ("$300,000").
 *
 * Leases require LLI coverage (protects the unit/building from renter-caused
 * accident damage — distinct from renters insurance, which covers the
 * resident's personal property and temporary relocation/displacement).
 * Residents can enroll in an LLI option through the resident portal, or
 * bring their own policy documenting this coverage. (Owner-confirmed
 * 2026-08-17.)
 */
export const RENTERS_INSURANCE_LLI_DISPLAY = '$300,000';

/** Typical application review window, as displayed ("1–3 business days"). */
export const APPROVAL_WINDOW_DISPLAY = '1\u20133 business days';

// ---------------------------------------------------------------------------
// Unit total
// ---------------------------------------------------------------------------

/** Total residences in the tower. */
export const UNIT_TOTAL = 298;

// ---------------------------------------------------------------------------
// Square-footage range (derived from floorPlans.ts — the canonical source)
// ---------------------------------------------------------------------------

/** "1,528" — locale-formatted max square footage. */
export const SQFT_MAX_DISPLAY = SQFT_MAX.toLocaleString('en-US');
/** "448" */
export const SQFT_MIN_DISPLAY = SQFT_MIN.toLocaleString('en-US');
/** "448–1,528" (en dash) — the Building Facts range. */
export const SQFT_RANGE_DISPLAY = `${SQFT_MIN_DISPLAY}\u2013${SQFT_MAX_DISPLAY}`;
