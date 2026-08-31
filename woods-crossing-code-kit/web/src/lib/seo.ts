import { config, verifiedContent } from "../data/generated";

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export interface SeoModel {
  title: string;
  description: string;
  canonical: string;
  jsonLd: any;
}

const getFloorPlanSlug = (fp: any) => fp.slug || fp.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function buildSeo(path: string): SeoModel {
  const baseCanonical = config.identity.canonicalOrigin.replace(/\/$/, "");
  const canonical = `${baseCanonical}${path}`;

  let title = "Page not found";
  let description = config.seo.defaultDescription;
  let jsonLd: any = null;
  let type = "WebPage";

  const breadcrumbs = [{ "@type": "ListItem", position: 1, name: "Home", item: baseCanonical }];
  const addBreadcrumb = (name: string, url: string, pos = 2) => breadcrumbs.push({ "@type": "ListItem", position: pos, name, item: `${baseCanonical}${url}` });

  const propertyAddress = {
    "@type": "PostalAddress",
    streetAddress: config.nap.streetAddress,
    addressLocality: config.nap.locality,
    addressRegion: config.nap.region,
    postalCode: config.nap.postalCode,
    addressCountry: config.nap.country
  };

  const propertyProvider = {
    "@type": ["ApartmentComplex", "LocalBusiness"],
    name: config.property.name,
    url: baseCanonical,
    telephone: config.nap.phone,
    address: propertyAddress
  };

  const article = [...(verifiedContent.knowledge||[]), ...(verifiedContent.blog||[]), ...(verifiedContent.neighborhoodGuides||[])]
    .find((x: any) => path.endsWith(`/${x.slug}`));
    
  const floorPlan = verifiedContent.floorPlans?.find((x: any) => path === `/floor-plans/${getFloorPlanSlug(x)}`);

  if (path === "/") {
    title = `${config.property.name} ${config.seo.defaultTitleSuffix}`;
    description = (verifiedContent as any).home?.description || config.seo.defaultDescription;
    jsonLd = propertyProvider;
  } else if (path === "/floor-plans") {
    title = `Floor Plans ${config.seo.defaultTitleSuffix}`;
    description = `View available floor plans at ${config.property.name}. ${config.seo.defaultDescription}`;
    addBreadcrumb("Floor Plans", "/floor-plans");
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Floor Plans",
      url: canonical,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: verifiedContent.floorPlans?.map((fp, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${baseCanonical}/floor-plans/${getFloorPlanSlug(fp)}`
        }))
      }
    };
  } else if (floorPlan) {
    title = `${floorPlan.name} Floor Plan ${config.seo.defaultTitleSuffix}`;
    description = `${floorPlan.name} floor plan at ${config.property.name}. ` + (floorPlan.beds !== undefined ? `${floorPlan.beds} Bed, ${floorPlan.baths} Bath` : '');
    addBreadcrumb("Floor Plans", "/floor-plans", 2);
    addBreadcrumb(floorPlan.name, `/floor-plans/${getFloorPlanSlug(floorPlan)}`, 3);
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "FloorPlan",
      name: floorPlan.name,
      url: canonical,
      isPlanForApartment: propertyProvider,
      numberOfBedrooms: floorPlan.beds,
      numberOfBathroomsTotal: floorPlan.baths,
      floorSize: floorPlan.sqft ? { "@type": "QuantitativeValue", value: floorPlan.sqft, unitCode: "FTK" } : undefined,
      image: floorPlan.image ? `${baseCanonical}${floorPlan.image}` : undefined
    };
  } else if (path === "/amenities") {
    title = `Amenities ${config.seo.defaultTitleSuffix}`;
    description = `Amenities at ${config.property.name}. ${config.seo.defaultDescription}`;
    addBreadcrumb("Amenities", "/amenities");
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Amenities",
      url: canonical,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: verifiedContent.amenities?.map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: a.title,
          description: a.description
        }))
      }
    };
  } else if (path === "/gallery") {
    title = `Gallery ${config.seo.defaultTitleSuffix}`;
    description = `Photo gallery for ${config.property.name}. ${config.seo.defaultDescription}`;
    addBreadcrumb("Gallery", "/gallery");
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Gallery",
      url: canonical,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: verifiedContent.gallery?.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          image: `${baseCanonical}${g.src}`,
          name: g.alt
        }))
      }
    };
  } else if (path === "/faqs") {
    title = `Frequently Asked Questions ${config.seo.defaultTitleSuffix}`;
    description = `FAQs for ${config.property.name}. ${config.seo.defaultDescription}`;
    addBreadcrumb("FAQs", "/faqs");
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: verifiedContent.faqs?.map(faq => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer }
      }))
    };
  } else if (path === "/knowledge" || path === "/blog" || path === "/neighborhood-guides") {
    const names: Record<string, string> = { "/knowledge": "Renter Knowledge", "/blog": "Property News", "/neighborhood-guides": "Neighborhood Guides" };
    title = `${names[path]} ${config.seo.defaultTitleSuffix}`;
    description = `${names[path]} for ${config.property.name}. ${config.seo.defaultDescription}`;
    addBreadcrumb(names[path], path);
    
    let items: any[] = [];
    if (path === "/knowledge") items = verifiedContent.knowledge || [];
    else if (path === "/blog") items = verifiedContent.blog || [];
    else if (path === "/neighborhood-guides") items = verifiedContent.neighborhoodGuides || [];

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: names[path],
      url: canonical,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: items.map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${baseCanonical}${path}/${a.slug}`
        }))
      }
    };
  } else if (article) {
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    const parentNames: Record<string, string> = { "/knowledge": "Knowledge", "/blog": "Blog", "/neighborhood-guides": "Neighborhood Guides" };
    addBreadcrumb(parentNames[parentPath] || "Articles", parentPath, 2);
    addBreadcrumb(article.title, path, 3);
    
    title = `${article.title} ${config.seo.defaultTitleSuffix}`;
    description = article.excerpt || `${article.title} at ${config.property.name}.`;
    
    const articleType = path.startsWith('/blog') ? 'BlogPosting' : 'Article';
    jsonLd = {
      "@context": "https://schema.org",
      "@type": articleType,
      headline: article.title,
      description: article.excerpt,
      articleBody: article.content,
      publisher: propertyProvider,
      url: canonical
    };
  } else if (path === "/contact") {
    title = `Contact Us ${config.seo.defaultTitleSuffix}`;
    description = `Contact ${config.property.name} to schedule a tour or learn more.`;
    addBreadcrumb("Contact", "/contact");
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact Us",
      url: canonical
    };
  } else if (path === "/neighborhood") {
    title = `Neighborhood ${config.seo.defaultTitleSuffix}`;
    description = `Explore the neighborhood around ${config.property.name}.`;
    addBreadcrumb("Neighborhood", "/neighborhood");
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Neighborhood",
      url: canonical
    };
  }

  // Inject BreadcrumbList if not home and jsonLd exists
  if (path !== "/" && jsonLd) {
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs
    };
    jsonLd = [jsonLd, breadcrumbJsonLd];
  } else if (path === "/" && !jsonLd) {
     jsonLd = propertyProvider;
  } else if (path === "/" && jsonLd) {
     jsonLd = { "@context": "https://schema.org", ...jsonLd };
  }

  return { title, description, canonical, jsonLd };
}

export function renderHeadTags(model: SeoModel) {
  const ldStr = model.jsonLd ? `<script type="application/ld+json">${JSON.stringify(model.jsonLd).replace(/</g,"\\u003c")}</script>` : '';
  return `<title>${esc(model.title)}</title>
<meta name="description" content="${esc(model.description)}">
<link rel="canonical" href="${esc(model.canonical)}">
<meta property="og:title" content="${esc(model.title)}">
<meta property="og:description" content="${esc(model.description)}">
<meta property="og:url" content="${esc(model.canonical)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(model.title)}">
<meta name="twitter:description" content="${esc(model.description)}">
${ldStr}`;
}
