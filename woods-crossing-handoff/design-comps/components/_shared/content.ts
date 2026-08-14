// Real Woods Crossing content pulled from the migration bundle (scraped Aug 6, 2026).
// Facts flagged uncertain in the bundle keep the bundle's wording; confirm before launch.

export const property = {
  name: "Woods Crossing",
  address: "850 N. Hwy 89, North Salt Lake, UT 84054",
  phone: "(801) 896-9844",
  phoneHref: "tel:+18018969844",
  email: "utah@highlandptrs.com",
  eyebrow: "1 & 2 Bedroom Apartments near Downtown Salt Lake City",
  h1: "Woods Crossing Apartments in North Salt Lake, UT",
  intro:
    "A pet-friendly apartment community on the mountain bench in North Salt Lake — minutes from downtown Salt Lake City, with one- and two-bedroom homes, covered parking, a pool, clubhouse, and playground.",
  startingRent: "$1,199",
  officeHours: "Mon–Fri 9:00 AM – 5:00 PM",
};

const img = (f: string) => `/__mockup/images/woods-crossing/${f}`;

export const photos = {
  hero: img("woods-crossing-apartments-in-north-salt-lake-ut.jpg"),
  exterior: img("exterior-woods-crossing.jpg"),
  aerial: img("aerial-view-woods-crossing.jpg"),
  clubhouse: img("clubhouse-woods-crossing.jpg"),
  lounge: img("clubhouse-lounge-woods-crossing.jpg"),
  pool: img("swimming-pool-woods-crossing.jpg"),
  playground: img("playground-and-picnic-table-woods-crossing.jpg"),
  living: img("living-room-with-kitchen-and-carpeted-flooring-woods-crossin.jpg"),
  bedroom: img("bedroom-woods-crossing.jpg"),
  kitchen: img("kitchen-with-wood-style-cabinets-and-flooring-with-patio-ent.jpg"),
  monument: img("monument-sign-woods-crossing.jpg"),
  layoutA: img("woods-crossing-apartments-floor-plan-layout-a.jpg"),
  layoutB: img("woods-crossing-apartments-floor-plan-layout-b.jpg"),
  layoutC: img("woods-crossing-apartments-floor-plan-layout-c.jpg"),
  layoutD: img("woods-crossing-apartments-floor-plan-layout-d.jpg"),
};

export const floorPlans = [
  { name: "Layout A", beds: "1 Bed", baths: "1 Bath", sqft: "684 sq ft", from: "$1,199", image: photos.layoutA },
  { name: "Layout B", beds: "2 Bed", baths: "1 Bath", sqft: "864 sq ft", from: "$1,389", image: photos.layoutB },
  { name: "Layout C", beds: "2 Bed", baths: "2 Bath", sqft: "822 sq ft", from: "$1,420", image: photos.layoutC },
  { name: "Layout D", beds: "2 Bed", baths: "1.5 Bath", sqft: "888 sq ft", from: "$1,389", image: photos.layoutD },
];

export const apartmentAmenities = [
  "Walk-in closets",
  "Reserved covered parking",
  "Air conditioning",
  "Washer & dryer hookups",
  "Large private balconies or patios",
  "Large windows for natural light",
];

export const communityAmenities = [
  "Swimming pool",
  "Clubhouse",
  "Playground",
  "Onsite management",
  "24-hour emergency maintenance",
  "Pet friendly (up to 2 pets)",
];

export const neighborhood = [
  { name: "Eaglewood Golf Course", note: "Mountain-side golf minutes up the bench" },
  { name: "Downtown Salt Lake City", note: "Temple Square & City Creek shopping, minutes away" },
  { name: "Foxboro North Regional Park", note: "Trails, fields, and weekend afternoons nearby" },
  { name: "Bountiful favorites", note: "Local bakeries, soda shops, and restaurants close by" },
];

export const review = {
  body: "Wonderful management, helpful and kind. The property is clean and quiet.",
  date: "June 2026",
};
