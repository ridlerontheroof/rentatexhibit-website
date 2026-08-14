import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Woods Crossing home page", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>North Salt Lake Apartments \| Woods Crossing<\/title>/i);
  assert.match(html, /Woods Crossing Apartments in North Salt Lake, UT/);
  assert.match(html, /850 N\. Hwy 89/);
  assert.match(html, /ApartmentComplex/);
  assert.match(html, /FAQPage/);
  assert.match(html, /class="faq-card"/);
  assert.doesNotMatch(html, /<details|<summary/i);
  assert.match(html, /\/llms-full\.txt/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton|codex-preview/i);
});

test("renders source-backed availability table", async () => {
  const response = await render("/apartment-search");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Apartment Search \| Woods Crossing Availability/);
  assert.match(html, /<table>/);
  assert.match(html, />6A</);
  assert.match(html, /\$1,350/);
  assert.match(html, /September 10, 2026/);
  assert.match(html, /OfferCatalog/);
});

test("renders alias route with canonical metadata", async () => {
  const response = await render("/amenities");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Woods Crossing Amenities/);
  assert.match(
    html,
    /rel="canonical" href="https:\/\/www\.woodscrossingslc\.com\/north-salt-lake-ut\/amenities"/,
  );
});

test("crawler and handoff files are present", async () => {
  const [robots, llms, sitemap, metadata] = await Promise.all([
    readFile(new URL("../public/robots.txt", import.meta.url), "utf8"),
    readFile(new URL("../public/llms-full.txt", import.meta.url), "utf8"),
    readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
    readFile(new URL("../content/seo/seo-aeo-metadata.csv", import.meta.url), "utf8"),
  ]);

  assert.match(robots, /User-agent: GPTBot/);
  assert.match(llms, /Woods Crossing Apartments LLM Reference/);
  assert.match(sitemap, /https:\/\/www\.woodscrossingslc\.com\/floor-plans/);
  assert.match(metadata, /North Salt Lake Apartments \| Woods Crossing/);
});
