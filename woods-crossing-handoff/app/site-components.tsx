/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { GalleryLightbox, type GalleryImage } from "./gallery-lightbox";
import {
  apartmentAmenities,
  availableUnits,
  canonicalPathFor,
  commonFaqs,
  communityAmenities,
  finalDomain,
  floorPlans,
  images,
  localPlaces,
  nearbyHighlights,
  pages,
  petPolicy,
  property,
  reviews,
  sourceDate,
  type Faq,
  type SitePage,
} from "./site-data";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || finalDomain).replace(/\/$/, "");
const leasingFormAction =
  process.env.NEXT_PUBLIC_LEASING_FORM_ENDPOINT || "https://www.woodscrossingslc.com/contact";
const tourFormAction =
  process.env.NEXT_PUBLIC_TOUR_FORM_ENDPOINT || "https://www.woodscrossingslc.com/schedule-a-tour";
const applicationFormAction =
  process.env.NEXT_PUBLIC_APPLICATION_FORM_ENDPOINT || "https://www.woodscrossingslc.com/apply-online";

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function metadataForPage(page: SitePage): Metadata {
  const canonical = absoluteUrl(canonicalPathFor(page));
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical },
    openGraph: {
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: property.name,
      type: "website",
      images: [
        {
          url: absoluteUrl(images.hero),
          width: 1920,
          height: 1080,
          alt: "Woods Crossing clubhouse and community interior",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [absoluteUrl(images.hero)],
    },
  };
}

function propertySchema() {
  return {
    "@type": "ApartmentComplex",
    "@id": `${baseUrl}/#apartmentcomplex`,
    name: property.name,
    url: baseUrl,
    image: absoluteUrl(images.exterior),
    telephone: property.phone,
    email: property.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.streetAddress,
      addressLocality: property.city,
      addressRegion: property.region,
      postalCode: property.postalCode,
      addressCountry: property.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude,
    },
    petsAllowed: "Dogs and cats allowed; up to two pets per apartment, with breed restrictions according to the source site.",
    amenityFeature: [...apartmentAmenities, ...communityAmenities].map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    priceRange: "$1199-$1449 as listed on the source site on August 6, 2026",
  };
}

function pageSchema(page: SitePage) {
  const canonical = absoluteUrl(canonicalPathFor(page));
  const graph: object[] = [
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: property.name,
      url: baseUrl,
      publisher: { "@id": `${baseUrl}/#apartmentcomplex` },
    },
    propertySchema(),
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: page.title,
      description: page.description,
      isPartOf: { "@id": `${baseUrl}/#website` },
      about: { "@id": `${baseUrl}/#apartmentcomplex` },
      dateModified: "2026-08-06",
      inLanguage: "en-US",
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-block"],
      },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: page.h1, item: canonical },
      ],
    },
  ];

  if (page.faqs?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  if (page.kind === "availability" || page.kind === "floorPlans") {
    graph.push({
      "@type": "OfferCatalog",
      "@id": `${baseUrl}/floor-plans#offercatalog`,
      name: "Woods Crossing floor plans",
      itemListElement: floorPlans.map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        priceCurrency: "USD",
        price: plan.from.replace(/[$,]/g, ""),
        availability: "https://schema.org/InStock",
        itemOffered: {
          "@type": "Apartment",
          name: `${property.name} ${plan.name}`,
          numberOfRooms: plan.bedrooms,
          floorSize: {
            "@type": "QuantitativeValue",
            value: plan.squareFeet,
            unitCode: "FTK",
          },
        },
      })),
    });
  }

  if (page.kind === "reviews") {
    graph.push({
      "@type": "AggregateRating",
      itemReviewed: { "@id": `${baseUrl}/#apartmentcomplex` },
      ratingValue: "4.34",
      reviewCount: "136",
      bestRating: "5",
      worstRating: "1",
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function JsonLd({ page }: { page: SitePage }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema(page)) }}
    />
  );
}

function Header() {
  const nav = [
    { href: "/floor-plans", label: "Floor Plans" },
    { href: "/apartment-search", label: "Availability" },
    { href: "/gallery", label: "Gallery" },
    { href: "/north-salt-lake-ut/amenities", label: "Amenities" },
    { href: "/north-salt-lake-ut/neighborhood", label: "Neighborhood" },
    { href: "/pet-friendly", label: "Pets" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="topbar">
        <a href={property.phoneHref}>{property.phone}</a>
        <span>{property.address}</span>
        <a href={property.googleMaps}>Map It</a>
        <a href={property.residentPortal}>Residents</a>
      </div>
      <nav className="main-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">
          <img src={images.logo} alt="Woods Crossing logo" width="164" height="80" />
        </Link>
        <div className="nav-links">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <Link className="nav-cta" href="/schedule-a-tour">
          Schedule Tour
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <img src={images.logo} alt="Woods Crossing logo" width="138" height="67" />
        <p>{property.address}</p>
        <p>
          <a href={property.phoneHref}>{property.phone}</a> ·{" "}
          <a href={property.emailHref}>{property.email}</a>
        </p>
      </div>
      <div>
        <h2>Leasing</h2>
        <Link href="/floor-plans">View Floor Plans</Link>
        <Link href="/apartment-search">Check Availability</Link>
        <Link href="/apply-online">Apply Online</Link>
        <Link href="/schedule-a-tour">Schedule a Tour</Link>
      </div>
      <div>
        <h2>Residents</h2>
        <a href={property.residentPortal}>Pay Rent</a>
        <a href={property.residentPortal}>Maintenance Request</a>
        <Link href="/residents">Resident Resources</Link>
        <Link href="/rental-scams">Avoid Rental Scams</Link>
      </div>
      <div>
        <h2>Site</h2>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms-of-service">Terms of Service</Link>
        <Link href="/accessibility-statement">Accessibility Statement</Link>
        <Link href="/disclosure-fees">Rental Fee Disclosure</Link>
      </div>
    </footer>
  );
}

function Hero({ page }: { page: SitePage }) {
  return (
    <section className={`hero hero-${page.kind}`}>
      <img src={images.hero} alt="Woods Crossing clubhouse interior" width="1920" height="1080" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.h1}</h1>
        <p>{page.answer}</p>
        <div className="hero-actions" aria-label="Primary actions">
          <Link className="button primary" href="/apartment-search">
            Check Availability
          </Link>
          <Link className="button secondary" href="/schedule-a-tour">
            Schedule a Tour
          </Link>
        </div>
      </div>
    </section>
  );
}

function PageIntro({ page }: { page: SitePage }) {
  return (
    <section className="page-intro">
      <p className="eyebrow">{page.eyebrow}</p>
      <h1>{page.h1}</h1>
      <p className="answer-block">{page.answer}</p>
      <div className="source-note">
        <span>Source: </span>
        <a href={page.sourceUrl}>{page.sourceUrl}</a>
        {page.markdownTwin ? (
          <>
            <span> · Markdown twin: </span>
            <a href={page.markdownTwin}>{page.markdownTwin}</a>
          </>
        ) : null}
      </div>
    </section>
  );
}

function FactBar() {
  return (
    <section className="fact-bar" aria-label="Key Woods Crossing facts">
      <div>
        <strong>Address</strong>
        <span>{property.address}</span>
      </div>
      <div>
        <strong>Floor Plans</strong>
        <span>1 and 2 bedrooms</span>
      </div>
      <div>
        <strong>Source Rents</strong>
        <span>$1,199-$1,449</span>
      </div>
      <div>
        <strong>Office</strong>
        <span>{property.phone}</span>
      </div>
    </section>
  );
}

function ImageCard({ src, alt, title, body }: { src: string; alt: string; title: string; body: string }) {
  return (
    <article className="image-card">
      <img src={src} alt={alt} width="800" height="600" loading="lazy" />
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}

function HomePage({ page }: { page: SitePage }) {
  return (
    <>
      <Hero page={page} />
      <FactBar />
      <main id="main-content">
        <section className="split-section">
          <div>
            <p className="eyebrow">Quick Answer</p>
            <h2>What is Woods Crossing?</h2>
            <p className="answer-block">
              Woods Crossing is a North Salt Lake apartment community near Bountiful and north of downtown Salt Lake City. The source site positions the community around practical apartment features, mature landscaping, a pool, clubhouse, playground, and access to shopping, dining, parks, and entertainment.
            </p>
            <Link className="text-link" href="/floor-plans">
              Compare Woods Crossing floor plans
            </Link>
          </div>
          <img src={images.aerial} alt="Aerial view of Woods Crossing apartments and pool" width="800" height="600" loading="lazy" />
        </section>
        <section className="card-grid-section">
          <div className="section-heading">
            <p className="eyebrow">Community Snapshot</p>
            <h2>Photos Renters Can Inspect</h2>
          </div>
          <div className="image-grid">
            <ImageCard src={images.exterior} alt="Woods Crossing exterior and pool fencing" title="North Salt Lake setting" body="Exterior photos show low-rise apartment buildings, green space, and the pool area." />
            <ImageCard src={images.pool} alt="Woods Crossing swimming pool" title="Swimming pool" body="The source amenities list includes a community swimming pool." />
            <ImageCard src={images.living} alt="Woods Crossing apartment living room and kitchen" title="Apartment interiors" body="Interior gallery photos show carpeted living areas, kitchens, bedrooms, and bathrooms." />
          </div>
        </section>
        <FloorPlanPreview />
        <AmenitiesPreview />
        <NeighborhoodPreview />
        <FaqBlock faqs={page.faqs ?? commonFaqs} />
      </main>
    </>
  );
}

function FloorPlanPreview() {
  return (
    <section className="table-section">
      <div className="section-heading">
        <p className="eyebrow">As of {sourceDate}</p>
        <h2>Floor Plan Summary</h2>
        <p>Source-listed floor plan details are shown in real table markup for search engines and answer engines.</p>
      </div>
      <FloorPlanTable compact />
    </section>
  );
}

function FloorPlanTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Layout</th>
            <th>Bedrooms</th>
            <th>Bathrooms</th>
            <th>Approx. Sq. Ft.</th>
            <th>Deposit</th>
            <th>Source Rent From</th>
            {!compact ? <th>Availability</th> : null}
          </tr>
        </thead>
        <tbody>
          {floorPlans.map((plan) => (
            <tr key={plan.name}>
              <td>{plan.name}</td>
              <td>{plan.bedrooms}</td>
              <td>{plan.bathrooms}</td>
              <td>{plan.squareFeet}</td>
              <td>{plan.deposit}</td>
              <td>{plan.from}</td>
              {!compact ? <td>{plan.available}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FloorPlansPage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="plan-gallery">
        {floorPlans.map((plan) => (
          <article key={plan.name} className="plan-card">
            <img src={plan.image} alt={`Woods Crossing ${plan.name} floor plan`} width="800" height="600" />
            <div>
              <h2>{plan.name}</h2>
              <p>{plan.bedrooms} bedroom, {plan.bathrooms} bath, approximately {plan.squareFeet} square feet.</p>
              <p><strong>{plan.from}</strong> source-listed starting rent · {plan.deposit} deposit</p>
              <Link className="text-link" href="/apartment-search">Check source-listed availability</Link>
            </div>
          </article>
        ))}
      </section>
      <section className="table-section">
        <div className="section-heading">
          <p className="eyebrow">Floor Plan Table</p>
          <h2>Compare Layouts</h2>
        </div>
        <FloorPlanTable />
        <p className="small-print">Source note: base rent and mandatory fees were included on the source site. Variable and usage-based fees were not included. Pricing, availability, square footage, deposits, discounts, taxes, and fees are subject to change.</p>
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function AvailabilityPage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="table-section">
        <div className="section-heading">
          <p className="eyebrow">Call for August Specials: {property.phone}</p>
          <h2>Source-Listed Apartments</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Apartment</th>
                <th>Rent</th>
                <th>Available</th>
                <th>Type</th>
                <th>Floor Plan</th>
                <th>Square Feet</th>
              </tr>
            </thead>
            <tbody>
              {availableUnits.map((unit) => (
                <tr key={unit.unit}>
                  <td>{unit.unit}</td>
                  <td>{unit.rent}</td>
                  <td>{unit.available}</td>
                  <td>{unit.type}</td>
                  <td>{unit.layout}</td>
                  <td>{unit.squareFeet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small-print">Availability was copied from the public apartment-search page on {sourceDate}. Confirm directly with the leasing office before applying.</p>
      </section>
      <section className="cta-band">
        <h2>Ready to confirm a unit?</h2>
        <p>Call the leasing office or send an application request with your move-in timing.</p>
        <div>
          <a className="button primary" href={property.phoneHref}>Call {property.phone}</a>
          <Link className="button secondary" href="/apply-online">Apply Online</Link>
        </div>
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function GalleryPage({ page }: { page: SitePage }) {
  const gallery: GalleryImage[] = [
    { src: images.exterior, alt: "Exterior at Woods Crossing" },
    { src: images.aerial, alt: "Aerial view of Woods Crossing and pool" },
    { src: images.pool, alt: "Swimming pool at Woods Crossing" },
    { src: images.playground, alt: "Playground and picnic table at Woods Crossing" },
    { src: images.clubhouse, alt: "Clubhouse at Woods Crossing" },
    { src: images.lounge, alt: "Clubhouse lounge at Woods Crossing" },
    { src: images.living, alt: "Living room with kitchen at Woods Crossing" },
    { src: images.kitchen, alt: "Kitchen at Woods Crossing" },
    { src: images.bedroom, alt: "Bedroom at Woods Crossing" },
    { src: images.monument, alt: "Woods Crossing monument sign" },
  ];

  return (
    <main id="main-content">
      <PageIntro page={page} />
      <GalleryLightbox images={gallery} />
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function AmenitiesPreview() {
  return (
    <section className="list-section">
      <div>
        <p className="eyebrow">Amenities</p>
        <h2>Apartment Features</h2>
        <ul className="feature-list">
          {apartmentAmenities.slice(0, 6).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div>
        <p className="eyebrow">Community</p>
        <h2>Shared Spaces</h2>
        <ul className="feature-list">
          {communityAmenities.slice(0, 6).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </section>
  );
}

function AmenitiesPage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="split-section">
        <img src={images.pool} alt="Woods Crossing swimming pool" width="800" height="600" loading="lazy" />
        <div>
          <p className="eyebrow">Community Amenities</p>
          <h2>Pool, Clubhouse, Playground, and More</h2>
          <p>Woods Crossing pairs practical apartment features with shared community spaces listed on the source amenities page.</p>
        </div>
      </section>
      <AmenitiesPreview />
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function NeighborhoodPreview() {
  return (
    <section className="table-section">
      <div className="section-heading">
        <p className="eyebrow">North Salt Lake and Bountiful</p>
        <h2>Nearby Places Listed by the Source Site</h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Place</th>
              <th>Category</th>
              <th>Phone</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {localPlaces.map((place) => (
              <tr key={place.name}>
                <td>{place.name}</td>
                <td>{place.category}</td>
                <td>{place.phone}</td>
                <td>{place.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NeighborhoodPage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="split-section">
        <div>
          <p className="eyebrow">Location</p>
          <h2>Close to Restaurants, Parks, and Downtown Salt Lake City</h2>
          <p>The source site describes Woods Crossing as a North Salt Lake community near Bountiful with access to shopping, dining, parks, transportation, and entertainment.</p>
        </div>
        <img src={images.playground} alt="Woods Crossing playground and picnic area" width="800" height="600" loading="lazy" />
      </section>
      <NeighborhoodPreview />
      <section className="card-grid-section">
        <div className="image-grid no-image">
          {nearbyHighlights.map((item) => (
            <article className="plain-card" key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function PetPage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="split-section">
        <img src={images.exterior} alt="Green space and exterior at Woods Crossing" width="800" height="600" loading="lazy" />
        <div>
          <p className="eyebrow">Pet Policy</p>
          <h2>Dogs and Cats at Woods Crossing</h2>
          <p>The source pet page says Woods Crossing welcomes pets and is located minutes from parks. Current pet rules should be confirmed before lease signing.</p>
        </div>
      </section>
      <section className="table-section">
        <div className="table-wrap narrow">
          <table>
            <thead>
              <tr><th>Policy Item</th><th>Source-Listed Detail</th></tr>
            </thead>
            <tbody>
              {petPolicy.map((item) => (
                <tr key={item.label}><td>{item.label}</td><td>{item.value}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small-print">Source note: the pet page labels deposits under &quot;Refundable Pet Deposit&quot; but also says &quot;Non refundable pet deposit.&quot; This conflict is flagged for confirmation.</p>
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function ReviewsPage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="review-summary">
        <div><strong>4.34</strong><span>Source-listed rating</span></div>
        <div><strong>136</strong><span>Source-listed reviews</span></div>
        <div><strong>{sourceDate}</strong><span>Scrape date</span></div>
      </section>
      <section className="card-grid-section">
        <div className="section-heading">
          <p className="eyebrow">Recent Source-Listed Reviews</p>
          <h2>Resident Feedback Highlights</h2>
        </div>
        <div className="review-grid">
          {reviews.map((review) => (
            <article className="plain-card" key={`${review.author}-${review.date}`}>
              <p>{review.body}</p>
              <h3>{review.author}</h3>
              <span>{review.date}</span>
            </article>
          ))}
        </div>
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function LeadForm({ type }: { type: "contact" | "tour" | "apply" }) {
  const labels = {
    contact: { heading: "Contact the Leasing Office", action: leasingFormAction },
    tour: { heading: "Request a Tour", action: tourFormAction },
    apply: { heading: "Request an Application", action: applicationFormAction },
  }[type];

  return (
    <form className="lead-form" action={labels.action} method="post">
      <h2>{labels.heading}</h2>
      <label>
        First name
        <input name="first_name" autoComplete="given-name" required />
      </label>
      <label>
        Last name
        <input name="last_name" autoComplete="family-name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Phone
        <input name="phone" type="tel" autoComplete="tel" required />
      </label>
      {type !== "contact" ? (
        <label>
          Approximate move-in date
          <input name="move_in_date" type="date" />
        </label>
      ) : null}
      {type === "tour" ? (
        <label>
          Preferred tour time
          <input name="tour_time" />
        </label>
      ) : null}
      <label className="full">
        Notes
        <textarea name="notes" rows={5} />
      </label>
      <p className="consent">By submitting, consent is given for communication by email and text messaging from this community and its vendors.</p>
      <button className="button primary" type="submit">Submit Request</button>
    </form>
  );
}

function ContactPanel() {
  return (
    <aside className="contact-panel">
      <h2>Woods Crossing Apartments</h2>
      <p>{property.address}</p>
      <p><a href={property.phoneHref}>{property.phone}</a></p>
      <h3>Office Hours</h3>
      {property.officeHours.map((line) => <p key={line}>{line}</p>)}
      <a className="button secondary" href={property.googleMaps}>Get Directions</a>
    </aside>
  );
}

function ContactLikePage({ page, type }: { page: SitePage; type: "contact" | "tour" | "apply" }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="form-layout">
        <LeadForm type={type} />
        <ContactPanel />
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function ResidentsPage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="resident-actions">
        <a className="plain-card action-card" href={property.residentPortal}>
          <h2>Pay Rent</h2>
          <p>Open the Prisma resident portal linked by the source site.</p>
        </a>
        <a className="plain-card action-card" href={property.residentPortal}>
          <h2>Maintenance Request</h2>
          <p>Submit maintenance requests through the resident portal.</p>
        </a>
        <a className="plain-card action-card" href={property.residentPortal}>
          <h2>Suggestion Box</h2>
          <p>Use the portal for resident communications.</p>
        </a>
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function VirtualLeasingPage({ page }: { page: SitePage }) {
  const steps = [
    ["Choose a floor plan", "Review photos, floor plans, availability, and virtual materials online."],
    ["Fill out an online application", "The source page lists identification, paystubs or bank statements, references, rental history, and possible background and credit checks."],
    ["Schedule your move-in day", "After approval, coordinate move-in details with a leasing consultant."],
    ["E-sign your lease", "The source page says a lease-signing link is sent by email."],
    ["Pick up your keys", "After lease signing, pick up keys on the scheduled move-in day."],
  ];

  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="steps">
        {steps.map(([heading, body], index) => (
          <article key={heading} className="plain-card">
            <span>{index + 1}</span>
            <h2>{heading}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function FeesPage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="cta-band warning-band">
        <h2>Fee amounts need confirmation</h2>
        <p>The source route embeds a MarketApts fee guide at https://www.marketapts.com/iframes/fee-guide?code=662PBC, but the fee values were not present as crawlable page text.</p>
        <Link className="button secondary" href="/contact">Contact the leasing office</Link>
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function ArticlePage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <PageIntro page={page} />
      <section className="article-body">
        {(page.sections ?? []).map((section) => (
          <article key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
      </section>
      <FaqBlock faqs={page.faqs ?? commonFaqs} />
    </main>
  );
}

function FaqBlock({ faqs }: { faqs: Faq[] }) {
  return (
    <section className="faq-section">
      <div className="section-heading">
        <p className="eyebrow">Frequently Asked Questions</p>
        <h2>Woods Crossing answers</h2>
      </div>
      <div className="faq-list">
        {faqs.map((faq) => (
          <article className="faq-card" key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SourceUpdate({ page }: { page: SitePage }) {
  return (
    <aside className="update-box" aria-label="Source update">
      <strong>What changed?</strong>
      <p>{page.updatedNote ?? `Content was rebuilt from the public Woods Crossing source site on ${sourceDate}.`}</p>
    </aside>
  );
}

function PageRenderer({ page }: { page: SitePage }) {
  switch (page.kind) {
    case "home":
      return <HomePage page={page} />;
    case "floorPlans":
      return <FloorPlansPage page={page} />;
    case "availability":
      return <AvailabilityPage page={page} />;
    case "gallery":
      return <GalleryPage page={page} />;
    case "amenities":
      return <AmenitiesPage page={page} />;
    case "neighborhood":
      return <NeighborhoodPage page={page} />;
    case "petFriendly":
      return <PetPage page={page} />;
    case "reviews":
      return <ReviewsPage page={page} />;
    case "contact":
      return <ContactLikePage page={page} type="contact" />;
    case "tour":
      return <ContactLikePage page={page} type="tour" />;
    case "apply":
      return <ContactLikePage page={page} type="apply" />;
    case "residents":
      return <ResidentsPage page={page} />;
    case "virtualLeasing":
      return <VirtualLeasingPage page={page} />;
    case "fees":
      return <FeesPage page={page} />;
    default:
      return <ArticlePage page={page} />;
  }
}

export function SiteShell({ page }: { page: SitePage }) {
  return (
    <>
      <Header />
      <JsonLd page={page} />
      {page.kind !== "home" ? <SourceUpdate page={page} /> : null}
      <PageRenderer page={page} />
      <Footer />
    </>
  );
}

export function allRenderablePaths() {
  return pages.filter((page) => page.path !== "/").map((page) => page.path);
}
