export type PageKind =
  | "home"
  | "floorPlans"
  | "availability"
  | "gallery"
  | "amenities"
  | "neighborhood"
  | "petFriendly"
  | "reviews"
  | "contact"
  | "tour"
  | "apply"
  | "residents"
  | "virtualLeasing"
  | "fees"
  | "rentalScams"
  | "article";

export type Faq = {
  question: string;
  answer: string;
};

export type SitePage = {
  path: string;
  canonicalPath?: string;
  kind: PageKind;
  title: string;
  description: string;
  h1: string;
  eyebrow?: string;
  answer: string;
  sourceUrl: string;
  markdownTwin?: string;
  updatedNote?: string;
  sections?: Array<{ heading: string; body: string[] }>;
  faqs?: Faq[];
};

export const sourceDate = "August 6, 2026";
export const finalDomain = "https://www.woodscrossingslc.com";

export const property = {
  name: "Woods Crossing",
  legalName: "Woods Crossing Apartments",
  address: "850 N. Hwy 89, North Salt Lake, UT 84054",
  streetAddress: "850 N. Hwy 89",
  city: "North Salt Lake",
  region: "UT",
  postalCode: "84054",
  country: "US",
  phone: "(801) 896-9844",
  phoneHref: "tel:+18018969844",
  email: "utah@highlandptrs.com",
  emailHref: "mailto:utah@highlandptrs.com",
  latitude: 40.856926,
  longitude: -111.898871,
  officeHours: [
    "Monday - Friday: 09:00 AM - 05:00 PM",
    "Saturday - Sunday: Closed",
  ],
  residentPortal: "https://woodscrossing.goprisma.com/auth/login",
  googleMaps: "https://g.page/woodscrossingapartments?share",
};

export const images = {
  logo: "/assets/source/woods-crossing-logo-45509360.png",
  hero: "/assets/source/woods-crossing-apartments-in-north-salt-lake-ut-97b3f1b3.jpg",
  exterior: "/assets/source/exterior-woods-crossing-02e0d1bd.jpg",
  aerial: "/assets/source/aerial-view-woods-crossing-da56fb88.jpg",
  clubhouse: "/assets/source/clubhouse-woods-crossing-89befd99.jpg",
  lounge: "/assets/source/clubhouse-lounge-woods-crossing-54fc51e2.jpg",
  pool: "/assets/source/swimming-pool-woods-crossing-b08c0869.jpg",
  playground: "/assets/source/playground-and-picnic-table-woods-crossing-c1ad6099.jpg",
  living: "/assets/source/living-room-with-kitchen-and-carpeted-flooring-woods-crossin-39d8575a.jpg",
  bedroom: "/assets/source/bedroom-woods-crossing-6744a928.jpg",
  kitchen: "/assets/source/kitchen-with-wood-style-cabinets-and-flooring-with-patio-ent-7808e919.jpg",
  monument: "/assets/source/monument-sign-woods-crossing-5e87ad2b.jpg",
  layoutA: "/assets/source/woods-crossing-apartments-floor-plan-layout-a-c586b4e2.jpg",
  layoutB: "/assets/source/woods-crossing-apartments-floor-plan-layout-b-8658e05e.jpg",
  layoutC: "/assets/source/woods-crossing-apartments-floor-plan-layout-c-88376517.jpg",
  layoutD: "/assets/source/woods-crossing-apartments-floor-plan-layout-d-3b1ef126.jpg",
};

export const apartmentAmenities = [
  "Walk-in closets",
  "Dishwasher",
  "Reserved covered parking",
  "Air conditioning",
  "Storage space",
  "Washer and dryer hookups",
  "Spacious living area",
  "Large private balconies or patios",
  "Large windows for natural light",
];

export const communityAmenities = [
  "Convenient location",
  "Swimming pool",
  "Playground",
  "Clubhouse",
  "Guest parking",
  "Onsite management",
  "Flexible lease terms available",
  "Resident referral programs",
  "24-hour emergency maintenance service",
  "Close to shopping, dining, and entertainment",
];

export const floorPlans = [
  {
    name: "Layout A",
    bedrooms: "1",
    bathrooms: "1.0",
    squareFeet: "684",
    deposit: "$300",
    from: "$1,199",
    available: "2 apartments available",
    image: images.layoutA,
  },
  {
    name: "Layout B",
    bedrooms: "2",
    bathrooms: "1.0",
    squareFeet: "864",
    deposit: "$300",
    from: "$1,389",
    available: "2 apartments available",
    image: images.layoutB,
  },
  {
    name: "Layout C",
    bedrooms: "2",
    bathrooms: "2.0",
    squareFeet: "822",
    deposit: "$300",
    from: "$1,420",
    available: "1 apartment available",
    image: images.layoutC,
  },
  {
    name: "Layout D",
    bedrooms: "2",
    bathrooms: "1.5",
    squareFeet: "888",
    deposit: "$300",
    from: "$1,389",
    available: "2 apartments available",
    image: images.layoutD,
  },
];

export const availableUnits = [
  { unit: "6A", rent: "$1,350", available: "Today", type: "1x1.0", squareFeet: "684 sq ft", layout: "Layout A" },
  { unit: "7E", rent: "$1,199", available: "September 10, 2026", type: "1x1.0", squareFeet: "684 sq ft", layout: "Layout A" },
  { unit: "8F", rent: "$1,399", available: "Today", type: "2x1.0", squareFeet: "864 sq ft", layout: "Layout B" },
  { unit: "1D", rent: "$1,389", available: "September 10, 2026", type: "2x1.0", squareFeet: "864 sq ft", layout: "Layout B" },
  { unit: "1G", rent: "$1,420", available: "August 12, 2026", type: "2x2.0", squareFeet: "822 sq ft", layout: "Layout C" },
  { unit: "1H", rent: "$1,389", available: "September 10, 2026", type: "2x1.5", squareFeet: "888 sq ft", layout: "Layout D" },
  { unit: "8J", rent: "$1,449", available: "September 10, 2026", type: "2x1.5", squareFeet: "888 sq ft", layout: "Layout D" },
];

export const localPlaces = [
  { name: "All Pet Grooming", category: "Pet grooming", phone: "801-296-2018", address: "3221 S Highway 89, Bountiful, UT 84010" },
  { name: "Sips Drive Thru Soda Shop", category: "Soda shop", phone: "385-399-1035", address: "2223 S Main Street, Bountiful, UT 84010" },
  { name: "Parson's Bakery", category: "Bakery", phone: "801-298-3059", address: "535 W 2600 S, Bountiful, UT 84010" },
  { name: "Plates & Palates", category: "Restaurant", phone: "801-292-2425", address: "390 North 500 West, Bountiful, UT 84010" },
];

export const nearbyHighlights = [
  {
    name: "Eaglewood Golf Course",
    body: "The source site describes Eaglewood Golf Course as a mountain-side course near Woods Crossing.",
  },
  {
    name: "Temple Square",
    body: "Temple Square is listed by the source site as a downtown Salt Lake City destination minutes from the community.",
  },
  {
    name: "City Creek Shopping Center",
    body: "City Creek Shopping Center is listed as a downtown shopping and dining destination near Woods Crossing.",
  },
  {
    name: "Foxboro North Regional Park",
    body: "The source site names Foxboro North Regional Park as a nearby place to spend a free afternoon or weekend.",
  },
];

export const petPolicy = [
  { label: "Dog deposit", value: "$250" },
  { label: "Cat deposit", value: "$250" },
  { label: "Dog rent", value: "$45" },
  { label: "Cat rent", value: "$45" },
  { label: "Pet count", value: "Up to 2 pets per apartment" },
  { label: "Restrictions", value: "Breed restrictions apply; confirm current policy with the leasing office." },
];

export const reviews = [
  { author: "Null", date: "June 01, 2026", body: "Wonderful management, helpful and kind. The property is clean and quiet." },
  { author: "Rob Crosby", date: "May 31, 2026", body: "Adrian and Jesse were helpful with the move and made it a good experience." },
  { author: "Landon Jolley", date: "May 29, 2026", body: "Management is professional, the apartment was clean at move-in, and the area has been a good fit." },
  { author: "Patrick Crosby", date: "May 16, 2026", body: "The property manager and superintendent were friendly, patient, and helpful during the apartment process." },
  { author: "Kara Salmon", date: "April 07, 2026", body: "The tour was accommodating and the apartments looked great." },
];

export const commonFaqs: Faq[] = [
  {
    question: "Where is Woods Crossing located?",
    answer: "Woods Crossing is located at 850 N. Hwy 89 in North Salt Lake, Utah 84054.",
  },
  {
    question: "What floor plans does Woods Crossing offer?",
    answer: "The source site lists one- and two-bedroom apartment layouts from 684 to 888 approximate square feet.",
  },
  {
    question: "Is Woods Crossing pet-friendly?",
    answer: "Yes. The source site lists dog and cat deposits, monthly pet rent, and a policy of up to two pets per apartment with breed restrictions.",
  },
  {
    question: "How do renters contact Woods Crossing?",
    answer: "Renters can call Woods Crossing at (801) 896-9844, use the contact page, or email utah@highlandptrs.com.",
  },
  {
    question: "Are rents and availability guaranteed on this rebuild?",
    answer: `No. Rents, specials, deposits, and availability were copied from the public source site on ${sourceDate} and should be confirmed before launch.`,
  },
];

export const pages: SitePage[] = [
  {
    path: "/",
    kind: "home",
    title: "North Salt Lake Apartments | Woods Crossing",
    description: "Explore Woods Crossing, a North Salt Lake apartment community with one- and two-bedroom homes, covered parking, a pool, clubhouse, playground, and pet-friendly living.",
    h1: "Woods Crossing Apartments in North Salt Lake, UT",
    eyebrow: "1 and 2 Bedroom Apartments near Downtown Salt Lake City",
    answer: `As of ${sourceDate}, Woods Crossing is a pet-friendly apartment community at 850 N. Hwy 89 in North Salt Lake, Utah. The public source site lists one- and two-bedroom floor plans, rents starting at $1,199, a swimming pool, clubhouse, playground, covered parking, and onsite management.`,
    sourceUrl: "https://www.woodscrossingslc.com/",
    markdownTwin: "/markdown/home.md",
    updatedNote: `Source scrape completed ${sourceDate}. Prices, availability, fees, specials, and policies need leasing-office confirmation before launch.`,
    faqs: commonFaqs,
  },
  {
    path: "/floor-plans",
    kind: "floorPlans",
    title: "Floor Plans | Woods Crossing North Salt Lake Apartments",
    description: "Compare Woods Crossing one- and two-bedroom floor plans in North Salt Lake, including approximate square footage, deposits, and source-listed starting rents.",
    h1: "Woods Crossing Floor Plans",
    eyebrow: "Layouts A-D",
    answer: `As of ${sourceDate}, Woods Crossing lists four apartment layouts: one-bedroom Layout A and two-bedroom Layouts B, C, and D. Approximate floor plan sizes range from 684 to 888 square feet, with source-listed starting rents from $1,199 to $1,420 and $300 deposits.`,
    sourceUrl: "https://www.woodscrossingslc.com/floor-plans",
    markdownTwin: "/markdown/floor-plans.md",
    faqs: commonFaqs,
  },
  {
    path: "/apartment-search",
    canonicalPath: "/apartment-search",
    kind: "availability",
    title: "Apartment Search | Woods Crossing Availability",
    description: "Review source-listed Woods Crossing apartment availability, unit rents, move-in dates, and layout types from the public apartment search page.",
    h1: "Apartment Search",
    eyebrow: "Current Source-Listed Availability",
    answer: `As of ${sourceDate}, the source apartment-search page lists seven available apartments at Woods Crossing, with rents from $1,199 to $1,449 and move-in dates ranging from today to September 10, 2026. The source also says to call for August specials.`,
    sourceUrl: "https://www.woodscrossingslc.com/apartment-search",
    markdownTwin: "/markdown/apartment-search.md",
    faqs: commonFaqs,
  },
  {
    path: "/gallery",
    kind: "gallery",
    title: "Photo Gallery | Woods Crossing Apartments",
    description: "View Woods Crossing apartment, clubhouse, swimming pool, playground, exterior, and neighborhood photos copied from the authorized public source site.",
    h1: "Woods Crossing Photo Gallery",
    eyebrow: "Apartments, Amenities, and Community Photos",
    answer: "The Woods Crossing gallery includes public photos of apartment interiors, clubhouse spaces, the swimming pool, playground, exterior, monument sign, and aerial community views.",
    sourceUrl: "https://www.woodscrossingslc.com/gallery",
    markdownTwin: "/markdown/gallery.md",
    faqs: commonFaqs,
  },
  {
    path: "/north-salt-lake-ut/amenities",
    kind: "amenities",
    title: "Amenities | Woods Crossing Apartments North Salt Lake",
    description: "See apartment and community amenities at Woods Crossing, including walk-in closets, covered parking, pool, playground, clubhouse, and onsite management.",
    h1: "Woods Crossing Amenities",
    eyebrow: "Apartment and Community Features",
    answer: "Woods Crossing amenities include walk-in closets, dishwashers, reserved covered parking, air conditioning, storage space, washer and dryer hookups, large private balconies or patios, a swimming pool, playground, clubhouse, guest parking, onsite management, and 24-hour emergency maintenance service.",
    sourceUrl: "https://www.woodscrossingslc.com/north-salt-lake-ut/amenities",
    markdownTwin: "/markdown/amenities.md",
    faqs: commonFaqs,
  },
  {
    path: "/north-salt-lake-ut/neighborhood",
    kind: "neighborhood",
    title: "Neighborhood | Woods Crossing North Salt Lake",
    description: "Explore places near Woods Crossing in North Salt Lake and Bountiful, including restaurants, parks, shopping, Temple Square, and City Creek.",
    h1: "North Salt Lake Neighborhood",
    eyebrow: "Dining, Parks, Shopping, and Salt Lake City Access",
    answer: "Woods Crossing is located in North Salt Lake near Bountiful, with the source site naming nearby restaurants, parks, shopping, Eaglewood Golf Course, Temple Square, City Creek Shopping Center, and Foxboro North Regional Park.",
    sourceUrl: "https://www.woodscrossingslc.com/north-salt-lake-ut/neighborhood",
    markdownTwin: "/markdown/neighborhood.md",
    faqs: commonFaqs,
  },
  {
    path: "/pet-friendly",
    kind: "petFriendly",
    title: "Pet-Friendly Apartments | Woods Crossing",
    description: "Review Woods Crossing pet-friendly apartment information, including source-listed dog and cat deposits, pet rent, and policy notes.",
    h1: "Pet-Friendly Apartments in North Salt Lake",
    eyebrow: "Dogs and Cats Welcome",
    answer: "Woods Crossing is listed as a pet-friendly community. The public source site lists a $250 dog deposit, $250 cat deposit, $45 dog rent, $45 cat rent, up to two pets per apartment, and breed restrictions.",
    sourceUrl: "https://www.woodscrossingslc.com/pet-friendly",
    markdownTwin: "/markdown/pet-friendly.md",
    faqs: commonFaqs,
  },
  {
    path: "/reviews",
    kind: "reviews",
    title: "Reviews | Woods Crossing Apartments",
    description: "Read source-listed resident review highlights and current review summary information for Woods Crossing in North Salt Lake.",
    h1: "Woods Crossing Reviews",
    eyebrow: "Resident Feedback",
    answer: `As of the ${sourceDate} source scrape, the reviews page displayed a 4.34 rating and 136 total reviews for Woods Crossing. Review content should be verified through the approved reputation source before launch.`,
    sourceUrl: "https://www.woodscrossingslc.com/reviews",
    markdownTwin: "/markdown/reviews.md",
    faqs: commonFaqs,
  },
  {
    path: "/contact",
    kind: "contact",
    title: "Contact Woods Crossing | North Salt Lake Apartments",
    description: "Contact Woods Crossing Apartments at 850 N. Hwy 89 in North Salt Lake, Utah. Call (801) 896-9844 or use the leasing contact form.",
    h1: "Contact Woods Crossing",
    eyebrow: "Leasing Office",
    answer: "Woods Crossing can be reached by phone at (801) 896-9844. The source contact page lists office hours of Monday-Friday, 9:00 AM-5:00 PM, and Saturday-Sunday closed.",
    sourceUrl: "https://www.woodscrossingslc.com/contact",
    markdownTwin: "/markdown/contact.md",
    faqs: commonFaqs,
  },
  {
    path: "/schedule-a-tour",
    kind: "tour",
    title: "Schedule a Tour | Woods Crossing Apartments",
    description: "Schedule a tour of Woods Crossing Apartments in North Salt Lake, Utah. All tour requests are pending until confirmed by the leasing team.",
    h1: "Schedule a Tour",
    eyebrow: "In-Person Tour Requests",
    answer: "Prospective renters can request a tour of Woods Crossing through the schedule-a-tour page or by calling (801) 896-9844. The source page says all tours are pending until confirmed by the leasing team.",
    sourceUrl: "https://www.woodscrossingslc.com/schedule-a-tour",
    markdownTwin: "/markdown/schedule-a-tour.md",
    faqs: commonFaqs,
  },
  {
    path: "/apply-online",
    kind: "apply",
    title: "Apply Online | Woods Crossing Apartments",
    description: "Start a Woods Crossing application request and confirm current availability before applying.",
    h1: "Apply to Woods Crossing",
    eyebrow: "Application Requests",
    answer: "The source application page asks renters to contact Woods Crossing for availability before applying. It collects first name, last name, email, phone, and approximate move-in date.",
    sourceUrl: "https://www.woodscrossingslc.com/apply-online",
    markdownTwin: "/markdown/apply-online.md",
    faqs: commonFaqs,
  },
  {
    path: "/residents",
    kind: "residents",
    title: "Resident Portal | Woods Crossing",
    description: "Find Woods Crossing resident portal links for online rent payment, maintenance requests, and resident resources.",
    h1: "Resident Resources",
    eyebrow: "Pay Rent and Request Maintenance",
    answer: "The Woods Crossing source site links resident payment, maintenance requests, and suggestion-box actions to the Prisma resident portal.",
    sourceUrl: "https://www.woodscrossingslc.com/residents",
    markdownTwin: "/markdown/residents.md",
    faqs: commonFaqs,
  },
  {
    path: "/virtual-leasing",
    kind: "virtualLeasing",
    title: "Virtual Leasing | Woods Crossing Apartments",
    description: "Learn how Woods Crossing supports virtual leasing, online applications, lease signing, and move-in coordination.",
    h1: "Virtual Leasing at Woods Crossing",
    eyebrow: "Remote Leasing Steps",
    answer: "Woods Crossing supports virtual leasing through floor plan review, online applications, move-in scheduling, electronic lease signing, and key pickup coordination.",
    sourceUrl: "https://www.woodscrossingslc.com/virtual-leasing",
    markdownTwin: "/markdown/virtual-leasing.md",
    faqs: commonFaqs,
  },
  {
    path: "/disclosure-fees",
    kind: "fees",
    title: "Rental Fee Disclosure | Woods Crossing",
    description: "Rental fee disclosure page for Woods Crossing. The source page used an embedded MarketApts fee guide that needs final confirmation before launch.",
    h1: "Rental Fees Disclosure",
    eyebrow: "Fee Guide",
    answer: "The source rental-fee disclosure page contains an embedded MarketApts fee guide. The scraped HTML did not expose fee amounts as plain text, so fees must be confirmed through the fee-guide provider or leasing team before launch.",
    sourceUrl: "https://www.woodscrossingslc.com/disclosure-fees",
    markdownTwin: "/markdown/disclosure-fees.md",
    faqs: commonFaqs,
  },
  {
    path: "/rental-scams",
    kind: "rentalScams",
    title: "Avoid Rental Scams | Woods Crossing",
    description: "Read Woods Crossing rental-scam safety guidance, including tips for verifying listings, payments, leases, and official communication channels.",
    h1: "Avoid Rental Scams",
    eyebrow: "Renter Safety Guidance",
    answer: "The Woods Crossing source site warns that scammers may use the property name or property manager name without authorization. Renters should use official channels, verify listings, avoid suspicious payment requests, and report suspected fraud.",
    sourceUrl: "https://www.woodscrossingslc.com/rental-scams",
    markdownTwin: "/markdown/rental-scams.md",
    sections: [
      {
        heading: "How Woods Crossing says renters should verify a listing",
        body: [
          "The source page tells renters to confirm that they are dealing with a legitimate property owner, property manager, or leasing agent before making financial commitments.",
          "Renters are told to go directly to the official property or manager website instead of trusting a link sent by text, email, or social media.",
        ],
      },
      {
        heading: "Payment and lease warnings",
        body: [
          "The source page warns against cash, wire, Venmo, Zelle, PayPal, or similar requests before an application or lease is complete.",
          "The source page tells renters not to pay money before signing a written lease agreement, except for documented application payments tied to an actual application.",
        ],
      },
      {
        heading: "What to do if something seems wrong",
        body: [
          "The source page says renters who suspect fraud should report it to local law enforcement or the Federal Trade Commission.",
          "Renters should preserve phone numbers, email addresses, messages, and payment details connected to suspected scams.",
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    path: "/accessibility-statement",
    kind: "article",
    title: "Accessibility Statement | Woods Crossing",
    description: "Accessibility statement for Woods Crossing Apartments and website accessibility contact guidance.",
    h1: "Accessibility Statement",
    eyebrow: "Website Accessibility",
    answer: "Woods Crossing states that it works to make the website accessible and usable, and asks users who experience website access difficulty to contact the community.",
    sourceUrl: "https://www.woodscrossingslc.com/accessibility-statement",
    markdownTwin: "/markdown/accessibility-statement.md",
    sections: [
      {
        heading: "General use statement",
        body: [
          "Woods Crossing Apartments states that it is committed to providing a website that is accessible to a wide audience.",
          "The source page says the website strives to conform to W3C WCAG 2.0 Level A guidelines.",
          "The source page asks visitors who have difficulty accessing the Woods Crossing website to contact the community.",
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    path: "/privacy-policy",
    kind: "article",
    title: "Privacy Policy | Woods Crossing",
    description: "Privacy policy summary for Woods Crossing, including contact information and source-listed data collection categories.",
    h1: "Privacy Policy",
    eyebrow: "Website Privacy",
    answer: "The Woods Crossing privacy policy page summarizes the property address, contact phone number, contact email address, website data collection categories, cookie use, communication preferences, and opt-out guidance.",
    sourceUrl: "https://www.woodscrossingslc.com/privacy-policy",
    markdownTwin: "/markdown/privacy-policy.md",
    sections: [
      {
        heading: "Current contact information",
        body: [
          "Postal address: 850 N. Hwy 89, North Salt Lake, UT 84054.",
          "Phone: (801) 896-9844.",
          "Email: utah@highlandptrs.com.",
        ],
      },
      {
        heading: "Privacy-policy content to confirm before legal launch",
        body: [
          "The source policy describes collection of domain names, email addresses where possible, page-access information, information volunteered by users, contact information, and payment information.",
          "The source policy says the website uses cookies for preferences, sessions, page access, returning-visitor activity, advertising controls, and content customization.",
          "Because privacy policies are legal content, ownership, current manager details, and opt-out instructions should be reviewed before launch.",
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    path: "/terms-of-service",
    kind: "article",
    title: "Terms of Service | Woods Crossing",
    description: "Terms of service summary for Woods Crossing, including source-listed use license, disclaimer, limitations, links, and Utah governing law.",
    h1: "Terms of Service",
    eyebrow: "Website Terms",
    answer: "The Woods Crossing source terms cover website use, a temporary personal-use license, warranty disclaimers, liability limits, linked sites, revision rights, and Utah governing law.",
    sourceUrl: "https://www.woodscrossingslc.com/terms-of-service",
    markdownTwin: "/markdown/terms-of-service.md",
    sections: [
      {
        heading: "Source-listed terms topics",
        body: [
          "The source terms say visitors agree to applicable laws and local-law compliance when accessing the website.",
          "The source terms grant a temporary, personal, non-commercial viewing license and restrict copying, modification, commercial use, decompiling, removing proprietary notices, and mirroring.",
          "The source terms include disclaimers, limitations of liability, revision rights, linked-site responsibility limits, and Utah governing law.",
        ],
      },
      {
        heading: "Legal review note",
        body: [
          "The full scraped terms text is preserved in the source markdown inventory. Confirm the final legal entity, manager, policies, and governing-language requirements before publishing legal pages.",
        ],
      },
    ],
    faqs: commonFaqs,
  },
];

export const aliases: Record<string, string> = {
  "/amenities": "/north-salt-lake-ut/amenities",
  "/neighborhood": "/north-salt-lake-ut/neighborhood",
  "/availability": "/apartment-search",
  "/apply-now": "/apply-online",
  "/virtual-tours": "/virtual-leasing",
  "/terms": "/terms-of-service",
  "/termsofservice": "/terms-of-service",
};

export function pageByPath(path: string): SitePage | undefined {
  const normalized = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
  const resolved = aliases[normalized] ?? normalized;
  return pages.find((page) => page.path === resolved);
}

export function canonicalPathFor(page: SitePage): string {
  return page.canonicalPath ?? page.path;
}
