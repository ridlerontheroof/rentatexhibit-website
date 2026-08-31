import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
const root=resolve(import.meta.dirname,".."), configPath=resolve(root,process.env.PROPERTY_CONFIG_PATH||"");
if(!process.env.PROPERTY_CONFIG_PATH)throw new Error("PROPERTY_CONFIG_PATH is required for selected web build");
const config=JSON.parse(await readFile(configPath,"utf8")), content=JSON.parse(await readFile(resolve(dirname(configPath),config.contentManifestPath),"utf8"));
for (const image of [...content.gallery, ...content.floorPlans.filter((plan) => plan.image).map((plan) => ({ src: plan.image }))]) {
  if (!image.src.startsWith("/") || image.src.includes("..")) throw new Error(`unsupported local image path: ${image.src}`);
  try { await readFile(resolve(root, `web/public${image.src}`)); } catch { throw new Error(`manifest-referenced local image is missing: ${image.src}`); }
}
execFileSync(process.execPath,[resolve(root,"scripts/generate-selected-property.mjs"),configPath],{cwd:root,env:{...process.env,CONTENT_PHASE:process.env.CONTENT_PHASE||"prelaunch"},stdio:"inherit"});
const env={...process.env,VITE_GA4_MEASUREMENT_ID:config.analytics.ga4MeasurementId,VITE_UTM_STORAGE_KEY:config.analytics.utmStorageKey};
execFileSync("pnpm",["--filter","@highland/property-web","exec","vite","build"],{cwd:root,env,stdio:"inherit"});
execFileSync("pnpm",["--filter","@highland/property-web","exec","vite","build","--ssr","src/entry-server.tsx","--outDir","dist/server"],{cwd:root,env,stdio:"inherit"});
const mod=await import(`${pathToFileURL(resolve(root,"web/dist/server/entry-server.js")).href}?v=${Date.now()}`);
const template=(await readFile(resolve(root,"web/dist/public/index.html"),"utf8"))
  .replace(/\s*<meta name="description"[^>]*>/g,"")
  .replace(/\s*<meta property="og:(?:title|description)"[^>]*>/g,"");
const routes=["/","/floor-plans","/amenities","/neighborhood","/gallery","/contact","/faqs","/knowledge","/blog","/neighborhood-guides",...content.floorPlans.map(x=>`/floor-plans/${x.slug}`),...content.knowledge.map(x=>`/knowledge/${x.slug}`),...content.blog.map(x=>`/blog/${x.slug}`),...content.neighborhoodGuides.map(x=>`/neighborhood-guides/${x.slug}`)];
for(const route of routes){const out=await mod.render(route);const html=template.replace(/<title>.*?<\/title>/s,"").replace("</head>",`${out.head}</head>`).replace('<div id="root"></div>',`<div id="root">${out.html}</div>`);const file=route==="/"?resolve(root,"web/dist/public/index.html"):resolve(root,`web/dist/public${route}/index.html`);await mkdir(dirname(file),{recursive:true});await writeFile(file,html)}
await writeFile(resolve(root,"web/dist/public/404.html"),template.replace("</head>",'<meta name="robots" content="noindex"></head>').replace('<div id="root"></div>','<div id="root"><main><h1>Page not found</h1></main></div>'));
const origin=config.identity.canonicalOrigin.replace(/\/$/,""), xml=(value)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");await writeFile(resolve(root,"web/dist/public/robots.txt"),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);await writeFile(resolve(root,"web/dist/public/sitemap.xml"),`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r=>`<url><loc>${xml(origin+r)}</loc></url>`).join("")}</urlset>`);
await writeFile(resolve(root,"web/dist/public/llms.txt"),`# ${config.property.name}\\n${content.home.description}\\n`);await writeFile(resolve(root,"web/dist/public/llms-full.txt"),`# ${config.property.name}\\n\\n${[content.home.description,...content.knowledge.map(x=>x.content),...content.blog.map(x=>x.content)].join("\\n\\n")}\\n`);
await writeFile(resolve(root,"web/dist/legacy-redirects.json"),JSON.stringify(Object.fromEntries(content.legacyRedirects.map(x=>[x.from,x.to])),null,2));process.stdout.write(`prerendered ${routes.length} selected routes\\n`);
await writeFile(resolve(root,"web/dist/public/availability-seed.json"),JSON.stringify({ adapter: "selected-content-seed", propertySlug: config.property.slug, floorPlans: content.floorPlans },null,2));