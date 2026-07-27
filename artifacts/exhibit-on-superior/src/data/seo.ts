// Central SEO / AEO data for Exhibit On Superior.
// Source of truth: migration bundle seo-aeo-metadata + faq-answer-bank + schema manifest.

import { ADA_COUNTS } from './ada';
import { SQFT_MIN, SQFT_MAX } from './floorPlans';
import { getBakedAvailability } from './availabilitySnapshot';
import { getStartingRent, startingRentSentence } from './startingRent';
import { WALK_SCORE, TRANSIT_SCORE, BIKE_SCORE, WALK_SCORES_SENTENCE } from './walkScores';
import {
  CREDIT_SCORE_COSIGNER_MIN,
  CREDIT_SCORE_MIN,
  OFFICE_HOURS_SATURDAY,
  OFFICE_HOURS_WEEKDAY,
  SATURDAY_HOURS_CLOCK,
  SATURDAY_HOURS_SHORT,
  SQFT_MAX_DISPLAY,
  SQFT_MIN_DISPLAY,
  UNIT_TOTAL,
  WEEKDAY_HOURS_CLOCK,
  WEEKDAY_HOURS_SHORT,
} from './propertyFacts';

/**
 * Homepage pricing FAQ answer. The dollar figure comes from the baked
 * availability snapshot (same pipeline as the Available Units page), so it can
 * never go stale relative to listings. When no usable snapshot price exists we
 * fall back to wording without a number — never a wrong number.
 */
const PRICING_FAQ_ANSWER = (() => {
  const start = startingRentSentence();
  const tail =
    'Pricing updates automatically from the leasing system and varies by residence, lease term, and move-in date — see the Available Units page for live rent on every available apartment.';
  return start ? `${start} ${tail}` : tail;
})();

export const SITE_URL = 'https://www.rentatexhibit.com';

/**
 * Cache-buster for the share cards in public/images/og/ and the site-wide
 * default card public/images/og-card.jpg. Facebook, LinkedIn, and iMessage
 * cache og:image previews by URL for weeks; bump this whenever any card is
 * regenerated with new artwork so social scrapers see a new URL and fetch the
 * fresh image. (v2: 2026-07 regeneration of nine stale cards, notably
 * reviews.jpg. v3: default og-card.jpg brought under the same guard.)
 */
export const OG_CARD_VERSION = 3;

/** Site-wide fallback share card, cache-busted like the per-page cards. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-card.jpg?v=${OG_CARD_VERSION}`;

/** Absolute, cache-busted URL for a share card in public/images/og/. */
export const ogCardUrl = (name: string): string =>
  `${SITE_URL}/images/og/${name}.jpg?v=${OG_CARD_VERSION}`;

export const AVAILABILITY_URL = 'https://www.highlandptrs.com/exhibit-on-superior';
export const APPLY_URL = 'https://www.highlandptrs.com/exhibit-on-superior';
/** External "Schedule a Tour" destination (property management page). */
export const TOUR_URL = 'https://www.highlandptrs.com/exhibit-on-superior';

export interface Faq {
  q: string;
  a: string;
  /**
   * Slug of the fuller Knowledge Center article this quick answer summarizes.
   * Drives the "Full answer →" cross-link on /faq and the FAQ↔Knowledge
   * consistency guard (src/data/faq-knowledge-alignment.test.ts): the slug
   * must resolve, and concrete facts in the two answers must agree.
   */
  knowledgeSlug?: string;
}

export interface PageSeo {
  /** Route path, e.g. "/" or "/amenities" */
  path: string;
  /** Breadcrumb / short label used in structured data */
  label: string;
  title: string;
  description: string;
  /** AEO "Quick Answer" summary shown visibly near the top of the page */
  quickAnswer: string;
  faqs: Faq[];
  /** When true, the page is served with robots noindex and excluded from the sitemap. */
  noindex?: boolean;
  /** Absolute URL for this page's share-card image; falls back to DEFAULT_OG_IMAGE. */
  ogImage?: string;
}

export const PAGE_SEO: Record<string, PageSeo> = {
  '/': {
    path: '/',
    ogImage: ogCardUrl('home'),
    label: 'Exhibit On Superior',
    title: 'Luxury Apartments in River North Chicago | Exhibit On Superior',
    description:
      'Luxury apartments in River North Chicago — studio, convertible, one, two & three-bedroom homes with skyline views, amenities, and on-site retail.',
    quickAnswer:
      'Exhibit On Superior is a luxury high-rise apartment community at 165 W Superior St in Chicago\u2019s River North neighborhood with studio, convertible, one-, two-, and three-bedroom apartments, a full floor of luxury amenities, on-site retail, and quick access to downtown neighborhoods.',
    faqs: [
      {
        q: 'Where is Exhibit On Superior located?',
        a: 'Exhibit On Superior is located at 165 W Superior St, Chicago, IL 60654 in the River North area.',
      },
      {
        q: 'What apartment sizes are available at Exhibit On Superior?',
        a: 'The community offers studio, convertible, one-, two-, and three-bedroom apartment homes. Current availability is maintained by the on-site leasing team.',
      },
      {
        q: 'How do I check current availability?',
        a: 'Use the Available Units link to view current Exhibit On Superior availability with live pricing and move-in dates.',
      },
      {
        q: 'How much does it cost to live at Exhibit On Superior?',
        a: PRICING_FAQ_ANSWER,
        knowledgeSlug: 'how-much-is-rent',
      },
      {
        q: 'Is Exhibit On Superior pet-friendly?',
        a: 'Yes — cats and dogs are welcome, with a maximum of 2 pets per apartment. There is a one-time non-refundable pet fee of $650 for one dog or $750 for two dogs, and $325 for cats, with no monthly pet rent and no weight limits. Breed restrictions apply for dogs.',
        knowledgeSlug: 'does-exhibit-allow-dogs',
      },
    ],
  },
  '/available-units': {
    path: '/available-units',
    ogImage: ogCardUrl('floor-plans'),
    label: 'Available Units',
    title: 'Available Units & Floor Plans | Exhibit On Superior Chicago',
    description:
      'Browse available apartments at Exhibit On Superior in River North Chicago — live pricing, photos, move-in dates, and every studio to 3 bedroom floor plan.',
    quickAnswer:
      'This page lists every currently available Exhibit On Superior apartment with live rent, photos, and move-in dates, updated automatically from the leasing system. You can also compare every studio, convertible, one-, two-, and three-bedroom floor plan and apply directly from each available listing.',
    faqs: [
      {
        q: 'What apartments are available now at Exhibit On Superior?',
        a: 'The listings at the top of this page show every residence currently available, with live rent, photos, and move-in dates synced from our leasing system.',
      },
      {
        q: 'Does Exhibit On Superior have studio apartments?',
        a: 'Yes. Exhibit On Superior includes studio and convertible floor plan options along with one-, two-, and three-bedroom homes.',
      },
      {
        q: 'How do I apply for an apartment?',
        a: 'Open any available residence on this page and use its Apply Now button — each unit links directly to its own secure online application.',
      },
    ],
  },
  '/floor-plans': {
    path: '/floor-plans',
    ogImage: ogCardUrl('floor-plans'),
    label: 'Floor Plans',
    title: 'Floor Plan Layouts, Studio to 3 Bedroom | Exhibit On Superior',
    description:
      'Every distinct floor-plan layout at Exhibit On Superior in River North Chicago — plan sheets, square footage, floor ranges, balconies, and live availability.',
    quickAnswer: `Exhibit On Superior offers 34 distinct floor-plan layouts across 27 residence lines — studios, convertibles, and one, two, and three-bedroom homes from about ${SQFT_MIN_DISPLAY} to ${SQFT_MAX_DISPLAY} square feet over 34 floors. Each layout below has its own page with the plan sheet, floor range, balcony and accessibility details, and any apartments of that plan available now.`,
    faqs: [
      {
        q: 'How many floor plans does Exhibit On Superior have?',
        a: 'The tower has 34 distinct floor-plan layouts across 27 residence lines, spanning studios, convertibles, and one, two, and three-bedroom homes.',
      },
      {
        q: 'What sizes do the floor plans come in?',
        a: `Layouts range from roughly ${SQFT_MIN_DISPLAY} square feet for the smallest studio to ${SQFT_MAX_DISPLAY} square feet for the largest three-bedroom penthouse-level plan.`,
      },
      {
        q: 'Do all floor plans have a balcony?',
        knowledgeSlug: 'which-units-have-balconies',
        a: 'Nearly all of them. The only homes without a private balcony are the 02 and 03 stacks on floors 6 through 29 — every other plan includes one.',
      },
    ],
  },
  '/photo-gallery': {
    path: '/photo-gallery',
    ogImage: ogCardUrl('photo-gallery'),
    label: 'Photo Gallery',
    title: 'Photo Gallery | Exhibit On Superior Chicago Apartments',
    description:
      "View apartment, amenity, skyline, and community photos of Exhibit On Superior, a luxury high-rise at 165 W Superior St in Chicago's River North neighborhood.",
    quickAnswer:
      'The Exhibit On Superior photo gallery shows real photography of the 34-story River North tower \u2014 apartment interiors with floor-to-ceiling windows, the full amenity floor including the 75-foot lap pool and fitness center, skyline views, and shared community spaces \u2014 organized so you can jump straight to the spaces you care about.',
    faqs: [
      {
        q: 'What can I see in the Exhibit On Superior photo gallery?',
        a: 'The gallery includes apartment interiors, amenity spaces, city views, pool and fitness areas, lounges, and shared community spaces.',
      },
      {
        q: 'Are these photos of the actual building?',
        a: 'Yes. The gallery shows real photography of Exhibit On Superior\u2019s apartments, amenity floor, and views \u2014 and each available residence on the Available Units page carries its own current unit photos synced from the leasing system.',
      },
      {
        q: 'Can I tour the community virtually?',
        a: 'Yes. Use the Virtual Tour page for Matterport and video tour content.',
      },
    ],
  },
  '/virtual-tour': {
    path: '/virtual-tour',
    ogImage: ogCardUrl('virtual-tour'),
    label: 'Virtual Tour',
    title: 'Virtual Tours | Exhibit On Superior Apartments Chicago',
    description:
      'Take a virtual tour of Exhibit On Superior apartments and amenities in River North Chicago with video and Matterport tour embeds.',
    quickAnswer:
      'Renters can tour Exhibit On Superior remotely through the video tour and interactive 3D Matterport walkthroughs on this page \u2014 covering apartment homes and the full amenity floor of the 34-story River North tower \u2014 before scheduling an in-person visit with the leasing team.',
    faqs: [
      {
        q: 'Does Exhibit On Superior offer virtual tours?',
        a: 'Yes. The virtual tour page includes video and Matterport tour embeds for apartment and amenity previews.',
      },
      {
        q: 'What do the Matterport tours show?',
        a: 'The interactive 3D walkthroughs let you move room to room through apartment homes and amenity spaces at your own pace \u2014 including layouts, finishes, and the floor-to-ceiling window views.',
      },
      {
        q: 'Can I still schedule an in-person tour?',
        a: 'Yes. Prospects can schedule an in-person tour through the Schedule a Tour form, or contact the leasing team by phone or email.',
      },
    ],
  },
  '/amenities': {
    path: '/amenities',
    ogImage: ogCardUrl('amenities'),
    label: 'Amenities',
    title: 'Amenities | Exhibit On Superior River North Apartments',
    description:
      'Explore Exhibit On Superior amenities, including a full-floor amenity deck, fitness center, pool, lounges, work areas, dog spa, and on-site lifestyle retail.',
    quickAnswer:
      'Exhibit On Superior amenities include a full-floor amenity deck, fitness center, pool, hot tub, lounges, work and meeting rooms, dog spa, private park access, and on-site retail and wellness options.',
    faqs: [
      {
        q: 'What amenities does Exhibit On Superior offer?',
        a: 'Amenities include a full-floor amenity deck, fitness center, pool, hot tub, lounge spaces, work rooms, dog spa, grilling stations, fire pits, and outdoor areas.',
      },
      {
        q: 'Does Exhibit On Superior have on-site retail?',
        a: 'Yes. The property content references on-site retail and wellness options including fitness, food, and spa services.',
      },
      {
        q: 'Does Exhibit On Superior have a pool?',
        a: 'Yes. The amenity floor includes a 75-foot lap pool, plus an outdoor hot tub and a sauna with a wet lounge leading to the outdoor deck.',
      },
      {
        q: 'Is there a coworking space?',
        a: 'Yes. Residents can work from private work and meeting rooms, a tech lounge with charging stations and a kitchen, a library nook, and reading and charging alcoves.',
      },
      {
        q: 'Does the building have a fitness center?',
        a: 'Yes. The fitness center includes two private training rooms, cardio equipment, spin bikes, free weights, and a boxing simulator.',
      },
      {
        q: 'Is there a music studio?',
        a: 'Yes. Exhibit On Superior\u2019s amenity spaces include a music studio room.',
      },
      {
        q: 'Does the property have an outdoor dog area?',
        a: 'Yes. There is a gated outdoor dog walk, plus a doggie spa and lounge inside the building.',
      },
      {
        q: 'Is there a 24-hour concierge?',
        a: 'Yes. The front desk is staffed 24 hours a day.',
      },
      {
        q: 'What are the amenity hours?',
        a: 'Indoor amenities are open 24/7. Outdoor amenities close during quiet hours, 10pm\u20136am. The pool and hot tub are seasonal \u2014 the pool closes in late September and the hot tub closes at the first snowfall \u2014 while the grills and fire pits are available year-round.',
      },
      {
        q: 'Are there ADA-accessible apartments at Exhibit On Superior?',
        a: `Yes. Per the as-built accessibility matrix, ${ADA_COUNTS.total} apartments \u2014 more than 20% of the homes \u2014 carry an ADA designation: ${ADA_COUNTS.a} Type A accessible/adaptable residences (A) and ${ADA_COUNTS.ac} Type A units with conduit line (AC). Use the ADA-accessible filter on the Available Units page, and contact leasing to verify a specific apartment\u2019s current configuration: exhibit@highlandptrs.com or 312-450-0635.`,
      },
      {
        q: 'Can amenity spaces be reserved?',
        a: 'Yes. The Party Room is reservable through the leasing/management office at $50 per hour, and residents may bring up to 2 guests to the pool. Full rules are available on request.',
      },
    ],
  },
  '/pet-friendly': {
    path: '/pet-friendly',
    ogImage: ogCardUrl('pet-friendly'),
    label: 'Pet Friendly',
    title: 'Pet-Friendly Apartments in River North | Exhibit On Superior',
    description:
      'Learn about pet-friendly living at Exhibit On Superior in Chicago, including dog and cat-friendly apartment content and on-site pet amenities.',
    quickAnswer:
      'Exhibit On Superior is a pet-friendly River North apartment community for cats and dogs (maximum 2 pets), with pet amenities including a dog spa and gated outdoor dog walk. There is a one-time non-refundable pet fee \u2014 $650 for one dog or $750 for two, and $325 for cats \u2014 with no pet deposit, no monthly pet rent, and no weight limits. Breed restrictions apply; see the leasing team for details.',
    faqs: [
      {
        q: 'Is Exhibit On Superior pet-friendly?',
        a: 'Yes. Exhibit On Superior markets pet-friendly living for cats and dogs.',
      },
      {
        q: 'Are there pet amenities?',
        a: 'The amenities content includes a dog spa and gated outdoor dog walk.',
      },
      {
        q: 'How many pets are allowed?',
        a: 'A maximum of 2 pets per apartment. All pets must be registered with management, and dog owners must acknowledge the Dog Rider before application approval.',
      },
      {
        q: 'What are the pet fees?',
        a: 'There is a one-time non-refundable pet fee: $650 for one dog or $750 for two dogs (two-dog maximum), and $325 for cats (two-cat maximum). There is no refundable pet deposit and no monthly pet rent.',
      },
      {
        q: 'Are there breed or weight restrictions?',
        a: 'There are no weight limits. Breed restrictions do apply \u2014 please see a leasing consultant for the current details before applying.',
      },
    ],
  },
  '/neighborhood': {
    path: '/neighborhood',
    ogImage: ogCardUrl('neighborhood'),
    label: 'Neighborhood',
    title: 'River North Neighborhood | Exhibit On Superior Chicago',
    description:
      'Explore the River North location around Exhibit On Superior, close to dining, cafes, shopping, parks, the Chicago River, West Loop, Old Town, and Fulton Market.',
    quickAnswer: `Exhibit On Superior is in River North, with quick access to downtown Chicago dining, cafes, shopping, the Chicago River, West Loop, Old Town, and Fulton Market. Per Walk Score, the address rates a ${WALK_SCORE.score}/100 Walk Score, a ${TRANSIT_SCORE.score}/100 Transit Score, and an ${BIKE_SCORE.score}/100 Bike Score.`,
    faqs: [
      {
        q: 'What neighborhood is Exhibit On Superior in?',
        a: 'Exhibit On Superior is in River North in Chicago.',
      },
      {
        q: 'What is nearby?',
        a: 'The property is close to cafes, restaurants, shops, parks, the Chicago River, West Loop, Old Town, and Fulton Market.',
      },
      {
        q: 'Is Exhibit close to Whole Foods?',
        a: 'Yes. Whole Foods Market at 3 W Chicago Ave is about 0.3 miles away, with Trader Joe\u2019s (44 E Ontario St) and Jewel-Osco (550 N State St) also within roughly half a mile.',
      },
      {
        q: 'What is near Superior and Wells?',
        a: 'The blocks around Superior and Wells hold River North\u2019s gallery district, cafes and restaurants, the CTA Chicago Brown/Purple Line station about two blocks west, and Whole Foods a few blocks northeast.',
      },
      {
        q: 'Is River North a good neighborhood without a car?',
        a: 'Yes. Groceries, gyms, parks, restaurants, and two CTA rail stations are all within about a half-mile walk of Exhibit On Superior, and the Loop is roughly a mile south.',
      },
      {
        q: 'What are the Walk, Transit, and Bike Scores at Exhibit On Superior?',
        a: WALK_SCORES_SENTENCE,
      },
    ],
  },
  '/apartment-guide': {
    path: '/apartment-guide',
    ogImage: ogCardUrl('apartment-guide'),
    label: 'Apartment Guide',
    title: 'Apartment Guide: Layouts, Finishes & Views | Exhibit On Superior',
    description:
      'A complete guide to Exhibit On Superior apartments — studio, convertible, 1, 2 & 3 bedroom layouts, finishes, in-home laundry, and skyline views.',
    quickAnswer: `Exhibit On Superior offers studio, convertible, one, two, and three-bedroom apartments from about ${SQFT_MIN_DISPLAY} to ${SQFT_MAX_DISPLAY} square feet across floors 2\u201334, finished with driftwood plank floors, quartz countertops, stainless-steel appliances, in-home washers and dryers, floor-to-ceiling windows, and private balconies in nearly every home.`,
    faqs: [
      {
        q: 'Does Exhibit On Superior have convertible apartments?',
        a: 'Yes. Exhibit On Superior offers convertible and junior convertible floor plans of roughly 450\u2013554 square feet, alongside studio, one, two, and three-bedroom homes.',
      },
      {
        q: 'Do apartments have in-unit washers and dryers?',
        a: 'Yes. In-home washer/dryers are a standard apartment feature at Exhibit On Superior.',
      },
      {
        q: 'Which units have balconies?',
        a: 'Nearly every home has a private balcony. The only homes without balconies are the 02 Convertible and 03 Convertible plans \u2014 units ending in 02 or 03 on floors 6\u201329.',
      },
      {
        q: 'What views are available?',
        a: 'Homes feature dramatic floor-to-ceiling windows with panoramic views of the Chicago skyline; outlooks vary by floor and unit position within the 34-story tower.',
      },
      {
        q: 'What is the largest apartment available?',
        a: `The largest floor plan is a three-bedroom, three-bath residence of ${SQFT_MAX_DISPLAY} square feet, offered on the penthouse-level floors 30\u201334.`,
      },
      {
        q: 'Are furnished apartments available?',
        a: 'No. Apartments at Exhibit On Superior are offered unfurnished only.',
      },
      {
        q: 'Is storage or accessibility information available?',
        a: 'Yes. On-site storage is available for $25 per month, and more than 20% of the homes at Exhibit are ADA accessible. Select homes also include closet organizers and double vanities.',
      },
    ],
  },
  '/fees': {
    path: '/fees',
    ogImage: ogCardUrl('fees'),
    label: 'Fees & Leasing Costs',
    title: 'Fees, Utilities & Leasing Costs | Exhibit On Superior Chicago',
    description:
      'What it costs to lease at Exhibit On Superior in River North Chicago — application fees, the monthly utility bundle, plus parking and other charges.',
    quickAnswer:
      'Beyond monthly rent, Exhibit On Superior charges a per-application fee (shown on each unit\u2019s listing), a $500 non-refundable administration fee per apartment, and a monthly Utility & Service Amenity fee of $95\u2013$195 by floor plan covering water, sewer, trash, heat, air conditioning, and natural gas for cooking and the dryer. There is no security deposit. Electricity is billed directly by ComEd. Garage parking is $335/month and on-site storage is $25/month.',
    faqs: [
      {
        q: 'How much does it cost to live at Exhibit On Superior?',
        a: 'Rent depends on the floor plan, floor, and move-in date. Live pricing for every available residence is published on the Available Units page, synced automatically from the leasing system.',
      },
      {
        q: 'What fees are required in addition to rent?',
        a: 'Each unit\u2019s listing shows its application fee. There is also a $500 non-refundable administration fee per apartment \u2014 fully refunded if your application is denied, but retained if you choose to cancel \u2014 and a monthly Utility & Service Amenity fee of $95\u2013$195 depending on floor plan.',
      },
      {
        q: 'Is there a security deposit?',
        a: 'No. Exhibit does not currently collect a security deposit.',
      },
      {
        q: 'Are utilities included?',
        a: 'A monthly Utility & Service Amenity fee ($95 for studios up to $195 for three-bedrooms) covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Electricity is billed to the resident directly by ComEd.',
      },
      {
        q: 'What internet options are available?',
        a: 'Exhibit is implementing bulk internet through a partnership with Zentro, with symmetrical download and upload speeds up to 2 Gig.',
      },
      {
        q: 'Is storage available?',
        a: 'Yes. On-site storage is available for $25 per month.',
      },
      {
        q: 'Does Exhibit offer move-in specials?',
        a: 'Exhibit is not offering move-in concessions at this time. Ask the leasing team at exhibit@highlandptrs.com or 312-450-0635 about future offers.',
      },
      {
        q: 'How much is parking?',
        a: 'Garage parking in the attached indoor garage is $335 per month per unreserved space, subject to availability. See the Parking & Transportation page for details and transit alternatives.',
      },
    ],
  },
  '/parking-transportation': {
    path: '/parking-transportation',
    ogImage: ogCardUrl('parking-transportation'),
    label: 'Parking & Transportation',
    title: 'Parking & Transportation | Exhibit On Superior River North',
    description:
      'Getting around from Exhibit On Superior at 165 W Superior St — CTA Brown, Purple & Red Line stops, bus routes, highway access, and on-site parking.',
    quickAnswer:
      'Exhibit On Superior has an attached indoor multi-level garage with unreserved parking at $335/month (subject to availability), plus EV charging and complimentary ground-floor bike storage. It sits about two blocks from the CTA Chicago (Brown/Purple Line) station at Chicago & Franklin and about 0.3 miles from the Chicago (Red Line) station at Chicago & State, with the #66 Chicago Avenue bus one block north and the Loop roughly a mile south.',
    faqs: [
      {
        q: 'Does Exhibit On Superior have on-site parking?',
        a: 'Yes. Indoor, attached multi-level garage parking is available at $335 per month per unreserved space, subject to availability \u2014 contact the leasing team at exhibit@highlandptrs.com or 312-450-0635 for current availability.',
      },
      {
        q: 'Is there EV charging?',
        a: 'Yes. The garage has 3 EVBOX level-2 charging stations on the second garage level, each with 2 reserved EV spaces (6 total). Pricing and subscriptions are managed by EVBOX.',
      },
      {
        q: 'Is there guest parking?',
        a: 'Exhibit does not offer guest parking \u2014 we recommend using SpotHero or street parking nearby.',
      },
      {
        q: 'Is there bike storage?',
        a: 'Yes. Exhibit has complimentary bike storage on the ground floor.',
      },
      {
        q: 'How far is Exhibit from the CTA?',
        a: 'The CTA Chicago station on the Brown and Purple Lines (Chicago & Franklin) is about two blocks away, and the Chicago Red Line station at Chicago & State is roughly 0.3 miles \u2014 both an easy walk.',
      },
      {
        q: 'Is Exhibit walkable to the Loop?',
        a: `Yes. The Loop is roughly a mile south \u2014 about a 20-minute walk, or one short ride on the Brown Line from the Chicago station toward the Loop. Per Walk Score, the address rates a ${WALK_SCORE.score}/100 Walk Score and a ${TRANSIT_SCORE.score}/100 Transit Score.`,
      },
      {
        q: 'What bus routes serve the area?',
        a: 'The CTA #66 Chicago Avenue bus runs one block north, with the #156 LaSalle and #22 Clark routes within a few blocks \u2014 all connecting River North to the rest of the city.',
      },
      {
        q: 'How do drivers reach the highways?',
        a: 'The Ohio Street feeder to the Kennedy Expressway (I-90/94) is about a mile southwest, and Lake Shore Drive (US-41) is reachable to the east via Ontario and Ohio Streets.',
      },
      {
        q: 'Can you live at Exhibit On Superior without a car?',
        a: 'Yes. With two CTA rail stations, several bus routes, and groceries like Whole Foods, Trader Joe\u2019s, and Jewel-Osco all within about half a mile, River North is one of Chicago\u2019s most practical neighborhoods for car-free living.',
      },
    ],
  },
  '/application-guide': {
    path: '/application-guide',
    ogImage: ogCardUrl('application-guide'),
    label: 'Application Guide',
    title: 'Application & Qualification Guide | Exhibit On Superior',
    description:
      'How to apply for an apartment at Exhibit On Superior — the online application process, what to have ready, plus screening, guarantor, and lease-term details.',
    quickAnswer: `To apply for an apartment at Exhibit On Superior, open any residence on the Available Units page and use its Apply Now button \u2014 each unit links to its own secure online application through the AppFolio leasing system. A minimum credit score of ${CREDIT_SCORE_MIN} is required (${CREDIT_SCORE_COSIGNER_MIN}+ with a qualified co-signer), approval typically takes 1\u20133 business days, and 12+ month lease terms are available.`,
    faqs: [
      {
        q: 'How do I apply for an apartment at Exhibit On Superior?',
        a: 'Open any available residence on the Available Units page and use its Apply Now button \u2014 each unit links directly to its own secure online application through the AppFolio leasing system.',
      },
      {
        q: 'What credit score is required to qualify?',
        a: `A minimum credit score of ${CREDIT_SCORE_MIN} is required without a co-signer, or ${CREDIT_SCORE_COSIGNER_MIN}+ with a qualified co-signer.`,
      },
      {
        q: 'Are guarantors accepted?',
        a: `Yes. Qualified co-signers are accepted \u2014 applicants with a ${CREDIT_SCORE_COSIGNER_MIN}+ credit score can qualify with one.`,
      },
      {
        q: 'How long does approval take?',
        a: 'Approval typically takes 1\u20133 business days.',
      },
      {
        q: 'What lease terms are available?',
        a: '12+ month lease terms are available. Short-term leases are offered based on availability \u2014 see a leasing consultant for details.',
      },
      {
        q: 'What should I have ready to apply?',
        a: 'Have a state or federal government-issued photo ID ready. Renters insurance with minimum liability-to-landlord (LLI) coverage of $300,000 is required.',
      },
      {
        q: 'Can I tour before applying?',
        a: 'Yes. Schedule a tour directly from the residence you\u2019re interested in on the Available Units page, or preview homes remotely with the video and Matterport tours on the Virtual Tour page.',
      },
    ],
  },
  '/faq': {
    path: '/faq',
    ogImage: ogCardUrl('faq'),
    label: 'FAQ',
    title: 'Frequently Asked Questions | Exhibit On Superior Chicago',
    description:
      'Answers to common questions about Exhibit On Superior in River North Chicago — pricing and fees, amenities, pets, the neighborhood, touring, and applying.',
    quickAnswer:
      'This FAQ hub collects verified answers to the questions renters ask most about Exhibit On Superior \u2014 covering apartments and floor plans, pricing and fees, amenities, pet policy, the River North neighborhood, and how to tour and apply \u2014 each linking to a detail page with more depth.',
    faqs: [], // populated from FAQ_HUB_TOPICS below
  },
  '/knowledge': {
    path: '/knowledge',
    ogImage: ogCardUrl('faq'),
    label: 'Knowledge Center',
    title: 'Knowledge Center: Renter Questions Answered | Exhibit On Superior',
    description:
      'Fact-first answers to renter questions about Exhibit On Superior in River North Chicago — pricing, fees, floor plans, amenities, pets, parking, and leasing.',
    quickAnswer:
      'The Exhibit On Superior Knowledge Center answers the questions renters ask most, each on its own page with the direct answer first: pricing and fees, apartments and floor plans, amenities, pets, parking and transportation, leasing and applications, utilities, the River North neighborhood, and building services. Every answer uses verified facts from current listings and the leasing team.',
    faqs: [],
  },
  '/contact-us': {
    path: '/contact-us',
    ogImage: ogCardUrl('contact-us'),
    label: 'Contact Us',
    title: 'Contact Exhibit On Superior | River North Chicago Apartments',
    description:
      "Contact Exhibit On Superior in Chicago's River North neighborhood — email exhibit@highlandptrs.com, call 312-450-0635, or send a message with the online form.",
    quickAnswer: `To contact Exhibit On Superior, email exhibit@highlandptrs.com, call 312-450-0635, or visit the leasing office at 165 W Superior St, Chicago, IL 60654 \u2014 open Monday\u2013Friday ${WEEKDAY_HOURS_SHORT} and Saturday ${SATURDAY_HOURS_SHORT} (closed Sunday), with the front desk staffed 24 hours a day.`,
    faqs: [
      { q: 'What is the email for Exhibit On Superior?', a: 'The contact email is exhibit@highlandptrs.com.' },
      { q: 'What is the phone number for Exhibit On Superior?', a: 'The phone number is 312-450-0635.' },
      { q: 'What is the address?', a: 'The address is 165 W Superior St, Chicago, IL 60654.' },
      {
        q: 'What are the leasing office hours?',
        a: `Monday\u2013Friday ${WEEKDAY_HOURS_CLOCK} and Saturday ${SATURDAY_HOURS_CLOCK}; closed Sunday. The front desk is staffed 24 hours a day.`,
      },
      {
        q: 'How do I reach maintenance for an urgent issue?',
        a: 'Current residents should call (312) 883-5503 for urgent maintenance issues; routine requests go through the resident portal.',
      },
    ],
  },
  '/map-directions': {
    path: '/map-directions',
    ogImage: ogCardUrl('map-directions'),
    label: 'Map + Directions',
    title: 'Map & Directions | Exhibit On Superior Chicago IL',
    description:
      "Get map and direction information for Exhibit On Superior at 165 W Superior St in Chicago's River North, including transit, driving, and parking options.",
    quickAnswer:
      'Exhibit On Superior is located at 165 W Superior St, Chicago, IL 60654. Use the map on this page for driving directions from anywhere in the Chicago area.',
    faqs: [
      {
        q: 'What is the address for Exhibit On Superior?',
        a: 'Exhibit On Superior is located at 165 W Superior St, Chicago, IL 60654.',
      },
      {
        q: 'Is there a map link?',
        a: 'Yes. This page links to the Google map destination for Exhibit On Superior.',
      },
    ],
  },
  '/residents': {
    path: '/residents',
    ogImage: ogCardUrl('residents'),
    label: 'Residents',
    title: 'Resident Resources | Exhibit On Superior',
    description:
      'Resident resource page for Exhibit On Superior in River North Chicago with online portal access, rent payments, maintenance requests, and contact information.',
    quickAnswer:
      'Current Exhibit On Superior residents pay rent, submit maintenance requests, and follow building announcements through the online resident portal. For urgent maintenance call (312) 883-5503; for everything else reach the office at exhibit@highlandptrs.com or 312-450-0635 during office hours, Monday through Saturday.',
    faqs: [
      {
        q: 'Who should residents contact?',
        a: 'Residents can contact Exhibit On Superior at exhibit@highlandptrs.com or 312-450-0635.',
      },
      {
        q: 'How do residents pay rent?',
        a: 'Rent is paid securely online through the resident portal \u2014 no checks or office visits required.',
      },
      {
        q: 'How do residents request maintenance?',
        a: 'Submit routine maintenance requests through the resident portal. For urgent issues, call (312) 883-5503 directly.',
      },
    ],
  },
  '/schedule-a-tour': {
    path: '/schedule-a-tour',
    ogImage: ogCardUrl('schedule-a-tour'),
    label: 'Schedule a Tour',
    title: 'Schedule a Tour | Exhibit On Superior Apartments',
    description:
      'Schedule a tour of Exhibit On Superior in River North Chicago using the online tour request form, or email exhibit@highlandptrs.com or call 312-450-0635.',
    quickAnswer:
      'Prospective renters can schedule a tour of Exhibit On Superior by choosing an available apartment on this page and booking directly from its listing, or by requesting a showing with the leasing team — also reachable at exhibit@highlandptrs.com or 312-450-0635.',
    faqs: [
      {
        q: 'How do I schedule a tour?',
        a: 'Fill out the tour request form on this page with your preferred move-in date and floor plan — you can even request a specific available apartment. You can also email exhibit@highlandptrs.com or call 312-450-0635.',
      },
      {
        q: 'Can I tour online first?',
        a: 'Yes. The Virtual Tour page includes video and Matterport previews.',
      },
    ],
  },
  '/about': {
    path: '/about',
    label: 'About',
    title: 'About Exhibit On Superior | River North Chicago Apartments',
    description:
      `The story of Exhibit On Superior — a 34-story, ${UNIT_TOTAL}-residence luxury tower at 165 W Superior St in River North Chicago with a full-time on-site management team.`,
    quickAnswer: `Exhibit On Superior is a 34-story luxury apartment tower with ${UNIT_TOTAL} residences at 165 W Superior St in Chicago\u2019s River North neighborhood, professionally managed by a full-time on-site team. The building offers studio through three-bedroom homes from about ${SQFT_MIN_DISPLAY} to ${SQFT_MAX_DISPLAY} square feet, a full floor of amenities, a 24-hour staffed front desk, and on-site retail.`,
    faqs: [
      {
        q: 'How many apartments are in Exhibit On Superior?',
        a: `The tower holds ${UNIT_TOTAL} residences across 34 stories, with homes on floors 2\u201334 ranging from studios of about ${SQFT_MIN_DISPLAY} square feet to three-bedroom, three-bath penthouses of ${SQFT_MAX_DISPLAY} square feet.`,
      },
      {
        q: 'Where is Exhibit On Superior located?',
        knowledgeSlug: 'building-address',
        a: 'Exhibit On Superior is located at 165 W Superior St, Chicago, IL 60654 in the River North area.',
      },
      {
        q: 'What are the leasing office hours?',
        a: `The leasing office is open Monday\u2013Friday ${WEEKDAY_HOURS_CLOCK} and Saturday ${SATURDAY_HOURS_CLOCK}; it is closed on Sunday. The front desk is staffed 24 hours a day.`,
      },
    ],
  },
  '/reviews': {
    path: '/reviews',
    ogImage: ogCardUrl('reviews'),
    label: 'Reviews',
    title: 'Reviews | Exhibit On Superior Chicago Apartments',
    description:
      "Read reviews for Exhibit On Superior and connect with verified review sources for this River North Chicago apartment community.",
    quickAnswer:
      `Reviews of Exhibit On Superior come directly from the property\u2019s Google Business Profile, so the star rating and quotes shown on this page reflect what residents and visitors have actually posted about the ${UNIT_TOTAL}-residence River North tower \u2014 refreshed automatically rather than hand-picked marketing testimonials.`,
    faqs: [
      {
        q: 'Where do reviews come from?',
        a: 'Reviews come from current, verifiable sources such as the Google Business Profile.',
      },
      {
        q: 'How do I leave a review of Exhibit On Superior?',
        a: 'Post your review on the Exhibit On Superior Google Business Profile \u2014 the same listing this page reads from, so your feedback appears alongside the aggregate rating shown here.',
      },
      {
        q: 'How can I verify these reviews myself?',
        a: 'Open the Exhibit On Superior listing on Google Maps and read the reviews at the source. This page displays the same live rating and quotes rather than a curated selection.',
      },
    ],
  },
  '/schedule-showing': {
    path: '/schedule-showing',
    label: 'Schedule a Showing',
    title: 'Schedule a Showing | Exhibit On Superior',
    description:
      'Book an in-person showing of an available apartment at Exhibit On Superior in River North Chicago — pick a real time on the leasing calendar.',
    quickAnswer:
      'Pick an available apartment, share your contact details, and choose a real open time on the leasing calendar to book an in-person showing at Exhibit On Superior.',
    faqs: [],
    // Transactional per-visit booking page; the indexable tour entry point is
    // /schedule-a-tour.
    noindex: true,
  },
  '/privacy-policy': {
    path: '/privacy-policy',
    label: 'Privacy Policy',
    title: 'Privacy Policy | Exhibit On Superior',
    description:
      'Read the privacy policy for Exhibit On Superior in River North Chicago, covering how we collect, use, and protect your information.',
    quickAnswer:
      'This page explains how Exhibit On Superior collects, uses, and protects the information you share through the website.',
    faqs: [],
    // Indexable on purpose: search engines (and audit tools) treat a
    // discoverable privacy policy as a site-trust signal, and a noindexed
    // one reads as "no privacy policy found".
  },
  '/accessibility-statement': {
    path: '/accessibility-statement',
    label: 'Accessibility Statement',
    title: 'Accessibility Statement | Exhibit On Superior',
    description:
      'Exhibit On Superior is committed to digital accessibility and conforming to WCAG 2.1 AA. Learn about our measures and how to share feedback.',
    quickAnswer:
      'Exhibit On Superior is committed to WCAG 2.1 AA digital accessibility. Contact us if you encounter any barrier using the site.',
    faqs: [],
    noindex: true,
  },
};

// ---------------------------------------------------------------------------
// FAQ hub (/faq): verified Q&As aggregated by topic. Each topic links to its
// detail page; the hub's FAQPage schema is fed from these via PAGE_SEO['/faq'].
// Sources: leasing-approved FAQ answer bank + verified per-page FAQs only.
// ---------------------------------------------------------------------------

export interface FaqHubTopic {
  title: string;
  /** Detail page for this topic. */
  link: string;
  linkLabel: string;
  faqs: Faq[];
}

export const FAQ_HUB_TOPICS: FaqHubTopic[] = [
  {
    title: 'Location & Contact',
    link: '/contact-us',
    linkLabel: 'Contact Us',
    faqs: [
      {
        q: 'Where is Exhibit On Superior located?',
        knowledgeSlug: 'building-address',
        a: 'Exhibit On Superior is located at 165 W Superior St, Chicago, IL 60654 in the River North area.',
      },
      {
        q: 'What is the phone number for Exhibit On Superior?',
        a: 'The phone number is 312-450-0635.',
      },
      {
        q: 'What is the email for Exhibit On Superior?',
        a: 'The contact email is exhibit@highlandptrs.com.',
      },
      {
        q: 'Who manages Exhibit On Superior?',
        knowledgeSlug: 'who-manages-exhibit',
        a: 'The community is professionally managed on site; contact the leasing office at exhibit@highlandptrs.com or 312-450-0635.',
      },
    ],
  },
  {
    title: 'Apartments & Floor Plans',
    link: '/apartment-guide',
    linkLabel: 'Apartment Guide',
    faqs: [
      {
        q: 'What apartment sizes are available?',
        knowledgeSlug: 'what-apartment-sizes',
        a: `The community offers studio, convertible, one, two, and three-bedroom apartment homes from about ${SQFT_MIN_DISPLAY} to ${SQFT_MAX_DISPLAY} square feet across floors 2\u201334.`,
      },
      {
        q: 'Do apartments have in-unit laundry?',
        knowledgeSlug: 'in-unit-laundry',
        a: 'Yes. In-home washer/dryers are a standard apartment feature.',
      },
      {
        q: 'What finishes do apartments have?',
        knowledgeSlug: 'apartment-finishes',
        a: 'Homes feature driftwood plank floors, quartz countertops, tiled backsplashes, stainless-steel appliances, floor-to-ceiling windows, and private balconies in nearly every home.',
      },
      {
        q: 'What is the largest apartment?',
        knowledgeSlug: 'largest-apartment',
        a: `A three-bedroom, three-bath residence of ${SQFT_MAX_DISPLAY} square feet on the penthouse-level floors 30\u201334.`,
      },
      {
        q: 'Are furnished apartments available?',
        knowledgeSlug: 'are-apartments-furnished',
        a: 'No. Apartments are offered unfurnished only.',
      },
    ],
  },
  {
    title: 'Pricing & Fees',
    link: '/fees',
    linkLabel: 'Fees & Leasing Costs',
    faqs: [
      {
        q: 'How do I check current pricing and availability?',
        knowledgeSlug: 'how-much-is-rent',
        a: 'The Available Units page lists every available residence with live rent, photos, and move-in dates synced from the leasing system.',
      },
      {
        q: 'What fees are required in addition to rent?',
        knowledgeSlug: 'what-fees-in-addition-to-rent',
        a: 'Each unit\u2019s listing shows its application fee. There is also a $500 non-refundable administration fee per apartment and a monthly Utility & Service Amenity fee of $95\u2013$195 by floor plan. There is no security deposit.',
      },
      {
        q: 'Are utilities included?',
        knowledgeSlug: 'what-utility-fee-covers',
        a: 'The monthly Utility & Service Amenity fee covers water, sewer, trash, heat, A/C, and natural gas for cooking and the dryer; electricity is billed directly by ComEd.',
      },
      {
        q: 'Does Exhibit offer move-in specials?',
        knowledgeSlug: 'move-in-specials',
        a: 'Exhibit is not offering move-in concessions at this time \u2014 ask the leasing team about future offers.',
      },
      {
        q: 'How much is parking?',
        knowledgeSlug: 'how-much-does-parking-cost',
        a: 'Garage parking in the attached indoor garage is $335 per month per unreserved space, subject to availability.',
      },
    ],
  },
  {
    title: 'Amenities',
    link: '/amenities',
    linkLabel: 'Amenities',
    faqs: [
      {
        q: 'What amenities does Exhibit On Superior offer?',
        knowledgeSlug: 'full-amenity-list',
        a: 'Amenities include a full-floor amenity deck, fitness center, 75-foot lap pool, outdoor hot tub, sauna, lounges, work and meeting rooms, music studio, dog spa, grilling stations, fire pits, and outdoor areas.',
      },
      {
        q: 'Does Exhibit On Superior have a pool?',
        knowledgeSlug: 'is-there-a-pool',
        a: 'Yes \u2014 a 75-foot lap pool on the amenity floor, plus an outdoor hot tub and sauna.',
      },
      {
        q: 'Is there space to work from home?',
        knowledgeSlug: 'work-from-home-spaces',
        a: 'Yes. Private work and meeting rooms, a tech lounge with charging stations and kitchen, a library nook, and reading alcoves.',
      },
      {
        q: 'Does Exhibit have on-site retail?',
        knowledgeSlug: 'on-site-retail',
        a: 'Yes. On-site retail and wellness options include fitness, food, and spa services.',
      },
      {
        q: 'Is there a 24-hour concierge?',
        knowledgeSlug: 'front-desk-hours',
        a: 'Yes. The front desk is staffed 24 hours a day, and indoor amenities are open 24/7.',
      },
    ],
  },
  {
    title: 'Pets',
    link: '/pet-friendly',
    linkLabel: 'Pet Friendly',
    faqs: [
      {
        q: 'Is Exhibit On Superior pet-friendly?',
        knowledgeSlug: 'how-many-pets',
        a: 'Yes. Cats and dogs are welcome, with a maximum of 2 pets per apartment.',
      },
      {
        q: 'Are there pet amenities?',
        knowledgeSlug: 'pet-amenities',
        a: 'Yes \u2014 a doggie spa and lounge inside the building and a gated outdoor dog walk.',
      },
      {
        q: 'What are the pet fees and breed rules?',
        knowledgeSlug: 'what-are-pet-fees',
        a: 'One-time non-refundable pet fee: $650 for one dog or $750 for two, $325 for cats. No pet deposit, no monthly pet rent, no weight limits. Breed restrictions apply \u2014 see a leasing consultant for details.',
      },
    ],
  },
  {
    title: 'Neighborhood & Getting Around',
    link: '/neighborhood',
    linkLabel: 'Neighborhood',
    faqs: [
      {
        q: 'What neighborhood is Exhibit On Superior in?',
        knowledgeSlug: 'what-neighborhood',
        a: 'Exhibit On Superior is in River North in Chicago.',
      },
      {
        q: 'How close is the CTA?',
        knowledgeSlug: 'cta-proximity',
        a: 'The Chicago Brown/Purple Line station (Chicago & Franklin) is about two blocks away; the Chicago Red Line station (Chicago & State) is roughly 0.3 miles.',
      },
      {
        q: 'Is Exhibit close to a grocery store?',
        knowledgeSlug: 'neighborhood-groceries',
        a: 'Yes. Whole Foods (3 W Chicago Ave), Jewel-Osco (550 N State St), and Trader Joe\u2019s (44 E Ontario St) are all within about half a mile.',
      },
      {
        q: 'Is Exhibit walkable to the Loop?',
        knowledgeSlug: 'walk-to-the-loop',
        a: 'Yes \u2014 the Loop is roughly a mile south, about a 20-minute walk or one Brown Line stop.',
      },
      {
        q: 'What is nearby?',
        knowledgeSlug: 'whats-near-superior-and-wells',
        a: 'Cafes, restaurants, shops, parks, the Chicago River, West Loop, Old Town, and Fulton Market.',
      },
    ],
  },
  {
    title: 'Touring & Applying',
    link: '/application-guide',
    linkLabel: 'Application Guide',
    faqs: [
      {
        q: 'How do I schedule a tour?',
        knowledgeSlug: 'schedule-a-tour',
        a: 'Choose the residence you\u2019re interested in on the Available Units page and use its Schedule a Tour button, email exhibit@highlandptrs.com, or call 312-450-0635.',
      },
      {
        q: 'Can I tour virtually?',
        knowledgeSlug: 'virtual-tours',
        a: 'Yes. The Virtual Tour page includes video and Matterport tour embeds for apartment and amenity previews.',
      },
      {
        q: 'How do I apply?',
        knowledgeSlug: 'how-do-i-apply',
        a: 'Open any available residence on the Available Units page and use its Apply Now button \u2014 each unit links directly to its own secure online application.',
      },
      {
        q: 'What credit score is required and are guarantors accepted?',
        knowledgeSlug: 'credit-score-required',
        a: `A minimum credit score of ${CREDIT_SCORE_MIN} is required, or ${CREDIT_SCORE_COSIGNER_MIN}+ with a qualified co-signer. Qualified co-signers are accepted.`,
      },
      {
        q: 'What lease terms are available?',
        knowledgeSlug: 'lease-terms',
        a: '12+ month lease terms are available; short-term leases are offered based on availability. Approval typically takes 1\u20133 business days.',
      },
    ],
  },
  {
    title: 'Residents',
    link: '/residents',
    linkLabel: 'Residents',
    faqs: [
      {
        q: 'Who should residents contact?',
        knowledgeSlug: 'who-manages-exhibit',
        a: 'Residents can contact Exhibit On Superior at exhibit@highlandptrs.com or 312-450-0635.',
      },
      {
        q: 'Where should residents log in?',
        knowledgeSlug: 'resident-portal',
        a: 'Current residents use the resident portal linked from the Residents page for payments and maintenance requests.',
      },
    ],
  },
];

// The hub page's FAQPage schema carries every hub Q&A.
PAGE_SEO['/faq'].faqs = FAQ_HUB_TOPICS.flatMap((t) => t.faqs);

function canonicalFor(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

// Exported: per-unit pages (data/unitPageSeo.ts) re-emit these base entities so
// their @graph is self-contained (no dangling @id refs) and the merged
// ApartmentComplex node carries every recommended property on every page.
export const WEBSITE_NODE = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}#website`,
  name: 'Exhibit On Superior',
  url: SITE_URL,
  publisher: { '@id': `${SITE_URL}#organization` },
};

export const ORGANIZATION_NODE = {
  '@type': 'Organization',
  '@id': `${SITE_URL}#organization`,
  name: 'Exhibit On Superior',
  url: SITE_URL,
  email: 'exhibit@highlandptrs.com',
  telephone: '312-450-0635',
  // The leasing team's email/phone as a ContactPoint: `email` is not core
  // schema.org vocabulary on ApartmentComplex (a Place subtype), so the
  // property entity references this node instead of carrying email directly —
  // keeps validator.schema.org fully clean while the address stays in the graph.
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'leasing office',
    email: 'exhibit@highlandptrs.com',
    telephone: '312-450-0635',
    areaServed: 'US',
    availableLanguage: 'English',
  },
  logo: `${SITE_URL}/images/image-001-exhibit-on-superior-logo-color-a7pvg4-1805w.webp`,
  // Building photo (distinct from the logo) — Google's Organization guidance
  // recommends `image`; same shipped asset the ApartmentComplex node uses.
  image: `${SITE_URL}/images/image-002-gettyimages-1286580777-nvdupq-2000w.webp`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '165 W Superior St',
    addressLocality: 'Chicago',
    addressRegion: 'IL',
    postalCode: '60654',
    addressCountry: 'US',
  },
  sameAs: [
    'https://www.facebook.com/exhibitonsuperior',
    'https://www.instagram.com/exhibitonsuperior',
    'https://www.youtube.com/@ExhibitonSuperior',
  ],
};

/**
 * Building-wide square-footage range as a schema.org QuantitativeValue,
 * derived from the floor-plan database extremes (never hardcoded, so a new
 * or corrected plan sheet updates the structured data automatically).
 */
export const FLOOR_SIZE_RANGE_NODE = {
  '@type': 'QuantitativeValue',
  minValue: SQFT_MIN,
  maxValue: SQFT_MAX,
  unitCode: 'FTK',
  unitText: 'sq ft',
};

/**
 * Availability-derived ApartmentComplex properties, from the same baked
 * snapshot that powers the Available Units page and per-unit Offer nodes:
 * - numberOfAvailableAccommodationUnits: count of currently available units
 * - priceRange: "From $X,XXX/month", from the lowest current asking rent
 * Both degrade gracefully — when no usable snapshot (or no priced units)
 * exists the property is omitted entirely, never emitted as 0/null.
 */
export function availabilityComplexProps(
  now: number = Date.now(),
): { numberOfAvailableAccommodationUnits?: number; priceRange?: string } {
  const data = getBakedAvailability(now);
  const props: { numberOfAvailableAccommodationUnits?: number; priceRange?: string } = {};
  if (data && data.units.length > 0) {
    props.numberOfAvailableAccommodationUnits = data.units.length;
  }
  const starting = getStartingRent(now);
  if (starting) props.priceRange = `From ${starting.formatted}/month`;
  return props;
}

export const APARTMENT_COMPLEX_NODE = {
  '@type': 'ApartmentComplex',
  '@id': `${SITE_URL}#apartmentcomplex`,
  name: 'Exhibit On Superior',
  alternateName: 'Exhibit on Superior Apartments',
  url: SITE_URL,
  mainEntityOfPage: `${SITE_URL}/`,
  logo: `${SITE_URL}/images/image-001-exhibit-on-superior-logo-color-a7pvg4-1805w.webp`,
  containedInPlace: {
    '@type': 'Place',
    name: 'River North',
    containedInPlace: {
      '@type': 'City',
      name: 'Chicago',
      containedInPlace: {
        '@type': 'State',
        name: 'Illinois',
        containedInPlace: { '@type': 'Country', name: 'United States' },
      },
    },
  },
  // Total residences in the tower — a hard fact AI answer engines look for.
  numberOfAccommodationUnits: UNIT_TOTAL,
  // Building-wide square-footage range from the floor-plan DB extremes.
  floorSize: FLOOR_SIZE_RANGE_NODE,
  // Live availability count + real "From $X,XXX/month" price range from the
  // baked availability snapshot; omitted entirely when no usable snapshot.
  ...availabilityComplexProps(),
  // Touring/visiting the leasing office is free; this disambiguates the
  // entity from paid-admission venues for AI answer engines.
  isAccessibleForFree: true,
  potentialAction: [
    {
      '@type': 'ScheduleAction',
      name: 'Schedule a Tour',
      target: `${SITE_URL}/schedule-a-tour`,
    },
    {
      '@type': 'ViewAction',
      name: 'View Available Units',
      target: `${SITE_URL}/available-units`,
    },
  ],
  image: `${SITE_URL}/images/image-002-gettyimages-1286580777-nvdupq-2000w.webp`,
  description:
    'Exhibit On Superior is a luxury high-rise apartment community at 165 W Superior St in Chicago\u2019s River North neighborhood with studio, convertible, one-, two-, and three-bedroom apartments, a full floor of luxury amenities, on-site retail, and quick access to downtown neighborhoods.',
  telephone: '312-450-0635',
  // No `email` here: validator.schema.org flags it as UNKNOWN_FIELD on
  // ApartmentComplex (Place subtype). The address lives on the Organization
  // node's ContactPoint in the same @graph.
  address: {
    '@type': 'PostalAddress',
    streetAddress: '165 W Superior St',
    addressLocality: 'Chicago',
    addressRegion: 'IL',
    postalCode: '60654',
    addressCountry: 'US',
  },
  geo: { '@type': 'GeoCoordinates', latitude: '41.8953945', longitude: '-87.6335254' },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', ...OFFICE_HOURS_WEEKDAY },
    { '@type': 'OpeningHoursSpecification', ...OFFICE_HOURS_SATURDAY },
  ],
  hasMap: 'https://www.google.com/maps?cid=15240815771270963454',
  tourBookingPage: TOUR_URL,
  petsAllowed:
    'Cats and dogs are welcome (maximum 2 pets). One-time non-refundable pet fee: $650 for one dog or $750 for two, $325 for cats. No pet deposit or monthly pet rent; no weight limits; breed restrictions apply.',
  sameAs: [
    'https://www.facebook.com/exhibitonsuperior',
    'https://www.instagram.com/exhibitonsuperior',
    'https://www.youtube.com/@ExhibitonSuperior',
  ],
  amenityFeature: [
    'Full-floor amenity deck overlooking the city and private park',
    'Fitness center with two private training rooms',
    'Cardio equipment and spin bikes',
    'Boxing simulator',
    '75-foot lap pool',
    'Sauna and wet lounge leading to outdoor deck',
    'Outdoor hot tub',
    'Four grilling stations',
    'Four fire pits',
    'Doggie spa and lounge',
    'Tech lounge with charging stations and kitchen',
    'Lounge with fireplace and big screen TV',
    'Game area with arcade games and wall Scrabble',
    'Music studio room',
    'Gated outdoor dog walk',
    'Private work and meeting rooms',
    'Private dining room and party suite',
    'Library nook',
    'Floor-to-ceiling windows',
    'Private balconies (nearly every home)',
    'In-home washer/dryer',
    'Quartz countertops',
    'Stainless-steel appliances',
    'Wired for 1GB internet',
    // Third-party Walk Score metrics — must match visible site copy (walkScores.ts).
    `${WALK_SCORE.name} ${WALK_SCORE.score} (${WALK_SCORE.label}, per Walk Score)`,
    `${TRANSIT_SCORE.name} ${TRANSIT_SCORE.score} (${TRANSIT_SCORE.label}, per Walk Score)`,
    `${BIKE_SCORE.name} ${BIKE_SCORE.score} (${BIKE_SCORE.label}, per Walk Score)`,
  ].map((name) => ({ '@type': 'LocationFeatureSpecification', name })),
};

/** Build the JSON-LD @graph for a page path. */
export function buildJsonLd(path: string): Record<string, unknown> {
  const page = PAGE_SEO[path];
  const canonical = canonicalFor(path);
  const idBase = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;

  // /about is typed AboutPage with the Organization as its main entity —
  // the E-E-A-T signal search engines look for on an about page.
  const webPage = {
    '@type': path === '/about' ? 'AboutPage' : 'WebPage',
    '@id': `${idBase}#webpage`,
    url: canonical,
    name: page?.title,
    description: page?.description,
    isPartOf: { '@id': `${SITE_URL}#website` },
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
    // Explicit page-image signal, sourced from the same per-page share card
    // as the og:image meta so the two can never diverge.
    primaryImageOfPage: page?.ogImage ?? DEFAULT_OG_IMAGE,
    ...(path === '/about' ? { mainEntity: { '@id': `${SITE_URL}#organization` } } : {}),
    breadcrumb: { '@id': `${idBase}#breadcrumb` },
  };

  const breadcrumbItems =
    path === '/'
      ? [{ '@type': 'ListItem', position: 1, name: 'Exhibit On Superior', item: SITE_URL }]
      : [
          { '@type': 'ListItem', position: 1, name: 'Exhibit On Superior', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: page?.label, item: canonical },
        ];

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${idBase}#breadcrumb`,
    itemListElement: breadcrumbItems,
  };

  const graph: Record<string, unknown>[] = [
    WEBSITE_NODE,
    ORGANIZATION_NODE,
    APARTMENT_COMPLEX_NODE,
    webPage,
    breadcrumb,
  ];

  if (page && page.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${idBase}#faq`,
      mainEntity: page.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export { canonicalFor };

// ---------------------------------------------------------------------------
// Shared SEO tag model
//
// One model feeds BOTH the client <Seo> component (react-helmet-async) and the
// build-time prerenderer (renderHeadTags below), so title/description/canonical/
// OG/Twitter/JSON-LD can never drift between the two.
// ---------------------------------------------------------------------------

export interface SeoMeta {
  name?: string;
  property?: string;
  content: string;
}

export interface SeoModel {
  title: string;
  canonical?: string;
  metas: SeoMeta[];
  jsonLd: Record<string, unknown>[];
}

export interface SeoOptions {
  /** Override title (routes without a PAGE_SEO entry, e.g. 404). */
  title?: string;
  description?: string;
  /** Serve robots noindex and omit canonical/JSON-LD for unknown routes. */
  noindex?: boolean;
  /** Extra JSON-LD objects appended after the base @graph (e.g. floor-plan ItemList). */
  extraJsonLd?: Record<string, unknown>[];
}

export function buildSeoModel(path: string, opts: SeoOptions = {}): SeoModel | null {
  const page = PAGE_SEO[path];
  const title = opts.title ?? page?.title;
  if (!title) return null;

  const description = opts.description ?? page?.description ?? '';
  const isNoindex = opts.noindex ?? page?.noindex ?? false;
  // Only known routes self-canonicalize; a 404 must not canonicalize a bad URL.
  const canonical = page ? canonicalFor(path) : undefined;
  const ogImage = page?.ogImage ?? DEFAULT_OG_IMAGE;
  const baseJsonLd = page && !isNoindex ? buildJsonLd(path) : null;
  const jsonLd = [...(baseJsonLd ? [baseJsonLd] : []), ...(opts.extraJsonLd ?? [])];

  const metas: SeoMeta[] = [
    { name: 'description', content: description },
    // max-image-preview:large makes gallery/hero images eligible for large
    // image previews in Google Search and Discover.
    {
      name: 'robots',
      content: isNoindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
    },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Exhibit On Superior' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    ...(canonical ? [{ property: 'og:url', content: canonical }] : []),
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
  ];

  return { title, canonical, metas, jsonLd };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render an SeoModel to a `<head>`-ready HTML string, used by the prerenderer.
 * (react-helmet-async does not populate the SSR context under React 19, so head
 * tags are emitted deterministically here rather than via renderToString.)
 */
export function renderHeadTags(model: SeoModel): string {
  const parts: string[] = [`<title>${escapeHtml(model.title)}</title>`];
  if (model.canonical) {
    parts.push(`<link rel="canonical" href="${escapeHtml(model.canonical)}" />`);
  }
  for (const m of model.metas) {
    const attr = m.name ? `name="${m.name}"` : `property="${m.property}"`;
    parts.push(`<meta ${attr} content="${escapeHtml(m.content)}" />`);
  }
  for (const obj of model.jsonLd) {
    // Escape "<" so the JSON can never break out of the <script> element.
    // data-ssr-jsonld marks prerendered scripts so the client can remove them
    // before Helmet re-emits live copies — otherwise Googlebot's rendered DOM
    // contains both sets and GSC flags "Review has multiple aggregate ratings".
    const json = JSON.stringify(obj).replace(/</g, '\\u003c');
    parts.push(`<script type="application/ld+json" data-ssr-jsonld>${json}</script>`);
  }
  return parts.join('\n    ');
}
