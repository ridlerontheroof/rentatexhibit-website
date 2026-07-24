// Central SEO / AEO data for Exhibit On Superior.
// Source of truth: migration bundle seo-aeo-metadata + faq-answer-bank + schema manifest.

export const SITE_URL = 'https://www.rentatexhibit.com';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-card.jpg`;

export const AVAILABILITY_URL = 'https://www.highlandptrs.com/exhibit-on-superior';
export const APPLY_URL = 'https://www.highlandptrs.com/exhibit-on-superior';
/** External "Schedule a Tour" destination (Highland Partners property page). */
export const TOUR_URL = 'https://www.highlandptrs.com/exhibit-on-superior';

export interface Faq {
  q: string;
  a: string;
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
    ogImage: `${SITE_URL}/images/og/home.jpg`,
    label: 'Exhibit On Superior',
    title: 'Luxury Apartments in River North Chicago | Exhibit On Superior',
    description:
      'Luxury apartments in River North Chicago — studio to three-bedroom homes with skyline views, a full floor of amenities, and on-site retail.',
    quickAnswer:
      'Exhibit On Superior is a luxury high-rise apartment community at 165 W Superior St in Chicago\u2019s River North neighborhood with studio, one, two, and three-bedroom apartments, a full floor of luxury amenities, on-site retail, and quick access to downtown neighborhoods.',
    faqs: [
      {
        q: 'Where is Exhibit On Superior located?',
        a: 'Exhibit On Superior is located at 165 W Superior St, Chicago, IL 60654 in the River North area.',
      },
      {
        q: 'What apartment sizes are available at Exhibit On Superior?',
        a: 'The community offers studio, one, two, and three-bedroom apartment homes. Current availability is maintained through Highland Management LLC.',
      },
      {
        q: 'How do I check current availability?',
        a: 'Use the Available Units link to view current Exhibit On Superior availability through Highland Management LLC.',
      },
    ],
  },
  '/available-units': {
    path: '/available-units',
    ogImage: `${SITE_URL}/images/og/floor-plans.jpg`,
    label: 'Available Units',
    title: 'Available Units & Floor Plans | Exhibit On Superior Chicago',
    description:
      'Browse available apartments at Exhibit On Superior in River North Chicago with live pricing, photos, and move-in dates, then compare every studio, 1, 2 & 3 bedroom floor plan.',
    quickAnswer:
      'This page lists every currently available Exhibit On Superior apartment with live rent, photos, and move-in dates, updated automatically from the leasing system. You can also compare every studio, one, two, and three-bedroom floor plan and apply directly from each available listing.',
    faqs: [
      {
        q: 'What apartments are available now at Exhibit On Superior?',
        a: 'The listings at the top of this page show every residence currently available, with live rent, photos, and move-in dates synced from our leasing system.',
      },
      {
        q: 'Does Exhibit On Superior have studio apartments?',
        a: 'Yes. Exhibit On Superior includes studio floor plan options along with one, two, and three-bedroom homes.',
      },
      {
        q: 'How do I apply for an apartment?',
        a: 'Open any available residence on this page and use its Apply Now button — each unit links directly to its own secure online application.',
      },
    ],
  },
  '/photo-gallery': {
    path: '/photo-gallery',
    ogImage: `${SITE_URL}/images/og/photo-gallery.jpg`,
    label: 'Photo Gallery',
    title: 'Photo Gallery | Exhibit On Superior Chicago Apartments',
    description:
      "View apartment, amenity, skyline, and community photos for Exhibit On Superior in Chicago's River North neighborhood.",
    quickAnswer:
      'The Exhibit On Superior photo gallery shows apartment interiors, amenity spaces, skyline views, and community areas for the River North Chicago property.',
    faqs: [
      {
        q: 'What can I see in the Exhibit On Superior photo gallery?',
        a: 'The gallery includes apartment interiors, amenity spaces, city views, pool and fitness areas, lounges, and shared community spaces.',
      },
      {
        q: 'Can I tour the community virtually?',
        a: 'Yes. Use the Virtual Tour page for Matterport and video tour content.',
      },
    ],
  },
  '/virtual-tour': {
    path: '/virtual-tour',
    ogImage: `${SITE_URL}/images/og/virtual-tour.jpg`,
    label: 'Virtual Tour',
    title: 'Virtual Tours | Exhibit On Superior Apartments Chicago',
    description:
      'Take a virtual tour of Exhibit On Superior apartments and amenities in River North Chicago with video and Matterport tour embeds.',
    quickAnswer:
      'The virtual tour page lets renters preview Exhibit On Superior remotely through video and Matterport tours of apartment homes and amenity spaces.',
    faqs: [
      {
        q: 'Does Exhibit On Superior offer virtual tours?',
        a: 'Yes. The virtual tour page includes video and Matterport tour embeds for apartment and amenity previews.',
      },
      {
        q: 'Can I still schedule an in-person tour?',
        a: 'Yes. Prospects can schedule an in-person tour through the Schedule a Tour form, or contact the leasing team by phone or email.',
      },
    ],
  },
  '/amenities': {
    path: '/amenities',
    ogImage: `${SITE_URL}/images/og/amenities.jpg`,
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
        a: 'Front-desk and concierge staffing details are not published on this site \u2014 confirm current service hours with the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
      },
    ],
  },
  '/pet-friendly': {
    path: '/pet-friendly',
    ogImage: `${SITE_URL}/images/og/pet-friendly.jpg`,
    label: 'Pet Friendly',
    title: 'Pet-Friendly Apartments in River North | Exhibit On Superior',
    description:
      'Learn about pet-friendly living at Exhibit On Superior in Chicago, including dog and cat-friendly apartment content and on-site pet amenities.',
    quickAnswer:
      'Exhibit On Superior is a pet-friendly River North apartment community for cats and dogs, with pet-focused amenities such as a dog spa and outdoor dog walk. Confirm current pet fees, limits, and breed policies with the leasing team.',
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
        a: 'Pet fees, deposits, and any breed or weight guidelines are not published on this site \u2014 confirm current amounts with the leasing team at exhibit@highlandptrs.com or 312-450-0635 before applying.',
      },
      {
        q: 'Should renters confirm current pet rules?',
        a: 'Yes. Pet fees, limits, and breed policies should be confirmed with the leasing team before applying.',
      },
    ],
  },
  '/neighborhood': {
    path: '/neighborhood',
    ogImage: `${SITE_URL}/images/og/neighborhood.jpg`,
    label: 'Neighborhood',
    title: 'River North Neighborhood | Exhibit On Superior Chicago',
    description:
      'Explore the River North location around Exhibit On Superior, close to dining, cafes, shopping, parks, the Chicago River, West Loop, Old Town, and Fulton Market.',
    quickAnswer:
      'Exhibit On Superior is in River North, with quick access to downtown Chicago dining, cafes, shopping, the Chicago River, West Loop, Old Town, and Fulton Market.',
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
    ],
  },
  '/apartment-guide': {
    path: '/apartment-guide',
    ogImage: `${SITE_URL}/images/og/apartment-guide.jpg`,
    label: 'Apartment Guide',
    title: 'Apartment Guide: Layouts, Finishes & Views | Exhibit On Superior',
    description:
      'A complete guide to Exhibit On Superior apartments — studio, convertible, 1, 2 & 3 bedroom layouts, finishes, appliances, in-home laundry, balconies, and skyline views.',
    quickAnswer:
      'Exhibit On Superior offers studio, convertible, one, two, and three-bedroom apartments from about 448 to 1,528 square feet across floors 2\u201334, finished with driftwood plank floors, quartz countertops, stainless-steel appliances, in-home washers and dryers, floor-to-ceiling windows, and private balconies.',
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
        a: 'Private balconies are a signature apartment feature at Exhibit On Superior. Whether a specific residence includes one varies by floor plan \u2014 check the floor-plan sheet on the Available Units page or confirm with the leasing team.',
      },
      {
        q: 'What views are available?',
        a: 'Homes feature dramatic floor-to-ceiling windows with panoramic views of the Chicago skyline; outlooks vary by floor and unit position within the 34-story tower.',
      },
      {
        q: 'What is the largest apartment available?',
        a: 'The largest floor plan is a three-bedroom, three-bath residence of 1,528 square feet, offered on the penthouse-level floors 30\u201334.',
      },
      {
        q: 'Are furnished apartments available?',
        a: 'Furnished apartments are not advertised on the site. Ask the leasing team at exhibit@highlandptrs.com or 312-450-0635 about current options.',
      },
      {
        q: 'Is storage or accessibility information available?',
        a: 'Select homes include closet organizers and double vanities. For storage options and accessible-unit details, confirm with the leasing team before applying.',
      },
    ],
  },
  '/fees': {
    path: '/fees',
    ogImage: `${SITE_URL}/images/og/fees.jpg`,
    label: 'Fees & Leasing Costs',
    title: 'Fees, Utilities & Leasing Costs | Exhibit On Superior Chicago',
    description:
      'What it costs to lease at Exhibit On Superior in River North Chicago — application fees, utilities included with rent, and how to confirm parking and other charges.',
    quickAnswer:
      'Beyond monthly rent, current Exhibit On Superior listings show a per-application fee (recently $60\u2013$75 depending on the unit), and water, sewer, trash, and gas are included with rent. Confirm any other charges \u2014 such as move-in, administrative, pet, or parking fees \u2014 with the leasing team before applying.',
    faqs: [
      {
        q: 'How much does it cost to live at Exhibit On Superior?',
        a: 'Rent depends on the floor plan, floor, and move-in date. Live pricing for every available residence is published on the Available Units page, synced automatically from the leasing system.',
      },
      {
        q: 'What fees are required in addition to rent?',
        a: 'Each unit\u2019s listing shows its application fee \u2014 recent listings ranged from $60 to $75 per application. For any other charges, such as administrative or move-in fees, confirm with the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
      },
      {
        q: 'Are utilities included?',
        a: 'Yes, in part. Current listings include water, sewer, trash, and gas with rent. Confirm electricity, internet, and any other utility arrangements with the leasing team.',
      },
      {
        q: 'Does Exhibit offer move-in specials?',
        a: 'Move-in specials change over time and are not published on this site. Ask the leasing team at exhibit@highlandptrs.com or 312-450-0635 about current offers.',
      },
      {
        q: 'How much is parking?',
        a: 'Parking rates are not published on this site. Contact the leasing team for current parking options and pricing, and see the Parking & Transportation page for transit alternatives.',
      },
    ],
  },
  '/parking-transportation': {
    path: '/parking-transportation',
    ogImage: `${SITE_URL}/images/og/parking-transportation.jpg`,
    label: 'Parking & Transportation',
    title: 'Parking & Transportation | Exhibit On Superior River North',
    description:
      'Getting around from Exhibit On Superior at 165 W Superior St — CTA Brown, Purple & Red Line stations, bus routes, highway access, and how to confirm on-site parking.',
    quickAnswer:
      'Exhibit On Superior sits about two blocks from the CTA Chicago (Brown/Purple Line) station at Chicago & Franklin and about 0.3 miles from the Chicago (Red Line) station at Chicago & State, with the #66 Chicago Avenue bus one block north and the Loop roughly a mile south. Confirm on-site parking options and rates with the leasing team.',
    faqs: [
      {
        q: 'Does Exhibit On Superior have on-site parking?',
        a: 'Parking options, availability, and rates are not published on this site \u2014 confirm current details with the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
      },
      {
        q: 'How far is Exhibit from the CTA?',
        a: 'The CTA Chicago station on the Brown and Purple Lines (Chicago & Franklin) is about two blocks away, and the Chicago Red Line station at Chicago & State is roughly 0.3 miles \u2014 both an easy walk.',
      },
      {
        q: 'Is Exhibit walkable to the Loop?',
        a: 'Yes. The Loop is roughly a mile south \u2014 about a 20-minute walk, or one short ride on the Brown Line from the Chicago station toward the Loop.',
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
    ogImage: `${SITE_URL}/images/og/application-guide.jpg`,
    label: 'Application Guide',
    title: 'Application & Qualification Guide | Exhibit On Superior',
    description:
      'How to apply for an apartment at Exhibit On Superior — the online application process, what to have ready, and how to confirm screening, guarantor, and lease-term details.',
    quickAnswer:
      'To apply for an apartment at Exhibit On Superior, open any residence on the Available Units page and use its Apply Now button \u2014 each unit links to its own secure online application through the AppFolio leasing system. Income requirements, guarantor policies, and lease terms are confirmed by the leasing team at exhibit@highlandptrs.com or 312-450-0635.',
    faqs: [
      {
        q: 'How do I apply for an apartment at Exhibit On Superior?',
        a: 'Open any available residence on the Available Units page and use its Apply Now button \u2014 each unit links directly to its own secure online application through the AppFolio leasing system.',
      },
      {
        q: 'What income is required to qualify?',
        a: 'Income and credit screening criteria are not published on this site. Contact the leasing team at exhibit@highlandptrs.com or 312-450-0635 before applying so you know exactly what to expect.',
      },
      {
        q: 'Are guarantors accepted?',
        a: 'Guarantor and co-signer policies are confirmed by the leasing team \u2014 reach out at exhibit@highlandptrs.com or 312-450-0635 before you apply.',
      },
      {
        q: 'How long does approval take?',
        a: 'Approval timing varies with screening and verification. The leasing team can walk you through the current timeline when you apply.',
      },
      {
        q: 'What lease terms are available?',
        a: 'Available lease terms vary by unit and season and are confirmed by the leasing team \u2014 ask about the terms offered for the residence you\u2019re interested in.',
      },
      {
        q: 'What should I have ready to apply?',
        a: 'Online rental applications typically ask for government-issued ID, proof of income, and rental history contacts. The leasing team will confirm the exact documents required for your application.',
      },
      {
        q: 'Can I tour before applying?',
        a: 'Yes. Schedule an in-person tour through the Schedule a Tour page, or preview homes remotely with the video and Matterport tours on the Virtual Tour page.',
      },
    ],
  },
  '/faq': {
    path: '/faq',
    ogImage: `${SITE_URL}/images/og/faq.jpg`,
    label: 'FAQ',
    title: 'Frequently Asked Questions | Exhibit On Superior Chicago',
    description:
      'Answers to the most common questions about Exhibit On Superior in River North Chicago — apartments, pricing and fees, amenities, pets, the neighborhood, touring, and applying.',
    quickAnswer:
      'This FAQ hub collects verified answers to the questions renters ask most about Exhibit On Superior \u2014 covering apartments and floor plans, pricing and fees, amenities, pet policy, the River North neighborhood, and how to tour and apply \u2014 each linking to a detail page with more depth.',
    faqs: [], // populated from FAQ_HUB_TOPICS below
  },
  '/contact-us': {
    path: '/contact-us',
    ogImage: `${SITE_URL}/images/og/contact-us.jpg`,
    label: 'Contact Us',
    title: 'Contact Exhibit On Superior | River North Chicago Apartments',
    description:
      "Contact Exhibit On Superior in Chicago's River North neighborhood. Email exhibit@highlandptrs.com or call 312-450-0635.",
    quickAnswer:
      'To contact Exhibit On Superior, email exhibit@highlandptrs.com, call 312-450-0635, or visit 165 W Superior St, Chicago, IL 60654.',
    faqs: [
      { q: 'What is the email for Exhibit On Superior?', a: 'The contact email is exhibit@highlandptrs.com.' },
      { q: 'What is the phone number for Exhibit On Superior?', a: 'The phone number is 312-450-0635.' },
      { q: 'What is the address?', a: 'The address is 165 W Superior St, Chicago, IL 60654.' },
    ],
  },
  '/map-directions': {
    path: '/map-directions',
    ogImage: `${SITE_URL}/images/og/map-directions.jpg`,
    label: 'Map + Directions',
    title: 'Map & Directions | Exhibit On Superior Chicago IL',
    description:
      "Get map and direction information for Exhibit On Superior at 165 W Superior St in Chicago's River North neighborhood.",
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
    ogImage: `${SITE_URL}/images/og/residents.jpg`,
    label: 'Residents',
    title: 'Resident Resources | Exhibit On Superior',
    description:
      'Resident resource page for Exhibit On Superior with portal, payment, maintenance, and contact information.',
    quickAnswer:
      'The residents page helps current residents find portal, payment, maintenance, and contact resources for Exhibit On Superior.',
    faqs: [
      {
        q: 'Who should residents contact?',
        a: 'Residents can contact Exhibit On Superior at exhibit@highlandptrs.com or 312-450-0635.',
      },
    ],
  },
  '/schedule-a-tour': {
    path: '/schedule-a-tour',
    ogImage: `${SITE_URL}/images/og/schedule-a-tour.jpg`,
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
  '/reviews': {
    path: '/reviews',
    ogImage: `${SITE_URL}/images/og/reviews.jpg`,
    label: 'Reviews',
    title: 'Reviews | Exhibit On Superior Chicago Apartments',
    description:
      "Read reviews for Exhibit On Superior and connect with verified review sources for this River North Chicago apartment community.",
    quickAnswer:
      'This page connects renters to current, verifiable review sources for Exhibit On Superior in River North Chicago.',
    faqs: [
      {
        q: 'Where do reviews come from?',
        a: 'Reviews come from current, verifiable sources such as the Google Business Profile.',
      },
    ],
  },
  '/privacy-policy': {
    path: '/privacy-policy',
    label: 'Privacy Policy',
    title: 'Privacy Policy | Exhibit On Superior',
    description:
      'Read the privacy policy for Exhibit On Superior, managed by Highland Management LLC, covering how we collect, use, and protect your information.',
    quickAnswer:
      'This page explains how Exhibit On Superior and Highland Management LLC collect, use, and protect the information you share through the website.',
    faqs: [],
    noindex: true,
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
        a: 'The community is managed by Highland Management LLC.',
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
        a: 'The community offers studio, convertible, one, two, and three-bedroom apartment homes from about 448 to 1,528 square feet across floors 2\u201334.',
      },
      {
        q: 'Do apartments have in-unit laundry?',
        a: 'Yes. In-home washer/dryers are a standard apartment feature.',
      },
      {
        q: 'What finishes do apartments have?',
        a: 'Homes feature driftwood plank floors, quartz countertops, tiled backsplashes, stainless-steel appliances, floor-to-ceiling windows, and private balconies.',
      },
      {
        q: 'What is the largest apartment?',
        a: 'A three-bedroom, three-bath residence of 1,528 square feet on the penthouse-level floors 30\u201334.',
      },
      {
        q: 'Are furnished apartments available?',
        a: 'Furnished apartments are not advertised on the site \u2014 ask the leasing team about current options.',
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
        a: 'The Available Units page lists every available residence with live rent, photos, and move-in dates synced from the leasing system.',
      },
      {
        q: 'What fees are required in addition to rent?',
        a: 'Each unit\u2019s listing shows its application fee (recently $60\u2013$75 per application). Confirm any other charges with the leasing team.',
      },
      {
        q: 'Are utilities included?',
        a: 'Current listings include water, sewer, trash, and gas with rent. Confirm electricity, internet, and other utilities with the leasing team.',
      },
      {
        q: 'Does Exhibit offer move-in specials?',
        a: 'Specials change over time and are not published here \u2014 ask the leasing team about current offers.',
      },
      {
        q: 'How much is parking?',
        a: 'Parking rates are not published on this site; contact the leasing team for current options and pricing.',
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
        a: 'Amenities include a full-floor amenity deck, fitness center, 75-foot lap pool, outdoor hot tub, sauna, lounges, work and meeting rooms, music studio, dog spa, grilling stations, fire pits, and outdoor areas.',
      },
      {
        q: 'Does Exhibit On Superior have a pool?',
        a: 'Yes \u2014 a 75-foot lap pool on the amenity floor, plus an outdoor hot tub and sauna.',
      },
      {
        q: 'Is there space to work from home?',
        a: 'Yes. Private work and meeting rooms, a tech lounge with charging stations and kitchen, a library nook, and reading alcoves.',
      },
      {
        q: 'Does Exhibit have on-site retail?',
        a: 'Yes. On-site retail and wellness options include fitness, food, and spa services.',
      },
      {
        q: 'Is there a 24-hour concierge?',
        a: 'Front-desk and concierge staffing details are not published on this site \u2014 confirm with the leasing team.',
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
        a: 'Yes. Cats and dogs are welcome, with a maximum of 2 pets per apartment.',
      },
      {
        q: 'Are there pet amenities?',
        a: 'Yes \u2014 a doggie spa and lounge inside the building and a gated outdoor dog walk.',
      },
      {
        q: 'What are the pet fees and breed rules?',
        a: 'Pet fees, limits, and breed policies should be confirmed with the leasing team before applying.',
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
        a: 'Exhibit On Superior is in River North in Chicago.',
      },
      {
        q: 'How close is the CTA?',
        a: 'The Chicago Brown/Purple Line station (Chicago & Franklin) is about two blocks away; the Chicago Red Line station (Chicago & State) is roughly 0.3 miles.',
      },
      {
        q: 'Is Exhibit close to a grocery store?',
        a: 'Yes. Whole Foods (3 W Chicago Ave), Jewel-Osco (550 N State St), and Trader Joe\u2019s (44 E Ontario St) are all within about half a mile.',
      },
      {
        q: 'Is Exhibit walkable to the Loop?',
        a: 'Yes \u2014 the Loop is roughly a mile south, about a 20-minute walk or one Brown Line stop.',
      },
      {
        q: 'What is nearby?',
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
        a: 'Use the tour request form on the Schedule a Tour page, email exhibit@highlandptrs.com, or call 312-450-0635.',
      },
      {
        q: 'Can I tour virtually?',
        a: 'Yes. The Virtual Tour page includes video and Matterport tour embeds for apartment and amenity previews.',
      },
      {
        q: 'How do I apply?',
        a: 'Open any available residence on the Available Units page and use its Apply Now button \u2014 each unit links directly to its own secure online application.',
      },
      {
        q: 'What income is required and are guarantors accepted?',
        a: 'Screening criteria and guarantor policies are not published on this site \u2014 confirm with the leasing team before applying.',
      },
      {
        q: 'What lease terms are available?',
        a: 'Lease terms vary by unit and season and are confirmed by the leasing team.',
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
        a: 'Residents can contact Exhibit On Superior at exhibit@highlandptrs.com or 312-450-0635.',
      },
      {
        q: 'Where should residents log in?',
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

const WEBSITE_NODE = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}#website`,
  name: 'Exhibit On Superior',
  url: SITE_URL,
  publisher: { '@id': `${SITE_URL}#organization` },
};

const ORGANIZATION_NODE = {
  '@type': 'Organization',
  '@id': `${SITE_URL}#organization`,
  name: 'Highland Management LLC',
  url: SITE_URL,
  email: 'exhibit@highlandptrs.com',
  telephone: '312-450-0635',
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/images/image-001-exhibit-on-superior-logo-color-a7pvg4-1805w.webp`,
    width: 1805,
    height: 621,
  },
};

const APARTMENT_COMPLEX_NODE = {
  '@type': 'ApartmentComplex',
  '@id': `${SITE_URL}#apartmentcomplex`,
  name: 'Exhibit On Superior',
  alternateName: 'Exhibit on Superior Apartments',
  url: SITE_URL,
  mainEntityOfPage: `${SITE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/images/image-001-exhibit-on-superior-logo-color-a7pvg4-1805w.webp`,
    width: 1805,
    height: 621,
  },
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
    'Exhibit On Superior is a luxury high-rise apartment community at 165 W Superior St in Chicago\u2019s River North neighborhood with studio, one, two, and three-bedroom apartments, a full floor of luxury amenities, on-site retail, and quick access to downtown neighborhoods.',
  telephone: '312-450-0635',
  email: 'exhibit@highlandptrs.com',
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
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '10:00', closes: '17:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '12:00', closes: '17:00' },
  ],
  hasMap: 'https://www.google.com/maps?cid=15240815771270963454',
  tourBookingPage: TOUR_URL,
  petsAllowed:
    'Cats and dogs are welcome; confirm current pet fees, limits, and policy details with the leasing team.',
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
    'Lap pool',
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
    'Private balconies',
    'In-home washer/dryer',
    'Quartz countertops',
    'Stainless-steel appliances',
    'Wired for 1GB internet',
  ].map((name) => ({ '@type': 'LocationFeatureSpecification', name })),
};

/** Build the JSON-LD @graph for a page path. */
export function buildJsonLd(path: string): Record<string, unknown> {
  const page = PAGE_SEO[path];
  const canonical = canonicalFor(path);
  const idBase = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;

  const webPage = {
    '@type': 'WebPage',
    '@id': `${idBase}#webpage`,
    url: canonical,
    name: page?.title,
    description: page?.description,
    isPartOf: { '@id': `${SITE_URL}#website` },
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
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
    { name: 'robots', content: isNoindex ? 'noindex, follow' : 'index, follow' },
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
    const json = JSON.stringify(obj).replace(/</g, '\\u003c');
    parts.push(`<script type="application/ld+json">${json}</script>`);
  }
  return parts.join('\n    ');
}
