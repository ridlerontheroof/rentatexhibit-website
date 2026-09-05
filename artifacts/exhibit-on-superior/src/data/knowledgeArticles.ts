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
import { ADA_COUNTS } from './ada';
import { startingRentSentence } from './startingRent';
import {
  TRANSIT_SCORE_PHRASE,
  WALK_SCORE_PHRASE,
  WALK_SCORES_CHECKED,
  WALK_SCORES_CITATION,
} from './walkScores';

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  // -------------------------------------------------------------------------
  // Pricing & Fees
  // -------------------------------------------------------------------------
  {
    slug: 'how-much-is-rent',
    question: 'How much is rent at Exhibit On Superior?',
    changeableFacts: true,
    category: 'Pricing & Fees',
    answer:
      'Rent at Exhibit On Superior depends on the floor plan, floor, and move-in date, so there is no single number. Live pricing for every currently available apartment — studio through three-bedroom — is published on the Available Units page and synced automatically from the leasing system, with photos and move-in dates. For help matching a home to your budget, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        heading: 'Where to see live pricing',
        paragraphs: [
          // Dynamic starting price from the baked availability snapshot — the
          // same sentence the homepage pricing FAQ states, so the fact-drift
          // guard sees the identical dollar token on both surfaces. Omitted
          // entirely when no usable snapshot price exists.
          ...(startingRentSentence() ? [startingRentSentence() as string] : []),
          'The Available Units page lists every residence currently available with live rent, photos, and move-in dates. Because pricing updates automatically from the leasing system, it is always the most accurate source rather than a static rent range.',
          'You can apply directly from any listing, or schedule a tour of a specific apartment before you decide.',
        ],
      },
      {
        heading: 'What drives the price of a home',
        paragraphs: [
          'Rent tracks the floor plan and its square footage first: homes span roughly 448 to 1,528 square feet across floors 2 through 34, so a studio and a three-bedroom penthouse sit at opposite ends of the range.',
          'Floor height also matters, because higher residences on the 30\u201334 penthouse levels carry the widest skyline outlooks through their floor-to-ceiling windows. Your move-in date shifts the number too, since availability changes week to week.',
        ],
      },
      {
        heading: 'What is included with rent',
        paragraphs: [
          'Every apartment comes with an in-home washer and dryer, quartz countertops, stainless-steel appliances, and driftwood plank floors, so those finishes are part of the base rent rather than an upgrade.',
          'Rent does not include the monthly Utility & Service Amenity fee of $95\u2013$195 by floor plan, and electricity is billed separately by ComEd. Garage parking at $335 per month and storage at $25 per month are optional add-ons.',
        ],
      },
      {
        heading: 'How to match a home to your budget',
        paragraphs: [
          'The clearest way to gauge rent is to compare live listings side by side on the Available Units page, since each shows the current price, floor, and move-in date for that exact residence.',
          'For personalized help, the leasing team can suggest floor plans that fit a target monthly budget and factor in the Utility & Service Amenity fee. Reach them at exhibit@highlandptrs.com or 312-450-0635, or schedule a tour of a specific apartment.',
        ],
      },
    ],
    related: ['what-fees-in-addition-to-rent', 'total-move-in-cost', 'move-in-specials'],
    links: [
      { label: 'Available Units', href: '/available-units' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Schedule a Tour', href: '/schedule-a-tour' },
    ],
  },
  {
    slug: 'what-fees-in-addition-to-rent',
    question: 'What fees does Exhibit On Superior charge in addition to rent?',
    changeableFacts: true,
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
      {
        heading: 'What the Utility & Service Amenity fee covers',
        paragraphs: [
          'That monthly fee bundles water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer into one flat charge. Because the dryer runs on gas, in-home laundry adds no separate metered cost.',
          'The amount is set by floor plan, from $95 for a studio up to $195 for a three-bedroom, so larger homes pay more. Electricity is the only utility metered and billed to you individually, through a ComEd account in your own name.',
        ],
      },
      {
        heading: 'Are there any pet fees?',
        paragraphs: [
          'If you bring a pet, a one-time non-refundable pet fee applies: $650 for one dog, $750 for two dogs, or $325 for cats, with a maximum of two pets per apartment. There is no pet deposit and no monthly pet rent.',
          'Optional charges beyond rent include garage parking at $335 per month and on-site storage at $25 per month, both subject to availability. Bike storage on the ground floor is complimentary at no additional charge.',
        ],
      },
      {
        heading: 'Where each fee is shown',
        paragraphs: [
          'The $60 application fee appears on each unit\u2019s secure online application before you pay anything, and the full fee schedule is laid out on the Fees & Leasing Costs page.',
          'For an itemized quote covering a specific home, including rent, the Utility & Service Amenity fee, and any parking or storage, contact the leasing office at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
    ],
    related: ['is-there-a-security-deposit', 'administration-fee', 'what-utility-fee-covers', 'how-much-is-storage'],
    links: [
      { label: 'Fees & Leasing Costs', href: '/fees' },
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },
  {
    slug: 'is-there-a-security-deposit',
    question: 'Is there a security deposit at Exhibit On Superior?',
    changeableFacts: true,
    category: 'Pricing & Fees',
    answer:
      'No. Exhibit On Superior does not currently collect a security deposit. In place of a deposit there is a $500 non-refundable administration fee per apartment, which is fully refunded if your application is denied but retained if you choose to cancel. For the current policy, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    description:
      'No security deposit at Exhibit On Superior. A $500 non-refundable administration fee per apartment applies in place of a deposit \u2014 refunded if denied.',
    sections: [
      {
        paragraphs: [
          'Skipping a security deposit lowers the cash needed at move-in compared with buildings that collect a full month or more up front.',
          'You should still budget for the $60 application fee, the $500 administration fee, your first month of rent, and the monthly Utility & Service Amenity fee.',
        ],
      },
      {
        heading: 'How the administration fee works instead',
        paragraphs: [
          'In place of a refundable deposit, the building charges a single $500 administration fee per apartment. That fee is fully refunded if the property denies your application, but it is retained if you choose to cancel after applying.',
          'The $500 fee is separate from the $60 application fee, which is charged per applicant, so multiple adults on one lease each pay their own $60. Applications run through the AppFolio leasing system, and approval typically takes one to three business days.',
        ],
      },
      {
        heading: 'Why the cash-to-move-in stays lower',
        paragraphs: [
          'Without a security deposit, the required up-front cash is the application fee, the administration fee, first month rent, and the monthly Utility & Service Amenity fee of $95\u2013$195 by floor plan. Electricity is set up separately in your name with ComEd.',
          'Because policies can change, confirm the current deposit and fee structure with the leasing office before you sign. Optional garage parking at $335 per month and storage at $25 per month are the only other recurring add-ons.',
        ],
      },
      {
        heading: 'What renters ask next',
        paragraphs: [
          'A common follow-up is whether last month rent is collected up front; the building does not advertise that, so verify the exact move-in ledger with the leasing office. There is no monthly pet rent for residents who bring a cat or dog.',
          'The Fees & Leasing Costs page lays out the full schedule, and the leasing team can be reached at exhibit@highlandptrs.com or 312-450-0635 to confirm the current deposit policy before you apply.',
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
    changeableFacts: true,
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
      {
        heading: 'What the fee pays for',
        paragraphs: [
          'The application fee covers the cost of screening each adult applicant, including credit and background review. A minimum credit score of 700 is required without a co-signer, or 600 or above with a qualified co-signer.',
          'The exact fee is displayed on the unit\u2019s secure online application before you pay anything, so there is no surprise at checkout. Each available residence links to its own application from its listing on the Available Units page.',
        ],
      },
      {
        heading: 'What to have ready before you apply',
        paragraphs: [
          'Have a state or federal government-issued photo ID ready, and plan for renters insurance with minimum liability-to-landlord coverage of $300,000, which is required before move-in.',
          'The $60 application fee is separate from the $500 administration fee, and there is no security deposit at the building. Having your documents in hand helps keep review on the faster end of the one-to-three-business-day window.',
        ],
      },
      {
        heading: 'Is the application fee refundable?',
        paragraphs: [
          'The $60 application fee covers screening work and is not described as refundable, unlike the $500 administration fee, which is returned in full if the property denies your application. Confirm the current refund terms with the leasing office before you pay.',
          'To start, open any home on the Available Units page and use its Apply Now button, or reach the leasing team at exhibit@highlandptrs.com or 312-450-0635 with questions about the process.',
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
    changeableFacts: true,
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
      {
        heading: 'Administration fee versus application fee',
        paragraphs: [
          'The $500 administration fee is charged once per apartment, no matter how many adults are on the lease. The $60 application fee, by contrast, is charged per applicant, so each adult pays their own screening fee.',
          'Together these two one-time charges take the place of a traditional security deposit at the building. That structure lowers the cash needed at signing compared with properties that collect a full month or more up front.',
        ],
      },
      {
        heading: 'When is the fee due?',
        paragraphs: [
          'The administration fee is paid as part of finalizing your lease, alongside first month rent and the monthly Utility & Service Amenity fee of $95\u2013$195 by floor plan. Electricity is set up separately with ComEd in your own name.',
          'Applications and payments run through the AppFolio leasing system, and approval typically takes one to three business days. For the current policy and exact timing, contact the leasing office before you apply.',
        ],
      },
      {
        heading: 'Why buildings charge an administration fee',
        paragraphs: [
          'An administration fee covers the cost of processing and finalizing a new lease. Here it also stands in for a security deposit, which the building does not collect, so it is part of what keeps the move-in cash lower.',
          'The full fee schedule is published on the Fees & Leasing Costs page. For questions about the $500 charge or the refund conditions, reach the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
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
    changeableFacts: true,
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
      {
        heading: 'How to know when an offer changes',
        paragraphs: [
          'Any concession would show up on the individual listings on the Available Units page, which sync live from the leasing system and are the most current source. A quick call or email to the leasing office confirms whether an offer is active today.',
          'Rent itself already varies by floor plan, floor, and move-in date, so timing a lease around availability can matter as much as a headline special. Homes span roughly 448 to 1,528 square feet across floors 2 through 34.',
        ],
      },
      {
        heading: 'Ways the numbers already stay competitive',
        paragraphs: [
          'Skipping the security deposit means the required cash at signing is the $60 application fee per applicant, the $500 administration fee per apartment, first month rent, and the monthly Utility & Service Amenity fee of $95\u2013$195 by floor plan.',
          'The administration fee is fully refunded if your application is denied, and there is no monthly pet rent for residents with a cat or dog. Bike storage on the ground floor is complimentary, trimming another common add-on cost.',
        ],
      },
      {
        heading: 'Will a special come back later?',
        paragraphs: [
          'Concession offers are seasonal and market-driven, so the honest answer is to check with the leasing office rather than assume. The team can tell you whether an offer is planned and when it might apply.',
          'In the meantime, the Available Units page shows current pricing for every home, synced live from the leasing system. Reach the leasing team at exhibit@highlandptrs.com or 312-450-0635 to ask about upcoming offers.',
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
    changeableFacts: true,
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
      {
        heading: 'Storage versus complimentary bike storage',
        paragraphs: [
          'Two separate options exist for keeping gear out of your unit. Paid on-site storage runs $25 per month for general belongings, while bike storage on the ground floor is provided at no additional charge for residents who ride.',
          'River North is compact and flat, so many residents cycle to the Loop, the Chicago River paths, and nearby grocery stores rather than drive, which makes the free bike room a practical everyday amenity.',
        ],
      },
      {
        heading: 'How storage fits your monthly budget',
        paragraphs: [
          'The $25 storage charge is optional and billed monthly on top of rent, the Utility & Service Amenity fee of $95\u2013$195 by floor plan, and any garage parking at $335 per month. There is no security deposit at the building.',
          'Because inventory is limited and rented as it becomes available, ask the leasing office about a specific storage unit when you apply rather than assuming one is open. Electricity is billed separately by ComEd and is unrelated to storage.',
        ],
      },
      {
        heading: 'Can I add storage after I move in?',
        paragraphs: [
          'Storage can be added when a unit is open, not only at lease signing, but availability drives timing, so a space may not be free the moment you want one. The leasing office tracks current inventory.',
          'To check what is open now or to reserve a space, reach the leasing team at exhibit@highlandptrs.com or 312-450-0635. Full pricing sits alongside parking on the Fees & Leasing Costs page.',
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
    changeableFacts: true,
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
      {
        heading: 'A worked example of the one-time charges',
        paragraphs: [
          'For a single applicant, the one-time charges are the $60 application fee plus the $500 administration fee, totaling $560 before rent. A second adult on the lease adds another $60 application fee, since that fee is charged per applicant.',
          'The administration fee is fully refunded if the property denies your application, but retained if you cancel. Because there is no security deposit, these fees plus first month rent make up the bulk of the cash needed at signing.',
        ],
      },
      {
        heading: 'The recurring costs that follow',
        paragraphs: [
          'After move-in, monthly costs are rent plus the Utility & Service Amenity fee, which is $95 for a studio and rises to $195 for a three-bedroom based on floor plan. That fee covers water, sewer, trash, heat, air conditioning, and natural gas.',
          'Electricity is the one utility billed individually by ComEd. Pet fees are one-time: $650 for one dog, $750 for two dogs, or $325 for cats, with no monthly pet rent. For an itemized quote on a specific home, contact the leasing office.',
        ],
      },
      {
        heading: 'How to get an exact figure',
        paragraphs: [
          'Because rent varies by floor plan, floor, and move-in date, the surest way to total your move-in cost is to pick a live listing on the Available Units page and add the fixed fees to its current price.',
          'The leasing team can build a full itemized quote for a specific home and confirm whether internet through the Zentro rollout is bundled yet. Reach them at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
    ],
    related: ['what-fees-in-addition-to-rent', 'is-there-a-security-deposit', 'move-in-specials', 'how-much-is-rent'],
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
          'The smallest homes are junior convertibles and studios starting near 448 square feet; the largest is a three-bedroom, three-bath of 1,528 square feet on floors 30\u201334.',
          'Every apartment includes driftwood plank floors, quartz countertops, tiled backsplashes, and stainless-steel appliances.',
        ],
      },
      {
        heading: 'How the sizes stack up by floor band',
        paragraphs: [
          'The tower is organized into four floor bands: the podium (floors 2 through the 4M mezzanine), the mid-rise (6\u201316), the high-rise (17\u201329), and the penthouse level (30\u201334). There is no floor 5 in the building.',
          'Studios run about 448 to 484 square feet, junior convertibles about 450 to 478 square feet, and full convertibles about 554 square feet. One-, two-, and three-bedroom homes climb from there, with the three-bedroom plans reaching 1,455 to 1,528 square feet on the top five floors.',
          'Because the tower rises 34 stories, the same layout can feel different depending on its floor and its position within the building, which changes the skyline outlook through the floor-to-ceiling windows.',
        ],
      },
      {
        heading: 'Which size is right for me?',
        paragraphs: [
          'Renters who want the lowest rent usually start with a studio or junior convertible, while those who need a defined bedroom step up to a one-bedroom or larger. Convertibles sit in between, offering more usable space than a studio without the cost of a true one-bedroom.',
          'The Utility & Service Amenity fee scales with plan size, from $95 per month on the smaller homes up to $195 per month on the three-bedroom residences. A leasing consultant can match a floor plan to your budget at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Where to see sizes and pricing',
        paragraphs: [
          'The Available Units page lists every home currently available with its floor plan, square footage, live rent, photos, and move-in date, synced automatically from the leasing system. That makes it the most accurate place to compare sizes at their current prices.',
          'The Apartment Guide breaks down each layout in more detail, and the Photo Gallery shows the finishes in context. Together they let you narrow to a size before scheduling a tour.',
        ],
      },
    ],
    related: ['largest-apartment', 'how-many-apartments', 'do-studios-exist', 'ada-accessible-apartments'],
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
          'Studios and junior convertibles (about 448\u2013484 square feet) are the most compact homes in the tower, both finished with the same quartz countertops, stainless-steel appliances, and in-home washer/dryer as the larger plans.',
          'Availability changes often, so check the Available Units page for current studio openings.',
        ],
      },
      {
        heading: 'What a studio includes',
        paragraphs: [
          'A studio at the tower is a single open living and sleeping space with a separate bathroom and a full kitchen. Every studio carries driftwood plank floors, tiled backsplashes, and floor-to-ceiling windows, the same finish package used across the building.',
          'One studio plan sits on floor 3 at about 484 square feet, and other studios open near 448 square feet, so exact dimensions vary by stack and floor. The floor-to-ceiling glass keeps even the most compact homes bright with a Chicago skyline outlook.',
        ],
      },
      {
        heading: 'Studio versus convertible',
        paragraphs: [
          'A studio and a convertible are both open plans without a walled-off bedroom, but a convertible is larger and gives more room to carve out a defined sleeping area. Junior convertibles run about 450 to 478 square feet and full convertibles about 554 square feet, sitting just above studios in size and price.',
          'Renters who want the lowest entry rent tend to choose a studio, while those who want a little more separation without paying for a one-bedroom look at a convertible. A leasing consultant can walk through both at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'How to find an open studio',
        paragraphs: [
          'Studio availability is published live on the Available Units page, which updates automatically from the leasing system with rent, photos, and move-in dates. Because compact homes lease quickly, the openings shown there are the current source of truth rather than a static list.',
          'You can apply directly from any studio listing or schedule a tour first. The Apartment Guide adds detail on the studio and convertible layouts if you want to compare before you visit.',
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
    description:
      'Convertibles at Exhibit On Superior are open plans between a studio and one-bedroom \u2014 no separate bedroom but space for a sleeping area. About 450\u2013554 sq ft.',
    sections: [
      {
        paragraphs: [
          'Convertibles give more usable room than a studio while keeping rent below a true one-bedroom. Note that the 02 Convertible and 03 Convertible plans (units ending in 02 or 03 on floors 6\u201329) are the only homes without balconies.',
          'Every convertible includes an in-home washer/dryer and floor-to-ceiling windows.',
        ],
      },
      {
        heading: 'Junior convertible versus convertible',
        paragraphs: [
          'The tower offers two convertible sizes. Junior convertibles run about 450 to 478 square feet, and full convertibles are larger at about 554 square feet, so the label helps you gauge the footprint before you tour.',
          'Both share the same finish package as the rest of the building: driftwood plank floors, quartz countertops, tiled backsplashes, and stainless-steel appliances. The difference between them is usable square footage, not the level of finish.',
        ],
      },
      {
        heading: 'Do convertibles have balconies?',
        paragraphs: [
          'Most convertibles do include a private balcony, but the 02 Convertible and 03 Convertible plans are the exception. Those two stacks, on floors 6 through 29, are the only homes in the tower without a balcony.',
          'If direct outdoor access matters to you, confirm the specific plan and unit number with the leasing team before applying, since balconies pair with the floor-to-ceiling windows on nearly every other home. Reach the team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'How convertibles are priced',
        paragraphs: [
          'Convertibles slot between studios and one-bedrooms on price, so they appeal to renters who want more space than a studio without a true one-bedroom\u2019s rent. The Utility & Service Amenity fee, which starts at $95 per month on the smaller plans, is added on top of rent.',
          'Live pricing and move-in dates for every available convertible appear on the Available Units page, updated automatically from the leasing system. The Apartment Guide describes the convertible layouts in more detail before you tour.',
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
      {
        heading: 'Where the largest homes sit',
        paragraphs: [
          'The three-bedroom residences occupy the penthouse band, floors 30 through 34, the top of the 34-story tower. That placement puts them above the mid-rise and high-rise bands for the broadest views through the floor-to-ceiling windows.',
          'At 1,528 square feet, the largest plan is more than three times the size of the smallest studio, which opens near 448 square feet. Every three-bedroom home has three full baths, giving each bedroom close access to a bathroom.',
        ],
      },
      {
        heading: 'What comes standard in the largest plan',
        paragraphs: [
          'The three-bedroom homes carry the same finish package as the rest of the building: driftwood plank floors, quartz countertops, tiled backsplashes, stainless-steel appliances, and an in-home washer and dryer. Select homes also add closet organizers and double vanities.',
          'Because the largest plans sit in the penthouse band, availability is limited. Check live pricing and move-in dates on the Available Units page, or ask the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'How the three-bedroom compares',
        paragraphs: [
          'The two three-bedroom plans measure about 1,455 and 1,528 square feet, so even the smaller of the pair dwarfs the studios and convertibles lower in the tower. Both deliver three full bathrooms, which is unusual among apartment homes and useful for families or roommates.',
          'Their penthouse placement on floors 30 through 34 also means the widest skyline outlooks in the building through the floor-to-ceiling windows. The Photo Gallery and Virtual Tour pages show these top-floor homes in context.',
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
          'If a balcony is essential, avoid the 02 and 03 Convertible stacks on floors 6\u201329 and confirm the plan with the leasing team.',
        ],
      },
      {
        heading: 'Which plans are the exception',
        paragraphs: [
          'Only two floor plans in the tower lack a private balcony: the 02 Convertible and the 03 Convertible. These are the units ending in 02 or 03 on floors 6 through 29, in the mid-rise and high-rise bands.',
          'Every other plan across the studio, convertible, one-, two-, and three-bedroom lineup includes a balcony. Studios, junior convertibles, and the penthouse-level three-bedroom homes all have direct outdoor access.',
        ],
      },
      {
        heading: 'How to confirm a balcony before you lease',
        paragraphs: [
          'Each residence on the Available Units page lists its floor plan, so you can match the plan name against the two balcony-free convertible stacks before you apply. The unit number tells you the line: anything ending in 02 or 03 on floors 6 through 29 is the exception.',
          'If you are unsure, the leasing team can confirm whether a specific apartment has a balcony at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Why a balcony is worth having here',
        paragraphs: [
          'A private balcony extends the floor-to-ceiling window views out into the open air, which matters in a 34-story tower where the Chicago skyline is the backdrop. Higher floors in the mid-rise, high-rise, and penthouse bands turn that outdoor space into a private overlook.',
          'Because balconies come standard on nearly every plan, most residents get this outdoor access without paying a premium for a specific home. See balconies and views in context on the Photo Gallery and Virtual Tour pages.',
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
      {
        heading: 'What is provided versus what you bring',
        paragraphs: [
          'Provided in every apartment: stainless-steel kitchen appliances, quartz countertops, a tiled backsplash, an in-home washer and dryer, driftwood plank floors, and floor-to-ceiling windows. Select homes also include closet organizers and double vanities.',
          'You bring the furniture, so plan for beds, a sofa, a dining set, and any window treatments. Because homes are wired for 1GB internet, you can set up a workspace as soon as you move in.',
        ],
      },
      {
        heading: 'Can I furnish it myself before move-in?',
        paragraphs: [
          'Yes. Since apartments are delivered unfurnished, residents choose and arrange their own furniture. Measuring the floor plan in advance helps, especially in the studios and convertibles that open near 448 to 554 square feet.',
          'On-site storage is available for $25 per month if you need somewhere to keep extra belongings, and complimentary bike storage sits on the ground floor. Confirm any home\u2019s specific features with the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Are furnished units ever available?',
        paragraphs: [
          'The published apartment offering is unfurnished only, so furnished homes are not a standard option. Residents supply their own furniture in every plan, from the studios near 448 square feet to the three-bedroom penthouses at 1,528 square feet.',
          'If your situation calls for a furnished arrangement, the leasing office is the place to ask about current possibilities rather than assuming one exists. Because the offering is unfurnished, renters should budget separately for furniture and window treatments alongside the first month of rent and the monthly Utility & Service Amenity fee. Reach the team at exhibit@highlandptrs.com or 312-450-0635.',
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
      {
        heading: 'In-home laundry in every plan',
        paragraphs: [
          'The washer and dryer are standard in every apartment, from the smallest studio near 448 square feet to the three-bedroom penthouse homes at 1,528 square feet. No resident has to rely on a shared laundry room or feed coins into a machine.',
          'Having the machines in-home means you can do laundry on your own schedule, including during the 10pm to 6am quiet hours, without leaving your apartment.',
        ],
      },
      {
        heading: 'What laundry costs to run',
        paragraphs: [
          'The gas the dryer uses, plus the water and sewer the washer draws, are all folded into the monthly Utility & Service Amenity fee, which runs $95 to $195 depending on floor plan. There is no separate metered charge for a load of laundry.',
          'Electricity is the one home utility billed separately, directly by ComEd, so the small amount the washer and dryer draw electrically appears on that bill. Confirm what your plan\u2019s fee covers with the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Do I need to visit a laundry room?',
        paragraphs: [
          'No. Because every home has its own washer and dryer, there is no shared laundry room and no need to carry loads down a hallway or wait for an open machine. Laundry stays inside your apartment.',
          'That in-home setup also means no coins or laundry cards, since the running costs are already bundled into the Utility & Service Amenity fee rather than charged per load.',
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
      {
        heading: 'Kitchen and bath details',
        paragraphs: [
          'Kitchens pair quartz countertops with modern cabinetry, decorative hardware, undermount sinks, a tiled backsplash, and stainless-steel appliances. Sleek modern fixtures carry the look across the home.',
          'Bathrooms include a subway tile bath surround, and select homes add double vanities. Closet organizers, also in select homes, help maximize storage in the more compact studios and convertibles.',
        ],
      },
      {
        heading: 'Are the finishes the same in every apartment?',
        paragraphs: [
          'The core package is consistent building-wide: driftwood plank floors, quartz countertops, tiled backsplashes, stainless-steel appliances, an in-home washer and dryer, and floor-to-ceiling windows appear in every home from the studios to the penthouses.',
          'The features that vary are closet organizers and double vanities, which are limited to select homes, and balconies, which appear on every plan except the 02 and 03 Convertible stacks on floors 6 through 29. See the finishes in context on the Photo Gallery and Virtual Tour pages, or confirm a specific plan with the leasing team.',
        ],
      },
      {
        heading: 'Technology and comfort features',
        paragraphs: [
          'Every apartment is wired for 1GB internet, and the building is implementing bulk internet through a partnership with Zentro with symmetrical speeds up to 2 Gig, so the homes are built for streaming and remote work. Floor-to-ceiling windows bring in daylight across each plan.',
          'The driftwood plank flooring runs throughout the living spaces for a consistent look, while the tiled backsplash and subway tile bath surround add texture in the kitchen and bath. Confirm which extras a specific home carries with the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
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
      {
        heading: 'How views change by floor',
        paragraphs: [
          'The tower is divided into four floor bands, and the outlook broadens as you climb: the podium (floors 2 through the 4M mezzanine), the mid-rise (6\u201316), the high-rise (17\u201329), and the penthouse level (30\u201334). There is no floor 5 in the building.',
          'Penthouse homes on floors 30 through 34 sit at the top of the 34-story tower and offer the widest skyline outlooks. Lower and mid-rise homes still get the full floor-to-ceiling glass, with views shaped by the unit\u2019s position on the building.',
        ],
      },
      {
        heading: 'Do all apartments have skyline views?',
        paragraphs: [
          'Every apartment has floor-to-ceiling windows, so all homes bring in natural light and a Chicago outlook, though the exact scene depends on the floor and the direction the unit faces. Nearly every home also has a private balcony that extends the view outdoors.',
          'The best way to judge a specific outlook is to tour the apartment in person or preview it with the interactive Matterport and video tours before you decide. The leasing team can point you to homes with the exposure you want at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Windows and balconies together',
        paragraphs: [
          'The floor-to-ceiling windows and private balconies work as a pair on nearly every plan, so most residents can both see the skyline through the glass and step outside to take it in. Only the 02 and 03 Convertible stacks on floors 6 through 29 lack a balcony.',
          'That combination extends the sense of space in even the compact studios and convertibles, where the glass and outdoor access make a small footprint feel larger. The Photo Gallery shows how the light reads across different plans.',
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
      `Yes. Per the as-built accessibility matrix, ${ADA_COUNTS.total} apartments at Exhibit On Superior — more than 20% of the homes — carry an ADA designation: ${ADA_COUNTS.a} Type A accessible/adaptable residences (A) and ${ADA_COUNTS.ac} Type A units with conduit line (AC). Use the ADA-accessible filter on the Available Units page to see the designated floor plans and apartments. Contact leasing to verify a specific apartment\u2019s current configuration and discuss accessibility needs: exhibit@highlandptrs.com or 312-450-0635.`,
    description:
      'Exhibit On Superior designates more than 20% of its apartments ADA-accessible across two types \u2014 filter by ADA on the Available Units page to see them.',
    sections: [
      {
        heading: 'What the designations mean',
        paragraphs: [
          '(A): Type A accessible/adaptable residence. Features and installed accessibility components may vary. (AC): Type A unit with conduit line, per as-built accessibility matrix.',
          'The Available Units & Floor Plans page has an ADA-accessible filter that narrows floor plans to those with designated (A)/(AC) apartments and lists which apartment numbers carry each designation.',
          "Contact leasing to verify the apartment's current configuration and discuss specific accessibility needs, or to request a reasonable accommodation or modification.",
        ],
      },
      {
        heading: 'How many accessible homes are there?',
        paragraphs: [
          `The building's as-built accessibility matrix records ${ADA_COUNTS.total} apartments with an ADA designation, which is more than 20% of the homes in the tower. That share spans multiple floor plans rather than being concentrated in a single stack.`,
          `Of those, ${ADA_COUNTS.a} are Type A accessible/adaptable residences and ${ADA_COUNTS.ac} are Type A units with a conduit line. Because designated apartments appear across the floor plan lineup, accessible options exist at more than one size and price point.`,
        ],
      },
      {
        heading: 'How do I find and tour an accessible apartment?',
        paragraphs: [
          'The Available Units & Floor Plans page has an ADA-accessible filter that narrows the list to plans with designated (A) and (AC) apartments and shows which unit numbers carry each designation. That lets you see live pricing and move-in dates for accessible homes in one view.',
          'Features and installed accessibility components can vary between designated homes, so the leasing team should confirm a specific apartment\u2019s current configuration before you apply. Reach the team to arrange a tour or discuss accommodations at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
    ],
    related: ['accessibility-contact', 'what-apartment-sizes', 'front-desk-hours'],
    links: [
      { label: 'ADA-Accessible Available Units', href: '/available-units?ada=1' },
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
          'A private dining room and party suite round out the social spaces, and reading and charging alcoves give quiet corners for a call or a book. The Party Room is reservable through the management office at $50 per hour.',
        ],
      },
      {
        heading: 'When can I use the amenities?',
        paragraphs: [
          'Indoor amenities are open 24/7, so the fitness center, sauna, work rooms, and lounges are available around the clock. Outdoor spaces observe quiet hours from 10pm to 6am.',
          'The front desk is staffed 24 hours a day. The pool and outdoor hot tub are seasonal, while the four grilling stations and four fire pits stay available year-round.',
        ],
      },
      {
        heading: 'Pets and on-site retail',
        paragraphs: [
          'Pet owners have a doggie spa and lounge inside the building plus a gated outdoor dog walk. The amenity floor sits above a private park featuring a one-of-a-kind sculpture by internationally acclaimed sculptor Pal Svensson.',
          'On-site retail brings CycleBar, Club Pilates, Train Moment, LaPerior Foot Spa, and Goddess and the Baker into the building, so fitness, spa, and coffee options are steps from home.',
        ],
      },
    ],
    related: ['is-there-a-pool', 'fitness-center', 'work-from-home-spaces', 'smoking-policy'],
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
      {
        heading: 'Where the pool sits',
        paragraphs: [
          'The 75-foot lap pool is part of the full-floor amenity deck that overlooks the city and the private park below. The same deck holds the four grilling stations and four fire pits, so the pool area doubles as a warm-weather gathering space.',
          'Inside, the sauna and its wet lounge lead directly out to the outdoor deck, connecting the indoor wellness spaces to the pool area.',
        ],
      },
      {
        heading: 'Can I bring guests to the pool?',
        paragraphs: [
          'Yes. Residents may bring up to 2 guests to the pool. Full pool and amenity rules are available on request from the leasing and management office.',
          'Because the pool sits outdoors, it follows the 10pm to 6am quiet hours along with the rest of the deck. For the current seasonal opening and closing dates, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Pool, hot tub, and sauna together',
        paragraphs: [
          'The wellness spaces are designed to flow into one another. The 75-foot lap pool is for swimming laps, the outdoor hot tub is for soaking, and the indoor sauna with its wet lounge opens straight onto the outdoor deck.',
          'That layout lets residents move from a warm sauna to the open-air deck and pool in one visit. Unlike the seasonal pool and hot tub, the sauna is indoors and open 24/7 year-round.',
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
    changeableFacts: true,
    category: 'Amenities',
    answer:
      'Indoor amenities at Exhibit On Superior are open 24/7. Outdoor amenities close during quiet hours, 10pm to 6am. The pool and hot tub are seasonal — the pool closes in late September and the hot tub closes at the first snowfall — while the grilling stations and fire pits are available year-round. The front desk is staffed 24 hours a day.',
    sections: [
      {
        paragraphs: [
          'The 24/7 indoor access covers the fitness center, sauna, work rooms, and lounges. Outdoor spaces, including the deck, pool area, grills, and fire pits, observe the 10pm\u20136am quiet hours.',
          'For amenity space reservations, the Party Room is bookable through the management office at $50 per hour.',
        ],
      },
      {
        heading: 'Indoor versus outdoor access',
        paragraphs: [
          'Indoor amenities never close: the fitness center with its two private training rooms, the sauna and wet lounge, the tech lounge, the work and meeting rooms, and the fireplace lounge are all open 24/7. That means a late-night workout or an early-morning call is always possible.',
          'Outdoor amenities pause overnight for quiet hours from 10pm to 6am. The outdoor deck, the 75-foot lap pool area, the four grilling stations, and the four fire pits all fall under that window.',
        ],
      },
      {
        heading: 'What about seasonal closures?',
        paragraphs: [
          'Two outdoor amenities are seasonal. The lap pool closes in late September, and the outdoor hot tub stays open until the first snowfall, so their hours shift with the Chicago weather.',
          'The grilling stations and fire pits are the exception outdoors, available year-round within quiet hours. For current seasonal dates or to reserve the Party Room, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Is the building staffed overnight?',
        paragraphs: [
          'Yes. The front desk is staffed 24 hours a day, so there is coverage for packages, questions, and building access at any hour. That around-the-clock staffing pairs with the 24/7 indoor amenities.',
          'The one reservable amenity space, the Party Room, is booked through the leasing and management office at $50 per hour rather than at the front desk. Reach the office at exhibit@highlandptrs.com or 312-450-0635.',
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
      {
        heading: 'What equipment is available',
        paragraphs: [
          'The fitness center is stocked with cardio equipment, spin bikes, free weights, and a boxing simulator, covering strength, cardio, and cycling in one space. Two private training rooms give residents a quieter spot for focused sessions or personal training.',
          'The center is part of the full-floor amenity deck that overlooks the city and the private park, so workouts come with a skyline outlook.',
        ],
      },
      {
        heading: 'When is the gym open?',
        paragraphs: [
          'Like the other indoor amenities, the fitness center is open 24/7, so residents can train at any hour. The front desk is staffed 24 hours a day if you need building assistance during an early-morning or late-night workout.',
          'If you want more variety, on-site retail adds CycleBar for indoor cycling, Club Pilates, and Train Moment, and neighborhood options such as East Bank Club and Equinox are within about a half mile. Ask the leasing team about the fitness center at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Beyond the gym floor',
        paragraphs: [
          'Wellness at the tower extends past the weights and cardio. The sauna and its wet lounge lead out to the outdoor deck, and the seasonal 75-foot lap pool offers a way to train that the main gym floor cannot.',
          'Because all of these sit on the same full-floor amenity deck overlooking the city and the private park, residents can combine a workout, a swim, and a sauna in a single trip upstairs.',
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
      {
        heading: 'Internet built for remote work',
        paragraphs: [
          'Every apartment is wired for 1GB internet, so a home office is ready from day one. The building is also implementing bulk internet through a partnership with Zentro, offering symmetrical speeds up to 2 Gig.',
          'Symmetrical speeds matter for video calls and large uploads, since the connection is as fast going out as it is coming in. Confirm the current internet setup and any included service with the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Can I take calls outside my apartment?',
        paragraphs: [
          'Yes. The private work and meeting rooms are built for calls and heads-down work away from your home, and the tech lounge pairs charging stations with a kitchen for longer stretches. All of these indoor spaces are open 24/7.',
          'For a quieter setting, the library nook and the reading and charging alcoves offer smaller corners to plug in. Since the front desk is staffed 24 hours a day, help is available whenever you are working.',
        ],
      },
      {
        heading: 'Hosting a meeting or client',
        paragraphs: [
          'The private meeting rooms give residents a place to host a small in-person meeting away from their apartment. For a larger gathering, the Party Room is reservable through the management office at $50 per hour.',
          'The tech lounge\u2019s kitchen and charging stations make it practical for longer working sessions, and a private dining room and party suite are available among the building\u2019s social spaces. Confirm availability with the office at exhibit@highlandptrs.com or 312-450-0635.',
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
      {
        heading: 'How to book the Party Room',
        paragraphs: [
          'Reservations go through the leasing and management office, so contact them ahead of your event to check availability and confirm the $50-per-hour rate. Booking is not self-serve, which keeps the calendar coordinated for all residents.',
          'The Party Room pairs with a private dining room and party suite among the building\u2019s indoor social spaces, giving residents a dedicated place to host. Reach the office at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'What are the rules for guests?',
        paragraphs: [
          'Full amenity and Party Room rules are available on request from the management office. One published limit is that residents may bring up to 2 guests to the pool.',
          'Because indoor amenities are open 24/7 but outdoor spaces observe quiet hours from 10pm to 6am, timing an event that spills onto the deck is worth confirming with the office. The front desk is staffed 24 hours a day if questions come up during your reservation.',
        ],
      },
      {
        heading: 'Other spaces for gatherings',
        paragraphs: [
          'The Party Room is not the only place to host. The building also has a private dining room and party suite, a fireplace lounge with a big-screen TV, and a game area with arcade games and wall Scrabble for more casual get-togethers.',
          'These lounges are indoor amenities, so they stay open 24/7, unlike the outdoor deck. A leasing consultant can explain which spaces require a reservation and which are open to residents at any time.',
        ],
      },
    ],
    // 'work-from-home-spaces' added while the internet-options article is
    // hidden pending the Zentro install (it supplied the second inbound link);
    // it is topical here (meeting rooms) and can stay after the restore.
    related: ['amenity-hours', 'full-amenity-list', 'is-there-a-pool', 'work-from-home-spaces'],
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
      {
        heading: 'Year-round versus seasonal outdoor amenities',
        paragraphs: [
          'The four grilling stations and four fire pits are available year-round, unlike the outdoor amenities that close with the Chicago weather. The lap pool closes in late September and the outdoor hot tub stays open until the first snowfall.',
          'That makes the grills and fire pits the deck features residents can count on in every season, whether for a summer cookout or a cold-weather gathering around the fire.',
        ],
      },
      {
        heading: 'When can I use the grills and fire pits?',
        paragraphs: [
          'The grilling and fire pit areas sit on the outdoor amenity deck, so they follow the 10pm to 6am quiet hours that apply to all outdoor spaces. Between 6am and 10pm they are open for cooking and gathering.',
          'The deck overlooks the city and the private park below, with the sculpture by Pal Svensson visible from above. For any guest limits or reservation questions, the leasing and management office can help at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Cooking and gathering outdoors',
        paragraphs: [
          'Four grilling stations give multiple residents room to cook at once, so the deck can handle more than a single household at a time. The four fire pits create separate gathering spots for evenings on the deck.',
          'Sitting on the full-floor amenity deck, the grills and fire pits share the space with the 75-foot lap pool and outdoor hot tub in warm months, turning the whole floor into an outdoor social area above the Chicago skyline.',
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
      {
        heading: 'The Pal Svensson sculpture',
        paragraphs: [
          'The centerpiece of the private park is a one-of-a-kind sculpture by internationally acclaimed sculptor Pal Svensson, commissioned for the community. It anchors the green space as a distinctive feature rather than a generic courtyard.',
          'Because the amenity deck runs the full floor above, residents can take in the park and its sculpture from the deck while using the pool, grills, and fire pits.',
        ],
      },
      {
        heading: 'Green space in and around the building',
        paragraphs: [
          'The private park gives residents dedicated outdoor space on the property itself, complemented by the gated outdoor dog walk for pet owners. Together they cover both people and pets without leaving home.',
          'Beyond the building, River North adds public parks within an easy walk, including Washington Square Park about 0.3 miles away and A. Montgomery Ward Park about 0.5 miles away. The Neighborhood page maps more of the nearby green space.',
        ],
      },
      {
        heading: 'Enjoying the park from the amenity floor',
        paragraphs: [
          'The full-floor amenity deck is positioned to overlook both the city and the private park below, so residents take in the green space from above while using the pool, grills, and fire pits. The park becomes part of the view rather than a separate errand.',
          'That vantage point pairs the outdoor deck with the park to make the amenity floor feel connected to greenery, a distinctive touch for a 34-story tower in River North.',
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
      {
        heading: 'Fitness and wellness retail',
        paragraphs: [
          'Three of the on-site tenants focus on movement: CycleBar for indoor cycling, Club Pilates for Pilates classes, and Train Moment for a next-level fitness experience. Residents can add studio classes to whatever they do in the building\u2019s own fitness center.',
          'LaPerior Foot Spa rounds out the wellness side with spa services, giving residents a way to reset without leaving the building.',
        ],
      },
      {
        heading: 'Why on-site retail matters day to day',
        paragraphs: [
          'Having coffee, fitness, and spa options inside the building means everyday errands and workouts take steps rather than a trip across the neighborhood. Goddess and the Baker handles the morning coffee and a sweet treat, all under the same roof.',
          'These tenants complement the amenity floor\u2019s fitness center, sauna, and lounges rather than replace them, so residents get both resident-only amenities and public-facing retail. See the current lineup on the Amenities page.',
        ],
      },
      {
        heading: 'Coffee and food on-site',
        paragraphs: [
          'Goddess and the Baker is the building\u2019s coffee and food option, a place to grab a morning coffee and a sweet treat without stepping outside. For residents working from home or heading out early, that means one less stop across the neighborhood.',
          'River North adds many more dining and cafe choices within a short walk, but having a coffee spot in the building covers the everyday routine first. The Neighborhood page maps the wider dining scene around the tower.',
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
          'The doggie spa and lounge give residents an indoor place to wash and dry a dog after a walk, so muddy paws stay out of the apartment and the elevators.',
          'All pets must be registered with management, and dog owners must acknowledge the Dog Rider before their application is approved.',
        ],
      },
      {
        heading: 'What dogs cost to bring',
        paragraphs: [
          'The dog fee is a one-time, non-refundable charge of $650 for one dog or $750 for two dogs. There is no refundable pet deposit and no monthly pet rent, so the cost is paid once rather than added to rent every month.',
          'A maximum of 2 pets is allowed per apartment, and that cap is a combined total across dogs and cats. Two dogs, or one dog and one cat, both fit within the two-pet limit.',
        ],
      },
      {
        heading: 'Are there breed or weight limits?',
        paragraphs: [
          'There are no weight limits for dogs at the building, so size alone will not disqualify a pet. Breed restrictions do apply, and the current restricted-breed list is confirmed by the leasing office rather than published, so review it with a leasing consultant before you apply.',
          'Beyond the on-site dog walk and spa, River North is a walkable neighborhood with two off-leash dog parks within about a half mile for longer runs.',
        ],
      },
      {
        heading: 'Where dogs can run nearby',
        paragraphs: [
          'Ohio Place Dog Park at 360 W Ohio St is about 0.3 miles from the building, and Larrabee Dog Park at 652 N Larrabee St is about 0.5 miles away. Both are an easy walk from 165 W Superior St.',
          'The flat, compact River North grid makes it simple to reach either park on foot, and the on-site gated dog walk covers quick breaks closer to home.',
          'Because there is no monthly pet rent, the ongoing cost of a dog here is limited to your own food, care, and supplies rather than a recurring building charge.',
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
        heading: 'What cats cost to bring',
        paragraphs: [
          'Cats carry a single $325 one-time fee rather than a deposit or recurring pet rent. Because there is no monthly pet rent, the cost of a cat is paid once and never recurs on your statement.',
          'The 2-pet cap applies across cats and dogs combined, so any mix must stay within two pets total. Two cats, or one cat and one dog, both fit inside the two-pet limit.',
        ],
      },
      {
        heading: 'Registration and indoor pet spaces',
        paragraphs: [
          'Every pet must be registered with management before move-in, which keeps the building\u2019s pet records current for all residents. There are no weight limits, and breed restrictions apply only to dogs rather than cats.',
          'Pet-owning residents share the building\u2019s doggie spa and lounge and a gated outdoor dog walk, and the amenity floor and lounges give indoor room to spend time without leaving home.',
        ],
      },
      {
        heading: 'Can I bring a cat and a dog?',
        paragraphs: [
          'Yes, as long as the total stays within two pets. A household with one cat and one dog pays the dog fee of $650 plus the cat fee of $325 rather than the two-dog rate.',
          'For the current pet policy and to register your animals, contact the leasing team, since availability of specific pet-friendly homes can change.',
        ],
      },
      {
        heading: 'Outdoor space for pets',
        paragraphs: [
          'Cat owners benefit from the same walkable River North setting as dog owners, with Washington Square Park about 0.3 miles away and A. Montgomery Ward Park about 0.5 miles from the building.',
          'On the property, the gated outdoor dog walk sits on the full-floor amenity deck, which overlooks a private park and the Chicago skyline.',
          'The building rises 34 stories at 165 W Superior St, and its indoor amenity spaces are open 24/7 for residents and their pets to enjoy.',
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
    changeableFacts: true,
    category: 'Pets',
    answer:
      'Exhibit On Superior charges a one-time, non-refundable pet fee: $650 for one dog or $750 for two dogs (two-dog maximum), and $325 for cats (two-cat maximum). There is no refundable pet deposit and no monthly pet rent. Breed restrictions apply for dogs; see a leasing consultant for details.',
    description:
      'One-time pet fee at Exhibit On Superior: $650 for one dog, $750 for two dogs, or $325 per cat. No deposit and no monthly pet rent. Breed restrictions apply.',
    sections: [
      {
        heading: 'One-time, not recurring',
        paragraphs: [
          'The pet fee is charged once and is not refundable. There is no ongoing pet rent, which keeps monthly costs lower than buildings that add per-pet rent.',
          'A maximum of 2 pets is allowed per apartment, and all pets must be registered with management.',
        ],
      },
      {
        heading: 'Fees by pet type',
        paragraphs: [
          'For dogs, the one-time fee is $650 for a single dog or $750 for two dogs, up to a two-dog maximum. For cats, the one-time fee is $325, up to a two-cat maximum.',
          'A household with one dog and one cat pays $650 plus $325 rather than the two-dog rate, since the fee tracks the type and number of pets you bring.',
        ],
      },
      {
        heading: 'What the fee does not include',
        paragraphs: [
          'There is no refundable pet deposit and no monthly pet rent, so the pet fee is the only pet-specific charge at move-in. It is separate from the $60 application fee and the $500 administration fee that apply to the lease itself.',
          'Breed restrictions apply for dogs and there are no weight limits, so confirm the current restricted-breed list with a leasing consultant before applying.',
        ],
      },
      {
        heading: 'What your pets get on-site',
        paragraphs: [
          'The one-time fee comes with access to the building\u2019s pet amenities: a doggie spa and lounge inside the building and a gated outdoor dog walk on the full-floor amenity deck.',
          'Nearby, Ohio Place Dog Park (about 0.3 miles) and Larrabee Dog Park (about 0.5 miles) give dogs off-leash room within about a half mile of the building.',
          'All pets must be registered with management before move-in, and dog owners must acknowledge the Dog Rider before their application is approved.',
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
        heading: 'No weight limits',
        paragraphs: [
          'There is no weight cap, so size alone is not a barrier to bringing a dog. Large-breed dogs are welcome as long as they are not on the restricted list.',
          'Because the restricted-breed list can change, the leasing office is the source of truth. Dog owners must also acknowledge the Dog Rider before approval.',
        ],
      },
      {
        heading: 'How breed rules are confirmed',
        paragraphs: [
          'The building does not publish its restricted-breed list, so the reliable step is to review it with a leasing consultant before you apply and pay any fees. This avoids surprises during application review.',
          'Every pet must also be registered with management before move-in, and the two-pet maximum applies across cats and dogs combined.',
        ],
      },
      {
        heading: 'Do these rules apply to cats?',
        paragraphs: [
          'Breed restrictions apply only to dogs, not cats. Cats have no breed or weight rules and carry a one-time fee of $325, up to a two-cat maximum.',
          'For dogs, the one-time fee is $650 for one or $750 for two, with no deposit and no monthly pet rent.',
        ],
      },
      {
        heading: 'Amenities for larger dogs',
        paragraphs: [
          'Since there is no weight cap, larger dogs are welcome and can use the same on-site amenities as any pet: a doggie spa and lounge inside the building and a gated outdoor dog walk.',
          'For longer runs, Ohio Place Dog Park is about 0.3 miles away and Larrabee Dog Park is about 0.5 miles away, both an easy walk in the compact River North grid.',
          'The two-pet maximum applies across cats and dogs combined, so a household can keep two dogs of any size as long as neither is a restricted breed.',
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
        heading: 'On-site pet spaces',
        paragraphs: [
          'The doggie spa and lounge provide an indoor space to clean up after walks, and the gated dog walk gives a secure outdoor area on the property. Together they let residents wash and exercise a dog without leaving the building.',
          'The gated dog walk is part of the full-floor amenity deck, which also overlooks a private park and the city skyline.',
        ],
      },
      {
        heading: 'Dog parks nearby',
        paragraphs: [
          'For longer runs, two off-leash dog parks are within about a half mile. Ohio Place Dog Park at 360 W Ohio St is about 0.3 miles away, and Larrabee Dog Park at 652 N Larrabee St is about 0.5 miles away.',
          'Because River North is compact and walkable, both parks are an easy walk from 165 W Superior St.',
        ],
      },
      {
        heading: 'Which pets are allowed?',
        paragraphs: [
          'A maximum of 2 pets is allowed per apartment, cats or dogs, with no weight limits. Breed restrictions apply for dogs, so confirm the current list with a leasing consultant.',
          'Pet fees are one-time and non-refundable: $650 for one dog, $750 for two dogs, and $325 for cats, with no deposit and no monthly pet rent.',
        ],
      },
      {
        heading: 'How the pet spaces fit the amenity floor',
        paragraphs: [
          'The gated dog walk and the private park share the same full-floor amenity deck as the 75-foot lap pool, the outdoor hot tub, and the sauna, so pet care and resident wellness sit on one level.',
          'Indoor amenities, including the doggie spa and lounge, are open 24/7, which suits early-morning or late-night trips after a walk.',
          'All pets must be registered with management, and River North\u2019s two nearby dog parks extend the on-site options within about a half mile.',
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
        heading: 'How the two-pet cap works',
        paragraphs: [
          'The 2-pet limit is a combined total, so two dogs, two cats, or one of each all fit within the cap. The rule counts pets rather than species, so a mix is fine as long as it stays at two.',
          'Registration with management is required for every pet before move-in, and dog owners must also acknowledge the Dog Rider before approval.',
        ],
      },
      {
        heading: 'Fees for two pets',
        paragraphs: [
          'Fees are one-time and non-refundable: $650 for one dog, $750 for two dogs, and $325 for cats. A household with one dog and one cat pays $650 plus $325 rather than the two-dog rate.',
          'There is no refundable pet deposit and no monthly pet rent, so bringing the maximum of two pets does not add a recurring charge to your rent.',
        ],
      },
      {
        heading: 'Any size or breed limits?',
        paragraphs: [
          'There are no weight limits for pets, so size is not a barrier within the two-pet cap. Breed restrictions apply to dogs, and the current list is confirmed by the leasing office.',
          'Pet owners share the building\u2019s doggie spa, lounge, and gated outdoor dog walk, with two off-leash dog parks within about a half mile.',
        ],
      },
      {
        heading: 'Steps before move-in',
        paragraphs: [
          'Register each pet with management before move-in so the building\u2019s records are complete. Dog owners must also acknowledge the Dog Rider as part of getting an application approved.',
          'Confirm the restricted-breed list with a leasing consultant first, since it is not published and can change over time.',
          'Because pet fees are one-time rather than recurring, bringing the full two pets adds no monthly charge beyond the $325 or $650 to $750 paid once at move-in.',
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
    changeableFacts: true,
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
          'The tower sits about two blocks from the CTA Chicago Brown/Purple Line station at Chicago & Franklin and roughly 0.3 miles from the Red Line at Chicago & State, with the #66 Chicago Avenue bus one block north.',
          'Groceries like Whole Foods, Trader Joe\u2019s, and Jewel-Osco are all within about a half-mile walk, so many residents keep a car only for occasional trips.',
        ],
      },
      {
        heading: 'Is there guest parking?',
        paragraphs: [
          'There is no dedicated guest parking in the garage. Visitors can use metered street parking on both sides of W Superior St in front of the building, or reserve a nearby space through SpotHero.',
          'Because two CTA rail lines and several bus routes are within a short walk, many guests arrive by transit rather than driving.',
        ],
      },
      {
        heading: 'Optional add-ons',
        paragraphs: [
          'Garage parking is billed monthly alongside your lease and is separate from rent, the Utility & Service Amenity fee, and electricity from ComEd. On-site storage is also available at $25 per month, subject to availability.',
          'Complimentary bike storage on the ground floor is included at no charge, which suits residents who ride around the flat, compact River North grid.',
          'The garage is part of a 34-story tower at 165 W Superior St, so residents park under the same roof as the amenity floor, front desk, and their apartment.',
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
    changeableFacts: true,
    category: 'Parking & Transportation',
    answer:
      'Yes. The attached indoor garage at Exhibit On Superior has three level-2 EV charging stations on the second garage level, each with two reserved EV parking spaces (six spaces total). The stations are operated by EVBOX; for pricing and subscription details visit the EVBOX website. Standard unreserved garage parking is $335 per month.',
    sections: [
      {
        heading: 'Where the chargers are',
        paragraphs: [
          'The three EVBOX level-2 stations are located on the second level of the garage, each serving two dedicated EV spaces. All six spaces are reserved for EV charging use.',
          'Because the garage is indoor and attached to the building, you can plug in and reach your apartment without stepping outside in Chicago weather.',
        ],
      },
      {
        heading: 'Pricing and how to sign up',
        paragraphs: [
          'Charging pricing and subscription options are handled by EVBOX rather than the leasing office, so the EVBOX website is the source for current rates and plans.',
          'A standard unreserved garage space is $335 per month, subject to availability, and is rented month to month alongside your lease.',
        ],
      },
      {
        heading: 'Do I need a car to live here?',
        paragraphs: [
          'No. The building sits about two blocks from the CTA Chicago Brown/Purple Line station and roughly 0.3 miles from the Red Line, with the #66 Chicago Avenue bus one block north.',
          'Complimentary ground-floor bike storage is also included, so residents can charge an EV, ride a bike, or ride transit depending on the trip.',
          'Groceries like Whole Foods, Trader Joe\u2019s, and Jewel-Osco are within about a half mile, so many residents drive only occasionally.',
        ],
      },
      {
        heading: 'Charging and everyday parking',
        paragraphs: [
          'The six EV spaces sit on the second level of the same indoor garage that offers standard month-to-month parking, so an EV owner uses one facility for both charging and daily parking.',
          'Availability of both the EV spaces and standard spaces can change, so confirm current openings with the leasing office when you apply.',
          'The garage is attached to a 34-story tower at 165 W Superior St, keeping charging and parking under the same roof as the amenity floor and front desk.',
        ],
      },
    ],
    related: ['how-much-does-parking-cost', 'is-there-guest-parking', 'car-free-living'],
    links: [
      { label: 'Parking & Transportation', href: '/parking-transportation' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
    externalLinks: [
      { label: 'EVBOX website (charging pricing & subscriptions)', href: 'https://evbox.com' },
    ],
  },
  {
    slug: 'is-there-guest-parking',
    question: 'Does Exhibit On Superior have guest parking?',
    changeableFacts: true,
    category: 'Parking & Transportation',
    answer:
      'The garage does not offer dedicated guest parking. Metered street parking is available on both sides of W Superior St directly in front of the building, providing convenient accessible street-level access. SpotHero lots are also nearby. Residents can rent an unreserved space in the attached indoor garage for $335 per month, subject to availability. For garage availability, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    sections: [
      {
        heading: 'Where visitors can park',
        paragraphs: [
          'Metered street parking lines both sides of W Superior St in front of the building, making drop-offs and short visits convenient without navigating a garage.',
          'For longer stays, SpotHero is a reliable option for reserving nearby parking in River North.',
          'The neighborhood is transit-rich, so many guests arrive by CTA rail or bus rather than driving.',
        ],
      },
      {
        heading: 'Arriving by transit instead',
        paragraphs: [
          'The building is about two blocks from the CTA Chicago Brown/Purple Line station at Chicago & Franklin and roughly 0.3 miles from the Red Line at Chicago & State. The #66 Chicago Avenue bus runs one block north.',
          'With two rail lines and several bus routes within a short walk, guests can reach 165 W Superior St without a car at all.',
        ],
      },
      {
        heading: 'Can residents rent a space?',
        paragraphs: [
          'Yes. Residents can rent an unreserved space in the attached indoor garage for $335 per month, subject to availability, billed month to month alongside the lease.',
          'The garage also holds three EVBOX level-2 charging stations with six reserved EV spaces, and complimentary bike storage sits on the ground floor.',
          'Because the garage is indoor and attached, residents never cross the street in Chicago weather when parking at 165 W Superior St.',
        ],
      },
      {
        heading: 'Planning a visit',
        paragraphs: [
          'For a short drop-off, the metered spaces on W Superior St put guests directly at the building\u2019s front door with accessible street-level access.',
          'For an evening or overnight stay, reserving a nearby space through SpotHero avoids circling for street parking in a busy River North.',
          'Guests arriving by transit can use the CTA Chicago Brown/Purple Line about two blocks away or the Red Line roughly 0.3 miles from the building.',
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
        heading: 'Complimentary and secure',
        paragraphs: [
          'Ground-floor bike storage keeps bikes secure and out of your apartment without a monthly fee. Because it is included at no charge, it costs nothing to store a bike or two on-site.',
          'The ground-floor location makes it easy to grab a bike on the way out rather than hauling it through the elevators from your unit.',
        ],
      },
      {
        heading: 'Why cycling works here',
        paragraphs: [
          'River North is compact and flat, so cycling reaches the Loop, the Chicago River paths, and nearby grocery stores quickly. Whole Foods, Trader Joe\u2019s, and Jewel-Osco are all within about a half mile.',
          'For residents who mix riding with transit, the CTA Chicago Brown/Purple Line station is about two blocks away and the Red Line is roughly 0.3 miles away.',
        ],
      },
      {
        heading: 'What about other storage?',
        paragraphs: [
          'Paid on-site storage for other belongings is available at $25 per month, subject to availability, which suits luggage and seasonal gear that will not fit on a bike rack.',
          'Storage is optional and billed in addition to rent, parking, and the monthly Utility & Service Amenity fee, so confirm current inventory with the leasing office.',
        ],
      },
      {
        heading: 'How bike storage fits car-free living',
        paragraphs: [
          'Free bike storage pairs with the building\u2019s transit access to make a car optional: the CTA Chicago Brown/Purple Line is about two blocks away and the Red Line is roughly 0.3 miles away.',
          'The Loop is roughly a mile south, an easy ride from River North, and A. Montgomery Ward Park along the Chicago River connects to nearby riverfront paths.',
          'For residents who do keep a car, unreserved garage parking is available at $335 per month, so cycling and driving can coexist.',
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
        heading: 'Rail lines within a short walk',
        paragraphs: [
          'Two rail lines within a short walk give direct access across the North Side, the Loop, and O\u2019Hare via the Blue Line connection downtown.',
          'The Brown and Purple Lines board at Chicago & Franklin about two blocks away, and the Red Line at Chicago & State is roughly 0.3 miles from the building.',
        ],
      },
      {
        heading: 'Bus routes nearby',
        paragraphs: [
          'The #66 Chicago Avenue bus runs one block north, with the #156 LaSalle and #22 Clark routes within a few blocks. These fill in crosstown and north-south trips not covered by rail.',
          `Together the rail and bus network makes River North one of Chicago\u2019s most practical neighborhoods for getting around without a car \u2014 Walk Score rates the address ${TRANSIT_SCORE_PHRASE}.`,
        ],
      },
      {
        heading: 'How far is the Loop by train?',
        paragraphs: [
          'The Loop is roughly a mile south, and the Brown and Purple Lines at Chicago & Franklin run directly toward downtown, so it is a short one-stop ride in bad weather.',
          'The same walkability puts groceries, gyms, and dining within about a half mile of 165 W Superior St.',
        ],
      },
      {
        heading: 'Airport and beyond',
        paragraphs: [
          'The Blue Line to O\u2019Hare connects downtown, so a transfer from the nearby Red Line or a short trip into the Loop reaches the airport by rail.',
          'For residents who also drive, the Ohio Street feeder to the Kennedy Expressway is about a mile southwest and Lake Shore Drive is reachable to the east via Ontario and Ohio Streets.',
          'This layering of two rail lines, several bus routes, and quick highway access is what makes River North practical whether you commute by train or by car.',
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
        heading: 'Everything within a half mile',
        paragraphs: [
          `Daily needs — groceries, gyms, parks, restaurants, and transit — are within about a half-mile walk, so a car is optional rather than necessary. Whole Foods, Trader Joe\u2019s, and Jewel-Osco all sit within that radius. Per Walk Score, the address rates ${WALK_SCORE_PHRASE} and ${TRANSIT_SCORE_PHRASE}.`,
          'Washington Square Park and A. Montgomery Ward Park are nearby for green space, and East Bank Club and Equinox are within about a half mile for fitness.',
        ],
      },
      {
        heading: 'Transit and biking options',
        paragraphs: [
          'The CTA Chicago Brown/Purple Line station is about two blocks away and the Red Line is roughly 0.3 miles away, with the #66 Chicago Avenue bus one block north.',
          'Complimentary ground-floor bike storage is included, and the flat, compact River North grid makes cycling to the Loop and the river paths quick.',
        ],
      },
      {
        heading: 'What if I do keep a car?',
        paragraphs: [
          'For occasional driving, SpotHero and metered street parking on W Superior St cover guests, and the attached indoor garage rents unreserved spaces for $335 per month.',
          'That mix means a resident can go fully car-free or keep a car for weekend trips without changing homes.',
        ],
      },
      {
        heading: 'Errands and nights out on foot',
        paragraphs: [
          'Restaurants, cafes, and River North\u2019s gallery district are steps from 165 W Superior St, and on-site Goddess and the Baker serves coffee and food inside the building.',
          'The two nearby dog parks, Ohio Place and Larrabee, plus Washington Square Park all sit within about a half mile, so pet walks and green space are also car-free.',
          'With daily needs, transit, and downtown all within an easy walk, River North is one of Chicago\u2019s most practical neighborhoods for living without a car.',
        ],
      },
    ],
    related: ['cta-proximity', 'walk-to-the-loop', 'is-there-bike-storage', 'highway-access'],
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
        heading: 'Main routes to the highways',
        paragraphs: [
          'The Ohio/Ontario one-way pair is the main route to and from the Kennedy Expressway and Lake Shore Drive, keeping highway access close. Ohio Street feeds westbound onto the Kennedy toward O\u2019Hare, while Ontario carries eastbound traffic back into River North.',
          'Lake Shore Drive (US-41) is reachable to the east via Ontario and Ohio Streets, giving a fast north-south route along the lakefront.',
        ],
      },
      {
        heading: 'Parking when you get home',
        paragraphs: [
          'Drivers can enter the attached indoor garage without street parking, which is convenient in Chicago weather. Unreserved spaces rent for $335 per month, subject to availability.',
          'The garage also has three EVBOX level-2 charging stations with six reserved EV spaces on the second level for electric vehicles.',
        ],
      },
      {
        heading: 'Do I need to drive here?',
        paragraphs: [
          'No. Even with quick highway access, the building sits about two blocks from the CTA Chicago Brown/Purple Line and roughly 0.3 miles from the Red Line, so a car is optional.',
          'See the Map + Directions page for turn-by-turn driving routes to and from the expressways.',
        ],
      },
      {
        heading: 'Reaching the suburbs and airport',
        paragraphs: [
          'The Kennedy Expressway (I-90/94) carries traffic northwest toward O\u2019Hare and the northwest suburbs, and it is the main highway link from River North via the Ohio Street feeder about a mile southwest.',
          'Lake Shore Drive runs north and south along the lakefront, giving a scenic route to the North Side and toward the South Side.',
          'For drivers who commute, the attached indoor garage means you can leave and return without hunting for street parking, and unreserved spaces rent for $335 per month.',
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
      `Yes. The Loop is roughly a mile south of Exhibit On Superior — about a 20-minute walk, or one short ride on the Brown Line from the Chicago station toward the Loop. The building sits at 165 W Superior St in River North, with two CTA rail stations within about a half mile. ${WALK_SCORES_CITATION}`,
    sections: [
      {
        heading: 'A mile from downtown',
        paragraphs: [
          'A mile puts downtown offices, theaters, and Millennium Park within an easy walk or single transit trip. The walk south from River North into the Loop takes about 20 minutes at a steady pace.',
          'Because the route runs through downtown Chicago, the walk passes shops, cafes, and the Chicago River on the way.',
        ],
      },
      {
        heading: 'The train alternative',
        paragraphs: [
          'The Brown and Purple Lines at Chicago & Franklin run directly toward the Loop, so a one-stop ride is an option in bad weather. The station sits about two blocks from the building.',
          'The Red Line at Chicago & State, roughly 0.3 miles away, is a second rail option toward downtown.',
        ],
      },
      {
        heading: 'Is it walkable beyond the Loop?',
        paragraphs: [
          'Yes. River North itself keeps groceries, gyms, parks, and dining within about a half mile of 165 W Superior St, so most daily trips do not require the Loop at all.',
          `Third-party ratings back this up (checked ${WALK_SCORES_CHECKED}): ${WALK_SCORES_CITATION}`,
          'Complimentary ground-floor bike storage adds a fast option for the mile downtown when you would rather ride than walk.',
        ],
      },
      {
        heading: 'What is in the Loop',
        paragraphs: [
          'The Loop holds much of downtown Chicago\u2019s office core, theaters, and Millennium Park, so a mile south covers work, culture, and the lakefront in one direction.',
          'River North\u2019s own gallery district, restaurants, and nightlife fill in the blocks around the building, so residents get a walkable neighborhood plus quick downtown access.',
          'Two CTA rail stations within about a half mile mean the Loop is reachable by train in minutes even when the weather rules out the walk.',
          'For a commute, the roughly one-mile distance means a walk, a bike ride from the free ground-floor storage, or a short train trip are all realistic ways to reach downtown offices.',
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
    changeableFacts: true,
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
      {
        heading: 'How the online application works',
        paragraphs: [
          'Each available residence links to its own secure online application through the AppFolio leasing system, so you apply for the exact home you want rather than a generic waitlist. Live rent, photos, and move-in dates on the Available Units page update automatically from the leasing system, letting you confirm a home is still open before you start.',
          'The $60 application fee is charged per applicant, and every adult who will live in the apartment submits a separate application. A separate $500 non-refundable administration fee is charged once per apartment; it is fully refunded if the property denies your application but retained if you cancel.',
        ],
      },
      {
        heading: 'What happens after you submit',
        paragraphs: [
          'The leasing team reviews your application and walks you through screening, timing, and lease signing, with approval typically taking one to three business days. Pet owners acknowledge the Dog Rider and pet policy before approval, and all pets must be registered with management.',
          'Lease terms of 12 months or longer are standard, and short-term leases are offered based on availability. For help at any step, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'What it costs to apply and move in',
        paragraphs: [
          'There is no security deposit at the building, which lowers the cash needed up front compared with properties that collect a full month or more. Beyond the one-time application and administration fees, budget for your first month of rent and the monthly Utility & Service Amenity fee of $95 to $195 by floor plan.',
          'Electricity is set up separately and billed directly by ComEd, while garage parking at $335 per month and on-site storage at $25 per month are optional add-ons. Live rent for every open home appears on the Available Units page so you can size up the full cost before applying.',
        ],
      },
    ],
    related: ['credit-score-required', 'documents-needed', 'approval-time', 'application-fee'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Available Units', href: '/available-units' },
      { label: 'Fees & Leasing Costs', href: '/fees' },
    ],
  },
  {
    slug: 'credit-score-required',
    question: 'What credit score do you need to rent at Exhibit On Superior?',
    changeableFacts: true,
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
      {
        heading: 'How the score fits the wider screening',
        paragraphs: [
          'Credit score is one part of the qualification and screening review, alongside a state or federal government-issued photo ID and required renters insurance with minimum liability-to-landlord (LLI) coverage of $300,000. Having these documents ready helps keep the review on the faster end of the one-to-three-day window.',
          'Each adult applicant is screened individually and pays the $60 per-applicant application fee, so every leaseholder submits their own online application through the AppFolio leasing system.',
        ],
      },
      {
        heading: 'What if my score is below 700?',
        paragraphs: [
          'An applicant with a credit score of 600 or above can qualify by adding a qualified co-signer, versus the 700 minimum required to qualify alone. The tower accepts qualified co-signers specifically to bridge that gap for renters between 600 and 700.',
          'Because screening requirements can be nuanced, the leasing office is the best source for what a co-signer must provide. Reach the team at exhibit@highlandptrs.com or 312-450-0635 to confirm before you apply.',
        ],
      },
      {
        heading: 'When to check your score',
        paragraphs: [
          'It helps to know where your credit stands before you open an application, since the 700 threshold, or 600 or above with a qualified co-signer, is a firm part of screening. Checking early lets you line up a co-signer in advance rather than pausing a submitted application.',
          'Screening also weighs a state or federal government-issued photo ID and proof of renters insurance with minimum liability-to-landlord coverage of $300,000, so gathering those alongside your credit information keeps approval near the one-to-three-day mark.',
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
    changeableFacts: true,
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
      {
        heading: 'Who a co-signer helps',
        paragraphs: [
          'A qualified co-signer is most useful for renters whose credit score sits between 600 and 700, since a 700 minimum applies to anyone qualifying on their own. This makes co-signers a practical path for recent graduates, newcomers to Chicago, or anyone still building a longer credit history.',
          'The co-signer arrangement is part of the same qualification and screening review that covers credit, a state or federal government-issued photo ID, and required renters insurance with minimum liability-to-landlord (LLI) coverage of $300,000.',
        ],
      },
      {
        heading: 'How to confirm the requirements',
        paragraphs: [
          'Applications and screening run through the AppFolio leasing system, and approval typically takes one to three business days once everything is submitted. Each adult on the lease still files a separate application at the $60 per-applicant fee, whether or not a co-signer is involved.',
          'Because a co-signer must meet the property\u2019s own standards, confirm the exact requirements before applying by contacting the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'What a co-signer does not change',
        paragraphs: [
          'Adding a qualified co-signer helps you meet the credit standard, but it does not waive the other qualification steps. Renters insurance with minimum liability-to-landlord coverage of $300,000 and a state or federal government-issued photo ID are still required, and the standard lease terms of 12 months or longer apply the same way to your application and approval.',
          'The building charges no security deposit regardless of whether you use a co-signer; the main one-time costs remain the $60 application fee per applicant and the $500 non-refundable administration fee per apartment.',
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
    changeableFacts: true,
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
      {
        heading: 'What can speed up or slow down the review',
        paragraphs: [
          'The fastest applications arrive complete: a state or federal government-issued photo ID plus renters insurance with minimum liability-to-landlord (LLI) coverage of $300,000 already in hand. Because every adult on the lease is screened individually and pays the $60 per-applicant fee, all applicants submitting on the same day helps avoid delays.',
          'Pet owners acknowledge the Dog Rider and pet policy before approval, so registering a cat or dog early keeps that step from holding up the timeline. Missing documents or an unsubmitted co-applicant are the most common reasons a review stretches toward the three-day end.',
        ],
      },
      {
        heading: 'How do I check my application status?',
        paragraphs: [
          'Applications are submitted through each unit\u2019s secure online form in the AppFolio leasing system, and the leasing team can look up where yours stands. For a status update at any point in the one-to-three-day window, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Why applying sooner matters',
        paragraphs: [
          'Live rent, photos, and move-in dates on the Available Units page update automatically from the leasing system, so a home you like can be leased by another applicant while you gather documents. Starting the online application promptly locks in your place in the review queue for that specific residence.',
          'Since approval still takes one to three business days, applying early relative to your desired move-in date leaves room for screening, lease signing, and setting up renters insurance and ComEd electricity service before you take possession.',
        ],
      },
    ],
    related: ['how-do-i-apply', 'credit-score-required', 'documents-needed', 'co-signers-accepted'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Available Units', href: '/available-units' },
    ],
  },
  {
    slug: 'lease-terms',
    question: 'What lease terms does Exhibit On Superior offer?',
    changeableFacts: true,
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
      {
        heading: 'Are short-term leases available?',
        paragraphs: [
          'Short-term leases are offered based on availability, so they are confirmed case by case rather than posted as a fixed program. A leasing consultant can tell you which shorter terms and floor plans are open for your target move-in date.',
          'Because short-term terms and any related pricing vary, the leasing team is the authoritative source. Reach them at exhibit@highlandptrs.com or 312-450-0635 to check current options.',
        ],
      },
      {
        heading: 'What applies to every lease',
        paragraphs: [
          'Whatever the length, each lease is signed after the online application clears screening in the AppFolio leasing system, and every adult occupant submits a separate application at the $60 per-applicant fee. Renters insurance with minimum liability-to-landlord (LLI) coverage of $300,000 is required for the lease term.',
          'There is no security deposit; the main one-time charges are the $60 application fee per applicant and the $500 non-refundable administration fee per apartment. Live rent and move-in dates for each home appear on the Available Units page, synced automatically from the leasing system.',
        ],
      },
      {
        heading: 'How term length fits your plans',
        paragraphs: [
          'A 12-month term suits residents settling in for a full year, while a shorter term, subject to availability, can bridge a relocation, an internship, or a home purchase in progress. Occupancy on any term follows the Chicago Building Code standard of two persons per sleeping room plus one additional occupant.',
          'Because pricing can shift with term length and floor plan, and because live availability changes, confirm the current options for your move-in date with a leasing consultant before you commit.',
        ],
      },
    ],
    related: ['how-do-i-apply', 'approval-time', 'occupancy-limits', 'renters-insurance-required'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'occupancy-limits',
    question: 'What are the occupancy limits at Exhibit On Superior?',
    changeableFacts: true,
    category: 'Leasing & Applications',
    answer:
      'Occupancy at Exhibit On Superior follows the Chicago Building Code standard: 2 persons per sleeping room plus 1 additional occupant per apartment. A studio or convertible counts as 1 sleeping room (3 occupants); a one-bedroom allows 4; a two-bedroom allows 5; a three-bedroom allows 7. Every adult on the lease submits their own application at $60 per applicant.',
    sections: [
      {
        paragraphs: [
          'The formula — 2 per sleeping room + 1 — is set by Chicago Building Code and applies uniformly across floor plans by bedroom count.',
          'Each adult occupant submits their own application and pays the $60 application fee.',
        ],
      },
      {
        heading: 'How the limits map to floor plans',
        paragraphs: [
          'A studio or convertible counts as one sleeping room, allowing three occupants; a one-bedroom allows four; a two-bedroom allows five; and a three-bedroom allows seven. Homes range from about 448 to 1,528 square feet across floors 2 through 34, so a larger plan carries a correspondingly higher occupancy ceiling.',
          'Convertibles fall between studios and one-bedrooms in size but still count as a single sleeping room under the code, so their limit matches a studio rather than a one-bedroom.',
        ],
      },
      {
        heading: 'How occupancy affects applying',
        paragraphs: [
          'Every adult who will live in the apartment must be named on the lease and submit a separate online application through the AppFolio leasing system, each paying the $60 per-applicant fee. Each of those applicants is screened individually, including the minimum credit score of 700, or 600 or above with a qualified co-signer.',
          'To confirm how the standard applies to a specific home or household, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Choosing a plan for your household',
        paragraphs: [
          'Match the floor plan to the number of people who will live there: a couple often fits a studio, convertible, or one-bedroom, while a small family or roommates may need a two- or three-bedroom to stay within the occupancy ceiling. The three-bedroom, three-bath plans reach up to 1,528 square feet and allow the most occupants at seven.',
          'Every home, from studio to penthouse-level three-bedroom, shares the same standard features, including floor-to-ceiling windows and an in-home washer/dryer, so the main differences by household are size, occupancy limit, and monthly cost.',
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
    changeableFacts: true,
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
      {
        heading: 'Documents by applicant versus by household',
        paragraphs: [
          'Some items are per applicant and some are per apartment. Each adult on the lease provides their own government-issued photo ID and submits a separate online application through the AppFolio leasing system at the $60 per-applicant fee.',
          'The renters insurance requirement, with minimum liability-to-landlord (LLI) coverage of $300,000, and the $500 non-refundable administration fee both attach to the apartment rather than to each person. Pet owners also acknowledge the Dog Rider and pet policy and register any cat or dog with management before approval.',
        ],
      },
      {
        heading: 'What about co-signers?',
        paragraphs: [
          'If you plan to qualify with a qualified co-signer because your credit score is between 600 and 700, the co-signer is part of the same screening and may need to provide their own paperwork. Since exact co-signer documentation can vary, confirm it before you apply.',
          'The leasing team can list anything the office may request during screening. Reach them at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Getting your paperwork ready',
        paragraphs: [
          'Gathering everything before you open the online application keeps approval on the faster end of the one-to-three-day window. Have your government-issued photo ID, a renters insurance policy meeting the $300,000 liability-to-landlord minimum, and, if needed, a qualified co-signer lined up in advance.',
          'Because each residence links to its own secure application in the AppFolio leasing system and live availability updates automatically, being ready to submit promptly helps you secure the specific home you want.',
        ],
      },
    ],
    related: ['renters-insurance-required', 'how-do-i-apply', 'credit-score-required', 'occupancy-limits'],
    links: [
      { label: 'Application Guide', href: '/application-guide' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    slug: 'renters-insurance-required',
    question: 'Is renters insurance required at Exhibit On Superior?',
    changeableFacts: true,
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
      {
        heading: 'When you need the policy in place',
        paragraphs: [
          'Proof of renters insurance is part of the qualification and screening review, so line it up alongside your government-issued photo ID as you apply. Coverage must be active per the lease, which means it should be ready by move-in rather than added afterward.',
          'Approval through the AppFolio leasing system typically takes one to three business days, and having insurance confirmed early helps keep the review on the faster end of that window.',
        ],
      },
      {
        heading: 'What the requirement does and does not cover',
        paragraphs: [
          'The $300,000 liability-to-landlord minimum is about damage to the building that you could be responsible for; it is not the same as insuring your own belongings. Adding personal-property coverage is optional but protects your furniture and electronics, which matter here because apartments are offered unfurnished.',
          'The building may ask to be listed a specific way on the policy, and interested-party requirements can vary. Confirm how the property should appear by contacting the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'How insurance fits your move-in budget',
        paragraphs: [
          'Renters insurance is a recurring cost separate from rent, and it sits alongside the monthly Utility & Service Amenity fee of $95 to $195 by floor plan and electricity billed directly by ComEd. Because there is no security deposit, the required one-time charges at move-in are the $60 application fee per applicant and the $500 non-refundable administration fee per apartment.',
          'Lining up the policy as part of your overall move-in plan avoids a last-minute scramble, since coverage must be active per the lease before you take possession.',
        ],
      },
    ],
    related: ['documents-needed', 'how-do-i-apply', 'total-move-in-cost', 'lease-terms'],
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
          'The leasing office is open Monday through Friday 9am–6pm and Saturday 10am–5pm for showings and questions; it is closed on Sunday.',
        ],
      },
      {
        heading: 'What to see on a tour',
        paragraphs: [
          'A tour typically covers both an apartment and the full-floor amenity deck, which includes a 75-foot lap pool, an outdoor hot tub, a sauna, and a fitness center with two private training rooms. You can also walk the private park, the work and meeting rooms, and the outdoor deck with four grilling stations and four fire pits.',
          'Homes feature floor-to-ceiling windows, in-home washer/dryers, quartz countertops, and, on most plans, private balconies, so touring in person shows the finishes and skyline outlooks that vary by floor across the 34-story tower.',
        ],
      },
      {
        heading: 'Can I tour without visiting first?',
        paragraphs: [
          'Yes. The Virtual Tour page has video and Matterport previews of apartment homes and amenity spaces, which is useful for out-of-town renters deciding what to book. You can preview remotely, then reserve an in-person showing of a specific available apartment from the Available Units page.',
          'To arrange a visit outside the posted hours or ask a question first, email exhibit@highlandptrs.com or call 312-450-0635.',
        ],
      },
      {
        heading: 'How to book the right slot',
        paragraphs: [
          'The tour request form on the Schedule a Tour page asks for your preferred move-in date and floor plan, and you can request a specific available apartment so the leasing team has the exact home ready. Booking from a live listing on the Available Units page ties your tour to a residence that is currently open.',
          'Because listings sync automatically from the leasing system, choosing a specific unit early helps you tour it before it is leased. If you would rather talk first, the leasing team answers by phone and email during office hours, Monday through Saturday.',
        ],
      },
    ],
    related: ['virtual-tours', 'reviews-sources', 'leasing-office-hours'],
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
      {
        heading: 'What the virtual tours show',
        paragraphs: [
          'The Matterport tour is an interactive 3D walkthrough you can navigate at your own pace, while the video tour gives a guided look at apartment homes and amenity spaces. Together they showcase the floor-to-ceiling windows, in-home washer/dryers, and quartz-and-stainless kitchens found across floor plans.',
          'The tours also feature shared spaces such as the full-floor amenity deck, the 75-foot lap pool, and the private park, so you can gauge the building beyond a single unit before traveling.',
        ],
      },
      {
        heading: 'Virtual tour versus in-person tour',
        paragraphs: [
          'A virtual tour is ideal for narrowing your shortlist remotely, since outlooks and light vary by floor across the 34-story tower and are hard to judge from photos alone. An in-person tour then confirms the exact home, finishes, and view before you apply.',
          'To book a showing after previewing online, use the Schedule a Tour page or contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'What to pair with the tours',
        paragraphs: [
          'Alongside the video and Matterport walkthroughs, the Photo Gallery shows apartment interiors and amenity spaces in detail, and the Available Units page lists live rent and move-in dates for every open home. Reviewing all three gives a fuller picture before you commit time to a visit.',
          'Out-of-town renters can also read current feedback on the Reviews page, which pulls ratings straight from the community\u2019s Google Business Profile, then confirm anything remaining with the leasing team.',
        ],
      },
    ],
    related: ['schedule-a-tour', 'reviews-sources', 'views-and-windows'],
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
    changeableFacts: true,
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
      {
        heading: 'Setting up your ComEd account',
        paragraphs: [
          'You open the electricity account in your own name with ComEd, the local utility, rather than through the building. Doing this before or at move-in ensures power is active on day one.',
          'Because electricity is metered to each apartment, your monthly bill reflects your own usage. Everything else needed to run the home \u2014 heat, air conditioning, and gas for cooking and the dryer \u2014 stays inside the flat Utility & Service Amenity fee.',
        ],
      },
      {
        heading: 'Do I get one bill or several?',
        paragraphs: [
          'You receive two housing-related charges: rent, which includes the monthly Utility & Service Amenity fee of $95\u2013$195 by floor plan on your ledger, and a separate ComEd statement for electricity. There are no additional metered water, gas, or trash bills.',
          'This split keeps budgeting simple, since only electricity varies with how much you use. The bundled fee is set by floor plan, so a studio pays $95 and a three-bedroom pays $195 regardless of month-to-month usage.',
        ],
      },
      {
        heading: 'What about internet?',
        paragraphs: [
          'Internet is handled separately from electricity and the bundled fee. The building is implementing bulk service through a partnership with Zentro at symmetrical speeds up to 2 Gig, and every apartment is already wired for 1GB.',
          'Because the Zentro rollout is in progress, confirm current internet service, pricing, and setup with the leasing office. Electricity setup, by contrast, is always through your own ComEd account.',
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
      {
        heading: 'Why symmetrical speed matters',
        paragraphs: [
          'Symmetrical service means upload speed matches download speed, so the planned Zentro connection sends data as fast as it receives it. That balance helps video calls, cloud backups, and large file transfers that many providers slow on the upload side.',
          'At up to 2 Gig symmetrical, the bulk plan targets households with several connected people and devices at once. The existing 1GB wiring in every apartment already supports typical streaming and remote-work use while the rollout continues.',
        ],
      },
      {
        heading: 'Where to work online in the building',
        paragraphs: [
          'Beyond in-home service, residents can use private work and meeting rooms and a tech lounge with charging stations and a kitchen, all part of the indoor amenities that stay open 24/7.',
          'Because the Zentro bulk program is still being implemented, confirm current pricing, whether the fee is bundled, and setup steps with the leasing office before you rely on it. The team can be reached at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Can I use my own provider?',
        paragraphs: [
          'Because the apartments are already wired for 1GB, residents have wiring in place regardless of the bulk program. Whether you can bring an outside provider depends on the building policy as the Zentro rollout finishes.',
          'The leasing office can confirm which options are active today and whether internet is included in another charge. Reach them at exhibit@highlandptrs.com or 312-450-0635 before setting up service.',
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
    question: 'What does the Utility & Service fee cover?',
    changeableFacts: true,
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
      {
        heading: 'What is not covered',
        paragraphs: [
          'Electricity is the single utility left out of the bundle; you set up a ComEd account in your own name and pay for your own usage. Internet is also separate, with the building implementing bulk service through Zentro at symmetrical speeds up to 2 Gig.',
          'Because the fee is flat and set by floor plan, the covered utilities do not fluctuate with your usage. That means heat in winter and air conditioning in summer never produce a surprise metered bill.',
        ],
      },
      {
        heading: 'How laundry ties into the fee',
        paragraphs: [
          'Every apartment includes an in-home washer and dryer, and the dryer runs on natural gas that the Utility & Service Amenity fee already covers. Water and sewer used by the washer are covered too, so in-unit laundry adds no metered cost.',
          'This is why residents see only two housing charges: rent with the bundled fee, and a separate ComEd electricity statement. The fee ranges from $95 for a studio to $195 for a three-bedroom based on floor plan.',
        ],
      },
      {
        heading: 'Does the fee change month to month?',
        paragraphs: [
          'No. The Utility & Service Amenity fee is a flat monthly amount tied to your floor plan, so it does not rise in cold months when heat runs or in summer when air conditioning runs harder.',
          'Only electricity, billed by ComEd, moves with your usage. The exact bundled fee for a given floor plan is listed on the Fees & Leasing Costs page and in the by-floor-plan breakdown.',
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
    question: 'How much is the utility fee by floor plan?',
    changeableFacts: true,
    category: 'Utilities',
    answer:
      'The monthly Utility & Service Amenity fee at Exhibit On Superior is $95 for studios and junior convertibles, $105 for convertibles, $115 for one-bedrooms, $125 for two-bedroom/one-bath, $150 for two-bedroom/two-bath, $165 for two-bedroom plus den, and $195 for three-bedroom/three-bath homes. It covers water, sewer, trash, heat, A/C, and natural gas for cooking and the dryer; electricity is billed separately by ComEd.',
    sections: [
      {
        heading: 'Fee by home type',
        paragraphs: [
          'Studio (448–484 sq ft) and Jr. Convertible (450–478 sq ft): $95. Convertible (554 sq ft): $105. One-bedroom (619–768 sq ft): $115.',
          'Two-bedroom/one-bath (767–821 sq ft): $125. Two-bedroom/two-bath (899–1,135 sq ft): $150. Two-bedroom plus den (983 sq ft): $165. Three-bedroom/three-bath (1,455–1,528 sq ft): $195.',
        ],
      },
      {
        heading: 'Why the fee scales with the home',
        paragraphs: [
          'The fee rises with square footage because larger apartments use more heat, air conditioning, water, and gas across the covered utilities. A studio at $95 and a three-bedroom penthouse at $195 mark the two ends of the range.',
          'Every tier covers the same set of services: water, sewer, trash, heat, air conditioning, and natural gas for cooking and the clothes dryer. Only the flat monthly amount changes with the floor plan, not the list of what is included.',
        ],
      },
      {
        heading: 'How to confirm the fee for a specific unit',
        paragraphs: [
          'Because the fee follows the floor plan, you can match any listing on the Available Units page to its tier using the sizes above. Homes span floors 2 through 34, so the same plan carries the same fee regardless of height.',
          'Electricity sits outside this fee and is billed directly by ComEd in your own name. For the exact fee tied to a home you are considering, confirm with the leasing office at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Is the fee the same on every floor?',
        paragraphs: [
          'Yes. Two apartments with the same floor plan carry the same Utility & Service Amenity fee even if one sits on a low floor and the other on the 30\u201334 penthouse levels. The fee is a function of the plan, not the view.',
          'The full table of types, sizes, and monthly fees is published on the Fees & Leasing Costs page, so you can verify any tier before you apply.',
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
        heading: 'What River North is known for',
        paragraphs: [
          'River North puts galleries, restaurants, cafes, and shops within walking distance, with two CTA rail stations nearby. The neighborhood holds one of the city\u2019s densest concentrations of art galleries alongside chef-driven dining and nightlife.',
          'Fulton Market, Old Town, and the West Loop are all short trips away for dining and entertainment.',
        ],
      },
      {
        heading: 'Getting around from here',
        paragraphs: [
          'The CTA Chicago Brown/Purple Line station is about two blocks away and the Red Line at Chicago & State is roughly 0.3 miles away, with the #66 Chicago Avenue bus one block north.',
          'The Loop is roughly a mile south, about a 20-minute walk or a short train ride, so downtown is close without living in it.',
        ],
      },
      {
        heading: 'Daily needs nearby',
        paragraphs: [
          'Groceries are covered within about a half mile, including Whole Foods, Trader Joe\u2019s, and Jewel-Osco. Washington Square Park and A. Montgomery Ward Park add green space close to the building.',
          'The address, 165 W Superior St, Chicago, IL 60654, sits in the gallery district near Superior and Wells.',
        ],
      },
      {
        heading: 'The building itself',
        paragraphs: [
          'The building is a 34-story tower with a full floor of amenities, a 24-hour staffed front desk, and homes ranging from studios to three-bedrooms on floors 2 through 34.',
          'On-site retail includes Goddess and the Baker for coffee and food, plus fitness studios like CycleBar and Club Pilates, so some daily stops happen without leaving home.',
          'That mix of a high-rise base and a dense, walkable neighborhood is what defines living in River North here.',
          'More than 20% of the homes carry an ADA designation, spanning Type A accessible/adaptable and Type AC floor plans, so the building serves a range of accessibility needs.',
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
        heading: 'Four stores within a half mile',
        paragraphs: [
          'Four grocery options within about a half mile make car-free shopping practical, whether you want a full supermarket, specialty items, or Italian market fare at Eataly.',
          'Whole Foods Market at 3 W Chicago Ave and Jewel-Osco at 550 N State St are both about 0.3 miles from the building, while Trader Joe\u2019s at 44 E Ontario St and Eataly at 43 E Ohio St are about 0.4 miles.',
        ],
      },
      {
        heading: 'Why this makes car-free easy',
        paragraphs: [
          'The short distances also make delivery and quick trips easy in River North, since every store is a walk of well under a mile from 165 W Superior St.',
          'Complimentary ground-floor bike storage gives residents a fast way to carry a larger haul home without a car.',
        ],
      },
      {
        heading: 'Can I shop without a car?',
        paragraphs: [
          'Yes. With a full supermarket, a specialty grocer, and an Italian market all within about a half mile, most residents handle weekly shopping on foot or by bike.',
          'The CTA Chicago Brown/Purple Line and Red Line stations are also nearby if you combine errands with a transit trip.',
        ],
      },
      {
        heading: 'What each store offers',
        paragraphs: [
          'Whole Foods Market and Jewel-Osco cover full-supermarket needs about 0.3 miles away, while Trader Joe\u2019s adds value-focused staples about 0.4 miles from the building.',
          'Eataly at 43 E Ohio St is a large Italian market and dining hall about 0.4 miles away, useful for specialty ingredients and prepared food.',
          'Together the four stores give River North residents a range of price points and styles without needing to leave the neighborhood.',
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
        heading: 'Two parks within a half mile',
        paragraphs: [
          'Two off-leash dog parks within about a half mile give dogs room to run beyond the on-site gated dog walk. Ohio Place Dog Park at 360 W Ohio St is about 0.3 miles away, and Larrabee Dog Park at 652 N Larrabee St is about 0.5 miles away.',
          'Because River North is compact and walkable, both parks are an easy walk from 165 W Superior St.',
        ],
      },
      {
        heading: 'On-site dog amenities',
        paragraphs: [
          'The building has a gated outdoor dog walk and a doggie spa and lounge, so residents can exercise and wash a dog without leaving home. The dog walk is part of the full-floor amenity deck.',
          'Between the on-site walk and the two nearby parks, dogs have options for both quick breaks and longer runs.',
        ],
      },
      {
        heading: 'What are the pet rules?',
        paragraphs: [
          'The building allows a maximum of 2 pets with no weight limits, though breed restrictions apply for dogs and the list is confirmed by the leasing office.',
          'Dog fees are one-time and non-refundable at $650 for one dog or $750 for two, with no deposit and no monthly pet rent.',
        ],
      },
      {
        heading: 'Green space beyond dog parks',
        paragraphs: [
          'For walks that are not off-leash, Washington Square Park at 901 N Clark St is about 0.3 miles away and A. Montgomery Ward Park at 630 N Kingsbury St sits along the Chicago River about 0.5 miles from the building.',
          'The river paths near A. Montgomery Ward Park give a longer route for exercising a dog while enjoying the waterfront.',
          'All pets must be registered with management, and the compact River North grid keeps every one of these parks within an easy walk of 165 W Superior St.',
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
        heading: 'What the building covers',
        paragraphs: [
          'The building covers everyday workouts with its fitness center, spin bikes, free weights, and boxing simulator, plus CycleBar, Club Pilates, and Train Moment on-site.',
          'The fitness center also has two private training rooms for focused sessions or personal training, and indoor amenities are open 24/7.',
        ],
      },
      {
        heading: 'Larger clubs nearby',
        paragraphs: [
          'For a larger club, East Bank Club at 500 N Kingsbury St is about 0.5 miles away and Equinox Gold Coast at 900 N Michigan Ave is about 0.6 miles away.',
          'Both are an easy walk from 165 W Superior St, so residents can pair the on-site gym with a full-service club membership.',
        ],
      },
      {
        heading: 'Do I need an outside gym?',
        paragraphs: [
          'Not necessarily. Between the 24/7 fitness center and the on-site CycleBar, Club Pilates, and Train Moment, many residents cover their routine without leaving the building.',
          'The wellness amenities extend to a 75-foot lap pool, an outdoor hot tub, and a sauna on the amenity floor.',
        ],
      },
      {
        heading: 'Getting to the nearby clubs',
        paragraphs: [
          'East Bank Club at 500 N Kingsbury St is a large multi-sport club about 0.5 miles from the building, and Equinox Gold Coast at 900 N Michigan Ave is about 0.6 miles away.',
          'Both are walkable in the flat, compact River North grid, and the CTA Chicago Red Line and Brown/Purple Line stations are nearby if you prefer a short ride.',
          'That combination lets residents keep the free on-site gym for daily workouts and add an outside club membership only if they want the extra facilities.',
          'The two private training rooms in the on-site fitness center also give a quieter option for personal training without a separate club.',
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
        heading: 'Public parks nearby',
        paragraphs: [
          'Washington Square Park at 901 N Clark St, Chicago\u2019s oldest existing park, is about 0.3 miles away, and A. Montgomery Ward Park at 630 N Kingsbury St sits along the Chicago River about 0.5 miles from the building.',
          'Both are an easy walk from 165 W Superior St, giving residents open green space within River North.',
        ],
      },
      {
        heading: 'The private park on-site',
        paragraphs: [
          'On-site, residents also have a private park with a sculpture by Pal Svensson, viewable from the full-floor amenity deck.',
          'The amenity floor overlooks both the private park and the Chicago skyline, so green space is part of the building itself, not just the neighborhood.',
        ],
      },
      {
        heading: 'What about dog parks?',
        paragraphs: [
          'Ohio Place Dog Park at 360 W Ohio St (about 0.3 miles) and Larrabee Dog Park at 652 N Larrabee St (about 0.5 miles) are within about a half mile for off-leash time.',
          'The building adds a gated outdoor dog walk and a doggie spa and lounge for residents with pets.',
        ],
      },
      {
        heading: 'How the parks fit car-free living',
        paragraphs: [
          'Because every one of these parks sits within about a half mile of 165 W Superior St, residents can reach green space on foot without a car.',
          'The CTA Chicago Brown/Purple Line and Red Line stations are also nearby if you want to reach larger lakefront parks or the Loop.',
          'Combined with the on-site private park and amenity deck, the neighborhood gives both quick outdoor breaks and longer walks within River North.',
          'A. Montgomery Ward Park\u2019s riverside setting also links to the Chicago River paths, extending an on-foot route well beyond the park itself.',
        ],
      },
    ],
    related: ['private-park', 'neighborhood-dog-parks', 'what-neighborhood', 'neighborhood-gyms'],
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
        heading: 'The gallery district',
        paragraphs: [
          'The blocks around Superior and Wells hold much of River North\u2019s gallery scene, along with restaurants and nightlife. The building sits in the heart of that district at 165 W Superior St.',
          'Cafes, chef-driven restaurants, and shops line the surrounding streets, giving the corner a dense mix of art and dining.',
        ],
      },
      {
        heading: 'Transit and groceries close by',
        paragraphs: [
          'The CTA Chicago Brown/Purple Line station is about two blocks west at Chicago & Franklin, and the Red Line at Chicago & State is roughly 0.3 miles away.',
          'Whole Foods at 3 W Chicago Ave is a few blocks northeast, with Trader Joe\u2019s and Jewel-Osco also within about a half mile.',
        ],
      },
      {
        heading: 'How far is downtown?',
        paragraphs: [
          'The Loop is roughly a mile south, about a 20-minute walk or a short ride on the Brown or Purple Line toward downtown.',
          'That central position makes Superior and Wells a practical base for reaching transit, groceries, and the Loop on foot.',
        ],
      },
      {
        heading: 'Parks and pet space near the corner',
        paragraphs: [
          'Washington Square Park at 901 N Clark St is about 0.3 miles from the corner, and Ohio Place Dog Park at 360 W Ohio St is also about 0.3 miles away for off-leash time.',
          'A. Montgomery Ward Park along the Chicago River is about 0.5 miles away, adding riverfront green space within an easy walk.',
          'The building itself contributes a private park with a sculpture by Pal Svensson and a full floor of amenities at 165 W Superior St.',
          'Larrabee Dog Park at 652 N Larrabee St, about 0.5 miles away, adds a second off-leash option near the corner for residents with dogs.',
        ],
      },
    ],
    related: ['what-neighborhood', 'neighborhood-dining', 'cta-proximity', 'neighborhood-groceries'],
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
        heading: 'A dense dining scene',
        paragraphs: [
          'River North combines art galleries with a dense restaurant and nightlife scene, from casual cafes to fine dining. Rooftop cocktail bars, speakeasies, and live-music venues fill out the evenings.',
          'On-site, Goddess and the Baker serves coffee and food, so a cafe stop does not require leaving the building.',
        ],
      },
      {
        heading: 'Beyond the neighborhood',
        paragraphs: [
          'Fulton Market and the West Loop, both short trips away, add some of Chicago\u2019s most notable restaurants. Old Town is another nearby hub for dining and nightlife.',
          'Eataly, the large Italian market and dining hall at 43 E Ohio St, is about 0.4 miles from the building.',
        ],
      },
      {
        heading: 'Can I get there without driving?',
        paragraphs: [
          'Yes. The CTA Chicago Brown/Purple Line and Red Line stations are within a short walk, and several bus routes serve the area, so nights out rarely require a car.',
          'The Loop, roughly a mile south, adds theaters and downtown restaurants within an easy walk or one transit stop.',
        ],
      },
      {
        heading: 'Coffee and quick bites',
        paragraphs: [
          'For casual stops, on-site Goddess and the Baker serves coffee and food inside the building, so a morning coffee run can happen without going outside.',
          'Eataly at 43 E Ohio St, about 0.4 miles away, combines an Italian market with cafes and restaurants for a quick meal or specialty ingredients.',
          'Between the on-site cafe, the surrounding gallery-district restaurants, and the nearby dining hubs, River North covers everything from a fast coffee to a full night out.',
          'Fulton Market, Old Town, and the West Loop are all short trips away, so a special-occasion dinner does not require going far from 165 W Superior St.',
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
      {
        heading: 'The mix of homes',
        paragraphs: [
          'The 298 apartments include studios, convertibles, one-, two-, and three-bedroom plans, sized from about 448 square feet up to a 1,528-square-foot three-bedroom on penthouse-level floors 30 through 34. Residents on floors 2 through 34 share the same finishes, including floor-to-ceiling windows, in-home washer/dryers, quartz countertops, and stainless-steel appliances.',
          'Nearly every home has a private balcony; the only exceptions are the 02 and 03 Convertible plans on floors 6 through 29. Live availability and pricing for each size are published on the Available Units page, synced automatically from the leasing system.',
        ],
      },
      {
        heading: 'Beyond the apartment count',
        paragraphs: [
          'The building pairs its 298 homes with a full floor of amenities, including a 75-foot lap pool, a sauna, a fitness center with two private training rooms, and a private park with a sculpture. A front desk is staffed 24 hours a day, and indoor amenities are open around the clock.',
          'The tower stands at 165 W Superior St in River North, about two blocks from the CTA Chicago Brown/Purple Line station.',
        ],
      },
      {
        heading: 'How the homes are distributed',
        paragraphs: [
          'The 298 residences fill floors 2 through 34, so a single address holds a full range of price points and outlooks under one roof. The largest homes, the three-bedroom, three-bath plans of up to 1,528 square feet, sit on the penthouse-level floors 30 through 34, while studios and convertibles near 448 square feet anchor the smaller end.',
          'This vertical mix means residents across the tower share the same amenity floor and 24-hour front desk regardless of which apartment they choose.',
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
    changeableFacts: true,
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
      {
        heading: 'Front desk versus leasing office',
        paragraphs: [
          'The front desk and the leasing office are two separate services. The front desk operates 24 hours a day for residents and guests, while the leasing office keeps set hours: Monday through Friday 9am–6pm and Saturday 10am–5pm, closed on Sunday.',
          'Route tours, applications, and general questions to the leasing office during those hours; the front desk covers day-to-day building needs at any time, including late-night arrivals.',
        ],
      },
      {
        heading: 'How amenity hours line up',
        paragraphs: [
          'Indoor amenities such as the fitness center, sauna, and work rooms are open 24/7, matching the round-the-clock front desk. Outdoor amenities, including the deck, pool area, grilling stations, and fire pits, close during quiet hours from 10pm to 6am.',
          'For urgent maintenance at any hour, current residents call the maintenance line at 312-883-5503, while routine requests go through the online resident portal.',
        ],
      },
      {
        heading: 'What the front desk handles',
        paragraphs: [
          'A 24-hour front desk means someone is on hand for package acceptance, guest check-in, and building access whether you arrive at midday or after a late flight. That coverage complements the completely smoke-free policy and the outdoor quiet hours from 10pm to 6am by keeping the shared spaces of the 34-story, 298-residence tower monitored around the clock, every day of the week.',
          'For questions the desk cannot answer, such as leasing, applications, or accessibility, reach the on-site team by email at exhibit@highlandptrs.com or by phone at 312-450-0635 during office hours, Monday through Saturday.',
        ],
      },
    ],
    related: ['leasing-office-hours', 'smoking-policy', 'who-manages-exhibit', 'resident-portal'],
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
      {
        heading: 'Which contact to use',
        paragraphs: [
          'For tours, applications, and general leasing questions, email exhibit@highlandptrs.com or call 312-450-0635 during office hours, Monday through Saturday. For urgent maintenance, current residents call the dedicated maintenance line at 312-883-5503, while routine requests go through the resident portal linked from the Residents page.',
          'You can also visit the on-site leasing office at 165 W Superior St, Chicago, IL 60654, open Monday through Friday 9am–6pm and Saturday 10am–5pm, closed on Sunday.',
        ],
      },
      {
        heading: 'Who runs the building day to day',
        paragraphs: [
          'The 34-story tower is professionally managed by a full-time on-site team, the same team that leases apartments and supports residents once they move in. A front desk is staffed 24 hours a day for packages, guests, and building access.',
          'Because the management team works on site rather than remotely, questions about the building, amenities, or your apartment reach people who are physically in the tower at 165 W Superior St.',
        ],
      },
      {
        heading: 'Reaching the team as a prospect or resident',
        paragraphs: [
          'Prospective renters use the same phone number and email to book tours and ask about live availability, which syncs automatically from the leasing system onto the Available Units page. There is no separate call center, so the people answering are the on-site leasing consultants.',
          'Current residents lean on the online resident portal for rent payments and routine requests and the dedicated maintenance line at 312-883-5503 for urgent issues, which keeps day-to-day building matters separate from the leasing inbox and its tour scheduling.',
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
    changeableFacts: true,
    category: 'Building & Services',
    answer:
      'The leasing office at Exhibit On Superior is open Monday through Friday 9am–6pm and Saturday 10am–5pm; it is closed on Sunday. You can tour, apply, or ask questions during these hours, or reach the team any time at exhibit@highlandptrs.com or 312-450-0635. The building front desk is staffed 24 hours a day.',
    sections: [
      {
        paragraphs: [
          'Saturday hours make it easy to tour outside of a standard workweek.',
          'To reserve a specific time, use the Schedule a Tour page or contact the leasing team directly.',
        ],
      },
      {
        heading: 'What you can do during office hours',
        paragraphs: [
          'The leasing office at 165 W Superior St handles tours, online applications, and general questions in person Monday through Friday 9am–6pm and Saturday 10am–5pm. A leasing consultant can also confirm short-term lease options, walk you through screening, and match an ADA-designated home to your needs.',
          'Because the office is closed on Sunday, the Saturday 10am–5pm window is the main weekend option for an in-person visit.',
        ],
      },
      {
        heading: 'What if the office is closed?',
        paragraphs: [
          'Outside office hours you can still reach the team by email at exhibit@highlandptrs.com or by phone at 312-450-0635, and the building front desk is staffed 24 hours a day for residents and guests. Current residents with an urgent maintenance issue call the maintenance line at 312-883-5503 at any time.',
          'To lock in a specific tour slot, submit the tour request form on the Schedule a Tour page with your preferred move-in date and floor plan.',
        ],
      },
      {
        heading: 'Planning a weekday or weekend visit',
        paragraphs: [
          'Weekday visitors have the widest window, 9am to 6pm Monday through Friday, which suits lunchtime or after-work tours. Weekend renters get the Saturday 10am–5pm slot, a practical option for anyone who cannot step away during the workweek.',
          'The office sits at 165 W Superior St in River North, about two blocks from the CTA Chicago Brown/Purple Line station, so reaching it by transit is straightforward on either a weekday or Saturday.',
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
    description:
      'Exhibit On Superior is at 165 W Superior St, Chicago, IL 60654, in River North \u2014 two blocks from the CTA Brown/Purple Line. Contact leasing at 312-450-0635.',
    sections: [
      {
        paragraphs: [
          'The building sits near Superior and Wells, about two blocks from the CTA Chicago Brown/Purple Line station.',
          'The attached indoor garage lets drivers arrive without street parking; guests can use SpotHero or street parking nearby.',
        ],
      },
      {
        heading: 'How to reach the building',
        paragraphs: [
          'The CTA Chicago station on the Brown and Purple Lines, at Chicago and Franklin, is about two blocks away, and the Chicago Red Line station at Chicago and State is roughly 0.3 miles. The #66 Chicago Avenue bus runs one block north, and the Loop is roughly a mile south, about a 20-minute walk or one short Brown Line ride.',
          'Drivers can use the attached indoor multi-level garage, with unreserved parking at $335 per month subject to availability. The Map + Directions page has driving, transit, and parking routes to 165 W Superior St.',
        ],
      },
      {
        heading: 'What is around the address',
        paragraphs: [
          'The tower sits in River North\u2019s gallery district, with cafes and restaurants within the surrounding blocks and Whole Foods a few blocks northeast. On-site retail, including CycleBar and Club Pilates, sits at street level of the building itself.',
          'This 34-story, 298-residence tower has a 24-hour staffed front desk, so packages and guests are handled at the same central address at any hour.',
        ],
      },
      {
        heading: 'Directions for guests and deliveries',
        paragraphs: [
          'Guests arriving by car can use SpotHero or nearby street parking, since the building does not offer dedicated guest parking, while the attached indoor garage serves residents at $335 per month subject to availability. Riders can take the Brown or Purple Line to the Chicago station at Chicago and Franklin, or the Red Line to Chicago and State about 0.3 miles away.',
          'Because the front desk operates around the clock, couriers and visitors can be received at 165 W Superior St at any hour rather than only during business hours.',
        ],
      },
    ],
    related: ['what-neighborhood', 'cta-proximity', 'how-many-apartments', 'accessibility-contact'],
    links: [
      { label: 'Map + Directions', href: '/map-directions' },
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Parking & Transportation', href: '/parking-transportation' },
    ],
  },
  {
    slug: 'resident-portal',
    question: 'How do Exhibit On Superior residents pay rent and get repairs?',
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
      {
        heading: 'Routine versus urgent maintenance',
        paragraphs: [
          'Submit routine maintenance requests through the resident portal, where you can describe the issue and track it. For urgent problems, current residents call the dedicated maintenance line at 312-883-5503 directly rather than waiting on a portal ticket.',
          'The front desk is staffed 24 hours a day, so building-access and package questions are covered around the clock even outside office hours.',
        ],
      },
      {
        heading: 'How do I get portal access?',
        paragraphs: [
          'The online resident portal is reached from the Residents page and is available to current residents for payments, requests, and community updates. Setup and login questions go to the leasing office at exhibit@highlandptrs.com or 312-450-0635 during office hours, Monday through Saturday.',
          'Because rent payments run through the portal securely, residents avoid paper checks and can pay from a phone or computer at any time.',
        ],
      },
      {
        heading: 'What else the portal keeps in one place',
        paragraphs: [
          'Beyond rent and maintenance, the portal is where residents follow building announcements, resident events, and community news, so updates about amenity spaces or the seasonal pool and hot tub schedule arrive in a single feed. Because the pool closes in late September and the hot tub closes at the first snowfall, these seasonal notices are a practical reason to check the portal. That makes it the primary hub for staying current with day-to-day life in the 34-story tower.',
          'For anything the portal does not cover, the front desk staffed 24 hours a day handles packages, guests, and building access, and the on-site leasing office fields general questions during posted hours, Monday through Saturday.',
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
      {
        heading: 'Where the ratings come from',
        paragraphs: [
          'The ratings and quotes on the Reviews page come straight from the community\u2019s Google Business Profile, so what you see reflects real resident feedback about day-to-day life at 165 W Superior St. The aggregate rating and the individual quotes both draw from that same live source rather than being curated by the leasing team.',
          'Pulling directly from Google keeps the star rating and review count honest and current instead of frozen in a static testimonial block.',
        ],
      },
      {
        heading: 'What if I want more than reviews?',
        paragraphs: [
          'Reviews are a starting point, but touring is the surest way to judge the finishes and skyline outlooks, which vary by floor across the 34-story tower. Book an in-person showing from the Schedule a Tour page, or preview homes and amenities remotely with the video and Matterport virtual tours.',
          'For anything the reviews don\u2019t answer, contact the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'Why reviews are pulled live',
        paragraphs: [
          'Ratings that update automatically from the Google Business Profile stay in sync with what current residents are saying, rather than sitting frozen in a static testimonial section. This live approach means the star rating and review count on the Reviews page reflect the community as it is today.',
          'Pairing that feedback with the Photo Gallery and the Available Units page, which shows live rent and move-in dates, gives a well-rounded view of the building before you schedule a visit.',
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
      `For accessibility questions at Exhibit On Superior — including ADA-designated apartments, accessible unit features, or reasonable accommodation requests — contact the leasing team at exhibit@highlandptrs.com or 312-450-0635. Per the as-built accessibility matrix, ${ADA_COUNTS.total} apartments carry an ADA designation (${ADA_COUNTS.a} Type A “(A)” and ${ADA_COUNTS.ac} Type A with conduit line “(AC)”), browsable with the ADA-accessible filter on the Available Units page. The building has a 24-hour staffed front desk.`,
    sections: [
      {
        paragraphs: [
          "The leasing office can match an accessible home to your needs. Contact leasing to verify the apartment's current configuration and discuss specific accessibility needs, since installed components vary by unit.",
          'To request a reasonable accommodation or modification, reach the team by phone or email.',
        ],
      },
      {
        heading: 'What the ADA designations mean',
        paragraphs: [
          'Two designations appear in the as-built accessibility matrix. A Type A residence, marked (A), is an accessible or adaptable home, while a Type A unit with conduit line, marked (AC), is Type A with conduit run for future accessibility components. Installed features can differ between units carrying the same designation.',
          'You can browse these homes yourself using the ADA-accessible filter on the Available Units page, which narrows the list to floor plans with designated apartments and shows which apartment numbers carry each mark.',
        ],
      },
      {
        heading: 'How to reach the building in person',
        paragraphs: [
          'The on-site leasing office is at 165 W Superior St, Chicago, IL 60654, in River North, and a front desk is staffed 24 hours a day for building access. The tower is about two blocks from the CTA Chicago Brown/Purple Line station for step-free transit access.',
          'For accommodation requests or to confirm a specific unit\u2019s configuration before applying, email exhibit@highlandptrs.com or call 312-450-0635.',
        ],
      },
      {
        heading: 'When to raise accessibility needs',
        paragraphs: [
          'It helps to discuss accessibility early, ideally before you apply, so the leasing office can match a designated home to your needs and confirm which installed features a specific apartment currently has. More than 20% of the tower\u2019s homes carry an ADA designation, giving several floor plans to consider.',
          'Requests for a reasonable accommodation or modification can be made at any point by phone or email, and the on-site team can also arrange an in-person or virtual tour of a designated apartment.',
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
      {
        heading: 'Where the policy applies',
        paragraphs: [
          'Being completely smoke-free means the restriction covers indoor and outdoor spaces alike, from individual apartments to the full-floor amenity deck with its 75-foot lap pool, sauna, and fitness center. It also extends to the outdoor deck, the four grilling stations, the four fire pits, the private park, and every shared common area.',
          'Because there are no designated smoking areas anywhere on the premises, the policy is uniform across all 298 residences and the shared spaces of the 34-story tower.',
        ],
      },
      {
        heading: 'How the policy is supported',
        paragraphs: [
          'A smoke-free building keeps common areas and neighboring apartments free of drifting smoke, which supports the wellness-focused amenities such as the sauna and lap pool. A front desk staffed 24 hours a day helps keep an eye on shared spaces.',
          'For details on this policy or other building rules, including pet registration and the Dog Rider, contact the on-site leasing team at exhibit@highlandptrs.com or 312-450-0635.',
        ],
      },
      {
        heading: 'What it means for balconies and outdoor areas',
        paragraphs: [
          'Because the policy is completely smoke-free, it reaches private balconies and the shared outdoor deck as well as indoor apartments, so there is no exception for stepping outside within the property. Nearly every home has a private balcony, and none of them is a permitted smoking spot.',
          'The same rule covers the amenity floor\u2019s outdoor spaces, including the four grilling stations and four fire pits, which otherwise stay available year-round outside the 10pm to 6am quiet hours.',
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
