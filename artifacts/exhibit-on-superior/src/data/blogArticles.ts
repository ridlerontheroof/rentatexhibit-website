// Blog article content — pure data, no logic (see blog.ts for types/helpers).
//
// AUTHORING RULES (mirror knowledgeArticles.ts):
//   1. Facts only from committed fact modules (propertyFacts, walkScores,
//      commute), live listing data, or already-published page copy. Anything
//      unconfirmed is deferred to the leasing office — never guessed.
//   2. Third-party claims cite a source in `sources` (rendered visibly).
//   3. `summary` is a self-contained 40–60-word answer to the target query.
//   4. Every article literal starts with `slug:` then `title:` (the plain-Node
//      slug parser in scripts/lib/blog-slugs.mjs depends on this format).
//   5. `draft: true` keeps an article out of every published surface until a
//      human reviewer flips it. AI-generated drafts must always start drafted.
//   6. No em dashes spelled "--"; use \u2013 (en dash) / \u2014 (em dash) and
//      \u2019 for apostrophes, matching the site's typography.
import type { BlogArticle } from './blog';
import {
  WALK_SCORE_PHRASE,
  TRANSIT_SCORE_PHRASE,
  BIKE_SCORE_PHRASE,
  WALK_SCORE_SOURCE_URL,
} from './walkScores';

export const ALL_BLOG_ARTICLES: BlogArticle[] = [
  // ---------------------------------------------------------------------
  // PILLAR — River North living
  // ---------------------------------------------------------------------
  {
    slug: 'living-in-river-north-chicago',
    title: 'Living in River North, Chicago: A Renter\u2019s Guide',
    metaTitle: 'Living in River North: A Renter\u2019s Guide',
    targetQuery: 'living in river north chicago',
    role: 'pillar',
    pillar: 'living-in-river-north-chicago',
    authorId: 'rebbekah-hallberg',
    summary:
      'River North gives renters gallery-lined streets, restaurants and nightlife at the door, and a commute measured in blocks: 165 W Superior St earns a 99/100 Walk Score and a perfect 100/100 Transit Score, with the Loop one L stop away. This guide covers getting around, costs, apartment styles, and high-rise life.',
    sections: [
      {
        heading: 'Where River North sits',
        paragraphs: [
          'River North is the neighborhood just north of the Chicago River and the Loop, west of the Magnificent Mile. Exhibit On Superior sits at 165 W Superior St, near the corner of Superior and Wells \u2014 close enough to walk to the Loop, the riverwalk, and Michigan Avenue, but a few blocks removed from the heaviest tourist foot traffic.',
          'The neighborhood built its reputation on art galleries and design showrooms, and it is now one of the densest restaurant districts in Chicago. For renters, the practical draw is simpler: almost everything a week requires \u2014 groceries, gyms, coffee, transit \u2014 is within a few blocks.',
        ],
      },
      {
        heading: 'Getting around without a car',
        paragraphs: [
          `This is the part of River North living that surprises people most. Per Walk Score, 165 W Superior St rates ${WALK_SCORE_PHRASE}, ${TRANSIT_SCORE_PHRASE}, and ${BIKE_SCORE_PHRASE} \u2014 errands here genuinely do not require a car.`,
          'The Chicago station on the Brown and Purple Lines is about two blocks away at Chicago Ave & Franklin St \u2014 roughly a three-minute walk. The Red Line\u2019s Chicago/State station is about 0.3 miles east, around a seven-minute walk, and the #66 Chicago Ave bus stops one block north. The Loop is one L stop away \u2014 about ten minutes door to door \u2014 or a twenty-minute walk of roughly a mile down Wells Street.',
          'Both airports are reachable by train: per the CTA\u2019s published schedules, O\u2019Hare takes roughly 45\u201355 minutes on the Blue Line, and Midway roughly 45\u201355 minutes on the Orange Line with a transfer in the Loop.',
        ],
      },
      {
        heading: 'What renting here costs beyond rent',
        paragraphs: [
          'Every building prices extras differently, so ask for the full fee schedule before you apply anywhere. At Exhibit On Superior the structure is straightforward: there is no security deposit. Applicants pay a $60 application fee per person and a $500 administration fee per apartment, and the administration fee is refunded if the application is denied.',
          'A monthly Utility & Service Amenity fee of $95\u2013$195, depending on the floor plan, covers water, sewer, trash, heat, air conditioning, and natural gas \u2014 electricity through ComEd is the only utility you set up yourself. Garage parking is $335 per month, storage lockers are $25 per month, and bike storage is free.',
        ],
      },
      {
        heading: 'Apartment styles you will find',
        paragraphs: [
          'River North\u2019s rental stock is dominated by high-rise towers, and layouts run from compact studios to full three-bedrooms. At Exhibit On Superior, homes range from studios and convertibles to one-, two-, and three-bedroom apartments, spanning roughly 448 to 1,528 square feet across floors 2 through 34.',
          'Interiors here include floor-to-ceiling windows, an in-home washer and dryer, quartz countertops, and driftwood-style plank flooring \u2014 features worth putting on your comparison checklist for any building you tour in the neighborhood.',
        ],
      },
      {
        heading: 'High-rise life: floors, views, and quiet',
        paragraphs: [
          'Floor choice changes the experience more than most renters expect. Lower floors put you closest to the street energy; higher floors trade a longer elevator ride for bigger skyline views and less street sound. Exhibit\u2019s tower runs from floor 2 to floor 34, so there is a wide band to choose from \u2014 our team walks renters through the trade-offs on every tour.',
          'Building amenities carry more weight in a high-rise neighborhood because they extend your square footage: Exhibit residents have a 75-foot indoor lap pool, an outdoor hot tub, and a sauna, among other spaces.',
        ],
      },
      {
        heading: 'Bringing a pet',
        paragraphs: [
          'River North is a dog neighborhood \u2014 you will see them on every block. Exhibit On Superior allows up to two pets per apartment with a one-time fee of $650 for one dog, $750 for two dogs, or $325 for cats, and there is no monthly pet rent.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is River North a walkable neighborhood?',
        answer:
          `Yes \u2014 it is one of the most walkable rental neighborhoods in Chicago. Per Walk Score, 165 W Superior St rates ${WALK_SCORE_PHRASE} and ${TRANSIT_SCORE_PHRASE}, with groceries, restaurants, and two L stations within a few blocks.`,
      },
      {
        question: 'How far is River North from the Loop?',
        answer:
          'One L stop or about a mile on foot. From Exhibit On Superior, the Brown/Purple Line at Chicago & Franklin reaches the Loop in roughly ten minutes door to door, and the walk down Wells Street takes about twenty minutes.',
      },
      {
        question: 'Do you need a car to live in River North?',
        answer:
          'No. The address holds a perfect 100/100 Transit Score per Walk Score, with the Brown, Purple, and Red Lines and the #66 bus all within a seven-minute walk. Renters who keep a car can lease garage parking at Exhibit On Superior for $335 per month.',
      },
    ],
    related: [
      'is-river-north-a-good-place-to-live',
      'moving-to-river-north-chicago-checklist',
      'river-north-vs-streeterville-renters',
    ],
    links: [
      { label: 'See current availability and pricing', href: '/available-units' },
      { label: 'Explore the neighborhood guide', href: '/neighborhood' },
      { label: 'Schedule a tour', href: '/schedule-a-tour' },
    ],
    sources: [
      {
        label: 'Walk Score for 165 W Superior St',
        href: WALK_SCORE_SOURCE_URL,
      },
      {
        label: 'CTA \u2014 train schedules and travel times',
        href: 'https://www.transitchicago.com/schedules/',
      },
      {
        label: 'ComEd \u2014 start, stop, or move electric service',
        href: 'https://www.comed.com/my-account/customer-support/start-stop-move',
      },
    ],
    ogCard: 'neighborhood',
    published: '2026-08-13',
    updated: '2026-08-13',
  },

  // ---------------------------------------------------------------------
  // CLUSTER — is River North a good place to live
  // ---------------------------------------------------------------------
  {
    slug: 'is-river-north-a-good-place-to-live',
    title: 'Is River North a Good Place to Live? A Property Manager\u2019s Honest Take',
    metaTitle: 'Is River North a Good Place to Live?',
    targetQuery: 'is river north a good place to live',
    role: 'cluster',
    pillar: 'living-in-river-north-chicago',
    authorId: 'rebbekah-hallberg',
    summary:
      'For renters who want to live car-free in central Chicago, yes: River North pairs a 99/100 Walk Score and a perfect 100/100 Transit Score with the Loop one L stop away. The honest trade-offs are downtown pricing and city energy \u2014 this piece weighs both sides from a property manager\u2019s view.',
    sections: [
      {
        heading: 'Who River North suits best',
        paragraphs: [
          'I manage Exhibit On Superior at 165 W Superior St, and the renters who thrive here share a pattern: they want their daily life within walking distance. Restaurants, groceries, gyms, galleries, the riverwalk, and two L stations all sit within a few blocks, so the neighborhood rewards people who would rather walk ten minutes than drive twenty.',
          'It also suits commuters. The Loop is one stop away on the Brown or Purple Line \u2014 about ten minutes door to door per the CTA\u2019s published schedules \u2014 and both airports are reachable by train, which matters more than people expect for frequent travelers.',
        ],
      },
      {
        heading: 'The case for: walkability and transit',
        paragraphs: [
          `The numbers back up the feel of the neighborhood. Per Walk Score, this address rates ${WALK_SCORE_PHRASE}, ${TRANSIT_SCORE_PHRASE}, and ${BIKE_SCORE_PHRASE}. In practice that means most residents run their whole week without a car \u2014 and those who keep one lease a garage space and use it mostly for weekend trips.`,
        ],
      },
      {
        heading: 'The honest trade-offs',
        paragraphs: [
          'River North is a downtown neighborhood, and it lives like one. Streets are busier and brighter at night than in residential neighborhoods farther out, and high-rise buildings here price at a premium \u2014 you are paying for location and building amenities. If your priority is maximum square footage per dollar or a quiet residential block, a neighborhood farther from the core will fit better.',
          'Inside a well-run high-rise, most of the noise concern falls away with smart floor choice. Higher floors are quieter and get bigger views; lower floors are closer to the street energy and the elevator ride is shorter. At Exhibit the tower runs from floor 2 to floor 34, so renters have a real range to choose from.',
        ],
      },
      {
        heading: 'What renters ask me most',
        paragraphs: [
          'On tours, the questions are consistent: How walkable is it really? (Very \u2014 see the scores above.) Can I live here without a car? (Most residents do.) What does it cost to move in? At Exhibit there is no security deposit \u2014 applicants pay a $60 application fee per person and a $500 administration fee per apartment, refunded if the application is denied \u2014 which is a lighter up-front load than many buildings in the area.',
        ],
      },
      {
        heading: 'The verdict',
        paragraphs: [
          'If you want central Chicago at walking speed \u2014 transit at the corner, the Loop one stop away, and a high-rise with real amenities \u2014 River North is one of the best places in the city to rent. If you want quiet residential streets and the most space per dollar, look farther out. Most of our residents made that trade knowingly, and renew because the location keeps paying off daily.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is River North expensive to live in?',
        answer:
          'River North high-rises price at a premium for the location \u2014 the premium buys walkability, transit, and building amenities. Up-front costs vary by building; at Exhibit On Superior there is no security deposit, which lightens the initial move-in load.',
      },
      {
        question: 'Is River North quiet at night?',
        answer:
          'It is a downtown neighborhood, so streets are livelier than residential areas farther out. Inside a high-rise, floor choice matters most: higher floors are noticeably quieter. Exhibit On Superior spans floors 2 through 34, giving renters a wide range of options.',
      },
    ],
    related: ['living-in-river-north-chicago', 'moving-to-river-north-chicago-checklist'],
    links: [
      { label: 'Browse available apartments', href: '/available-units' },
      { label: 'Compare floor plans', href: '/floor-plans' },
      { label: 'Schedule a tour', href: '/schedule-a-tour' },
    ],
    sources: [
      {
        label: 'Walk Score for 165 W Superior St',
        href: WALK_SCORE_SOURCE_URL,
      },
      {
        label: 'CTA \u2014 train schedules and travel times',
        href: 'https://www.transitchicago.com/schedules/',
      },
    ],
    ogCard: 'luxury-apartments-river-north',
    published: '2026-08-13',
    updated: '2026-08-13',
  },

  // ---------------------------------------------------------------------
  // CLUSTER — moving to River North checklist
  // ---------------------------------------------------------------------
  {
    slug: 'moving-to-river-north-chicago-checklist',
    title: 'Moving to River North, Chicago: A Renter\u2019s Checklist',
    metaTitle: 'Moving to River North: Renter\u2019s Checklist',
    targetQuery: 'moving to river north chicago',
    role: 'cluster',
    pillar: 'living-in-river-north-chicago',
    authorId: 'leasing-team',
    summary:
      'Moving to River North takes four steps: tour and apply (at Exhibit On Superior, a $60 application fee per applicant, a 700 minimum credit score or 600 with a co-signer, and a decision in 1\u20133 business days), budget move-in costs, set up ComEd electricity and renters insurance, then coordinate move-in with the office.',
    sections: [
      {
        heading: 'Four to six weeks out: tour and shortlist',
        paragraphs: [
          'In our leasing office\u2019s experience, River North apartments move quickly, so we recommend starting tours about a month before your target move date. Tour at the time of day you will actually be home \u2014 light and street sound change through the day \u2014 and ask every building for its full fee schedule, not just the rent, so you can compare true monthly costs.',
        ],
        list: [
          'Book tours for your top three buildings in one week so comparisons stay fresh.',
          'Ask each building what its application, administration, and monthly fees are.',
          'Note commute times from each address \u2014 in River North, blocks matter.',
        ],
      },
      {
        heading: 'Applying: documents and requirements',
        paragraphs: [
          'Applications in most River North buildings are online. At Exhibit On Superior, the application runs through our secure portal and decisions typically come back in 1\u20133 business days. Qualifying is straightforward: applicants need a minimum credit score of 700, or 600 with a qualified co-signer, along with a government-issued photo ID. The application fee is $60 per applicant, plus a $500 administration fee per apartment that is refunded if the application is denied.',
        ],
      },
      {
        heading: 'Budgeting your move-in costs',
        paragraphs: [
          'Up-front costs vary widely between buildings, so build the full list before you sign. At Exhibit On Superior there is no security deposit, which removes the biggest traditional line item.',
        ],
        list: [
          'First month\u2019s rent, plus the $60-per-applicant application fee and $500 administration fee.',
          'The monthly Utility & Service Amenity fee \u2014 $95\u2013$195 depending on floor plan \u2014 covering water, sewer, trash, heat, air conditioning, and natural gas.',
          'Garage parking at $335 per month if you keep a car; storage lockers at $25 per month; bike storage is free.',
          'A one-time pet fee if applicable: $650 for one dog, $750 for two dogs, $325 for cats \u2014 with no monthly pet rent.',
        ],
      },
      {
        heading: 'Utilities and insurance before move-in',
        paragraphs: [
          'Electricity is the one utility renters at Exhibit set up themselves \u2014 service is through ComEd, and you should schedule the start date for your move-in day. Everything else \u2014 water, sewer, trash, heat, air conditioning, and natural gas \u2014 is covered by the monthly Utility & Service Amenity fee.',
          'Renters insurance is required before move-in, with at least $300,000 in liability-to-landlord coverage. Ask your insurer to write the policy to that liability level, and have the policy documents ready to share with the office.',
        ],
      },
      {
        heading: 'Move-in day and settling in',
        paragraphs: [
          'Coordinate your move-in time with the leasing office in advance so the elevator and loading access are ready for your movers \u2014 email exhibit@highlandptrs.com or call 312-450-0635 to schedule. Once you are in, register your bike for the free bike room, set up your resident portal for rent payments and maintenance requests, and introduce your pet to the team.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How long does apartment approval take in River North?',
        answer:
          'At Exhibit On Superior, applications are reviewed within 1\u20133 business days of submission. Having your photo ID and renters insurance details ready keeps the process on the fast end.',
      },
      {
        question: 'Is there a security deposit at Exhibit On Superior?',
        answer:
          'No. Instead of a deposit, applicants pay a $60 application fee per person and a $500 administration fee per apartment \u2014 and the administration fee is refunded if the application is denied.',
      },
      {
        question: 'What credit score do you need to rent in River North?',
        answer:
          'Requirements vary by building. Exhibit On Superior asks for a minimum credit score of 700, or 600 with a qualified co-signer approved by the leasing team.',
      },
    ],
    related: ['living-in-river-north-chicago', 'is-river-north-a-good-place-to-live'],
    links: [
      { label: 'See current availability and pricing', href: '/available-units' },
      { label: 'Review fees and policies', href: '/fees' },
      { label: 'Schedule a tour', href: '/schedule-a-tour' },
    ],
    sources: [
      {
        label: 'ComEd \u2014 start, stop, or move electric service',
        href: 'https://www.comed.com/my-account/customer-support/start-stop-move',
      },
    ],
    ogCard: 'application-guide',
    published: '2026-08-13',
    updated: '2026-08-13',
  },

  // ---------------------------------------------------------------------
  // CLUSTER — River North vs. Streeterville
  // ---------------------------------------------------------------------
  {
    slug: 'river-north-vs-streeterville-renters',
    title: 'River North vs. Streeterville: Which Should Renters Choose?',
    metaTitle: 'River North vs. Streeterville: Which Should Renters Choose?',
    targetQuery: 'river north vs streeterville',
    role: 'cluster',
    pillar: 'living-in-river-north-chicago',
    authorId: 'rebbekah-hallberg',
    summary:
      'Both River North and Streeterville are walkable downtown Chicago neighborhoods within easy reach of the Loop, but they feel different. River North earns a 99/100 Walk Score and a perfect 100/100 Transit Score; its streets are lined with galleries and restaurants. Streeterville is quieter and faces the lake. This piece weighs both for renters deciding between them.',
    sections: [
      {
        heading: 'Where the two neighborhoods sit',
        paragraphs: [
          'River North and Streeterville share a border but have distinct personalities. River North runs from the Chicago River north to Chicago Avenue, between the river and Michigan Avenue. Streeterville picks up on the other side of Michigan Avenue and stretches east to Lake Shore Drive and the lakefront, bordered roughly by the river to the south and Oak Street to the north.',
          'The practical consequence: River North puts you a few blocks from the Brown and Purple Line stations and the Loop. Streeterville puts you closer to the lakefront, Ohio Street Beach, and Navy Pier, but a bit farther from L service.',
        ],
      },
      {
        heading: 'Getting around: transit and walkability',
        paragraphs: [
          `River North\u2019s transit access is one of its clearest advantages. Per Walk Score, 165 W Superior St \u2014 right in the heart of River North \u2014 rates ${WALK_SCORE_PHRASE}, ${TRANSIT_SCORE_PHRASE}, and ${BIKE_SCORE_PHRASE}. The Chicago station on the Brown and Purple Lines is about two blocks away; the Red Line\u2019s Chicago/State station is roughly a seven-minute walk east; and the #66 Chicago Avenue bus stops one block north. The Loop is one L stop away \u2014 about ten minutes door to door per the CTA\u2019s published schedules.`,
          'Streeterville is also walkable: most necessities are reachable on foot along Michigan Avenue, and the Red Line\u2019s Chicago/State station serves the neighborhood\u2019s western edge. Lakefront express buses run along Lake Shore Drive and connect quickly to the Loop. That said, Streeterville does not have its own L station \u2014 the walk to the nearest train is longer than it is from most River North addresses.',
          'If train access matters most to your commute, River North has the edge.',
        ],
      },
      {
        heading: 'Neighborhood energy and daily life',
        paragraphs: [
          'River North\u2019s energy comes from density. The neighborhood is one of the densest restaurant districts in Chicago, and its gallery-district history gives it a mix of creative studios and design showrooms alongside everyday retail. Streets are active through the evening, and the sound level outside reflects that.',
          'Streeterville is quieter in character. It has a more residential feel, anchored by Northwestern Memorial Hospital and the residential towers along the lakefront. Daily life there leans on Michigan Avenue and the Magnificent Mile for shopping and dining \u2014 strong access, but with more tourist traffic than River North\u2019s side streets. The lakefront is Streeterville\u2019s strongest card: Ohio Street Beach and the Lakefront Trail are minutes away on foot, which is hard to replicate from an inland River North address.',
        ],
      },
      {
        heading: 'Apartment stock and what you pay for',
        paragraphs: [
          'Both neighborhoods are dominated by high-rise towers, and both price at a downtown premium. The core trade-off is what that premium buys you: in River North, density of transit and restaurant options; in Streeterville, lakefront proximity and a quieter street environment.',
          'At Exhibit On Superior in River North, apartments run from studios and convertibles to three-bedrooms \u2014 448 to 1,528 square feet across floors 2 through 34 \u2014 with floor-to-ceiling windows, an in-home washer and dryer, quartz countertops, and driftwood-style plank flooring. There is no security deposit; move-in costs are a $60 application fee per applicant and a $500 administration fee per apartment, refunded if the application is denied.',
          'Building features include a 75-foot outdoor lap pool, hot tub, sauna, and fitness center, plus a dog spa and outdoor dog run on the first floor. Monthly add-ons: a Utility & Service Amenity fee of $95\u2013$195 depending on floor plan (covering water, sewer, trash, heat, air conditioning, and natural gas), garage parking at $335 per month, and storage lockers at $25 per month.',
        ],
      },
      {
        heading: 'Who each neighborhood suits',
        paragraphs: [
          'River North is a better fit if you commute by train and want the shortest walk to the L, if you want to walk to most daily needs \u2014 restaurants, groceries, the riverwalk \u2014 without a car, or if you prefer neighborhood energy over quiet: galleries, late-night dining, and street activity at your door.',
          'Streeterville is a better fit if lakefront access \u2014 running, cycling, or the beach \u2014 is part of your daily routine, if you want a quieter residential street environment in a downtown location, or if your commute is to Northwestern Memorial Hospital or the surrounding medical campus.',
          'Most renters who choose between the two have already decided whether transit proximity or lakefront proximity matters more to their daily life. That single preference usually determines the pick.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is River North or Streeterville more walkable?',
        answer:
          `Both neighborhoods are highly walkable \u2014 you can run most errands on foot in either one. River North rates ${WALK_SCORE_PHRASE} and ${TRANSIT_SCORE_PHRASE} at 165 W Superior St per Walk Score, reflecting denser L access. Streeterville is similarly walkable day-to-day but relies more on buses than on nearby L stations.`,
      },
      {
        question: 'Which neighborhood is closer to the Loop?',
        answer:
          'River North, for most transit users. From Exhibit On Superior, the Brown/Purple Line at Chicago & Franklin reaches the Loop in about ten minutes door to door per the CTA\u2019s published schedules. Streeterville residents typically take the Red Line from Chicago/State or a lakefront bus, adding a few extra minutes of walking.',
      },
      {
        question: 'Does Streeterville have better lakefront access than River North?',
        answer:
          'Yes \u2014 that is Streeterville\u2019s defining advantage. Ohio Street Beach and the Lakefront Trail are steps away from most Streeterville addresses. River North sits inland; the lakefront is reachable by bike or bus, but it is not a quick walk from most buildings.',
      },
    ],
    related: ['living-in-river-north-chicago', 'is-river-north-a-good-place-to-live'],
    links: [
      { label: 'Explore the neighborhood guide', href: '/neighborhood' },
      { label: 'See current availability and pricing', href: '/available-units' },
      { label: 'Schedule a tour', href: '/schedule-a-tour' },
    ],
    sources: [
      {
        label: 'Walk Score for 165 W Superior St',
        href: WALK_SCORE_SOURCE_URL,
      },
      {
        label: 'CTA \u2014 train schedules and travel times',
        href: 'https://www.transitchicago.com/schedules/',
      },
    ],
    ogCard: 'neighborhood',
    published: '2026-08-13',
    updated: '2026-08-13',
  },
];
