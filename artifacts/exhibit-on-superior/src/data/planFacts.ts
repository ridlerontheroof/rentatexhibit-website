// Per-floor-plan facts aggregated from the unit map spreadsheet
// (unitMap.json, script-derived via scripts/generate-unit-map.mjs from
// EXHIBIT_UNIT_MAP_v1.2_ACCESSIBILITY, approved fact source 2026-08-04).
//
// Pure data module — no React, no hooks (pure-data-module convention).
// Facts are aggregated per plan id (floorPlans.ts `Plan.id`); the sheet's
// extra split of residence line 06 into 6-16 / 17-21 packets is merged into
// the DB's consolidated 6-29 plan via PLAN_ID_ALIASES.
//
// Direction → experiential copy uses ONLY the user-approved mapping
// (2026-08-04): south → city skyline views (the Loop lies south of the
// tower), west → evening sunlight, east → morning sunlight, north → soft
// indirect light; diagonals blend. Never any claim beyond this mapping.
import unitMap from './unitMap.json';

export interface UnitMapRow {
  unit: string;
  floor: string;
  line: number;
  band: string;
  layout: string;
  category: string;
  beds: number;
  baths: number;
  den: boolean;
  sqft: number;
  planId: string;
  facing: string;
  balcony: boolean;
  balconyException: boolean;
  inHomeWd: boolean;
  kitchenIsland: boolean;
  foyer: boolean;
  openLivingDining: boolean;
  sleepingAlcove: boolean;
  openStudioLayout: boolean;
  splitBedroom: boolean;
  dedicatedDen: boolean;
  visualNotes: string;
  typeA: boolean;
  accessibilityCode: string;
  accessibilityDisclaimerRequired: boolean;
}

export const UNIT_MAP: UnitMapRow[] = (unitMap as { units: UnitMapRow[] }).units;

/**
 * Sheet plan ids that map onto a different (consolidated) floor-plan DB id.
 * The v0.7 plan book merged line 06's former 6-16 / 17-21 sheets into one
 * 6-29 sheet; the unit map still carries the old split.
 */
const PLAN_ID_ALIASES: Record<string, string> = {
  'unit-6-floors-17-21': 'unit-6-floors-6-29',
};

export interface PlanFacts {
  planId: string;
  /** Compass facing shared by every unit of this plan (per the unit map). */
  facing: string;
  /** All units of the plan share one balcony answer (guarded by test). */
  balcony: boolean;
  inHomeWd: boolean;
  kitchenIsland: boolean;
  foyer: boolean;
  openLivingDining: boolean;
  sleepingAlcove: boolean;
  openStudioLayout: boolean;
  splitBedroom: boolean;
  dedicatedDen: boolean;
  /** Building band(s) the plan's homes sit in (Podium/Mid-Rise/High-Rise/Penthouse). */
  bands: string[];
  unitCount: number;
}

function aggregate(): Map<string, PlanFacts> {
  const byPlan = new Map<string, UnitMapRow[]>();
  for (const row of UNIT_MAP) {
    const id = PLAN_ID_ALIASES[row.planId] ?? row.planId;
    const list = byPlan.get(id);
    if (list) list.push(row);
    else byPlan.set(id, [row]);
  }
  const out = new Map<string, PlanFacts>();
  for (const [planId, rows] of byPlan) {
    const all = (k: keyof UnitMapRow) => rows.every((r) => Boolean(r[k]));
    // Facing can only be trusted when uniform across the plan's units; the
    // current sheet is uniform per plan (guarded by planFacts.test.ts).
    const facings = Array.from(new Set(rows.map((r) => r.facing)));
    out.set(planId, {
      planId,
      facing: facings.length === 1 ? facings[0] : '',
      balcony: all('balcony'),
      inHomeWd: all('inHomeWd'),
      kitchenIsland: all('kitchenIsland'),
      foyer: all('foyer'),
      openLivingDining: all('openLivingDining'),
      sleepingAlcove: all('sleepingAlcove'),
      openStudioLayout: all('openStudioLayout'),
      splitBedroom: all('splitBedroom'),
      dedicatedDen: all('dedicatedDen'),
      bands: Array.from(new Set(rows.map((r) => r.band))),
      unitCount: rows.length,
    });
  }
  return out;
}

const PLAN_FACTS = aggregate();

/** Facts for a floor-plan DB plan id (floorPlans.ts `Plan.id`), or null. */
export function planFactsFor(planId: string): PlanFacts | null {
  return PLAN_FACTS.get(planId) ?? null;
}

/**
 * User-approved experiential wording per compass direction (2026-08-04).
 * South = skyline (the Loop is south of the tower); west = evening sun;
 * east = morning sun; north = soft indirect light. Diagonals blend both.
 */
const DIRECTION_PHRASES: Record<string, string> = {
  South: 'city skyline views toward the Loop',
  North: 'soft, indirect northern light through the day',
  East: 'morning sunlight',
  West: 'evening sunlight',
  Southeast: 'city skyline views toward the Loop and morning sunlight',
  Southwest: 'city skyline views toward the Loop and evening sunlight',
  Northeast: 'soft northern light with morning sun from the east',
  Northwest: 'soft northern light with evening sun from the west',
};

/** "south-facing" etc. — lowercase adjective form of the compass facing. */
export function facingAdjective(facing: string): string {
  return facing ? `${facing.toLowerCase()}-facing` : '';
}

/** Experiential light/view phrase for a facing, per the approved mapping only. */
export function directionPhrase(facing: string): string {
  return DIRECTION_PHRASES[facing] ?? '';
}
