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
    images: [
      {
        src: '/images/image-081-20170926-1450-wmbiod.jpg',
        alt: 'Downtown Chicago skyline with high-rise towers under an evening sky',
        caption: 'The downtown Chicago skyline rises just south of River North.',
      },
      {
        src: '/images/image-057-dji-20230620092900-0153-d-oaedvz.jpg',
        alt: 'Aerial view of Exhibit On Superior\u2019s glass facade, outdoor pool, and landscaped deck along the street',
        caption: 'Exhibit On Superior from above\u2014the outdoor pool and landscaped deck sit right on the block.',
      },
    ],
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
          'Building amenities carry more weight in a high-rise neighborhood because they extend your square footage: Exhibit residents have a 75-foot outdoor lap pool, an outdoor hot tub, and a sauna, among other spaces.',
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
      'river-north-commute-guide',
      'river-north-with-a-dog',
      'how-to-rent-an-apartment-in-chicago',
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
    images: [
      {
        src: '/images/image-082-bt7b3562-adimkf.jpg',
        alt: 'River North street corner at dusk with high-rise apartments above street-level restaurants',
        caption: 'A River North corner at dusk: high-rise living stacked above street-level restaurants and pubs.',
      },
      {
        src: '/images/image-014-exhibit-living-room-n5xrna.jpg',
        alt: 'Furnished Exhibit On Superior living room with floor-to-ceiling windows overlooking River North',
        caption: 'Inside an Exhibit On Superior living room, with the neighborhood right outside the floor-to-ceiling windows.',
      },
    ],
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
    images: [
      {
        src: '/images/image-087-012417-5548-ocwsdh.jpg',
        alt: 'Furnished lounge area with a leather sofa and wooden shelving inside an Exhibit On Superior residence',
        caption: 'The goal of every checklist item: a settled, unpacked space like this Exhibit On Superior lounge.',
      },
      {
        src: '/images/image-030-012417-5663-hxwee6.jpg',
        alt: 'Apartment kitchen and dining area with stainless appliances and a four-seat table at Exhibit On Superior',
        caption: 'An Exhibit On Superior kitchen and dining area, ready for the first grocery run.',
      },
    ],
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
    images: [
      {
        src: '/images/image-082-bt7b3562-adimkf.jpg',
        alt: 'River North street corner at dusk with high-rise apartments above street-level restaurants',
        caption: 'River North\u2019s street life\u2014restaurants and bars at the base of residential towers.',
      },
      {
        src: '/images/image-055-dji-20230620092832-0149-d-yrh5eg.jpg',
        alt: 'Aerial view of Exhibit On Superior\u2019s outdoor pool, sundeck, and the tree-lined street below',
        caption: 'Exhibit On Superior\u2019s pool and sundeck from above, in the middle of River North\u2019s low-slung blocks.',
      },
    ],
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

  // ---------------------------------------------------------------------
  // CLUSTER — river north commute to the loop
  // ---------------------------------------------------------------------
  {
    slug: 'river-north-commute-guide',
    title: 'The River North Commute Guide: L Lines, Buses, and Airports',
    metaTitle: 'River North Commute Guide',
    targetQuery: 'river north commute to the loop',
    role: 'cluster',
    pillar: 'living-in-river-north-chicago',
    authorId: 'leasing-team',
    summary:
      'From 165 W Superior St, our leasing team\u2019s practical Loop plan is the Brown or Purple Line from Chicago & Franklin, with an approximate 10-minute L ride, or a walk down Wells St of about 20 minutes. This guide also outlines nearby rail, bus, bike, car, and airport options.',
    images: [
      {
        src: '/images/image-081-20170926-1450-wmbiod.jpg',
        alt: 'Downtown Chicago skyline with high-rise towers under an evening sky',
        caption: 'The Loop\u2019s towers sit just south of River North, keeping most commutes short.',
      },
      {
        src: '/images/image-055-dji-20230620092832-0149-d-yrh5eg.jpg',
        alt: 'Aerial view of Exhibit On Superior\u2019s outdoor pool, sundeck, and the tree-lined street below',
        caption: 'Superior Street from above\u2014quiet enough to live on, close enough to walk downtown.',
      },
    ],
    sections: [
      {
        heading: 'A practical commute from River North to the Loop',
        paragraphs: [
          'For a River North commute to the Loop, we recommend starting with Chicago station at Chicago Ave and Franklin St. The Brown and Purple Lines are about 2 blocks from Exhibit On Superior, or an approximate 3-minute walk. From Chicago & Franklin, the Loop is one stop away on the Brown or Purple Line, with an approximate 10-minute L trip.',
          'Walking is another straightforward car-free option when it fits your schedule. The route down Wells St is an approximate 20-minute walk, or about 1 mile. Our leasing team recommends checking CTA schedules before leaving when you plan to take the Brown or Purple Line.',
        ],
      },
      {
        heading: 'Nearby rail and bus options',
        paragraphs: [
          'Chicago/State station on the Red Line is at Chicago Ave and State St, about 0.3 miles from the community or an approximate 7-minute walk. This gives residents another rail starting point in addition to the Brown and Purple Lines at Chicago & Franklin.',
          'For bus travel, the #66 Chicago Ave bus stops along Chicago Ave, one block north of the property. The stop is about 1 block away, or an approximate 2-minute walk. When selecting a route, our leasing team recommends comparing the nearby rail station and Chicago Ave bus option with your specific destination and departure time.',
        ],
        list: [
          'Chicago station \u2014 Brown & Purple Lines: Chicago Ave & Franklin St, about 2 blocks or an approximate 3-minute walk',
          'Chicago/State station \u2014 Red Line: Chicago Ave & State St, about 0.3 miles or an approximate 7-minute walk',
          '#66 Chicago Ave bus: along Chicago Ave, about 1 block or an approximate 2-minute walk',
        ],
      },
      {
        heading: 'Car-free and bike-ready planning',
        paragraphs: [
          'The address has a 99/100 Walk Score, described as \u201cWalker\u2019s Paradise,\u201d a 100/100 Transit Score, described as \u201cRider\u2019s Paradise,\u201d and an 86/100 Bike Score, described as \u201cVery Bikeable.\u201d For residents building a car-free routine, the nearby Brown, Purple, and Red Lines, the #66 Chicago Ave bus, and the walk to the Loop provide several starting points.',
          'Residents who bike can use complimentary bike storage on the ground floor at Exhibit On Superior. We recommend planning a bike trip around your own destination and comfort level, then using the available storage as part of your arrival and departure routine. For more location details, see the map and directions page and the parking and transportation guide linked below.',
        ],
      },
      {
        heading: 'Airport trips by rail or car',
        paragraphs: [
          'For O\u2019Hare International Airport, the Blue Line is available from Grand station at Milwaukee & Halsted. The station is reached by a short ride or bus west. The approximate trip time is 45\u201355 minutes by L or 30\u201345 minutes by car via I-90 W. Our leasing team recommends allowing your own additional time for the connection to Grand station and for your airport plans.',
          'For Midway International Airport, take the Orange Line from the Loop with a Brown or Purple Line transfer. The approximate trip time is 45\u201355 minutes by L or 25\u201340 minutes by car. These are approximate commute-table times, so we recommend reviewing CTA schedules when planning a rail trip.',
        ],
      },
      {
        heading: 'Parking and neighborhood trip planning',
        paragraphs: [
          'Residents who plan to drive may apply for unreserved garage parking, subject to availability, at $335 per space monthly. The community also offers on-site storage locker rental for $25 monthly. Our leasing team can help direct prospective residents to current parking and transportation information.',
          'Whether you are walking to the Loop, taking an L line, using the #66 Chicago Ave bus, biking, or planning an airport trip, begin with the option that matches your destination. Our River North neighborhood guide, linked below, can help you orient your daily plans around the community\u2019s location and quick access to downtown neighborhoods.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the River North commute to the Loop from Exhibit On Superior?',
        answer:
          'From 165 W Superior St, take the Brown or Purple Line from Chicago & Franklin. The Loop is one stop away, with an approximate 10-minute L trip. Walking down Wells St is an approximate 20-minute walk, or about 1 mile.',
      },
      {
        question: 'What CTA stations are closest to 165 W Superior St?',
        answer:
          'Chicago station for the Brown and Purple Lines is at Chicago Ave and Franklin St, about 2 blocks or an approximate 3-minute walk. Chicago/State station for the Red Line is at Chicago Ave and State St, about 0.3 miles or an approximate 7-minute walk.',
      },
      {
        question: 'How can I get to O\u2019Hare or Midway from River North?',
        answer:
          'For O\u2019Hare, use the Blue Line from Grand station at Milwaukee & Halsted after a short ride or bus west; the approximate L trip is 45\u201355 minutes. For Midway, transfer from the Brown or Purple Line in the Loop to the Orange Line; the approximate L trip is 45\u201355 minutes.',
      },
    ],
    related: ['living-in-river-north-chicago', 'moving-to-river-north-chicago-checklist'],
    links: [
      { label: 'map and directions information', href: '/map-directions' },
      { label: 'parking and transportation guide', href: '/parking-transportation' },
      { label: 'River North neighborhood guide', href: '/neighborhood' },
    ],
    sources: [
      {
        label: 'Walk Score for 165 W Superior St',
        href: 'https://www.walkscore.com/score/165-w-superior-st-chicago-il-60654',
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

  // ---------------------------------------------------------------------
  // CLUSTER — river north dog friendly apartments
  // AI DRAFT — awaiting human review. To publish, ALL THREE edits are
  // required (guard tests fail if any is missed):
  //   1. remove `draft: true` below
  //   2. add 'river-north-with-a-dog' to the related: list of the
  //      'living-in-river-north-chicago' article above (inbound-link guard)
  //   3. add the /blog/river-north-with-a-dog rewrite pair in artifact.toml
  // ---------------------------------------------------------------------
  {
    slug: 'river-north-with-a-dog',
    title: 'Living in River North with a Dog: A Practical Guide',
    metaTitle: 'River North Dog-Friendly Apartments',
    targetQuery: 'river north dog friendly apartments',
    role: 'cluster',
    pillar: 'living-in-river-north-chicago',
    authorId: 'rebbekah-hallberg',
    summary:
      'River North dog-friendly apartment searching should pair neighborhood routines with clear building policies. At Exhibit On Superior, we welcome cats and dogs, offer a dog spa and outdoor walk, and charge a one-time dog fee with no monthly pet rent. Our leasing team can help you confirm the details before touring.',
    images: [
      {
        src: '/images/image-080-gettyimages-1386939001-lrrzhc.jpg',
        alt: 'Renter walking a golden retriever on a leash along a city sidewalk',
        caption: 'Daily leash walks are easy on River North\u2019s flat, walkable blocks.',
      },
    ],
    sections: [
      {
        heading: 'Start with the building\u2019s pet policy',
        paragraphs: [
          'As property manager, I encourage renters searching for River North dog-friendly apartments to begin with the details that shape everyday life. At Exhibit On Superior, cats and dogs are welcome, and the community offers a dog spa and outdoor walk. The amenity collection also includes private park access, so our leasing team can clarify how that access works for your household and pet.',
          'We have a two-dog maximum, and the pet-friendly policy has no weight limits. Because a dog\u2019s routine is personal, we recommend discussing your specific needs with our leasing team rather than making assumptions based on a listing description.',
        ],
        list: [
          'Dogs: $650 one-time fee for one dog or $750 one-time fee for two dogs',
          'No pet deposit and no monthly pet rent',
          'Cats: $325 one-time fee, with a two-cat maximum',
        ],
      },
      {
        heading: 'Plan a practical high-rise dog routine',
        paragraphs: [
          'High-rise living works best when the dog\u2019s walk schedule is part of the household schedule. Our leasing team recommends identifying your preferred departure times, keeping walk supplies organized near your door, and allowing enough time for the elevator trip before an outing. These small planning choices can make morning, midday, and evening routines easier to maintain.',
          'The dog spa can be useful after a walk, while the outdoor walk gives residents an on-site option to discuss during a tour. We recommend asking about the features that matter most to you and your dog, including access routes and the spaces you expect to use regularly.',
        ],
        list: [
          'Discuss your dog\u2019s daily routine during the tour',
          'Ask our leasing team about the dog spa and outdoor walk',
          'Confirm the current pet policy before submitting an application',
        ],
      },
      {
        heading: 'Use River North\u2019s walkable setting thoughtfully',
        paragraphs: [
          'Exhibit On Superior is at 165 W Superior St in Chicago\u2019s River North neighborhood. Walk Score rates the address 99/100 for walking, 100/100 for transit, and 86/100 for biking. For dog owners, our team recommends using that walkability as a reason to map your own preferred routes and everyday stops before choosing an apartment.',
          'We do not make specific claims about nearby dog parks or pet access at individual neighborhood businesses. Instead, we suggest taking a walking tour of the immediate area with your own priorities in mind, then asking our leasing team questions about the building\u2019s pet amenities and access points.',
        ],
        list: [
          'Walk Score: 99/100',
          'Transit Score: 100/100',
          'Bike Score: 86/100',
        ],
      },
      {
        heading: 'Choose a layout around your household routine',
        paragraphs: [
          'Exhibit On Superior has studio, convertible, one-, two-, and three-bedroom apartments. Apartment sizes range from about 448 to 1,528 square feet overall. Our leasing team recommends considering where you will keep food, supplies, towels, and any other dog-care items when comparing layouts.',
          'Studios are about 448\u2013484 square feet, convertibles and Jr. Convertibles are about 450\u2013554 square feet, and one-bedroom homes are about 619\u2013768 square feet. Two-bedroom homes range from about 767\u20131,135 square feet, while three-bedroom homes are about 1,455\u20131,528 square feet. During a tour, we can help you compare available homes with your household\u2019s setup in mind.',
        ],
        list: [
          'Studio: about 448\u2013484 sq ft',
          'Convertible / Jr. Convertible: about 450\u2013554 sq ft',
          '1 Bed: about 619\u2013768 sq ft',
          '2 Bed: about 767\u20131,135 sq ft',
          '3 Bed: about 1,455\u20131,528 sq ft',
        ],
      },
      {
        heading: 'Review application and move-in details early',
        paragraphs: [
          'Pet planning is only one part of the leasing process. Exhibit requires a minimum credit score of 700, or 600 with a qualified co-signer, and an approval decision is provided in 1\u20133 business days. Renters insurance is required with $300,000 liability-to-landlord coverage.',
          'The application fee is $60 per applicant, and the administration fee is $500 per apartment. Exhibit does not currently collect a security deposit. The monthly Utility & Service Amenity fee ranges from $95 to $195 by floor plan and covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Electricity is billed directly to the resident by ComEd.',
        ],
        list: [
          'Application fee: $60 per applicant, one-time',
          'Administration fee: $500 per apartment, one-time',
          'Security deposit: $0',
          'Utility & Service Amenity fee: $95\u2013$195 monthly by floor plan',
        ],
      },
    ],
    faqs: [
      {
        question: 'How much is the dog fee at Exhibit On Superior?',
        answer:
          'The one-time dog fee is $650 for one dog or $750 for two dogs. Exhibit has a two-dog maximum, and there is no pet deposit or monthly pet rent.',
      },
      {
        question: 'Are there weight limits for dogs?',
        answer:
          'No. Exhibit On Superior\u2019s pet-friendly policy has no weight limits for dogs. The community has a two-dog maximum, and our leasing team can confirm the current policy details before you apply.',
      },
      {
        question: 'How can I tour a dog-friendly apartment in River North?',
        answer:
          'You can send our leasing team a tour request through the schedule-a-tour page or book a specific apartment from Available Units. Our office hours are Monday\u2013Friday, 9:00 AM\u20136:00 PM, and Saturday, 10:00 AM\u20135:00 PM; the office is closed Sunday.',
      },
    ],
    related: ['living-in-river-north-chicago', 'moving-to-river-north-chicago-checklist'],
    links: [
      { label: 'Explore pet-friendly apartments at Exhibit On Superior', href: '/pet-friendly' },
      { label: 'Schedule a tour with our leasing team', href: '/schedule-a-tour' },
    ],
    sources: [
      {
        label: 'Walk Score for 165 W Superior St',
        href: 'https://www.walkscore.com/score/165-w-superior-st-chicago-il-60654',
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
  // PILLAR — how to rent an apartment in chicago
  // ---------------------------------------------------------------------
  {
    slug: 'how-to-rent-an-apartment-in-chicago',
    title: 'How to Rent an Apartment in Chicago: The Complete Guide',
    metaTitle: 'Rent an Apartment in Chicago',
    targetQuery: 'how to rent an apartment in chicago',
    role: 'pillar',
    pillar: 'how-to-rent-an-apartment-in-chicago',
    authorId: 'leasing-team',
    summary:
      'To rent an apartment in Chicago, narrow your preferred home, review the complete charges, tour, submit the building\u2019s online application, and plan utilities and insurance after approval. At Exhibit On Superior, our leasing team can explain the screening path, fees, available residences, and move-in questions for a River North lease.',
    images: [
      {
        src: '/images/image-014-exhibit-living-room-n5xrna.jpg',
        alt: 'Furnished Exhibit On Superior living room with floor-to-ceiling windows overlooking River North',
        caption: 'What the process ends with: a furnished Exhibit On Superior living room in River North.',
      },
      {
        src: '/images/image-030-012417-5663-hxwee6.jpg',
        alt: 'Apartment kitchen and dining area with stainless appliances and a four-seat table at Exhibit On Superior',
        caption: 'An Exhibit On Superior kitchen and dining area\u2014touring in person helps you judge spaces like this.',
      },
    ],
    sections: [
      {
        heading: 'Start by defining the home and location you need',
        paragraphs: [
          'Our leasing team recommends beginning with the apartment type, space, and daily access that matter most to you. At Exhibit On Superior, residences include studio, convertible, one-, two-, and three-bedroom apartments. Overall apartment sizes range from 448\u20131,528 sq ft, with individual floor-plan sizes varying by layout.',
          'Review current homes, photos, pricing, and move-in dates before deciding which layouts to tour. For a Chicago search, availability and lease details vary by building, so we recommend asking the leasing office about the specific residence you are considering.',
        ],
        list: [
          'Studios are about 448\u2013484 sq ft.',
          'Convertible and Jr. Convertible apartments are about 450\u2013554 sq ft.',
          'One-bedroom apartments are about 619\u2013768 sq ft.',
          'Two-bedroom apartments are about 767\u20131135 sq ft.',
          'Three-bedroom apartments are about 1455\u20131528 sq ft.',
        ],
      },
      {
        heading: 'Tour the apartment and ask lease-specific questions',
        paragraphs: [
          'A tour is the time to compare the particular residence with your needs and to ask our leasing team about the application path, move-in timing, amenity access, and any building-specific questions. Exhibit On Superior has a full-floor amenity deck, fitness center, pool, hot tub, lounges, work and meeting rooms, dog spa, private park access, and on-site retail and wellness options.',
          'We recommend reviewing the available-home details before your visit, then using the tour to confirm which features matter for your day-to-day routine. You can browse current residences through Available Units or send our team a tour request when you are ready.',
        ],
      },
      {
        heading: 'Review every upfront and monthly charge before applying',
        paragraphs: [
          'Before submitting an application, our leasing team recommends reading the charge list for the apartment you select. At Exhibit On Superior, the application fee is $60 per applicant and is shown on each unit\u2019s secure online application before payment. The administration fee is $500 per apartment and is refunded only if the application is denied.',
          'Exhibit does not currently collect a security deposit. The monthly Utility & Service Amenity fee is $95\u2013$195 by floor plan and covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Electricity is billed directly to the resident by ComEd.',
        ],
        list: [
          'Garage parking is $335 per space monthly, unreserved and subject to availability.',
          'On-site storage is $25 monthly for a storage locker rental.',
          'Dog fees are $650 for one dog or $750 for two dogs, with a two-dog maximum.',
          'The cat fee is $325, with a two-cat maximum.',
          'There is no pet deposit or monthly pet rent.',
        ],
      },
      {
        heading: 'Submit the application and plan for the decision',
        paragraphs: [
          'At Exhibit On Superior, the minimum credit score is 700, or 600 with a qualified co-signer. Our leasing team can clarify the application sequence and answer questions about your individual situation, while the approval decision is issued in 1\u20133 business days.',
          'After approval, review the lease materials and confirm your required renters insurance. Renters insurance is required with $300,000 liability-to-landlord coverage. Requirements at other Chicago buildings vary by building, so we recommend confirming screening, insurance, fees, and next steps directly with that leasing office.',
        ],
      },
      {
        heading: 'Prepare utilities, transportation, and move-in logistics',
        paragraphs: [
          'For an Exhibit lease, plan for the utility items that are separate from the monthly Utility & Service Amenity fee. ComEd provides information for starting, stopping, or moving electric service. Exhibit also has complimentary bike storage on the ground floor.',
          `If walkability or transit access is part of your Chicago rental decision, per Walk Score, 165 W Superior St rates ${WALK_SCORE_PHRASE}, ${TRANSIT_SCORE_PHRASE}, and ${BIKE_SCORE_PHRASE}. CTA schedules can help you check current train planning; the Chicago station for the Brown and Purple Lines is at Chicago Ave and Franklin St, and the Chicago/State station for the Red Line is at Chicago Ave and State St.`,
        ],
      },
    ],
    faqs: [
      {
        question: 'How long does approval take at Exhibit On Superior?',
        answer:
          'At Exhibit On Superior, the approval decision is issued in 1\u20133 business days. Our leasing team can answer questions about the application sequence for the residence you select.',
      },
      {
        question: 'What credit score is required to rent at Exhibit On Superior?',
        answer:
          'Exhibit On Superior requires a minimum credit score of 700, or 600 with a qualified co-signer. Ask our leasing team if you need clarification about your application path.',
      },
      {
        question: 'What utilities are included in the monthly Utility & Service Amenity fee?',
        answer:
          'The monthly Utility & Service Amenity fee covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. The fee is $95\u2013$195 by floor plan, while electricity is billed directly to the resident by ComEd.',
      },
    ],
    related: [
      'moving-to-river-north-chicago-checklist',
      'river-north-commute-guide',
      'chicago-apartment-application-documents',
      'first-apartment-chicago-guide',
      'chicago-move-in-costs-explained',
      'chicago-renters-insurance-basics',
    ],
    links: [
      { label: 'Browse available apartments', href: '/available-units' },
      { label: 'Review leasing fees and charges', href: '/fees' },
      { label: 'Schedule a tour with our leasing team', href: '/schedule-a-tour' },
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
    ogCard: 'application-guide',
    published: '2026-08-13',
    updated: '2026-08-13',
  },

  // ---------------------------------------------------------------------
  // CLUSTER — documents needed to rent an apartment chicago
  // ---------------------------------------------------------------------
  {
    slug: 'chicago-apartment-application-documents',
    title: 'What You Need to Apply for a Chicago Apartment',
    metaTitle: 'Chicago Apartment Application Documents',
    targetQuery: 'documents needed to rent an apartment chicago',
    role: 'cluster',
    pillar: 'how-to-rent-an-apartment-in-chicago',
    authorId: 'leasing-team',
    summary:
      'Documents needed to rent an apartment in Chicago vary by building. Our leasing team recommends confirming identification, income or credit-review materials, and renters-insurance requirements before applying. At Exhibit On Superior, applicants need a minimum credit score of 700, or 600 with a qualified co-signer, plus required renters insurance.',
    images: [
      {
        src: '/images/image-087-012417-5548-ocwsdh.jpg',
        alt: 'Furnished lounge area with a leather sofa and wooden shelving inside an Exhibit On Superior residence',
        caption: 'Paperwork first, then this: a furnished lounge inside an Exhibit On Superior residence.',
      },
      {
        src: '/images/image-004-012417-5732-pu4fo5.jpg',
        alt: 'Reading nook with a lounge chair beside a colorful tile wall and a window facing city rooftops',
        caption: 'A reading nook at Exhibit On Superior\u2014approval moves fastest when your documents are ready up front.',
      },
    ],
    sections: [
      {
        heading: 'Start with the building\u2019s application checklist',
        paragraphs: [
          'There is no single document list that applies to every Chicago apartment. Identification standards, income documentation, credit-review materials, co-signer rules, and insurance timing vary by building. Before submitting an application, our leasing team recommends asking the property which documents it needs and whether it has a preferred format for each item.',
          'At Exhibit On Superior, the application is completed through a secure online application for the selected apartment. The application fee is shown on each unit\u2019s secure online application before payment. You can begin by reviewing available residences and selecting the home you would like to apply for.',
        ],
        list: [
          'Confirm the identification documentation requested by the building.',
          'Ask which materials are needed for its credit and income review.',
          'Ask whether a co-signer is available if you do not meet the building\u2019s direct approval criteria.',
          'Confirm when renters-insurance information is required and what liability coverage the building requires.',
        ],
      },
      {
        heading: 'Understand Exhibit\u2019s credit and co-signer path',
        paragraphs: [
          'For Exhibit On Superior, the minimum credit score is 700. Applicants with a credit score of 600 may qualify with a qualified co-signer. Whether another building accepts a co-signer, and what it considers qualified, varies by building.',
          'Our leasing team recommends discussing the co-signer path before you submit an application if you expect to use one. That gives you an opportunity to confirm the building\u2019s current requirements and understand what information the co-signer may need to provide.',
        ],
        list: [
          'Minimum credit score: 700.',
          'Credit score with a qualified co-signer: 600.',
          'Approval decision: 1\u20133 business days.',
        ],
      },
      {
        heading: 'Plan for application and lease-related charges',
        paragraphs: [
          'Knowing the charges connected with an application can help you prepare before you apply. At Exhibit, the application fee is $60 per applicant and is one-time. The administration fee is $500 per apartment and is one-time; it is non-refundable and refunded only if the application is denied.',
          'Exhibit does not currently collect a security deposit. Other charges may apply depending on your apartment selection and services. Our leasing team recommends reviewing the full fee information alongside your chosen floor plan before moving forward.',
        ],
        list: [
          'Application fee: $60 per applicant, one-time.',
          'Administration fee: $500 per apartment, one-time.',
          'Security deposit: $0.',
          'Utility & Service Amenity fee: $95\u2013$195 by floor plan, monthly.',
        ],
      },
      {
        heading: 'Arrange renters insurance before move-in',
        paragraphs: [
          'At Exhibit, renters insurance is required with $300,000 liability-to-landlord coverage. Our leasing team recommends confirming your policy meets that requirement before move-in and asking us where to provide the insurance information.',
          'The monthly Utility & Service Amenity fee covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Electricity is billed directly to the resident by ComEd. Residents can use ComEd\u2019s move-service resources when arranging electric service.',
        ],
        list: [
          'Required liability-to-landlord coverage: $300,000.',
          'Electricity: billed directly to the resident by ComEd.',
          'Covered through the Utility & Service Amenity fee: water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer.',
        ],
      },
      {
        heading: 'Choose an apartment, then confirm the current requirements',
        paragraphs: [
          'Exhibit On Superior is at 165 W Superior St in Chicago\u2019s River North neighborhood and offers studio, convertible, one-, two-, and three-bedroom apartments. The applicable monthly Utility & Service Amenity fee depends on the floor plan, from $95 for studios to $195 for three-bedrooms.',
          'Requirements and availability can change, so our leasing team recommends choosing an available apartment first, then contacting us to confirm the current application checklist, co-signer process, and renters-insurance submission steps. A tour request is also a practical time to ask application questions before you apply.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What documents do I need to rent an apartment in Chicago?',
        answer:
          'Document requirements vary by building. Our leasing team recommends confirming the building\u2019s requested identification, credit or income-review materials, co-signer documentation if applicable, and renters-insurance requirements before applying.',
      },
      {
        question: 'What credit score do I need to apply at Exhibit On Superior?',
        answer:
          'Exhibit requires a minimum credit score of 700. Applicants with a credit score of 600 may qualify with a qualified co-signer. Approval decisions are made in 1\u20133 business days.',
      },
      {
        question: 'Is renters insurance required at Exhibit On Superior?',
        answer:
          'Yes. Renters insurance is required at Exhibit with $300,000 liability-to-landlord coverage. Our leasing team can help confirm the required submission steps before move-in.',
      },
    ],
    related: ['how-to-rent-an-apartment-in-chicago', 'moving-to-river-north-chicago-checklist'],
    links: [
      { label: 'Browse available apartments and move-in dates', href: '/available-units' },
      { label: 'Review Exhibit On Superior fees', href: '/fees' },
      { label: 'Schedule a tour and ask our leasing team questions', href: '/schedule-a-tour' },
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
  // CLUSTER — apartment move in costs chicago
  // AI DRAFT — awaiting human review. To publish, ALL THREE edits are
  // required (guard tests fail if any is missed):
  //   1. remove `draft: true` below
  //   2. add 'chicago-move-in-costs-explained' to the related: list of the
  //      'how-to-rent-an-apartment-in-chicago' article above (inbound-link guard)
  //   3. add the /blog/chicago-move-in-costs-explained rewrite pair in artifact.toml
  // ---------------------------------------------------------------------
  {
    slug: 'chicago-move-in-costs-explained',
    title: 'Move-In Costs in Chicago: What Renters Actually Pay',
    metaTitle: 'Chicago Apartment Move-In Costs',
    targetQuery: 'apartment move in costs chicago',
    role: 'cluster',
    pillar: 'how-to-rent-an-apartment-in-chicago',
    authorId: 'leasing-team',
    summary:
      'At Exhibit On Superior, upfront leasing costs include a $60 application fee per applicant and a $500 non-refundable administration fee per apartment, unless an application is denied. There is currently no security deposit. Monthly costs can include the Utility & Service Amenity fee, electricity, and selected optional services.',
    images: [
      {
        src: '/images/image-004-012417-5732-pu4fo5.jpg',
        alt: 'Reading nook with a lounge chair beside a colorful tile wall and a window facing city rooftops',
        caption: 'Budgeting up front means fewer surprises once you\u2019re settled into spaces like this Exhibit On Superior nook.',
      },
      {
        src: '/images/image-003-gettyimages-1216663469-cc9uxz.jpg',
        alt: 'Bedroom with white bedding, a wooden side stool, and houseplants',
        caption: 'Furniture and setup costs are part of the real move-in math, not just the fees on the ledger.',
      },
    ],
    sections: [
      {
        heading: 'Start by separating upfront and monthly costs',
        paragraphs: [
          'When renters ask our leasing team about apartment move-in costs in Chicago, we recommend separating charges due during the application process from recurring monthly charges. This makes it easier to compare a building\u2019s fee schedule with the apartment\u2019s live rent and with the services a household plans to use.',
          'At Exhibit On Superior, the application fee is $60 per applicant and is shown on each unit\u2019s secure online application before payment. The administration fee is $500 per apartment, is non-refundable, and is refunded only if the application is denied. For current apartment availability, pricing, photos, and move-in dates, renters can browse our available apartments.',
        ],
      },
      {
        heading: 'What \u201cno security deposit\u201d means at Exhibit',
        paragraphs: [
          'Exhibit does not currently collect a security deposit: the listed security deposit is $0. That does not mean there are no upfront charges. Applicants should still plan for the application fee and administration fee, along with any selected one-time pet fee.',
          'Our leasing team recommends asking each building whether it uses a deposit, a non-refundable administrative charge, or another model. Policies vary by building, so renters should review the fee schedule and application terms for the specific apartment they are considering. At Exhibit, the administration fee and security deposit are separate line items, with different terms.',
        ],
      },
      {
        heading: 'An itemized Exhibit move-in example',
        paragraphs: [
          'Here is a practical example for a one-bedroom applicant at Exhibit. The initial application-stage charges are the $60 application fee per applicant and the $500 administration fee per apartment. The security-deposit line is $0 because Exhibit does not currently collect a security deposit.',
          'For that one-bedroom residence, the recurring Utility & Service Amenity fee is $115 monthly. It covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Electricity is billed directly to the resident by ComEd. Renters can review ComEd\u2019s guidance for starting, stopping, or moving electric service before move-in.',
          'Optional choices can change the picture. Garage parking is $335 per space monthly, subject to availability, and an on-site storage locker is $25 monthly. A dog has a one-time fee of $650 for one or $750 for two; a cat has a $325 one-time fee. There is no pet deposit or monthly pet rent at Exhibit.',
        ],
        list: [
          'Application fee: $60 per applicant, one-time',
          'Administration fee: $500 per apartment, one-time',
          'Security deposit: $0',
          'One-bedroom Utility & Service Amenity fee: $115 monthly',
          'Electricity: billed directly to the resident by ComEd',
        ],
      },
      {
        heading: 'Match the utility fee to the floor plan',
        paragraphs: [
          'The Utility & Service Amenity fee is not a single building-wide amount. It ranges from $95 to $195 monthly by floor plan. Studios and Jr. Convertibles are $95, Convertibles are $105, and one-bedrooms are $115.',
          'For larger layouts, the fee is $125 for a two-bedroom or one-bath, $150 for a two-bedroom or two-bath, $165 for a two-bedroom plus den, and $195 for a three-bedroom or three-bath. We recommend that renters identify the exact floor plan first, then use the matching tier when planning monthly costs.',
        ],
        list: [
          'Studio: $95',
          'Jr. Convertible: $95',
          'Convertible: $105',
          '1 Bedroom: $115',
          '2 Bedroom / 1 Bath: $125',
          '2 Bedroom / 2 Bath: $150',
          '2 Bedroom + Den: $165',
          '3 Bedroom / 3 Bath: $195',
        ],
      },
      {
        heading: 'Build a move-in checklist before applying',
        paragraphs: [
          'Before submitting an application, our leasing team recommends reviewing the complete fee schedule, deciding whether parking, storage, or pets apply, and arranging renters insurance. Renters insurance is required with $300,000 liability-to-landlord coverage.',
          'Applicants should also plan around the screening process. The minimum credit score is 700, or 600 with a qualified co-signer, and an approval decision is provided in 1\u20133 business days. Confirming these details before applying can help renters understand which charges are one-time, which are monthly, and which are optional for their household. Renters who want to discuss the checklist with our team can schedule a tour.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does no security deposit mean there are no move-in costs?',
        answer:
          'No. At Exhibit On Superior, the security deposit is $0, but the application fee is $60 per applicant and the administration fee is $500 per apartment. Optional pet fees may also apply.',
      },
      {
        question: 'Which utilities are included in the monthly Utility & Service Amenity fee?',
        answer:
          'The $95\u2013$195 monthly Utility & Service Amenity fee covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Electricity is billed directly to the resident by ComEd.',
      },
      {
        question: 'How long does an Exhibit application decision take?',
        answer:
          'An approval decision is provided in 1\u20133 business days. The minimum credit score is 700, or 600 with a qualified co-signer, and renters insurance with $300,000 liability-to-landlord coverage is required.',
      },
    ],
    related: ['how-to-rent-an-apartment-in-chicago', 'chicago-apartment-application-documents'],
    links: [
      { label: 'Browse available apartments and move-in dates', href: '/available-units' },
      { label: 'Compare floor plans and monthly fee tiers', href: '/floor-plans' },
      { label: 'Review Exhibit On Superior fees', href: '/fees' },
      { label: 'Schedule a tour with the leasing team', href: '/schedule-a-tour' },
    ],
    sources: [
      {
        label: 'ComEd \u2014 start, stop, or move electric service',
        href: 'https://www.comed.com/my-account/customer-support/start-stop-move',
      },
    ],
    ogCard: 'application-guide',
    published: '2026-08-13',
    updated: '2026-08-24',
  },

  // ---------------------------------------------------------------------
  // CLUSTER — first apartment chicago tips
  // AI DRAFT — awaiting human review. To publish, ALL THREE edits are
  // required (guard tests fail if any is missed):
  //   1. remove `draft: true` below
  //   2. add 'first-apartment-chicago-guide' to the related: list of the
  //      'how-to-rent-an-apartment-in-chicago' article above (inbound-link guard)
  //   3. add the /blog/first-apartment-chicago-guide rewrite pair in artifact.toml
  // ---------------------------------------------------------------------
  {
    slug: 'first-apartment-chicago-guide',
    title: 'Renting Your First Chicago Apartment: A No-Surprises Guide',
    metaTitle: 'First Chicago Apartment Guide',
    targetQuery: 'first apartment chicago tips',
    role: 'cluster',
    pillar: 'how-to-rent-an-apartment-in-chicago',
    authorId: 'leasing-team',
    summary:
      'Renting a first Chicago apartment is easier when you separate the tour, application, lease, move-in costs, and utility setup into clear steps. Our leasing team recommends asking direct questions early, reviewing every charge before applying, and confirming insurance and electricity responsibilities before your move.',
    images: [
      {
        src: '/images/image-030-012417-5663-hxwee6.jpg',
        alt: 'Apartment kitchen and dining area with stainless appliances and a four-seat table at Exhibit On Superior',
        caption: 'A first apartment worth the paperwork: an Exhibit On Superior kitchen and dining area.',
      },
      {
        src: '/images/image-003-gettyimages-1216663469-cc9uxz.jpg',
        alt: 'Bedroom with white bedding, a wooden side stool, and houseplants',
        caption: 'Start simple\u2014a bed, a lamp, and a plant go a long way in a first apartment.',
      },
    ],
    sections: [
      {
        heading: 'Start with a tour and a practical question list',
        paragraphs: [
          'For first-time renters, our leasing team recommends using a tour to understand both the apartment and the steps that follow. At Exhibit On Superior, you can send our team a tour request or book a specific apartment from the available units. During the visit, ask which home you are viewing, what is included in the monthly Utility & Service Amenity fee, and which costs are optional.',
          'Exhibit On Superior is at 165 W Superior St in River North and has studio, convertible, one-, two-, and three-bedroom apartments. Available home sizes range from about 448\u20131,528 sq ft, so we recommend comparing the floor plan that fits your day-to-day needs rather than choosing based on bedroom count alone.',
        ],
        list: [
          'Ask us to explain the application and approval steps.',
          'Ask which fees apply to the apartment you select.',
          'Ask about parking, storage, bike storage, and pet options if they matter to your move.',
          'Use our tour page to schedule a tour or request follow-up from the leasing team.',
        ],
      },
      {
        heading: 'Understand the application and co-signer route',
        paragraphs: [
          'Before applying, our leasing team recommends reviewing the screening standard and having your questions ready. Exhibit On Superior requires a minimum credit score of 700, or 600 with a qualified co-signer. An approval decision is made in 1\u20133 business days.',
          'A co-signer can be a useful path for a renter with a thinner credit file when the stated credit threshold is not met independently. Because qualification details matter, contact our leasing office before applying to discuss whether a co-signer may be appropriate for your situation. The $60 application fee is charged per applicant and is shown on each unit\u2019s secure online application before payment.',
        ],
        list: [
          'Minimum credit score: 700.',
          'Minimum credit score with a qualified co-signer: 600.',
          'Application fee: $60 per applicant, one-time.',
          'Administration fee: $500 per apartment, one-time; it is non-refundable and refunded only if the application is denied.',
        ],
      },
      {
        heading: 'Read the lease alongside the full cost list',
        paragraphs: [
          'A lease is the document to read slowly before you commit. Our leasing team recommends asking us to identify the charges connected to your selected apartment and any services you want to add. At Exhibit On Superior, the administration fee is $500 per apartment, and we do not currently collect a security deposit.',
          'The monthly Utility & Service Amenity fee covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. It is $95 for studios and ranges up to $195 for three-bedrooms. Electricity is billed directly to the resident by ComEd, so plan to arrange electric service as part of your move-in preparation.',
        ],
        list: [
          'Garage parking: $335 per space monthly, unreserved and subject to availability.',
          'On-site storage: $25 monthly.',
          'Complimentary bike storage is available on the ground floor.',
          'Review our detailed leasing costs and charges before you apply.',
        ],
      },
      {
        heading: 'Set up renters insurance before move-in',
        paragraphs: [
          'Renters insurance is required at Exhibit On Superior with $300,000 liability-to-landlord coverage. Our leasing team recommends confirming that your selected policy meets this requirement before move-in and keeping the policy information available if we request it.',
          'Insurance questions can feel technical on a first lease, so it is reasonable to ask what documentation we need from you. We can explain the property\u2019s coverage requirement, while your insurance provider can address policy terms and what the policy covers. Confirm the requirement early rather than leaving it until the last stage of your move.',
        ],
        list: [
          'Required liability-to-landlord coverage: $300,000.',
          'Confirm your insurance documentation with the leasing office before move-in.',
          'Plan for electricity to be billed directly to you by ComEd.',
        ],
      },
      {
        heading: 'Build a move-in checklist around your own timeline',
        paragraphs: [
          'Our leasing team recommends organizing your move in the same order as the rental process: tour, apply, review costs, complete lease requirements, secure insurance, and start electricity service. That approach helps first-time renters see what still needs attention without assuming that every step happens at once.',
          'For an in-person conversation, our office hours are Monday\u2013Friday, 9:00 AM\u20136:00 PM, and Saturday, 10:00 AM\u20135:00 PM. The office is closed Sunday. If you are comparing neighborhoods or timing a move, use the published renter guides below alongside a conversation with our on-site leasing team.',
        ],
        list: [
          'Schedule your apartment visit.',
          'Review the applicable fees before submitting an application.',
          'Ask about a qualified co-signer if needed.',
          'Confirm renters insurance and ComEd electricity service before move-in.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What credit score do I need to rent at Exhibit On Superior?',
        answer:
          'The minimum credit score is 700. A renter with a qualified co-signer may qualify with a credit score of 600. Contact our leasing office to discuss co-signer qualification questions before applying.',
      },
      {
        question: 'Does Exhibit On Superior require a security deposit?',
        answer:
          'No. Exhibit On Superior does not currently collect a security deposit. The administration fee is $500 per apartment, is one-time and non-refundable, and is refunded only if the application is denied.',
      },
      {
        question: 'Which utilities are included in the monthly fee?',
        answer:
          'The monthly Utility & Service Amenity fee covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Electricity is billed directly to the resident by ComEd.',
      },
    ],
    related: ['how-to-rent-an-apartment-in-chicago', 'chicago-apartment-application-documents'],
    links: [
      { label: 'Schedule a tour with our leasing team', href: '/schedule-a-tour' },
      { label: 'Review Exhibit On Superior leasing fees', href: '/fees' },
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
  // CLUSTER — renters insurance requirements chicago apartment
  // ---------------------------------------------------------------------
  {
    slug: 'chicago-renters-insurance-basics',
    title: 'Renters Insurance in Chicago: What Buildings Require and Why',
    metaTitle: 'Chicago Renters Insurance Requirements',
    targetQuery: 'renters insurance requirements chicago apartment',
    role: 'cluster',
    pillar: 'how-to-rent-an-apartment-in-chicago',
    authorId: 'leasing-team',
    summary:
      'At Exhibit On Superior, renters insurance is required with $300,000 liability-to-landlord coverage. Before signing, our leasing team recommends confirming that your policy documentation shows this requirement and asking your insurer how it is listed. Review electricity setup separately, since residents are billed directly by ComEd.',
    images: [
      {
        src: '/images/image-003-gettyimages-1216663469-cc9uxz.jpg',
        alt: 'Bedroom with white bedding, a wooden side stool, and houseplants',
        caption: 'Renters insurance covers what\u2019s yours\u2014the bedding, electronics, and furniture inside the walls.',
      },
      {
        src: '/images/image-087-012417-5548-ocwsdh.jpg',
        alt: 'Furnished lounge area with a leather sofa and wooden shelving inside an Exhibit On Superior residence',
        caption: 'A policy protects everything you bring into a residence, like the furnishings in this Exhibit On Superior lounge.',
      },
    ],
    sections: [
      {
        heading: 'Exhibit\u2019s renters insurance requirement',
        paragraphs: [
          'At Exhibit On Superior, renters insurance is required as part of the leasing requirements. The specific standard is $300,000 liability-to-landlord coverage. We recommend treating that amount and coverage description as a checklist item early in your apartment search, rather than waiting until the rest of your move details are in place.',
          'This is a property-specific requirement. Renters comparing Chicago apartments should not assume every building requests the same amount or uses the same coverage language; requirements vary by building. Our leasing team can confirm Exhibit\u2019s current requirement and answer property-specific questions before you finalize your leasing steps.',
        ],
      },
      {
        heading: 'Liability-to-landlord vs. renters insurance: two different protections',
        paragraphs: [
          'Liability-to-landlord insurance (LLI) and renters insurance protect different things, and it helps to keep them separate on your checklist. LLI protects the apartment and the building itself: if a renter-caused accident \u2014 such as a kitchen fire or an overflowing tub \u2014 damages the unit or the property, LLI is the coverage that responds to the landlord\u2019s loss.',
          'Renters insurance, in the everyday sense, protects you: your personal property (furniture, electronics, clothing), temporary relocation or displacement costs if the apartment becomes unlivable while repairs are made, and your personal liability beyond the building itself. A full renters policy typically includes liability coverage that can satisfy an LLI requirement, but the two are not the same thing \u2014 which is why we recommend verifying the documentation rather than the policy name.',
          'Leases at Exhibit On Superior require LLI coverage \u2014 the specific standard is $300,000 liability-to-landlord coverage. Residents who prefer not to shop for a policy can enroll in an LLI option directly through the resident portal, and residents who bring their own renters policy can ask their insurer to document the liability-to-landlord coverage it includes.',
        ],
        list: [
          'LLI: covers the unit and building when a renter-caused accident damages the property.',
          'Renters insurance: covers your personal property, temporary relocation or displacement costs, and your broader personal liability.',
          'Exhibit leases require $300,000 liability-to-landlord coverage; an LLI option is available through the resident portal.',
          'A personal renters policy is still worth considering even when LLI is handled through the portal \u2014 LLI alone does not cover your belongings.',
        ],
      },
      {
        heading: 'Keep insurance separate from lease fees and utilities',
        paragraphs: [
          'Renters insurance is a separate leasing requirement, so it should not be confused with Exhibit\u2019s listed application, administration, parking, storage, pet, or utility charges. Our committed fee table does not list a renters insurance premium. For a current view of the charges associated with leasing at Exhibit, review our fees page or contact our leasing team.',
          'The monthly Utility & Service Amenity fee covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. It ranges from $95 for studios to $195 for three-bedrooms. Electricity is billed directly to the resident by ComEd. For electric-service steps, residents can use ComEd\u2019s start, stop, or move service guidance.',
        ],
      },
      {
        heading: 'Questions to ask before you submit proof',
        paragraphs: [
          'Our leasing team recommends asking your insurer whether the policy documentation can show the $300,000 liability-to-landlord coverage requested by Exhibit. If the insurer uses different terms, bring that wording to us before assuming it meets the requirement.',
          'It is also useful to ask our team what documentation to provide and when it is needed in your leasing process. That keeps the insurance conversation focused on the actual Exhibit requirement instead of general advice that may apply differently at another building.',
        ],
      },
      {
        heading: 'Get confirmation from the on-site leasing team',
        paragraphs: [
          'Exhibit On Superior is located at 165 W Superior St in River North. Our on-site leasing team is available Monday\u2013Friday from 9:00 AM\u20136:00 PM and Saturday from 10:00 AM\u20135:00 PM; the office is closed Sunday.',
          'Use our contact page to request confirmation of the current renters insurance requirement, discuss documentation questions, or review other leasing details. We recommend obtaining that confirmation directly from the office if your insurer\u2019s wording does not clearly match the $300,000 liability-to-landlord coverage requirement.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is renters insurance required at Exhibit On Superior?',
        answer:
          'Yes. Exhibit On Superior requires renters insurance with $300,000 liability-to-landlord coverage.',
      },
      {
        question: 'What is the difference between liability-to-landlord insurance and renters insurance?',
        answer:
          'Liability-to-landlord insurance (LLI) covers the unit and building if a renter-caused accident damages the property. Renters insurance covers your side: personal property, temporary relocation or displacement costs, and broader personal liability. Exhibit leases require $300,000 LLI coverage; a renters policy protects your belongings on top of that.',
      },
      {
        question: 'Can I get liability-to-landlord coverage through Exhibit?',
        answer:
          'Yes. Residents can enroll in an LLI option directly through the resident portal, or bring their own policy that documents $300,000 liability-to-landlord coverage. Our leasing team can confirm which documentation is needed.',
      },
      {
        question: 'Does Exhibit set the price of renters insurance?',
        answer:
          'No renters insurance premium is listed in Exhibit\u2019s committed fee table. Ask your insurer about its policy options and documentation, and ask our leasing team to confirm the property requirement.',
      },
      {
        question: 'Are electricity charges included in Exhibit\u2019s Utility & Service Amenity fee?',
        answer:
          'No. The monthly Utility & Service Amenity fee covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Electricity is billed directly to the resident by ComEd.',
      },
    ],
    related: ['how-to-rent-an-apartment-in-chicago', 'chicago-apartment-application-documents'],
    links: [
      { label: 'Review leasing fees at Exhibit On Superior', href: '/fees' },
      { label: 'Contact the Exhibit On Superior leasing team', href: '/contact-us' },
    ],
    sources: [
      {
        label: 'ComEd \u2014 start, stop, or move electric service',
        href: 'https://www.comed.com/my-account/customer-support/start-stop-move',
      },
    ],
    ogCard: 'application-guide',
    published: '2026-08-30',
    updated: '2026-08-30',
  },

  // ---------------------------------------------------------------------
  // CLUSTER — how far in advance to look for apartments chicago
  // AI DRAFT — awaiting human review. To publish, ALL THREE edits are
  // required (guard tests fail if any is missed):
  //   1. remove `draft: true` below
  //   2. add 'when-to-start-apartment-hunting-chicago' to the related: list of the
  //      'how-to-rent-an-apartment-in-chicago' article above (inbound-link guard)
  //   3. add the /blog/when-to-start-apartment-hunting-chicago rewrite pair in artifact.toml
  // ---------------------------------------------------------------------
  {
    slug: 'when-to-start-apartment-hunting-chicago',
    title: 'When to Start Apartment Hunting in Chicago',
    metaTitle: 'When to Start Apartment Hunting',
    targetQuery: 'how far in advance to look for apartments chicago',
    role: 'cluster',
    pillar: 'how-to-rent-an-apartment-in-chicago',
    authorId: 'leasing-team',
    summary:
      'How far ahead should you look for an apartment in Chicago? Start when you know your move-in needs and can compare current homes. At Exhibit On Superior, approval decisions take 1\u20133 business days, so our leasing team recommends leaving time to tour, apply, arrange electricity, and meet insurance requirements before move-in.',
    sections: [
      {
        heading: 'When should you start looking for a Chicago apartment?',
        paragraphs: [
          'There is no single lead time that fits every renter or every building. Our leasing team recommends starting when you can clearly identify your intended move-in timing, apartment type, budget, and any needs that could affect your choice, such as parking, storage, or pet arrangements.',
          'For an apartment that is already available, build your plan around the home\u2019s listed move-in timing and leave room for a tour, an application, an approval decision, and your pre-move requirements. Starting with those concrete steps is more useful than relying on an unsupported seasonal rule.',
        ],
        list: [
          'Your target move-in date and how flexible it is.',
          'The apartment type and layout that fit your household.',
          'Your budget for rent, recurring charges, and one-time fees.',
          'Any parking, storage, or pet arrangements you may need.',
        ],
      },
      {
        heading: 'How should current availability shape your search?',
        paragraphs: [
          'Rather than relying on a generic Chicago timeline, we recommend reviewing current availability for your intended move-in. Available apartments, live pricing, and move-in dates are shown on our available-units page, giving you a practical starting point for comparing homes. Availability is the best place to begin because it reflects the residences that can actually be discussed now.',
          'When a home fits your needs, schedule a tour promptly. A tour is the right time to confirm the specific residence, ask about its move-in timing, and discuss any building-specific steps with our team. If your date is flexible, tell the leasing team what range works; if it is fixed, use that date to narrow the homes you consider.',
        ],
      },
      {
        heading: 'How much time should you allow for application approval?',
        paragraphs: [
          'At Exhibit On Superior, an approval decision takes 1\u20133 business days. Treat that window as one part of the move plan rather than the final task. Before submitting an application, confirm that you are ready to proceed with the apartment you selected and that you understand the applicable costs and requirements.',
          'Exhibit\u2019s screening example is a minimum credit score of 700, or 600 with a qualified co-signer. The application fee is $60 per applicant and is shown on each unit\u2019s secure online application before you pay. There is also a $500 administration fee per apartment; it is non-refundable and refunded only if the application is denied. Exhibit does not currently collect a security deposit.',
          'Allow time to read the application, gather your information, and respond to any questions from the leasing team before the 1\u20133 business-day decision window begins. If you are ready to see a specific home, schedule a tour with our on-site leasing team before applying.',
        ],
      },
      {
        heading: 'What should you arrange before move-in?',
        paragraphs: [
          'Renters insurance is required at Exhibit On Superior with $300,000 liability-to-landlord coverage. We recommend planning for that requirement before move-in so you can provide the needed coverage information at the appropriate point in your leasing process. Ask your insurer how the required coverage appears on the policy documents.',
          'The monthly Utility & Service Amenity fee covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. The fee ranges from $95 for studios to $195 for three-bedrooms, depending on floor plan. Electricity is billed directly to the resident by ComEd, so include electric-service setup among your pre-move tasks and confirm the start date for your home.',
        ],
      },
      {
        heading: 'What if you need parking, storage, or pet arrangements?',
        paragraphs: [
          'Ask about add-ons while you are evaluating an apartment, not after you have built your move-in plan. Garage parking is $335 per space monthly, is unreserved, and is subject to availability. On-site storage lockers are $25 monthly, and complimentary bike storage is available on the ground floor.',
          'Exhibit allows up to two dogs or two cats. The one-time dog fee is $650 for one dog or $750 for two dogs, and the one-time cat fee is $325. There is no pet deposit or monthly pet rent. Confirming these choices with our leasing team can help you organize the steps that apply to your household.',
          'For a broader process checklist, use the related renter guides below alongside a conversation with our on-site leasing team. The right search timeline is the one that leaves room to compare the home, complete the application, and finish the requirements that apply to you.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How far in advance should I look for an apartment in Chicago?',
        answer:
          'Start when you know your intended move-in needs and can compare current homes. At Exhibit On Superior, approval decisions take 1\u20133 business days, and you should also allow time for a tour, renters insurance, electricity setup, and any building-specific move-in steps.',
      },
      {
        question: 'Is one month enough time to find an apartment in Chicago?',
        answer:
          'It depends on your move-in date, apartment requirements, and the homes currently available. Our leasing team recommends starting once you can define those needs, then leaving time to tour, apply, allow 1\u20133 business days for an approval decision, and complete pre-move requirements.',
      },
      {
        question: 'How long does apartment approval take at Exhibit On Superior?',
        answer:
          'An approval decision at Exhibit On Superior takes 1\u20133 business days. Having your application information ready and understanding the applicable requirements before submitting can help you use that window effectively.',
      },
      {
        question: 'What should I have ready before applying for an apartment?',
        answer:
          'Be ready to identify the home you want, provide the information requested in the secure online application, and understand the applicable fees. Exhibit\u2019s screening example is a minimum credit score of 700, or 600 with a qualified co-signer, plus a $60 application fee per applicant.',
      },
      {
        question: 'Should I wait until closer to my move-in date to start looking?',
        answer:
          'Do not wait for a generic calendar milestone if you already know your move-in needs and a suitable home is available. Review current availability, schedule a tour, and ask the leasing team about the home\u2019s move-in timing so you can plan around the 1\u20133 business-day approval window.',
      },
      {
        question: 'What do I need to arrange before moving into Exhibit On Superior?',
        answer:
          'Renters insurance with $300,000 liability-to-landlord coverage is required. Electricity is billed directly to the resident by ComEd, while the monthly Utility & Service Amenity fee covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer.',
      },
    ],
    related: ['how-to-rent-an-apartment-in-chicago', 'chicago-apartment-application-documents'],
    links: [
      { label: 'Browse current available apartments', href: '/available-units' },
      { label: 'Schedule a tour with the leasing team', href: '/schedule-a-tour' },
    ],
    sources: [
      {
        label: 'ComEd \u2014 start, stop, or move electric service',
        href: 'https://www.comed.com/my-account/customer-support/start-stop-move',
      },
    ],
    ogCard: 'application-guide',
    published: '2026-08-24',
    updated: '2026-08-24',
    draft: true,
  },
];
