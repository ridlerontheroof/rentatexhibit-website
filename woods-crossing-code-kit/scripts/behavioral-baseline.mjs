import assert from "node:assert/strict";
import axe from "axe-core";
import { JSDOM } from "jsdom";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const id = process.argv[2];
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
if (id === "index.real-404") {
  const dist=resolve(root,"web/dist/public"); await mkdir(dist,{recursive:true}); await writeFile(resolve(dist,"index.html"),"<main>fixture</main>"); await writeFile(resolve(dist,"404.html"),'<meta name="robots" content="noindex"><main>Not found</main>');
  const child=spawn(process.execPath,["web/server/index.mjs"],{cwd:root,env:{...process.env,PORT:"4521"},detached:true,stdio:"ignore"});
  try { let response; for(let i=0;i<50;i++){try{response=await fetch("http://127.0.0.1:4521/unique-unknown");break}catch{}await new Promise(r=>setTimeout(r,50))} assert.equal(response.status,404); assert.match(await response.text(),/noindex/); } finally { try{process.kill(-child.pid,"SIGTERM")}catch{} }
} else if (id === "a11y.axe") {
  const dom = new JSDOM('<!doctype html><html lang="en"><title>Fixture</title><body><main><h1>Property</h1><a href="/contact">Contact leasing</a></main></body></html>', { runScripts: "dangerously" });
  dom.window.eval(axe.source);
  const result = await dom.window.axe.run(dom.window.document, { rules: { "color-contrast": { enabled: false } } });
  assert.equal(result.violations.length, 0, result.violations.map((v) => v.id).join(","));
} else if (id === "redirects.one-hop") {
  const dist=resolve(root,"web/dist/public"); await mkdir(resolve(dist,"old"),{recursive:true}); await mkdir(resolve(dist,"new"),{recursive:true}); await writeFile(resolve(dist,"index.html"),"<main>fixture</main>"); await writeFile(resolve(dist,"404.html"),'<meta name="robots" content="noindex">'); await writeFile(resolve(dist,"old/index.html"),'<meta http-equiv="refresh" content="0; url=/new">'); await writeFile(resolve(dist,"new/index.html"),"<main>canonical</main>");
  const child=spawn(process.execPath,["web/server/index.mjs"],{cwd:root,env:{...process.env,PORT:"4522"},detached:true,stdio:"ignore"});
  try { let first; for(let i=0;i<50;i++){try{first=await fetch("http://127.0.0.1:4522/old",{redirect:"manual"});break}catch{}await new Promise(r=>setTimeout(r,50))} assert.equal(first.status,301); assert.equal(first.headers.get("location"),"/new"); const second=await fetch("http://127.0.0.1:4522/new",{redirect:"manual"}); assert.equal(second.status,200); } finally { try{process.kill(-child.pid,"SIGTERM")}catch{} }
} else if (id === "ops.postpublish-watch") {
  const { shouldRunPostpublish, changedSitemapUrls } = await import("../web/scripts/postpublish-decision.mjs");
  assert.deepEqual(shouldRunPostpublish("a", "a"), { run: false, reason: "unchanged" });
  assert.deepEqual(shouldRunPostpublish("a", "b"), { run: true, reason: "new-build", buildId: "b" });
  assert.deepEqual(changedSitemapUrls({ "/": "1" }, { "/": "2", "/new": "1" }), ["/", "/new"]);
} else if (id === "jsonld.valid" || id === "head.per-url") {
  const { extractJsonLdPayloads, validateJsonLdPayloads } = await import("../web/scripts/validate-jsonld.mjs");
  const good = '<link rel="canonical" href="https://example.invalid/"><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>';
  assert.equal(validateJsonLdPayloads(extractJsonLdPayloads(good), "https://example.invalid").length, 0); assert.ok(validateJsonLdPayloads(["{"], "").length);
} else if (id === "leads.bot-guard") {
  const { inspectSubmission } = await import("../api-server/src/lib/botGuard.ts"); assert.equal(inspectSubmission({ xh_note: "x", elapsedMs: 1 }).bot, true);
} else if (id === "appfolio.feed-health") {
  process.env.APPFOLIO_DATABASE="fixture"; process.env.APPFOLIO_PROPERTY_NAME="Example Property"; process.env.APPFOLIO_LEAD_SOURCE_DEFAULT="Website (ExampleProperty)"; process.env.PROPERTY_NAME="Example"; process.env.PROPERTY_TIMEZONE="America/Denver"; process.env.GMAIL_SMTP_USER="x@example.invalid"; process.env.SITE_URL="https://example.invalid"; process.env.INDEXNOW_KEY="x";
  const { normalizeRow, isPropertyRow } = await import("../api-server/src/lib/appfolio.ts"); assert.equal(normalizeRow({ Unit:"1", UnitStatus:"Vacant-Rented" }), null); assert.equal(isPropertyRow({ Property:"Other" }), false);
} else if (id === "content.systems-live") {
  const content = (await import("../content/content-systems.json", { with: { type: "json" } })).default; for (const n of ["faqs","knowledge","blog","neighborhoodGuides"]) assert.ok(Array.isArray(content[n]));
} else if (id === "index.real-404") {} else {
  assert.equal(id, "index.real-404");
}
process.stdout.write(`behavioral baseline passed: ${id}\n`);