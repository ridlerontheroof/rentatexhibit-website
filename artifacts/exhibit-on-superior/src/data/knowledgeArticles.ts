// Knowledge Center article content. PURE DATA — types, helpers, and the head
// builder live in knowledge.ts.
//
// Authoring rules (enforced by src/data/knowledge.test.ts):
//   - `answer` must be UNDER 100 words and answer the question directly.
//   - Every fact must come from already-published site copy, live listing
//     data, or the leasing-approved questionnaire — no invented numbers,
//     hours, or policies. Facts still awaiting leasing-team confirmation use
//     honest "confirm with the leasing office" phrasing.
//   - `related` slugs must resolve to other articles; `links` hrefs must be
//     real site routes.
//   - Concrete facts over marketing phrasing ("75-foot lap pool, outdoor hot
//     tub, sauna" — never "resort-style amenities").
import type { KnowledgeArticle } from './knowledge';

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  // -------------------------------------------------------------------------
  // Pricing & Fees
  // -------------------------------------------------------------------------
  {
    slug: 'how-much-is-rent',
    question: 'How much is rent at Exhibit On Superior?',
    category: 'Pricing & Fees',
    answer:
      'Rent at Exhibit On Superior depends on the floor plan, floor, and move-in date, so there is no single number. Live pricing for every currently available apartment — studio through three-bedroom — is published on the Available Units page and synced automatically from the leasing system, with photos and move-in dates. For help matching a home to your budget, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        heading: 'Where to see live pricing',
        paragraphs: [
          'The Available Units page lists every residence currently available with live rent, photos, and move-in dates. Because pricing updates automatically from the leasing system, it is always the most accurate source rather than a static rent range.',
          'You can apply directly from any listing, or schedule a tour of a specific apartment before you decide.',
        ],
      },
    ],
    related: ['what-fees-in-addition-to-rent', 'total-move-in-cost', 'do-studios-exist'],
    links: [
      { label: 'Available Units', href: '/available-units' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Schedule a Tour', href: '/schedule-a-tour' },
    ],
  },
  {
    slug: 'what-fees-in-addition-to-rent',
    question: 'What fees does Exhibit On Superior charge in addition to rent?',
    category: 'Pricing & Fees',
    answer:
      'Beyond monthly rent, Exhibit On Superior charges a $60 application fee per applicant, a $500 non-refundable administration fee per apartment, and a monthly Utility & Service Amenity fee of $95–$195 depending on floor plan. There is no security deposit. Electricity is billed directly by ComEd. Garage parking is $335 per month and on-site storage is $25 per month, both optional and subject to availability.',
    sections: [
      {
        heading: 'One-time versus monthly',
        paragraphs: [
          'One-time charges are the $60 application fee (per applicant) and the $500 administration fee (per apartment). The administration fee is fully refunded if your application is denied, but retained if you choose to cancel.',
          'The recurring charge on top of rent is the Utility & Service Amenity fee of $95–$195 per month, set by floor plan. Electricity is separate and billed directly to you by ComEd.',
        ],
      },
    ],
    related: ['is-there-a-security-deposit', 'administration-fee', 'what-utility-fee-covers'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },
  {
    slug: 'is-there-a-security-deposit',
    question: 'Is there a security deposit at Exhibit On Superior?',
    category: 'Pricing & Fees',
    answer:
      'No. Exhibit On Superior does not currently collect a security deposit. In place of a deposit there is a $500 non-refundable administration fee per apartment, which is fully refunded if your application is denied but retained if you choose to cancel. For the current policy, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'Skipping a security deposit lowers the cash needed at move-in compared with buildings that collect a full month or more up front.',
          'You should still budget for the $60 application fee, the $500 administration fee, your first month of rent, and the monthly Utility & Service Amenity fee.',
        ],
      },
    ],
    related: ['administration-fee', 'what-fees-in-addition-to-rent', 'total-move-in-cost'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Application Guide', href: '/application-guide' },
    ],
  },
  {
    slug: 'application-fee',
    question: 'How much is the application fee at Exhibit On Superior?',
    category: 'Pricing & Fees',
    answer:
      'The application fee at Exhibit On Superior is $60 per applicant. Each available residence links to its own secure online application, and the fee is shown on the listing. To apply, open any home on the Available Units page and use its Apply Now button, or contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'The $60 fee is charged per applicant, so multiple adults each pay their own. It is separate from the $500 administration fee, which is charged once per apartment.',
          'Applications are processed through the AppFolio leasing system, and approval typically takes one to three business days.',
        ],
      },
    ],
    related: ['administration-fee', 'how-do-i-apply', 'total-move-in-cost'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Available Units', href: '/available-units' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
  },
  {
    slug: 'administration-fee',
    question: 'What is the administration fee at Exhibit On Superior?',
    category: 'Pricing & Fees',
    answer:
      'Exhibit On Superior charges a $500 non-refundable administration fee per apartment. The fee is fully refunded if your application is denied, but it is retained if you choose to cancel. It is separate from the $60 per-applicant application fee. For details, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        heading: 'When the fee is refunded',
        paragraphs: [
          'If the property denies your application, the $500 administration fee is returned in full. If you cancel after applying, the fee is retained.',
          'Because Exhibit does not collect a security deposit, this fee and the application fee are the main one-time charges beyond your first month of rent.',
        ],
      },
    ],
    related: ['application-fee', 'is-there-a-security-deposit', 'total-move-in-cost'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Application Guide', href: '/application-guide' },
    ],
  },
  {
    slug: 'move-in-specials',
    question: 'Does Exhibit On Superior offer move-in specials?',
    category: 'Pricing & Fees',
    answer:
      'Exhibit On Superior is not offering move-in concessions at this time. Current pricing for every available apartment appears on the Available Units page, synced live from the leasing system. To ask about future offers, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'Concession offers change over time, so the leasing team is the best source for the current status.',
          'Even without a special, move-in costs stay lower than many buildings because Exhibit does not collect a security deposit.',
        ],
      },
    ],
    related: ['how-much-is-rent', 'total-move-in-cost', 'what-fees-in-addition-to-rent'],
    links: [
      { label: 'Available Units', href: '/available-units' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'how-much-is-storage',
    question: 'How much does storage cost at Exhibit On Superior?',
    category: 'Pricing & Fees',
    answer:
      'On-site storage at Exhibit On Superior costs $25 per month, subject to availability. Storage is optional and billed in addition to rent, parking, and the monthly Utility & Service Amenity fee. For current storage availability, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'Storage lets you keep bikes, luggage, and seasonal gear out of your apartment. Complimentary bike storage is also available on the ground floor at no charge.',
          'Storage availability changes, so confirm current inventory with the leasing office when you apply.',
        ],
      },
    ],
    related: ['is-there-bike-storage', 'what-fees-in-addition-to-rent', 'total-move-in-cost'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Apartment Guide', href: '/apartment-guide' },
    ],
  },
  {
    slug: 'total-move-in-cost',
    question: 'What are the total move-in costs at Exhibit On Superior?',
    category: 'Pricing & Fees',
    answer:
      'To move in to Exhibit On Superior, budget for a $60 application fee per applicant, a $500 non-refundable administration fee per apartment, your first month of rent, and the monthly Utility & Service Amenity fee of $95–$195 by floor plan. There is no security deposit. Garage parking ($335/month) and storage ($25/month) are optional. For an itemized quote, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        heading: 'What to plan for',
        paragraphs: [
          'Required at move-in: the application fee, the administration fee, first month rent, and the Utility & Service Amenity fee. Electricity is set up separately with ComEd.',
          'Optional add-ons: garage parking at $335 per month, storage at $25 per month, and one-time pet fees if you bring a cat or dog.',
        ],
      },
    ],
    related: ['what-fees-in-addition-to-rent', 'is-there-a-security-deposit', 'what-are-pet-fees'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },

  // -------------------------------------------------------------------------
  // Apartments & Floor Plans
  // -------------------------------------------------------------------------
  {
    slug: 'what-apartment-sizes',
    question: 'What apartment sizes does Exhibit On Superior offer?',
    category: 'Apartments & Floor Plans',
    answer:
      'Exhibit On Superior offers studio, convertible, one-, two-, and three-bedroom apartments ranging from about 448 to 1,528 square feet across floors 2 through 34. Homes feature floor-to-ceiling windows, in-home washer/dryers, and, on most plans, private balconies. Live availability and pricing for each size are on the Available Units page.',
    sections: [
      {
        heading: 'The range of floor plans',
        paragraphs: [
          'The smallest homes are junior convertibles and studios starting near 448 square feet; the largest is a three-bedroom, three-bath of 1,528 square feet on floors 30–34.',
          'Every apartment includes driftwood plank floors, quartz countertops, tiled backsplashes, and stainless-steel appliances.',
        ],
      },
    ],
    related: ['largest-apartment', 'what-is-a-convertible', 'do-studios-exist'],
    links: [
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Available Units', href: '/available-units' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
    ],
  },
  {
    slug: 'do-studios-exist',
    question: 'Does Exhibit On Superior have studio apartments?',
    category: 'Apartments & Floor Plans',
    answer:
      'Yes. Exhibit On Superior offers studio apartments alongside convertible, one-, two-, and three-bedroom homes. Studios are among the smaller plans, near 484 square feet. Live pricing and availability for studios and every other floor plan are published on the Available Units page.',
    sections: [
      {
        paragraphs: [
          'Studios and junior convertibles (about 448–484 square feet) are the most compact homes in the tower, both finished with the same quartz countertops, stainless-steel appliances, and in-home washer/dryer as the larger plans.',
          'Availability changes often, so check the Available Units page for current studio openings.',
        ],
      },
    ],
    related: ['what-is-a-convertible', 'what-apartment-sizes', 'apartment-finishes'],
    links: [
      { label: 'Available Units', href: '/available-units' },
      { label: 'Apartment Guide', href: '/apartment-guide' },
    ],
  },
  {
    slug: 'what-is-a-convertible',
    question: 'What is a convertible apartment at Exhibit On Superior?',
    category: 'Apartments & Floor Plans',
    answer:
      'A convertible at Exhibit On Superior is an open floor plan larger than a studio but without a separate bedroom, with space that can be arranged as a sleeping area. Junior convertibles run about 450–478 square feet and convertibles about 554 square feet. They sit between studios and one-bedrooms in size and price. See live availability on the Available Units page.',
    sections: [
      {
        paragraphs: [
          'Convertibles give more usable room than a studio while keeping rent below a true one-bedroom. Note that the 02 Convertible and 03 Convertible plans (units ending in 02 or 03 on floors 6–29) are the only homes without balconies.',
          'Every convertible includes an in-home washer/dryer and floor-to-ceiling windows.',
        ],
      },
    ],
    related: ['which-units-have-balconies', 'do-studios-exist', 'what-apartment-sizes'],
    links: [
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },
  {
    slug: 'largest-apartment',
    question: 'What is the largest apartment at Exhibit On Superior?',
    category: 'Apartments & Floor Plans',
    answer:
      'The largest apartment at Exhibit On Superior is a three-bedroom, three-bath residence of 1,528 square feet, offered on the penthouse-level floors 30 through 34. Like all homes, it features floor-to-ceiling windows and an in-home washer/dryer. Check live availability for three-bedroom homes on the Available Units page.',
    sections: [
      {
        paragraphs: [
          'Three-bedroom, three-bath plans span roughly 1,455 to 1,528 square feet and carry the highest Utility & Service Amenity fee, $195 per month.',
          'Their position on the top five floors gives the widest skyline outlooks in the building.',
        ],
      },
    ],
    related: ['what-apartment-sizes', 'views-and-windows', 'what-utility-fee-covers'],
    links: [
      { label: 'Available Units', href: '/available-units' },
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
    ],
  },
  {
    slug: 'which-units-have-balconies',
    question: 'Which apartments at Exhibit On Superior have balconies?',
    category: 'Apartments & Floor Plans',
    answer:
      'Nearly every apartment at Exhibit On Superior has a private balcony. The only homes without balconies are the 02 Convertible and 03 Convertible plans — units ending in 02 or 03 on floors 6 through 29. All other floor plans include a private balcony. To confirm a specific unit, check its listing on the Available Units page.',
    sections: [
      {
        paragraphs: [
          'Balconies pair with the floor-to-ceiling windows found throughout the tower, so most residents get direct outdoor access along with the skyline views.',
          'If a balcony is essential, avoid the 02 and 03 Convertible stacks on floors 6–29 and confirm the plan with the leasing team.',
        ],
      },
    ],
    related: ['what-is-a-convertible', 'views-and-windows', 'what-apartment-sizes'],
    links: [
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },
  {
    slug: 'are-apartments-furnished',
    question: 'Are apartments at Exhibit On Superior furnished?',
    category: 'Apartments & Floor Plans',
    answer:
      'No. Apartments at Exhibit On Superior are offered unfurnished only. Each home does include an in-home washer/dryer, quartz countertops, stainless-steel appliances, and floor-to-ceiling windows, but no furniture. For questions about a specific home, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'Unfurnished means the kitchen appliances and in-unit laundry are provided, but you supply beds, seating, and other furniture.',
          'Select homes add closet organizers and double vanities; these vary by plan, so confirm details when you tour.',
        ],
      },
    ],
    related: ['in-unit-laundry', 'apartment-finishes', 'what-apartment-sizes'],
    links: [
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },
  {
    slug: 'in-unit-laundry',
    question: 'Do apartments at Exhibit On Superior have in-unit laundry?',
    category: 'Apartments & Floor Plans',
    answer:
      'Yes. In-home washer/dryers are a standard feature in every apartment at Exhibit On Superior. The dryer runs on natural gas, which is covered by the monthly Utility & Service Amenity fee. No shared laundry room or coin machines are needed.',
    sections: [
      {
        paragraphs: [
          'Because the dryer uses natural gas, that cost is bundled into the Utility & Service Amenity fee rather than billed separately.',
          'Water and sewer used by the washer are also covered by that fee, so laundry adds no metered utility cost.',
        ],
      },
    ],
    related: ['apartment-finishes', 'what-utility-fee-covers', 'are-apartments-furnished'],
    links: [
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
  },
  {
    slug: 'apartment-finishes',
    question: 'What finishes do apartments at Exhibit On Superior have?',
    category: 'Apartments & Floor Plans',
    answer:
      'Apartments at Exhibit On Superior feature driftwood plank floors, quartz countertops, tiled backsplashes, stainless-steel appliances, in-home washer/dryers, and floor-to-ceiling windows. Most homes also include a private balcony, and select homes add closet organizers and double vanities. See interiors on the Photo Gallery and Virtual Tour pages.',
    sections: [
      {
        paragraphs: [
          'These finishes are standard across floor plans, from studios to the three-bedroom penthouses.',
          'Closet organizers and double vanities appear in select homes rather than every unit, so confirm which features a specific plan includes when you tour.',
        ],
      },
    ],
    related: ['in-unit-laundry', 'views-and-windows', 'are-apartments-furnished'],
    links: [
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
      { label: 'Virtual Tour', href: '/virtual-tour' },
    ],
  },
  {
    slug: 'views-and-windows',
    question: 'What views do apartments at Exhibit On Superior have?',
    category: 'Apartments & Floor Plans',
    answer:
      'Apartments at Exhibit On Superior feature floor-to-ceiling windows with panoramic Chicago skyline views. Because the tower rises 34 stories, outlooks vary by floor and by the unit position within the building. Higher floors, including the penthouse-level 30–34, offer the widest views. See examples on the Photo Gallery and Virtual Tour pages.',
    sections: [
      {
        paragraphs: [
          'Floor-to-ceiling windows are standard on every plan, so light and views are a feature throughout the building, not only on high floors.',
          'To compare specific outlooks, tour a home in person or preview them with the Matterport and video tours.',
        ],
      },
    ],
    related: ['which-units-have-balconies', 'largest-apartment', 'apartment-finishes'],
    links: [
      { label: 'Photo Gallery', href: '/photo-gallery' },
      { label: 'Virtual Tour', href: '/virtual-tour' },
      { label: 'Apartment Guide', href: '/apartment-guide' },
    ],
  },
  {
    slug: 'ada-accessible-apartments',
    question: 'Does Exhibit On Superior have ADA-accessible apartments?',
    category: 'Apartments & Floor Plans',
    answer:
      'Yes. Per the as-built accessibility matrix, 62 apartments at Exhibit On Superior — more than 20% of the homes — carry an ADA designation: 34 Type A accessible/adaptable residences (A) and 28 Type A units with conduit line (AC). Use the ADA-accessible filter on the Available Units page to see the designated floor plans and apartments. Contact leasing to verify a specific apartment\u2019s current configuration and discuss accessibility needs: exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        heading: 'What the designations mean',
        paragraphs: [
          '(A): Type A accessible/adaptable residence. Features and installed accessibility components may vary. (AC): Type A unit with conduit line, per as-built accessibility matrix.',
          'The Available Units & Floor Plans page has an ADA-accessible filter that narrows floor plans to those with designated (A)/(AC) apartments and lists which apartment numbers carry each designation.',
          "Contact leasing to verify the apartment's current configuration and discuss specific accessibility needs, or to request a reasonable accommodation or modification.",
        ],
      },
    ],
    related: ['accessibility-contact', 'what-apartment-sizes', 'front-desk-hours'],
    links: [
      { label: 'Available Units', href: '/available-units' },
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },

  // -------------------------------------------------------------------------
  // Amenities
  // -------------------------------------------------------------------------
  {
    slug: 'full-amenity-list',
    question: 'What amenities does Exhibit On Superior offer?',
    category: 'Amenities',
    answer:
      'Exhibit On Superior has a full-floor amenity deck with a 75-foot lap pool, outdoor hot tub, sauna, and a fitness center with two private training rooms, cardio equipment, spin bikes, free weights, and a boxing simulator. It also includes four grilling stations, four fire pits, a doggie spa, a gated outdoor dog walk, work and meeting rooms, a tech lounge, a music studio, a game area, and a private park with a sculpture. Indoor amenities are open 24/7.',
    sections: [
      {
        heading: 'Wellness and outdoor',
        paragraphs: [
          'The amenity floor overlooks the city and the private park. Wellness spaces include the 75-foot lap pool, the outdoor hot tub, and a sauna with a wet lounge leading to the outdoor deck.',
          'Outdoors there are four grilling stations and four fire pits, available year-round, plus the gated dog walk.',
        ],
      },
      {
        heading: 'Work and play',
        paragraphs: [
          'Indoor social and work spaces include private work and meeting rooms, a tech lounge with charging stations and a kitchen, a fireplace lounge with a big-screen TV, a game area with arcade games and wall Scrabble, a music studio, and a library nook.',
        ],
      },
    ],
    related: ['is-there-a-pool', 'fitness-center', 'work-from-home-spaces'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
      { label: 'Schedule a Tour', href: '/schedule-a-tour' },
    ],
  },
  {
    slug: 'is-there-a-pool',
    question: 'Does Exhibit On Superior have a pool?',
    category: 'Amenities',
    answer:
      'Yes. Exhibit On Superior has a 75-foot lap pool on the amenity floor, plus an outdoor hot tub and a sauna with a wet lounge leading to the outdoor deck. The pool and hot tub are seasonal: the pool closes in late September and the hot tub closes at the first snowfall. Residents may bring up to 2 guests to the pool.',
    sections: [
      {
        heading: 'Seasonal schedule',
        paragraphs: [
          'The pool operates through the warm months and closes in late September; the outdoor hot tub stays open until the first snowfall.',
          'Indoor amenities like the sauna and fitness center are open 24/7 year-round, while outdoor areas close during quiet hours, 10pm to 6am.',
        ],
      },
    ],
    related: ['full-amenity-list', 'amenity-hours', 'grills-and-fire-pits'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
    ],
  },
  {
    slug: 'amenity-hours',
    question: 'What are the amenity hours at Exhibit On Superior?',
    category: 'Amenities',
    answer:
      'Indoor amenities at Exhibit On Superior are open 24/7. Outdoor amenities close during quiet hours, 10pm to 6am. The pool and hot tub are seasonal — the pool closes in late September and the hot tub closes at the first snowfall — while the grilling stations and fire pits are available year-round. The front desk is staffed 24 hours a day.',
    sections: [
      {
        paragraphs: [
          'The 24/7 indoor access covers the fitness center, sauna, work rooms, and lounges. Outdoor spaces, including the deck, pool area, grills, and fire pits, observe the 10pm–6am quiet hours.',
          'For amenity space reservations, the Party Room is bookable through the management office at $50 per hour.',
        ],
      },
    ],
    related: ['is-there-a-pool', 'party-room-reservation', 'front-desk-hours'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Residents', href: '/residents' },
    ],
  },
  {
    slug: 'fitness-center',
    question: 'Does Exhibit On Superior have a fitness center?',
    category: 'Amenities',
    answer:
      'Yes. The fitness center at Exhibit On Superior includes two private training rooms, cardio equipment, spin bikes, free weights, and a boxing simulator. It is part of the full-floor amenity deck and, like other indoor amenities, is open 24/7. On-site fitness retail includes CycleBar and Club Pilates.',
    sections: [
      {
        paragraphs: [
          'The two private training rooms allow focused workouts or personal training away from the main floor.',
          'For classes beyond the building, CycleBar and Club Pilates operate on-site, and East Bank Club and Equinox are within about a half mile in the neighborhood.',
        ],
      },
    ],
    related: ['on-site-retail', 'full-amenity-list', 'neighborhood-gyms'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
    ],
  },
  {
    slug: 'work-from-home-spaces',
    question: 'Does Exhibit On Superior have work-from-home spaces?',
    category: 'Amenities',
    answer:
      'Yes. Exhibit On Superior offers private work and meeting rooms, a tech lounge with charging stations and a kitchen, a library nook, and reading and charging alcoves. These indoor amenities are open 24/7. Apartments are wired for 1GB internet, and the building is implementing bulk internet through Zentro with symmetrical speeds up to 2 Gig.',
    sections: [
      {
        paragraphs: [
          'The private work and meeting rooms suit calls and focused work, while the tech lounge adds charging and a kitchen for longer sessions.',
          'For quiet reading or a change of scene, the library nook and charging alcoves are available around the clock.',
        ],
      },
    ],
    related: ['internet-options', 'full-amenity-list', 'party-room-reservation'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
  },
  {
    slug: 'party-room-reservation',
    question: 'Can I reserve the party room at Exhibit On Superior?',
    category: 'Amenities',
    answer:
      'Yes. The Party Room at Exhibit On Superior is reservable through the leasing and management office at $50 per hour. Residents may also bring up to 2 guests to the pool. Full rules are available on request from the office. To book, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'The $50-per-hour Party Room booking runs through the management office rather than a self-serve app, so reach out ahead of your event.',
          'Guest access to the pool is capped at 2 guests per resident; other amenity guest rules are available from the office on request.',
        ],
      },
    ],
    related: ['amenity-hours', 'full-amenity-list', 'is-there-a-pool'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Residents', href: '/residents' },
    ],
  },
  {
    slug: 'grills-and-fire-pits',
    question: 'Are there grills and fire pits at Exhibit On Superior?',
    category: 'Amenities',
    answer:
      'Yes. Exhibit On Superior has four grilling stations and four fire pits on the outdoor amenity deck, available year-round. Unlike the pool and hot tub, they are not seasonal. As outdoor amenities they observe the quiet hours of 10pm to 6am. The deck overlooks the city and the private park.',
    sections: [
      {
        paragraphs: [
          'Four grills and four fire pits give residents outdoor cooking and gathering space through every season.',
          'The grilling and fire pit areas share the outdoor deck with the seasonal pool and hot tub, all overlooking the private park below.',
        ],
      },
    ],
    related: ['is-there-a-pool', 'private-park', 'amenity-hours'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
    ],
  },
  {
    slug: 'private-park',
    question: 'Does Exhibit On Superior have a private park?',
    category: 'Amenities',
    answer:
      'Yes. Exhibit On Superior has a private park featuring a one-of-a-kind sculpture by internationally acclaimed sculptor Pal Svensson. The full-floor amenity deck overlooks both the city and this private park. The building also has a gated outdoor dog walk for residents with pets.',
    sections: [
      {
        paragraphs: [
          'The private park and its Pal Svensson sculpture give residents a green outdoor space that is part of the community, viewable from the amenity deck above.',
          'Nearby public green space includes Washington Square Park (about 0.3 miles) and A. Montgomery Ward Park (about 0.5 miles).',
        ],
      },
    ],
    related: ['grills-and-fire-pits', 'pet-amenities', 'neighborhood-parks'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Neighborhood', href: '/neighborhood' },
    ],
  },
  {
    slug: 'on-site-retail',
    question: 'What on-site retail does Exhibit On Superior have?',
    category: 'Amenities',
    answer:
      'On-site retail at Exhibit On Superior includes CycleBar, Club Pilates, Goddess and the Baker, LaPerior Foot Spa, and Train Moment. These fitness, coffee, spa, and training options are located within the building, so residents can reach them without leaving home. See the Amenities page for details.',
    sections: [
      {
        paragraphs: [
          'CycleBar and Club Pilates cover indoor cycling and Pilates; Train Moment offers additional fitness training; LaPerior Foot Spa provides spa services; and Goddess and the Baker serves coffee and food.',
          'These are in addition to the resident fitness center on the amenity floor.',
        ],
      },
    ],
    related: ['fitness-center', 'full-amenity-list', 'neighborhood-dining'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Neighborhood', href: '/neighborhood' },
    ],
  },

  // -------------------------------------------------------------------------
  // Pets
  // -------------------------------------------------------------------------
  {
    slug: 'does-exhibit-allow-dogs',
    question: 'Does Exhibit On Superior allow dogs?',
    category: 'Pets',
    answer:
      'Yes. Exhibit On Superior allows dogs, up to a maximum of 2 pets per apartment. There is a one-time non-refundable pet fee of $650 for one dog or $750 for two dogs, with no pet deposit, no monthly pet rent, and no weight limits. Breed restrictions apply, so see a leasing consultant for details. Dog owners must acknowledge the Dog Rider before approval.',
    sections: [
      {
        heading: 'Dog amenities',
        paragraphs: [
          'Dog owners have a doggie spa and lounge inside the building and a gated outdoor dog walk. Ohio Place Dog Park (about 0.3 miles) and Larrabee Dog Park (about 0.5 miles) are nearby.',
          'All pets must be registered with management, and dog owners must acknowledge the Dog Rider before their application is approved.',
        ],
      },
    ],
    related: ['does-exhibit-allow-cats', 'what-are-pet-fees', 'breed-and-weight-rules'],
    links: [
      { label: 'Pet Friendly', href: '/pet-friendly' },
      { label: 'Amenities', href: '/amenities' },
      { label: 'Neighborhood', href: '/neighborhood' },
    ],
  },
  {
    slug: 'does-exhibit-allow-cats',
    question: 'Does Exhibit On Superior allow cats?',
    category: 'Pets',
    answer:
      'Yes. Exhibit On Superior allows cats, up to a maximum of 2 pets per apartment (a two-cat maximum). There is a one-time non-refundable pet fee of $325 for cats, with no pet deposit and no monthly pet rent. All pets must be registered with management. For details, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'Cats carry a single $325 one-time fee rather than a deposit or recurring pet rent.',
          'The 2-pet cap applies across cats and dogs combined, so any mix must stay within two pets total.',
        ],
      },
    ],
    related: ['does-exhibit-allow-dogs', 'what-are-pet-fees', 'how-many-pets'],
    links: [
      { label: 'Pet Friendly', href: '/pet-friendly' },
      { label: 'Amenities', href: '/amenities' },
    ],
  },
  {
    slug: 'what-are-pet-fees',
    question: 'What are the pet fees at Exhibit On Superior?',
    category: 'Pets',
    answer:
      'Exhibit On Superior charges a one-time, non-refundable pet fee: $650 for one dog or $750 for two dogs (two-dog maximum), and $325 for cats (two-cat maximum). There is no refundable pet deposit and no monthly pet rent. Breed restrictions apply for dogs; see a leasing consultant for details.',
    sections: [
      {
        paragraphs: [
          'The pet fee is charged once and is not refundable. There is no ongoing pet rent, which keeps monthly costs lower than buildings that add per-pet rent.',
          'A maximum of 2 pets is allowed per apartment, and all pets must be registered with management.',
        ],
      },
    ],
    related: ['does-exhibit-allow-dogs', 'does-exhibit-allow-cats', 'breed-and-weight-rules'],
    links: [
      { label: 'Pet Friendly', href: '/pet-friendly' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
  },
  {
    slug: 'breed-and-weight-rules',
    question: 'Does Exhibit On Superior have pet breed or weight restrictions?',
    category: 'Pets',
    answer:
      'Exhibit On Superior has no weight limits for pets. Breed restrictions do apply for dogs, but the specific restricted-breed list is confirmed by the leasing office rather than published. Before applying, please see a leasing consultant for current details, or contact the team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'There is no weight cap, so size alone is not a barrier to bringing a dog.',
          'Because the restricted-breed list can change, the leasing office is the source of truth. Dog owners must also acknowledge the Dog Rider before approval.',
        ],
      },
    ],
    related: ['does-exhibit-allow-dogs', 'what-are-pet-fees', 'how-many-pets'],
    links: [
      { label: 'Pet Friendly', href: '/pet-friendly' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'pet-amenities',
    question: 'What pet amenities does Exhibit On Superior have?',
    category: 'Pets',
    answer:
      'Exhibit On Superior has a doggie spa and lounge inside the building and a gated outdoor dog walk. These let residents wash and exercise their dogs on-site. Nearby, Ohio Place Dog Park (about 0.3 miles) and Larrabee Dog Park (about 0.5 miles) offer additional off-leash space in River North.',
    sections: [
      {
        paragraphs: [
          'The doggie spa and lounge provide an indoor space to clean up after walks, and the gated dog walk gives a secure outdoor area on the property.',
          'For longer runs, two dog parks are within about a half mile.',
        ],
      },
    ],
    related: ['does-exhibit-allow-dogs', 'neighborhood-dog-parks', 'full-amenity-list'],
    links: [
      { label: 'Pet Friendly', href: '/pet-friendly' },
      { label: 'Amenities', href: '/amenities' },
      { label: 'Neighborhood', href: '/neighborhood' },
    ],
  },
  {
    slug: 'how-many-pets',
    question: 'How many pets can I have at Exhibit On Superior?',
    category: 'Pets',
    answer:
      'Exhibit On Superior allows a maximum of 2 pets per apartment, whether cats, dogs, or a combination. All pets must be registered with management, and dog owners must acknowledge the Dog Rider before their application is approved. For details, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'The 2-pet limit is a combined total, so two dogs, two cats, or one of each all fit within the cap.',
          'Registration with management is required for every pet before move-in.',
        ],
      },
    ],
    related: ['does-exhibit-allow-dogs', 'does-exhibit-allow-cats', 'what-are-pet-fees'],
    links: [
      { label: 'Pet Friendly', href: '/pet-friendly' },
      { label: 'Application Guide', href: '/application-guide' },
    ],
  },

  // -------------------------------------------------------------------------
  // Parking & Transportation
  // -------------------------------------------------------------------------
  {
    slug: 'how-much-does-parking-cost',
    question: 'How much does parking cost at Exhibit On Superior?',
    category: 'Parking & Transportation',
    answer:
      'Garage parking at Exhibit On Superior costs $335 per month for an unreserved space in the attached indoor multi-level garage, subject to availability. There is no guest parking; visitors can use SpotHero or street parking nearby. For current garage availability, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        heading: 'What the garage includes',
        paragraphs: [
          'The garage is indoor and attached to the building, so you never cross the street in Chicago weather. Spaces are unreserved and rented month to month alongside your lease.',
          'The garage also has 3 EVBOX level-2 charging stations on the second level with 6 reserved EV spaces, and complimentary bike storage is available on the ground floor.',
        ],
      },
      {
        heading: 'If you skip the car',
        paragraphs: [
          'Exhibit sits about two blocks from the CTA Chicago Brown/Purple Line station at Chicago & Franklin and roughly 0.3 miles from the Red Line at Chicago & State, with the #66 Chicago Avenue bus one block north.',
        ],
      },
    ],
    related: ['is-there-ev-charging', 'is-there-bike-storage', 'is-there-guest-parking'],
    links: [
      { label: 'Parking & Transportation', href: '/parking-transportation' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Schedule a Tour', href: '/schedule-a-tour' },
    ],
  },
  {
    slug: 'is-there-ev-charging',
    question: 'Does Exhibit On Superior have EV charging?',
    category: 'Parking & Transportation',
    answer:
      'Yes. The attached indoor garage at Exhibit On Superior has three level-2 EV charging stations on the second garage level, each with two reserved EV parking spaces (six spaces total). The stations are operated by EVBOX; for pricing and subscription details visit the EVBOX website. Standard unreserved garage parking is $335 per month.',
    sections: [
      {
        paragraphs: [
          'The three EVBOX level-2 stations are located on the second level of the garage, each serving two dedicated EV spaces. All six spaces are reserved for EV charging use.',
          'For current pricing and subscription options, visit the EVBOX website.',
        ],
      },
    ],
    related: ['how-much-does-parking-cost', 'is-there-guest-parking', 'car-free-living'],
    links: [
      { label: 'Parking & Transportation', href: '/parking-transportation' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
  },
  {
    slug: 'is-there-guest-parking',
    question: 'Does Exhibit On Superior have guest parking?',
    category: 'Parking & Transportation',
    answer:
      'The garage does not offer dedicated guest parking. Metered street parking is available on both sides of W Superior St directly in front of the building, providing convenient accessible street-level access. SpotHero lots are also nearby. Residents can rent an unreserved space in the attached indoor garage for $335 per month, subject to availability. For garage availability, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'Metered street parking lines both sides of W Superior St in front of the building, making drop-offs and short visits convenient without navigating a garage.',
          'For longer stays, SpotHero is a reliable option for reserving nearby parking in River North.',
          'The neighborhood is transit-rich, so many guests arrive by CTA rail or bus rather than driving.',
        ],
      },
    ],
    related: ['how-much-does-parking-cost', 'is-there-ev-charging', 'cta-proximity'],
    links: [
      { label: 'Parking & Transportation', href: '/parking-transportation' },
      { label: 'Map + Directions', href: '/map-directions' },
    ],
  },
  {
    slug: 'is-there-bike-storage',
    question: 'Does Exhibit On Superior have bike storage?',
    category: 'Parking & Transportation',
    answer:
      'Yes. Exhibit On Superior has complimentary bike storage on the ground floor, at no additional charge. It is a convenient option for residents who ride in River North rather than drive. Paid on-site storage for other belongings is also available at $25 per month, subject to availability.',
    sections: [
      {
        paragraphs: [
          'Ground-floor bike storage keeps bikes secure and out of your apartment without a monthly fee.',
          'River North is compact and flat, so cycling reaches the Loop, the Chicago River paths, and nearby grocery stores quickly.',
        ],
      },
    ],
    related: ['how-much-does-parking-cost', 'car-free-living', 'how-much-is-storage'],
    links: [
      { label: 'Parking & Transportation', href: '/parking-transportation' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
  },
  {
    slug: 'cta-proximity',
    question: 'How close is Exhibit On Superior to the CTA?',
    category: 'Parking & Transportation',
    answer:
      'Exhibit On Superior is about two blocks from the CTA Chicago station on the Brown and Purple Lines (Chicago & Franklin) and roughly 0.3 miles from the Chicago Red Line station (Chicago & State). The #66 Chicago Avenue bus runs one block north, with the #156 LaSalle and #22 Clark routes within a few blocks. Both rail stations are an easy walk from 165 W Superior St.',
    sections: [
      {
        paragraphs: [
          'Two rail lines within a short walk give direct access across the North Side, the Loop, and O\u2019Hare via the Blue Line connection downtown.',
          'The #66, #156, and #22 buses fill in crosstown and north-south trips not covered by rail.',
        ],
      },
    ],
    related: ['walk-to-the-loop', 'car-free-living', 'highway-access'],
    links: [
      { label: 'Parking & Transportation', href: '/parking-transportation' },
      { label: 'Map + Directions', href: '/map-directions' },
      { label: 'Neighborhood', href: '/neighborhood' },
    ],
  },
  {
    slug: 'car-free-living',
    question: 'Can you live at Exhibit On Superior without a car?',
    category: 'Parking & Transportation',
    answer:
      'Yes. Exhibit On Superior sits in River North with two CTA rail stations, several bus routes, and groceries like Whole Foods, Trader Joe\u2019s, and Jewel-Osco all within about half a mile. Complimentary ground-floor bike storage is available. The Loop is roughly a mile south, making River North one of Chicago\u2019s most practical neighborhoods for car-free living.',
    sections: [
      {
        paragraphs: [
          'Daily needs — groceries, gyms, parks, restaurants, and transit — are within about a half-mile walk, so a car is optional rather than necessary.',
          'For occasional driving, SpotHero and street parking cover guests, and the garage is available if you do keep a car.',
        ],
      },
    ],
    related: ['cta-proximity', 'walk-to-the-loop', 'is-there-bike-storage'],
    links: [
      { label: 'Parking & Transportation', href: '/parking-transportation' },
      { label: 'Neighborhood', href: '/neighborhood' },
    ],
  },
  {
    slug: 'highway-access',
    question: 'How do drivers reach the highways from Exhibit On Superior?',
    category: 'Parking & Transportation',
    answer:
      'From Exhibit On Superior, the Ohio Street feeder to the Kennedy Expressway (I-90/94) is about a mile southwest, and Lake Shore Drive (US-41) is reachable to the east via Ontario and Ohio Streets. The building has an attached indoor garage with unreserved parking at $335 per month. See the Map + Directions page for driving routes.',
    sections: [
      {
        paragraphs: [
          'The Ohio/Ontario one-way pair is the main route to and from the Kennedy Expressway and Lake Shore Drive, keeping highway access close.',
          'Drivers can enter the attached garage without street parking, which is convenient in Chicago weather.',
        ],
      },
    ],
    related: ['how-much-does-parking-cost', 'cta-proximity', 'walk-to-the-loop'],
    links: [
      { label: 'Parking & Transportation', href: '/parking-transportation' },
      { label: 'Map + Directions', href: '/map-directions' },
    ],
  },
  {
    slug: 'walk-to-the-loop',
    question: 'Is Exhibit On Superior walkable to the Loop?',
    category: 'Parking & Transportation',
    answer:
      'Yes. The Loop is roughly a mile south of Exhibit On Superior — about a 20-minute walk, or one short ride on the Brown Line from the Chicago station toward the Loop. The building sits at 165 W Superior St in River North, with two CTA rail stations within about a half mile.',
    sections: [
      {
        paragraphs: [
          'A mile puts downtown offices, theaters, and Millennium Park within an easy walk or single transit trip.',
          'The Brown and Purple Lines at Chicago & Franklin run directly toward the Loop, so a one-stop ride is an option in bad weather.',
        ],
      },
    ],
    related: ['cta-proximity', 'car-free-living', 'what-neighborhood'],
    links: [
      { label: 'Parking & Transportation', href: '/parking-transportation' },
      { label: 'Neighborhood', href: '/neighborhood' },
      { label: 'Map + Directions', href: '/map-directions' },
    ],
  },

  // -------------------------------------------------------------------------
  // Leasing & Applications
  // -------------------------------------------------------------------------
  {
    slug: 'how-do-i-apply',
    question: 'How do I apply for an apartment at Exhibit On Superior?',
    category: 'Leasing & Applications',
    answer:
      'To apply for an apartment at Exhibit On Superior, open any available residence on the Available Units page and use its Apply Now button. Each unit links to its own secure online application through the AppFolio leasing system. The application fee is $60 per applicant, and approval typically takes one to three business days.',
    sections: [
      {
        heading: 'What to have ready',
        paragraphs: [
          'Have a state or federal government-issued photo ID ready. Renters insurance with minimum liability-to-landlord (LLI) coverage of $300,000 is required.',
          'A minimum credit score of 700 is required without a co-signer, or 600+ with a qualified co-signer.',
        ],
      },
    ],
    related: ['credit-score-required', 'documents-needed', 'approval-time'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Available Units', href: '/available-units' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
  },
  {
    slug: 'credit-score-required',
    question: 'What credit score do you need to rent at Exhibit On Superior?',
    category: 'Leasing & Applications',
    answer:
      'Exhibit On Superior requires a minimum credit score of 700 to qualify without a co-signer, or 600+ with a qualified co-signer. Qualified co-signers are accepted. For questions about screening, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'Applicants at or above 700 can qualify on their own; those between 600 and 700 can qualify with a qualified co-signer.',
          'Screening is handled through the AppFolio leasing system, and approval typically takes one to three business days.',
        ],
      },
    ],
    related: ['co-signers-accepted', 'how-do-i-apply', 'approval-time'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },
  {
    slug: 'co-signers-accepted',
    question: 'Does Exhibit On Superior accept co-signers?',
    category: 'Leasing & Applications',
    answer:
      'Yes. Exhibit On Superior accepts qualified co-signers. An applicant with a credit score of 600 or above can qualify with a qualified co-signer, versus a 700 minimum without one. For co-signer requirements, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'A co-signer can bridge the gap for applicants who fall between a 600 and 700 credit score.',
          'The leasing office can confirm what a co-signer must provide during screening.',
        ],
      },
    ],
    related: ['credit-score-required', 'how-do-i-apply', 'documents-needed'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'approval-time',
    question: 'How long does apartment approval take at Exhibit On Superior?',
    category: 'Leasing & Applications',
    answer:
      'Application approval at Exhibit On Superior typically takes one to three business days. Applications are submitted through each unit\u2019s secure online form in the AppFolio leasing system. To check the status of an application, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'Having your photo ID and required renters insurance ready can help keep the review on the faster end of the one-to-three-day window.',
          'A minimum credit score of 700 (or 600+ with a qualified co-signer) is part of the screening.',
        ],
      },
    ],
    related: ['how-do-i-apply', 'credit-score-required', 'documents-needed'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },
  {
    slug: 'lease-terms',
    question: 'What lease terms does Exhibit On Superior offer?',
    category: 'Leasing & Applications',
    answer:
      'Exhibit On Superior offers lease terms of 12 months or longer. Short-term leases are available based on availability. Because short-term terms and any related pricing vary, see a leasing consultant for current details, or contact the team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'Standard terms start at 12 months. Shorter terms depend on current availability and are confirmed case by case with the leasing office.',
          'Approval on any term typically takes one to three business days after you apply.',
        ],
      },
    ],
    related: ['how-do-i-apply', 'approval-time', 'occupancy-limits'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'occupancy-limits',
    question: 'What are the occupancy limits at Exhibit On Superior?',
    category: 'Leasing & Applications',
    answer:
      'Occupancy at Exhibit On Superior complies with Chicago Building Code requirements. Because limits depend on the apartment size and code, confirm the maximum for a specific floor plan with the leasing team at exhibit@highlandptrs.com or 312-450-0635. Every adult occupant applies through the online application, at $60 per applicant.',
    sections: [
      {
        paragraphs: [
          'Rather than a flat per-unit number, occupancy follows Chicago Building Code, which the leasing office applies to each floor plan.',
          'Each adult on the lease submits their own application and pays the $60 application fee.',
        ],
      },
    ],
    related: ['lease-terms', 'how-do-i-apply', 'what-apartment-sizes'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'documents-needed',
    question: 'What documents do I need to apply at Exhibit On Superior?',
    category: 'Leasing & Applications',
    answer:
      'To apply at Exhibit On Superior, have a state or federal government-issued photo ID ready. Renters insurance with minimum liability-to-landlord (LLI) coverage of $300,000 is required. The application fee is $60 per applicant, and a minimum credit score of 700 (or 600+ with a qualified co-signer) applies.',
    sections: [
      {
        paragraphs: [
          'The core requirement is a government-issued photo ID. Renters insurance meeting the $300,000 LLI minimum must be in place per the lease.',
          'For any additional items the office may request during screening, contact the leasing team.',
        ],
      },
    ],
    related: ['renters-insurance-required', 'how-do-i-apply', 'credit-score-required'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'renters-insurance-required',
    question: 'Is renters insurance required at Exhibit On Superior?',
    category: 'Leasing & Applications',
    answer:
      'Yes. Exhibit On Superior requires renters insurance with minimum liability-to-landlord (LLI) coverage of $300,000. Have proof of coverage in place per your lease. For specifics on how the property should be listed, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'The $300,000 minimum liability-to-landlord coverage protects against damage you could be responsible for; personal-property coverage is a separate choice you can add.',
          'Confirm the exact policy details and any interested-party requirements with the leasing office.',
        ],
      },
    ],
    related: ['documents-needed', 'how-do-i-apply', 'total-move-in-cost'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
  },
  {
    slug: 'schedule-a-tour',
    question: 'How do I schedule a tour of Exhibit On Superior?',
    category: 'Leasing & Applications',
    answer:
      'To schedule a tour of Exhibit On Superior, use the tour request form on the Schedule a Tour page with your preferred move-in date and floor plan — you can even request a specific available apartment. You can also email exhibit@highlandptrs.com or call 312-450-0635. Prefer to look first? The Virtual Tour page has video and Matterport previews.',
    sections: [
      {
        paragraphs: [
          'Booking from a specific available residence lets you tour the exact home you are considering.',
          'The leasing office is open Monday through Friday 9am–6pm, Saturday 10am–5pm, and Sunday 12pm–5pm for showings and questions.',
        ],
      },
    ],
    related: ['virtual-tours', 'how-do-i-apply', 'leasing-office-hours'],
    links: [
      { label: 'Schedule a Tour', href: '/schedule-a-tour' },
      { label: 'Available Units', href: '/available-units' },
      { label: 'Virtual Tour', href: '/virtual-tour' },
    ],
  },
  {
    slug: 'virtual-tours',
    question: 'Does Exhibit On Superior offer virtual tours?',
    category: 'Leasing & Applications',
    answer:
      'Yes. Exhibit On Superior offers virtual tours through the Virtual Tour page, which includes video and Matterport tour embeds of apartment homes and amenity spaces. You can preview the building remotely before booking an in-person showing through the Schedule a Tour page or by contacting the leasing team.',
    sections: [
      {
        paragraphs: [
          'The video and Matterport tours let out-of-town renters walk through homes and amenities without visiting first.',
          'When you are ready, schedule an in-person tour of a specific available apartment from the Available Units page.',
        ],
      },
    ],
    related: ['schedule-a-tour', 'how-do-i-apply', 'views-and-windows'],
    links: [
      { label: 'Virtual Tour', href: '/virtual-tour' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
      { label: 'Schedule a Tour', href: '/schedule-a-tour' },
    ],
  },

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------
  {
    slug: 'how-is-electricity-billed',
    question: 'How is electricity billed at Exhibit On Superior?',
    category: 'Utilities',
    answer:
      'At Exhibit On Superior, electricity is billed to the resident directly by ComEd, separate from rent. Water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer are covered by the monthly Utility & Service Amenity fee of $95–$195 by floor plan. You set up your ComEd account in your own name.',
    sections: [
      {
        paragraphs: [
          'Electricity is the one utility metered and billed to you individually by ComEd, so usage habits affect that bill directly.',
          'Everything else — water, sewer, trash, heat, A/C, and gas for cooking and the dryer — is bundled into the flat Utility & Service Amenity fee.',
        ],
      },
    ],
    related: ['what-utility-fee-covers', 'utility-fee-by-floor-plan', 'internet-options'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Apartment Guide', href: '/apartment-guide' },
    ],
  },
  {
    slug: 'internet-options',
    question: 'What internet options are available at Exhibit On Superior?',
    category: 'Utilities',
    answer:
      'Exhibit On Superior is implementing bulk internet through a partnership with Zentro, offering symmetrical download and upload speeds up to 2 Gig. Apartments are wired for 1GB. Because the Zentro rollout is in progress, confirm current service, pricing, and setup with the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'The planned Zentro bulk service delivers symmetrical speeds up to 2 Gig, meaning uploads match downloads — useful for video calls and remote work.',
          'Every apartment is already wired for 1GB internet. Since the bulk program is still being implemented, the leasing office has the latest on availability and cost.',
        ],
      },
    ],
    related: ['what-utility-fee-covers', 'how-is-electricity-billed', 'work-from-home-spaces'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Amenities', href: '/amenities' },
    ],
  },
  {
    slug: 'what-utility-fee-covers',
    question: 'What does the Utility & Service Amenity fee cover at Exhibit On Superior?',
    category: 'Utilities',
    answer:
      'The monthly Utility & Service Amenity fee at Exhibit On Superior covers water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Electricity is billed separately by ComEd. The fee ranges from $95 to $195 depending on floor plan, from studios up to three-bedrooms.',
    sections: [
      {
        paragraphs: [
          'Bundling these utilities into one flat monthly fee means no separate metered bills for water, gas, or trash — only electricity through ComEd is on its own.',
          'The fee is set by floor plan, so larger homes pay more. See the by-floor-plan breakdown for exact amounts.',
        ],
      },
    ],
    related: ['utility-fee-by-floor-plan', 'how-is-electricity-billed', 'what-fees-in-addition-to-rent'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Apartment Guide', href: '/apartment-guide' },
    ],
  },
  {
    slug: 'utility-fee-by-floor-plan',
    question: 'How much is the Utility & Service Amenity fee by floor plan at Exhibit On Superior?',
    category: 'Utilities',
    answer:
      'The monthly Utility & Service Amenity fee at Exhibit On Superior is $95 for studios and junior convertibles, $105 for convertibles, $115 for one-bedrooms, $125 for two-bedroom/one-bath, $150 for two-bedroom/two-bath, $165 for two-bedroom plus den, and $195 for three-bedroom/three-bath homes. It covers water, sewer, trash, heat, A/C, and natural gas for cooking and the dryer; electricity is billed separately by ComEd.',
    sections: [
      {
        heading: 'Fee by home type',
        paragraphs: [
          'Studio (484 sq ft) and Jr. Convertible (450–478 sq ft): $95. Convertible (554 sq ft): $105. One-bedroom (619–768 sq ft): $115.',
          'Two-bedroom/one-bath (776–821 sq ft): $125. Two-bedroom/two-bath (899–1,135 sq ft): $150. Two-bedroom plus den (983 sq ft): $165. Three-bedroom/three-bath (1,455–1,528 sq ft): $195.',
        ],
      },
    ],
    related: ['what-utility-fee-covers', 'how-is-electricity-billed', 'what-fees-in-addition-to-rent'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },

  // -------------------------------------------------------------------------
  // Neighborhood
  // -------------------------------------------------------------------------
  {
    slug: 'what-neighborhood',
    question: 'What neighborhood is Exhibit On Superior in?',
    category: 'Neighborhood',
    answer:
      'Exhibit On Superior is in River North, at 165 W Superior St, Chicago, IL 60654. River North is a downtown Chicago neighborhood known for galleries, dining, and nightlife, with quick access to the Chicago River, West Loop, Old Town, and Fulton Market. The Loop is roughly a mile south.',
    sections: [
      {
        paragraphs: [
          'River North puts galleries, restaurants, cafes, and shops within walking distance, with two CTA rail stations nearby.',
          'Fulton Market, Old Town, and the West Loop are all short trips away for dining and entertainment.',
        ],
      },
    ],
    related: ['whats-near-superior-and-wells', 'neighborhood-groceries', 'walk-to-the-loop'],
    links: [
      { label: 'Neighborhood', href: '/neighborhood' },
      { label: 'Map + Directions', href: '/map-directions' },
      { label: 'Parking & Transportation', href: '/parking-transportation' },
    ],
  },
  {
    slug: 'neighborhood-groceries',
    question: 'What grocery stores are near Exhibit On Superior?',
    category: 'Neighborhood',
    answer:
      'Groceries near Exhibit On Superior include Whole Foods Market at 3 W Chicago Ave (about 0.3 miles), Jewel-Osco at 550 N State St (about 0.3 miles), Trader Joe\u2019s at 44 E Ontario St (about 0.4 miles), and Eataly at 43 E Ohio St (about 0.4 miles). All are within roughly a half-mile walk of 165 W Superior St.',
    sections: [
      {
        paragraphs: [
          'Four grocery options within about a half mile make car-free shopping practical, whether you want a full supermarket, specialty items, or Italian market fare at Eataly.',
          'The short distances also make delivery and quick trips easy in River North.',
        ],
      },
    ],
    related: ['what-neighborhood', 'car-free-living', 'neighborhood-dining'],
    links: [
      { label: 'Neighborhood', href: '/neighborhood' },
      { label: 'Map + Directions', href: '/map-directions' },
    ],
  },
  {
    slug: 'neighborhood-dog-parks',
    question: 'Are there dog parks near Exhibit On Superior?',
    category: 'Neighborhood',
    answer:
      'Yes. Ohio Place Dog Park at 360 W Ohio St is about 0.3 miles from Exhibit On Superior, and Larrabee Dog Park at 652 N Larrabee St is about 0.5 miles away. On-site, the building has a gated outdoor dog walk and a doggie spa and lounge for residents with pets.',
    sections: [
      {
        paragraphs: [
          'Two off-leash dog parks within about a half mile give dogs room to run beyond the on-site gated dog walk.',
          'Exhibit allows a maximum of 2 pets with no weight limits, though breed restrictions apply for dogs.',
        ],
      },
    ],
    related: ['pet-amenities', 'does-exhibit-allow-dogs', 'neighborhood-parks'],
    links: [
      { label: 'Neighborhood', href: '/neighborhood' },
      { label: 'Pet Friendly', href: '/pet-friendly' },
    ],
  },
  {
    slug: 'neighborhood-gyms',
    question: 'What gyms are near Exhibit On Superior?',
    category: 'Neighborhood',
    answer:
      'Exhibit On Superior has an on-site fitness center with two private training rooms, plus in-building fitness retail including CycleBar and Club Pilates. Nearby gyms include East Bank Club at 500 N Kingsbury St (about 0.5 miles) and Equinox Gold Coast at 900 N Michigan Ave (about 0.6 miles).',
    sections: [
      {
        paragraphs: [
          'The building covers everyday workouts with its fitness center, spin bikes, free weights, and boxing simulator, plus CycleBar, Club Pilates, and Train Moment on-site.',
          'For a larger club, East Bank Club and Equinox are both within about a half mile.',
        ],
      },
    ],
    related: ['fitness-center', 'on-site-retail', 'what-neighborhood'],
    links: [
      { label: 'Neighborhood', href: '/neighborhood' },
      { label: 'Amenities', href: '/amenities' },
    ],
  },
  {
    slug: 'neighborhood-parks',
    question: 'What parks are near Exhibit On Superior?',
    category: 'Neighborhood',
    answer:
      'Parks near Exhibit On Superior include Washington Square Park at 901 N Clark St (about 0.3 miles) and A. Montgomery Ward Park at 630 N Kingsbury St (about 0.5 miles). The building also has its own private park with a sculpture by Pal Svensson. Ohio Place and Larrabee dog parks are within about a half mile.',
    sections: [
      {
        paragraphs: [
          'Washington Square Park, Chicago\u2019s oldest existing park, is a short walk away, and A. Montgomery Ward Park sits along the Chicago River.',
          'On-site, residents also have the private park viewable from the amenity deck.',
        ],
      },
    ],
    related: ['private-park', 'neighborhood-dog-parks', 'what-neighborhood'],
    links: [
      { label: 'Neighborhood', href: '/neighborhood' },
      { label: 'Amenities', href: '/amenities' },
    ],
  },
  {
    slug: 'whats-near-superior-and-wells',
    question: 'What is near Superior and Wells in River North?',
    category: 'Neighborhood',
    answer:
      'Exhibit On Superior sits near Superior and Wells in River North\u2019s gallery district, surrounded by art galleries, cafes, restaurants, and shops. The CTA Chicago Brown/Purple Line station is about two blocks west at Chicago & Franklin, and Whole Foods at 3 W Chicago Ave is a few blocks northeast. The Loop is roughly a mile south.',
    sections: [
      {
        paragraphs: [
          'The blocks around Superior and Wells hold much of River North\u2019s gallery scene, along with restaurants and nightlife.',
          'Transit, groceries, and downtown are all within a short walk, making the corner a central base for the neighborhood.',
        ],
      },
    ],
    related: ['what-neighborhood', 'neighborhood-dining', 'cta-proximity'],
    links: [
      { label: 'Neighborhood', href: '/neighborhood' },
      { label: 'Map + Directions', href: '/map-directions' },
    ],
  },
  {
    slug: 'neighborhood-dining',
    question: 'What dining and nightlife are near Exhibit On Superior?',
    category: 'Neighborhood',
    answer:
      'Exhibit On Superior is in River North, known for its gallery district, chef-driven restaurants, rooftop cocktails, speakeasies, and live-music venues. Nearby dining hubs include Fulton Market, Old Town, and the West Loop. On-site, Goddess and the Baker serves coffee and food, and Eataly is about 0.4 miles away.',
    sections: [
      {
        paragraphs: [
          'River North combines art galleries with a dense restaurant and nightlife scene, from casual cafes to fine dining.',
          'Fulton Market and the West Loop, both short trips away, add some of Chicago\u2019s most notable restaurants.',
        ],
      },
    ],
    related: ['what-neighborhood', 'whats-near-superior-and-wells', 'on-site-retail'],
    links: [
      { label: 'Neighborhood', href: '/neighborhood' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
    ],
  },

  // -------------------------------------------------------------------------
  // Building & Services
  // -------------------------------------------------------------------------
  {
    slug: 'how-many-apartments',
    question: 'How many apartments does Exhibit On Superior have?',
    category: 'Building & Services',
    answer:
      'Exhibit On Superior has 298 apartments across a 34-story tower at 165 W Superior St in River North. Homes range from studios to three-bedrooms, on floors 2 through 34, from about 448 to 1,528 square feet. The building has a 24-hour staffed front desk and a full floor of amenities.',
    sections: [
      {
        paragraphs: [
          'With 298 residences over 34 floors, the tower offers a wide mix of floor plans and skyline outlooks.',
          'More than 20% of the homes are ADA accessible, spanning Type A (accessible/adaptable) and Type AC (with conduit line) floor plans.',
        ],
      },
    ],
    related: ['what-apartment-sizes', 'front-desk-hours', 'building-address'],
    links: [
      { label: 'Apartment Guide', href: '/apartment-guide' },
      { label: 'Available Units', href: '/available-units' },
      { label: 'Amenities', href: '/amenities' },
    ],
  },
  {
    slug: 'front-desk-hours',
    question: 'Is there a 24-hour front desk at Exhibit On Superior?',
    category: 'Building & Services',
    answer:
      'Yes. The front desk at Exhibit On Superior is staffed 24 hours a day. Indoor amenities are also open 24/7, while outdoor amenities close during quiet hours, 10pm to 6am. The separate leasing office keeps set weekday and weekend hours for tours and applications.',
    sections: [
      {
        paragraphs: [
          'A round-the-clock front desk handles packages, guests, and building access at any hour.',
          'For leasing questions and tours, use the leasing office hours or contact the team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
    ],
    related: ['leasing-office-hours', 'amenity-hours', 'who-manages-exhibit'],
    links: [
      { label: 'Amenities', href: '/amenities' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'who-manages-exhibit',
    question: 'How do I contact the management team at Exhibit On Superior?',
    category: 'Building & Services',
    answer:
      'Exhibit On Superior is professionally managed by an on-site team. Contact the leasing office at exhibit@highlandptrs.com or 312-450-0635, or visit 165 W Superior St, Chicago, IL 60654. For resident maintenance requests, use the resident portal or call the maintenance line at 312-883-5503.',
    sections: [
      {
        paragraphs: [
          'The leasing office handles tours, applications, and general questions during posted hours; the front desk is staffed 24 hours.',
          'Current residents manage rent payments and maintenance requests through the online resident portal.',
        ],
      },
    ],
    related: ['building-address', 'resident-portal', 'leasing-office-hours'],
    links: [
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Residents', href: '/residents' },
      { label: 'Map + Directions', href: '/map-directions' },
    ],
  },
  {
    slug: 'leasing-office-hours',
    question: 'What are the leasing office hours at Exhibit On Superior?',
    category: 'Building & Services',
    answer:
      'The leasing office at Exhibit On Superior is open Monday through Friday 9am–6pm, Saturday 10am–5pm, and Sunday 12pm–5pm. You can tour, apply, or ask questions during these hours, or reach the team any time at exhibit@highlandptrs.com or 312-450-0635. The building front desk is staffed 24 hours a day.',
    sections: [
      {
        paragraphs: [
          'Weekend hours make it easy to tour outside of a standard workweek.',
          'To reserve a specific time, use the Schedule a Tour page or contact the leasing team directly.',
        ],
      },
    ],
    related: ['schedule-a-tour', 'front-desk-hours', 'building-address'],
    links: [
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Schedule a Tour', href: '/schedule-a-tour' },
    ],
  },
  {
    slug: 'building-address',
    question: 'What is the address of Exhibit On Superior?',
    category: 'Building & Services',
    answer:
      'Exhibit On Superior is located at 165 W Superior St, Chicago, IL 60654, in the River North neighborhood. You can reach the leasing team at exhibit@highlandptrs.com or 312-450-0635. See the Map + Directions page for driving, transit, and parking routes to the building.',
    sections: [
      {
        paragraphs: [
          'The building sits near Superior and Wells, about two blocks from the CTA Chicago Brown/Purple Line station.',
          'The attached indoor garage lets drivers arrive without street parking; guests can use SpotHero or street parking nearby.',
        ],
      },
    ],
    related: ['what-neighborhood', 'cta-proximity', 'who-manages-exhibit'],
    links: [
      { label: 'Map + Directions', href: '/map-directions' },
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Parking & Transportation', href: '/parking-transportation' },
    ],
  },
  {
    slug: 'resident-portal',
    question: 'How do residents pay rent and request maintenance at Exhibit On Superior?',
    category: 'Building & Services',
    answer:
      'Residents at Exhibit On Superior pay rent, submit maintenance requests, and view community updates through the online resident portal, accessed from the Residents page. For urgent maintenance issues, call the maintenance line at 312-883-5503. General questions go to the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'The portal handles secure online rent payments and maintenance requests from a phone or computer, without checks or office trips.',
          'It also carries building announcements, resident events, and community news.',
        ],
      },
    ],
    related: ['who-manages-exhibit', 'front-desk-hours', 'building-address'],
    links: [
      { label: 'Residents', href: '/residents' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'reviews-sources',
    question: 'Where can I read reviews of Exhibit On Superior?',
    category: 'Building & Services',
    answer:
      'Reviews of Exhibit On Superior come from current, verifiable sources such as the Google Business Profile, linked from the Reviews page. For questions the reviews don\u2019t answer, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635, or schedule a tour to see the building in person.',
    sections: [
      {
        paragraphs: [
          'The Reviews page connects renters to verifiable review sources rather than hand-picked quotes, so you can read current feedback.',
          'To form your own impression, book a tour or explore the video and Matterport virtual tours.',
        ],
      },
    ],
    related: ['schedule-a-tour', 'virtual-tours', 'who-manages-exhibit'],
    links: [
      { label: 'Reviews', href: '/reviews' },
      { label: 'Schedule a Tour', href: '/schedule-a-tour' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
    ],
  },
  {
    slug: 'accessibility-contact',
    question: 'Who do I contact about accessibility at Exhibit On Superior?',
    category: 'Building & Services',
    answer:
      'For accessibility questions at Exhibit On Superior — including ADA-designated apartments, accessible unit features, or reasonable accommodation requests — contact the leasing team at exhibit@highlandptrs.com or 312-450-0635. Per the as-built accessibility matrix, 62 apartments carry an ADA designation (34 Type A “(A)” and 28 Type A with conduit line “(AC)”), browsable with the ADA-accessible filter on the Available Units page. The building has a 24-hour staffed front desk.',
    sections: [
      {
        paragraphs: [
          "The leasing office can match an accessible home to your needs. Contact leasing to verify the apartment's current configuration and discuss specific accessibility needs, since installed components vary by unit.",
          'To request a reasonable accommodation or modification, reach the team by phone or email.',
        ],
      },
    ],
    related: ['ada-accessible-apartments', 'who-manages-exhibit', 'front-desk-hours'],
    links: [
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Apartment Guide', href: '/apartment-guide' },
    ],
  },
  {
    slug: 'smoking-policy',
    question: 'Is Exhibit On Superior a smoke-free building?',
    category: 'Building & Services',
    answer:
      'Yes. Exhibit On Superior is a completely smoke-free property. The policy covers all residential units, indoor and outdoor amenity spaces, and common areas throughout the building. For questions about the smoking policy, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'The no-smoking policy applies to all parts of the building — every apartment, amenity floor, outdoor deck, and shared common area. There are no designated smoking areas on the premises.',
          'For questions about the policy or other building rules, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
    ],
    related: ['full-amenity-list', 'front-desk-hours', 'who-manages-exhibit'],
    links: [
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Amenities', href: '/amenities' },
    ],
  },
];
