import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { config, verifiedContent } from "./data/generated";
import { buildSeo, renderHeadTags } from "./lib/seo";

const getFloorPlanSlug = (fp: any) => fp.slug || fp.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const ROUTE_PATHS = [
  "/", "/floor-plans", "/amenities", "/neighborhood", "/gallery", "/contact", "/faqs", "/knowledge", "/blog", "/neighborhood-guides",
  ...(verifiedContent.knowledge?.map((x:any)=>`/knowledge/${x.slug}`) || []),
  ...(verifiedContent.blog?.map((x:any)=>`/blog/${x.slug}`) || []),
  ...(verifiedContent.neighborhoodGuides?.map((x:any)=>`/neighborhood-guides/${x.slug}`) || []),
  ...(verifiedContent.floorPlans?.map((x:any)=>`/floor-plans/${getFloorPlanSlug(x)}`) || [])
];

export const SITE_URL = config.identity.canonicalOrigin.replace(/\/$/, "");
export const LEGACY_REDIRECTS = Object.fromEntries((verifiedContent.legacyRedirects||[]).map((x:any)=>[x.from, x.to]));

export async function render(pathname: string){
  const html = renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <Router ssrPath={pathname}>
        <App/>
      </Router>
    </QueryClientProvider>
  );
  return { html, head: renderHeadTags(buildSeo(pathname)) };
}