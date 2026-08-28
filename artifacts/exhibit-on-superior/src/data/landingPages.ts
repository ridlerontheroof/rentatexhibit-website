// Search-intent landing pages ("luxury apartments River North", bedroom-type
// and "apartments near X" queries) — single source of truth for the shared
// SeoLanding page component and any cross-link blocks.
//
// PURE data module (no hook imports — see availability-pure-module rule):
// unit→category resolution reimplements the residence-line lookup from
// planGroups directly so tests that mock the availability hook stay green.
//
// Every fact in this copy is sourced from governed data (floor-plan DB,
// walkScores.ts, commute.ts, propertyFacts, Neighborhood distances) — never
// invent distances, view claims, or square footages here.

import { planGroups, type Category } from './floorPlans';
import { UNIT_TOTAL } from './propertyFacts';

/** Pure twin of AvailableUnits' groupForUnit: apartment number → plan category. */
export function categoryForUnit(unitNumber: string): Category | null {
  const digits = unitNumber.replace(/\D/g, '');
  if (digits.length < 3) return null;
  const line = Number(digits.slice(-2));
  const floor = Number(digits.slice(0, -2));
  if (!Number.isFinite(line) || !Number.isFinite(floor)) return null;
  const candidates = planGroups.filter((g) => g.unit === line);
  if (candidates.length === 0) return null;
  return (candidates.find((g) => g.floors.includes(floor)) ?? candidates[0]).category;
}

/** Does this apartment number belong to one of the page's categories? (null = all) */
export function unitMatchesCategories(unitNumber: string, categories: Category[] | null): boolean {
  if (!categories) return true;
  const cat = categoryForUnit(unitNumber);
  return cat !== null && categories.includes(cat);
}

/** Verified sqft range for a set of categories, from the floor-plan DB. */
export function categorySqftRange(categories: Category[]): { min: number; max: number } | null {
  const groups = planGroups.filter((g) => categories.includes(g.category));
  if (groups.length === 0) return null;
  return {
    min: Math.min(...groups.map((g) => g.sqftMin)),
    max: Math.max(...groups.map((g) => g.sqftMax)),
  };
}

/** Number of distinct residence lines offered in the given categories. */
export function categoryLineCount(categories: Category[]): number {
  return planGroups.filter((g) => categories.includes(g.category)).length;
}

export const sqftLabel = (r: { min: number; max: number }): string =>
  `${r.min.toLocaleString('en-US')} to ${r.max.toLocaleString('en-US')} square feet`;

export interface LandingHighlight {
  title: string;
  body: string;
}

export interface LandingPageDef {
  path: string;
  /** Hero image (must exist in the image manifest — reuse known site photos). */
  heroImage: string;
  heroAlt: string;
  heroScript?: string;
  heroTitle: string;
  heroSubtitle?: string;
  /** Intro paragraphs rendered under the H1 (answer-first, fact-backed). */
  intro: string[];
  /** Plan categories whose live availability the page lists; null = all units. */
  categories: Category[] | null;
  availabilityHeading: string;
  /** Shown when no matching units are currently posted. */
  emptyNote: string;
  highlights: LandingHighlight[];
  /** Subset of COMMUTE_ROWS destinations to surface (near-X pages). */
  commuteDestinations?: string[];
  /** Cross-links to sibling landing pages / core pages. */
  related: { href: string; label: string }[];
  /** Knowledge Center slugs for the Common Questions block. */
  knowledgeSlugs: string[];
}

const STUDIO_SQFT = categorySqftRange(['studio'])!;
const CONVERTIBLE_SQFT = categorySqftRange(['convertible'])!;
const ONE_BR_SQFT = categorySqftRange(['1br'])!;
const TWO_BR_SQFT = categorySqftRange(['2br'])!;
const THREE_BR_SQFT = categorySqftRange(['3br'])!;

const AMENITY_HIGHLIGHTS: LandingHighlight[] = [
  {
    title: 'A full floor of resort-style amenities',
    body: 'The amenity floor centers on a 75-foot outdoor lap pool with a hot tub and sauna, a fitness center with two private training rooms and a boxing simulator, work and meeting rooms, a music studio, and lounges indoors and out — plus grilling stations and fire pits on the deck.',
  },
  {
    title: 'Service that matches the address',
    body: 'The front desk is staffed 24 hours a day, and pet owners get a doggie spa and a gated outdoor dog walk on site — with no weight limits and no monthly pet rent.',
  },
  {
    title: 'A walker\u2019s paradise, verified',
    body: 'Per Walk Score, 165 W Superior St rates Walk Score 99, Transit Score 100, and Bike Score 86 \u2014 daily errands do not require a car, and the Chicago (Brown/Purple Line) station is about a 3-minute walk.',
  },
];

const TYPE_RELATED: { href: string; label: string }[] = [
  { href: '/luxury-apartments-river-north', label: 'Luxury Apartments in River North' },
  { href: '/studio-apartments-river-north', label: 'Studio Apartments' },
  { href: '/convertible-apartments-river-north', label: 'Convertible Apartments' },
  { href: '/one-bedroom-apartments-river-north', label: '1 Bedroom Apartments' },
  { href: '/two-bedroom-apartments-river-north', label: '2 Bedroom Apartments' },
  { href: '/three-bedroom-apartments-river-north', label: '3 Bedroom Apartments' },
  { href: '/floor-plans', label: 'All Floor Plans' },
];

const NEAR_RELATED: { href: string; label: string }[] = [
  { href: '/apartments-near-northwestern-memorial', label: 'Near Northwestern Memorial' },
  { href: '/apartments-near-merchandise-mart', label: 'Near the Merchandise Mart' },
  { href: '/apartments-near-the-loop', label: 'Near the Loop' },
  { href: '/neighborhood', label: 'River North Neighborhood Guide' },
  { href: '/floor-plans', label: 'All Floor Plans' },
];

const relatedExcept = (list: { href: string; label: string }[], path: string) =>
  list.filter((l) => l.href !== path);

export const LANDING_PAGES: LandingPageDef[] = [
  {
    path: '/luxury-apartments-river-north',
    heroImage: '/images/image-013-20170808-0861-n4esrp.jpg',
    heroAlt: 'Large lap pool at Exhibit On Superior in Chicago, Illinois',
    heroScript: 'luxury living in',
    heroTitle: 'River North',
    heroSubtitle: 'Luxury apartments at 165 W Superior St, Chicago',
    intro: [
      `Exhibit On Superior is a 34-story luxury apartment tower at 165 W Superior St in the heart of River North, with ${UNIT_TOTAL} residences ranging from 448 to 1,528 square feet across studio, convertible, one-, two-, and three-bedroom layouts.`,
      'Living here puts the best of downtown Chicago at your door: THE MART (Merchandise Mart) is about half a mile away, the Loop is roughly a mile south \u2014 one Brown Line stop \u2014 and Northwestern Memorial Hospital is about 0.6 miles east.',
    ],
    categories: null,
    availabilityHeading: 'Available Luxury Apartments in River North',
    emptyNote:
      'No apartments are posted right now \u2014 availability moves quickly. Contact the leasing team to join the interest list.',
    highlights: AMENITY_HIGHLIGHTS,
    related: [
      { href: '/studio-apartments-river-north', label: 'Studio Apartments' },
      { href: '/convertible-apartments-river-north', label: 'Convertible Apartments' },
      { href: '/one-bedroom-apartments-river-north', label: '1 Bedroom Apartments' },
      { href: '/two-bedroom-apartments-river-north', label: '2 Bedroom Apartments' },
      { href: '/amenities', label: 'Amenities' },
      { href: '/neighborhood', label: 'Neighborhood Guide' },
      { href: '/floor-plans', label: 'All Floor Plans' },
    ],
    knowledgeSlugs: ['full-amenity-list', 'how-much-is-rent'],
  },
  {
    path: '/studio-apartments-river-north',
    heroImage: '/images/image-014-exhibit-living-room-n5xrna.jpg',
    heroAlt: 'Beautiful living room with large windows at Exhibit On Superior in Chicago, Illinois',
    heroScript: 'studios in',
    heroTitle: 'River North',
    heroSubtitle: 'Studio apartments at Exhibit On Superior, Chicago',
    intro: [
      `Studio apartments at Exhibit On Superior run ${sqftLabel(STUDIO_SQFT)} \u2014 efficient homes in a full-service River North high-rise at 165 W Superior St, two blocks from the Chicago Brown/Purple Line station.`,
      'Every studio comes with access to the tower\u2019s full amenity floor, and if you want a little more separation between sleeping and living space, the convertible layouts below start just above the studio range.',
    ],
    categories: ['studio'],
    availabilityHeading: 'Studio Apartments Available Now',
    emptyNote:
      'No studios are posted at the moment. Convertibles are the next step up \u2014 or contact leasing to join the studio interest list.',
    highlights: AMENITY_HIGHLIGHTS,
    related: relatedExcept(TYPE_RELATED, '/studio-apartments-river-north'),
    knowledgeSlugs: ['do-studios-exist', 'what-is-a-convertible', 'how-much-is-rent'],
  },
  {
    path: '/convertible-apartments-river-north',
    heroImage: '/images/image-017-012417-6521-i8yuom.jpg',
    heroAlt: 'Resident lounge at Exhibit On Superior in Chicago, Illinois',
    heroScript: 'convertibles in',
    heroTitle: 'River North',
    heroSubtitle: 'Convertible apartments at Exhibit On Superior, Chicago',
    intro: [
      `A convertible is Chicago\u2019s in-between layout \u2014 bigger than a studio, with a defined sleeping alcove, but without a fully walled-off bedroom. At Exhibit On Superior, convertible apartments run ${sqftLabel(CONVERTIBLE_SQFT)}.`,
      'They\u2019re a popular fit for renters who want one-bedroom-style living space at a lower price point, in a luxury tower at 165 W Superior St with a full amenity floor and a 24-hour front desk.',
    ],
    categories: ['convertible'],
    availabilityHeading: 'Convertible Apartments Available Now',
    emptyNote:
      'No convertibles are posted at the moment. Check the studios and one-bedrooms, or contact leasing to join the interest list.',
    highlights: AMENITY_HIGHLIGHTS,
    related: relatedExcept(TYPE_RELATED, '/convertible-apartments-river-north'),
    knowledgeSlugs: ['what-is-a-convertible', 'which-units-have-balconies', 'how-much-is-rent'],
  },
  {
    path: '/one-bedroom-apartments-river-north',
    heroImage: '/images/image-018-lounge-with-fireplace-and-big-screen-tv-ymvrom.jpg',
    heroAlt: 'Resident lounge with large TV and fireplace at Exhibit On Superior in Chicago, Illinois',
    heroScript: 'one bedrooms in',
    heroTitle: 'River North',
    heroSubtitle: '1 bedroom apartments at Exhibit On Superior, Chicago',
    intro: [
      `One-bedroom apartments at Exhibit On Superior range ${sqftLabel(ONE_BR_SQFT)} across ${categoryLineCount(['1br'])} residence lines \u2014 real one-bedroom homes with a separate, walled bedroom, in a luxury River North tower at 165 W Superior St.`,
      'Nearly every layout in the tower includes a private balcony (the only exceptions are the 02 and 03 convertible stacks on floors 6\u201329), and residents get the full amenity floor: 75-foot lap pool, fitness center, work rooms, and more.',
    ],
    categories: ['1br'],
    availabilityHeading: '1 Bedroom Apartments Available Now',
    emptyNote:
      'No one-bedrooms are posted at the moment. Convertibles live like small one-bedrooms, or contact leasing to join the interest list.',
    highlights: AMENITY_HIGHLIGHTS,
    related: relatedExcept(TYPE_RELATED, '/one-bedroom-apartments-river-north'),
    knowledgeSlugs: ['which-units-have-balconies', 'in-unit-laundry', 'how-much-is-rent'],
  },
  {
    path: '/two-bedroom-apartments-river-north',
    heroImage: '/images/image-021-20170808-0852-sw1ncm.jpg',
    heroAlt: 'Outdoor deck with firepit at Exhibit On Superior in Chicago, Illinois',
    heroScript: 'two bedrooms in',
    heroTitle: 'River North',
    heroSubtitle: '2 bedroom apartments at Exhibit On Superior, Chicago',
    intro: [
      `Two-bedroom apartments at Exhibit On Superior range ${sqftLabel(TWO_BR_SQFT)} \u2014 room for roommates, a home office, or a family, in a downtown Chicago high-rise at 165 W Superior St in River North.`,
      'Two-bedroom homes pair well with the building\u2019s work and meeting rooms for remote days, and the Loop is one Brown Line stop away when you need to be in the office \u2014 about 10 minutes door to door.',
    ],
    categories: ['2br'],
    availabilityHeading: '2 Bedroom Apartments Available Now',
    emptyNote:
      'No two-bedrooms are posted at the moment. Contact the leasing team \u2014 two-bedroom homes move fast and the interest list hears first.',
    highlights: AMENITY_HIGHLIGHTS,
    related: relatedExcept(TYPE_RELATED, '/two-bedroom-apartments-river-north'),
    knowledgeSlugs: ['largest-apartment', 'what-apartment-sizes', 'how-much-is-rent'],
  },
  {
    path: '/three-bedroom-apartments-river-north',
    heroImage: '/images/image-081-20170926-1450-wmbiod.jpg',
    heroAlt: 'Panoramic Chicago downtown skyline view from Exhibit On Superior in River North — the vantage point from the three-bedroom penthouse-band floors',
    heroScript: 'three bedrooms in',
    heroTitle: 'River North',
    heroSubtitle: '3 bedroom apartments at Exhibit On Superior, Chicago',
    intro: [
      `Three-bedroom apartments at Exhibit On Superior range ${sqftLabel(THREE_BR_SQFT)} across ${categoryLineCount(['3br'])} residence lines \u2014 the largest homes in the tower, occupying the penthouse band on floors 30\u201334 at 165 W Superior St in River North, Chicago.`,
      'Each three-bedroom layout includes three full baths, floor-to-ceiling windows, driftwood plank floors, quartz countertops, stainless-steel appliances, an in-home washer and dryer, and a private balcony. Residents share a full amenity floor: 75-foot outdoor lap pool, fitness center, work and meeting rooms, and a 24-hour front desk.',
    ],
    categories: ['3br'],
    availabilityHeading: '3 Bedroom Apartments Available Now',
    emptyNote:
      'No three-bedrooms are posted at the moment. Three-bedroom homes are the rarest in the tower \u2014 contact the leasing team to join the interest list.',
    highlights: AMENITY_HIGHLIGHTS,
    related: relatedExcept(TYPE_RELATED, '/three-bedroom-apartments-river-north'),
    knowledgeSlugs: ['largest-apartment', 'what-apartment-sizes', 'how-much-is-rent'],
  },
  {
    path: '/apartments-near-northwestern-memorial',
    heroImage: '/images/image-081-20170926-1450-wmbiod.jpg',
    heroAlt: 'Panoramic Chicago downtown skyline view from Exhibit On Superior in River North',
    heroScript: 'apartments near',
    heroTitle: 'Northwestern Memorial',
    heroSubtitle: 'Luxury River North apartments \u2248 0.6 miles from the Streeterville medical district',
    intro: [
      'Exhibit On Superior sits about 0.6 miles west of Northwestern Memorial Hospital (251 E Huron St) and the Northwestern Medicine Arkes Pavilion (676 N St Clair St) \u2014 a straight shot down Superior Street from 165 W Superior St in River North.',
      'That makes the tower a practical home base for hospital staff, residents, fellows, and traveling clinicians: walk to work along Superior, or catch the #66 Chicago Ave bus one block north. Studio through three-bedroom homes mean options for every stage.',
    ],
    categories: null,
    availabilityHeading: 'Apartments Available Near Northwestern Memorial',
    emptyNote:
      'No apartments are posted right now. Contact the leasing team to join the interest list \u2014 helpful if your start date is months out.',
    highlights: AMENITY_HIGHLIGHTS,
    commuteDestinations: [
      'Chicago station \u2014 Brown & Purple Lines',
      'Chicago/State station \u2014 Red Line',
      '#66 Chicago Ave bus',
    ],
    related: relatedExcept(NEAR_RELATED, '/apartments-near-northwestern-memorial'),
    knowledgeSlugs: ['how-much-is-rent', 'what-apartment-sizes'],
  },
  {
    path: '/apartments-near-merchandise-mart',
    heroImage: '/images/image-084-20170601-0076-p0s5be.jpg',
    heroAlt: 'Built-in window seat with decorative pillows and bookshelves at Exhibit On Superior',
    heroScript: 'apartments near',
    heroTitle: 'The Merchandise Mart',
    heroSubtitle: 'Luxury River North apartments \u2248 0.5 miles from THE MART',
    intro: [
      'THE MART (Merchandise Mart) is about half a mile from Exhibit On Superior \u2014 a 10-minute walk down Wells or Franklin from 165 W Superior St, or one stop on the Brown/Purple Line from the Chicago station two blocks away.',
      'For people working at the Mart\u2019s tech offices, showrooms, and design studios, that means a commute you can do on foot year-round \u2014 and a luxury tower with a full amenity floor waiting at the end of it.',
    ],
    categories: null,
    availabilityHeading: 'Apartments Available Near the Merchandise Mart',
    emptyNote:
      'No apartments are posted right now \u2014 contact the leasing team to join the interest list.',
    highlights: AMENITY_HIGHLIGHTS,
    commuteDestinations: ['The Loop', 'Chicago station \u2014 Brown & Purple Lines', '#66 Chicago Ave bus'],
    related: relatedExcept(NEAR_RELATED, '/apartments-near-merchandise-mart'),
    knowledgeSlugs: ['how-much-is-rent', 'full-amenity-list'],
  },
  {
    path: '/apartments-near-the-loop',
    heroImage: '/images/image-085-30-south-kis7bz.jpg',
    heroAlt: 'Panoramic aerial view of the Chicago downtown skyline from River North near Exhibit On Superior',
    heroScript: 'apartments near',
    heroTitle: 'The Loop',
    heroSubtitle: 'Luxury River North apartments one Brown Line stop from downtown',
    intro: [
      'Exhibit On Superior is about a mile north of the Loop \u2014 roughly 10 minutes by L (one Brown/Purple Line stop from the Chicago station, a 3-minute walk from the building) or a 20-minute walk down Wells Street.',
      'Living just outside the Loop instead of in it gets you River North\u2019s restaurants and galleries at street level, with a Transit Score of 100 when it\u2019s time to commute \u2014 O\u2019Hare and Midway are both reachable by L as well.',
    ],
    categories: null,
    availabilityHeading: 'Apartments Available Near the Loop',
    emptyNote:
      'No apartments are posted right now \u2014 contact the leasing team to join the interest list.',
    highlights: AMENITY_HIGHLIGHTS,
    commuteDestinations: [
      'The Loop',
      "O'Hare International Airport (ORD)",
      'Midway International Airport (MDW)',
      'Chicago station \u2014 Brown & Purple Lines',
    ],
    related: relatedExcept(NEAR_RELATED, '/apartments-near-the-loop'),
    knowledgeSlugs: ['how-much-is-rent', 'views-and-windows'],
  },
];

export function landingPage(path: string): LandingPageDef | null {
  return LANDING_PAGES.find((p) => p.path === path) ?? null;
}

/** Paths of all search-intent landing pages (for cross-link and guard use). */
export const LANDING_PAGE_PATHS = LANDING_PAGES.map((p) => p.path);
