// Commute & transit facts for 165 W Superior St (River North) — single
// source of truth for the citation-friendly commute table.
//
// Every row is a static, verified fact consistent with the site's existing
// transit copy (Neighborhood guide, Map + Directions, Parking &
// Transportation) and standard CTA routing from the Chicago (Brown/Purple)
// and Chicago/State (Red) stations. Times are approximate and phrased as
// such; re-verify against transitchicago.com if CTA service changes.

export interface CommuteRow {
  /** Destination, e.g. "The Loop". */
  destination: string;
  /** How you get there without a car. */
  transit: string;
  /** Approximate door-to-door time by that transit option. */
  time: string;
}

export const COMMUTE_ROWS: CommuteRow[] = [
  {
    destination: 'The Loop',
    transit: 'Brown/Purple Line from Chicago & Franklin (one stop) or a walk down Wells St',
    time: '~10 min by L \u00b7 ~20 min walk (~1 mi)',
  },
  {
    destination: "O'Hare International Airport (ORD)",
    transit: 'Blue Line from Grand station (Milwaukee & Halsted, short ride or bus west)',
    time: '~45\u201355 min by L \u00b7 ~30\u201345 min by car (I-90 W)',
  },
  {
    destination: 'Midway International Airport (MDW)',
    transit: 'Orange Line from the Loop (Brown/Purple Line transfer)',
    time: '~45\u201355 min by L \u00b7 ~25\u201340 min by car',
  },
  {
    destination: 'Chicago station \u2014 Brown & Purple Lines',
    transit: 'Chicago Ave & Franklin St',
    time: '~2 blocks \u00b7 ~3 min walk',
  },
  {
    destination: 'Chicago/State station \u2014 Red Line',
    transit: 'Chicago Ave & State St',
    time: '~0.3 mi \u00b7 ~7 min walk',
  },
  {
    destination: '#66 Chicago Ave bus',
    transit: 'Stops along Chicago Ave, one block north',
    time: '~1 block \u00b7 ~2 min walk',
  },
];
