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
    ],
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
      'Prospective renters can schedule a tour of Exhibit On Superior using the tour request form on this page — including requesting a specific available apartment — or by emailing exhibit@highlandptrs.com or calling 312-450-0635.',
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
