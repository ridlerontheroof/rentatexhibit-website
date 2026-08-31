import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const path = resolve(root, process.argv[2] || process.env.PROPERTY_CONFIG_PATH || "config/example-property-config.json");
const phaseIndex = process.argv.indexOf("--phase");
const phase = phaseIndex >= 0 ? process.argv[phaseIndex + 1] : "build";
if (!["build", "prelaunch", "golive"].includes(phase)) throw new Error(`Unsupported phase: ${phase}`);
const config = JSON.parse(await readFile(path, "utf8"));
const errors = [];
const requiredObjects = ["property", "identity", "nap", "brand", "leasing", "appfolio", "seo", "analytics", "email", "secrets"];
const g5Roster = {APPFOLIO_CLIENT_ID:["api-server","account-secret-link"],APPFOLIO_CLIENT_SECRET:["api-server","account-secret-link"],DATABASE_URL:["api-server","property-secret"],GMAIL_APP_PASSWORD:["api-server","property-secret"],GMAIL_SMTP_USER:["api-server","non-secret"],LEASING_INBOX_EMAIL:["api-server","non-secret"],SEED_ALERT_EMAIL:["api-server","non-secret"],INDEXNOW_KEY:["api-server","property-secret"],SESSION_SECRET:["api-server","property-secret"],VITE_API_URL:["web","non-secret"],VITE_GA4_MEASUREMENT_ID:["web","non-secret"],VITE_UTM_STORAGE_KEY:["web","non-secret"]};

if (config.configVersion !== "1") errors.push("configVersion must be \"1\"");
if (config.kitVersion !== "kit-v2.0.0") errors.push("kitVersion must pin kit-v2.0.0");
if (typeof config.environmentManifestPath !== "string" || config.environmentManifestPath.trim() === "") errors.push("environmentManifestPath must be a non-empty path");
if (config.environmentManifestPath) {
  const manifestPath = resolve(dirname(path), config.environmentManifestPath);
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.manifestVersion !== "1.0.0") errors.push("environment manifestVersion must be \"1.0.0\"");
    if (manifest.propertySlug !== config.property?.slug || manifest.kitVersion !== config.kitVersion) errors.push("environment manifest propertySlug/kitVersion must match property config");
    const required = new Set((manifest.entries || []).filter((entry) => entry.required).map((entry) => entry.name));
    for (const name of config.secrets?.required || []) if (!required.has(name)) errors.push(`required secret ${name} has no required environment-manifest entry`);
    const allowedRoot = new Set(["manifestVersion","propertySlug","kitVersion","reviewStatus","reviewedBy","reviewedAt","entries"]);
    for (const key of Object.keys(manifest)) if (!allowedRoot.has(key)) errors.push(`environment manifest forbids field ${key}`);
    const allowedEntry = new Set(["name","classification","artifact","environment","required","owner","accountSecretName","scopeVerified","approval","approvedBy","approvedAt","status","notes"]);
    for (const [index, entry] of (manifest.entries || []).entries()) {
      for (const key of Object.keys(entry)) if (!allowedEntry.has(key)) errors.push(`environment entry ${index} forbids field ${key}`);
      if (!["account-secret-link","property-secret","non-secret"].includes(entry.classification)) errors.push(`environment entry ${index} has invalid classification`);
      if (entry.classification === "account-secret-link" && (!entry.accountSecretName || typeof entry.scopeVerified !== "boolean")) errors.push(`environment entry ${index} account link requires accountSecretName/scopeVerified`);
      if (entry.classification !== "account-secret-link" && "accountSecretName" in entry) errors.push(`environment entry ${index} forbids accountSecretName`);
      if (entry.approval === "APPROVED" && (!entry.approvedBy || !entry.approvedAt)) errors.push(`environment entry ${index} approved metadata incomplete`);
      for (const [key, value] of Object.entries(entry)) if (/(password|secret|token|key)value/i.test(key) && typeof value === "string" && !/^[A-Z][A-Z0-9_]*$/.test(value)) errors.push(`environment entry ${index} contains secret-like value`);
      if (["prelaunch","golive"].includes(phase) && entry.required) {
        const terminal = entry.classification === "account-secret-link" ? "LINKED" : "CONFIGURED";
        if (entry.approval !== "APPROVED" || entry.status !== terminal) errors.push(`environment entry ${index} is not approved/${terminal}`);
      }
    }
    if (config.kitVersion?.startsWith("kit-v2")) for (const [name,[artifact,classification]] of Object.entries(g5Roster)) {
      const matches=(manifest.entries||[]).filter(entry=>entry.name===name);
      if(matches.length!==1){errors.push(`G5 roster requires exactly one ${name} row`);continue}
      const entry=matches[0], terminal=classification==="account-secret-link"?"LINKED":"CONFIGURED";
      if(entry.artifact!==artifact||entry.environment!=="production"||entry.classification!==classification||entry.required!==true)errors.push(`G5 ${name} has wrong artifact/environment/classification`);
      if(["prelaunch","golive"].includes(phase)&&(entry.approval!=="APPROVED"||entry.status!==terminal||!entry.approvedBy||!entry.approvedAt))errors.push(`G5 ${name} is not terminal`);
      if(["prelaunch","golive"].includes(phase)&&classification==="account-secret-link"&&(entry.accountSecretName!==name||entry.scopeVerified!==true))errors.push(`G5 ${name} account link scope is invalid`);
    }
    if (["prelaunch","golive"].includes(phase) && (manifest.reviewStatus !== "APPROVED" || !manifest.reviewedBy || !manifest.reviewedAt)) errors.push("environment manifest requires terminal approved review metadata");
  } catch {
    errors.push(`environmentManifestPath does not resolve to a valid manifest: ${manifestPath}`);
  }
}
for (const key of requiredObjects) {
  if (!config[key] || typeof config[key] !== "object" || Array.isArray(config[key])) errors.push(`${key} must be an object`);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.property?.slug || "")) errors.push("property.slug must be a kebab-case slug");
try {
  const origin = new URL(config.identity?.canonicalOrigin);
  if (origin.protocol !== "https:" || origin.pathname !== "/") errors.push("identity.canonicalOrigin must be a bare HTTPS origin");
} catch {
  errors.push("identity.canonicalOrigin must be a valid URL");
}
if (!Array.isArray(config.identity?.domains) || config.identity.domains.length === 0) errors.push("identity.domains must contain at least one host");
for(const [key,value] of Object.entries(config.brand?.tokens?.colors||{})){const match=typeof value==="string"&&(value.match(/^hsl\(\s*(-?(?:\d+(?:\.\d+)?))\s+(-?(?:\d+(?:\.\d+)?))%\s+(-?(?:\d+(?:\.\d+)?))%\s*\)$/i)||value.match(/^(-?(?:\d+(?:\.\d+)?))\s+(-?(?:\d+(?:\.\d+)?))%\s+(-?(?:\d+(?:\.\d+)?))%$/));if(!match||Number(match[1])<0||Number(match[1])>360||Number(match[2])<0||Number(match[2])>100||Number(match[3])<0||Number(match[3])>100)errors.push(`brand color ${key} must be bounded HSL`)};
for(const [key,value] of Object.entries(config.brand?.tokens?.fonts||{}))if(typeof value!=="string"||!value.trim()||value.length>200||/[;{}<>\\\r\n]/.test(value))errors.push(`brand font ${key} is unsafe`);
if (!/^Website \([A-Za-z0-9_-]+\)$/.test(config.appfolio?.leadSourceDefault || "")) errors.push("appfolio.leadSourceDefault must use Website (Token)");
if (!/^G-/.test(config.analytics?.ga4MeasurementId || "")) errors.push("analytics.ga4MeasurementId must begin G-");
if (!Array.isArray(config.secrets?.required) || config.secrets.required.some((name) => !/^[A-Z][A-Z0-9_]*$/.test(name))) errors.push("secrets.required may contain environment-variable names only");
if (typeof config.contentManifestPath !== "string" || !config.contentManifestPath.trim()) errors.push("contentManifestPath must be a non-empty path");
else {
  try {
    const content = JSON.parse(await readFile(resolve(dirname(path), config.contentManifestPath), "utf8"));
    if (content.propertySlug !== config.property?.slug) errors.push("content manifest propertySlug must match property.slug");
    for (const key of ["home","amenities","neighborhood","gallery","floorPlans","faqs","knowledge","blog","neighborhoodGuides","legacyRedirects"]) if (!(key in content)) errors.push(`content manifest missing ${key}`);
    const slugs = [...(content.knowledge || []), ...(content.blog || []), ...(content.neighborhoodGuides || [])].map((article) => article.slug);
    if (new Set(slugs).size !== slugs.length) errors.push("content manifest article slugs must be globally unique");
    const redirects = content.legacyRedirects || [], froms = redirects.map((redirect) => redirect.from);
    if (new Set(froms).size !== froms.length) errors.push("content manifest legacy redirect sources must be unique");
    for (const redirect of redirects) {
      if (!/^\/(?!.*(?:\.\.|\/\/))/.test(redirect.from || "") || !/^(?:\/(?!.*(?:\.\.|\/\/))|https:\/\/)/.test(redirect.to || "")) errors.push("content manifest redirect path is unsafe");
      if (redirect.from === redirect.to || redirects.some((other) => other.from === redirect.to)) errors.push("content manifest redirect loop/collision");
    }
    for (const [name, items] of Object.entries({ amenities: content.amenities || [], neighborhood: content.neighborhood || [] })) for (const item of items) if (!item.title || !item.description) errors.push(`${name} items require title/description`);
    for (const image of content.gallery || []) if (!image.src || !image.alt || !Number.isInteger(image.width) || image.width < 1 || !Number.isInteger(image.height) || image.height < 1 || !image.category) errors.push("gallery items require src/alt/positive dimensions/category");
    const planSlugs=(content.floorPlans||[]).map(plan=>plan.slug);
    if(new Set(planSlugs).size!==planSlugs.length)errors.push("floor plan slugs must be unique");
    for (const plan of content.floorPlans || []) if (!plan.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plan.slug||"") || !plan.name || plan.beds < 0 || !(plan.baths > 0) || !(plan.sqft > 0)) errors.push("floor plan items require id/slug/name/nonnegative beds/positive baths/sqft");
    for (const faq of content.faqs || []) if (!faq.question || !faq.answer) errors.push("FAQ items require question/answer");
    for (const article of [...(content.knowledge || []), ...(content.blog || []), ...(content.neighborhoodGuides || [])]) if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug || "") || !article.title || !article.excerpt || typeof article.content !== "string" || article.content.length < 20) errors.push("article items require safe slug/title/excerpt/substantive content");
    if (["prelaunch","golive"].includes(phase)) {
      if (content.status !== "APPROVED" || !content.reviewedBy || !content.reviewedAt || content.provenance?.rightsConfirmed !== true) errors.push("content manifest requires APPROVED review and confirmed rights");
      if (!content.home?.heading || !content.home?.description || !content.gallery?.length || !content.floorPlans?.length) errors.push("approved content cannot be normatively empty");
      if (/(woods crossing|full content here|lorem ipsum|todo|placeholder)/i.test(JSON.stringify(content))) errors.push("content manifest contains placeholder/unsupported content");
    }
  } catch { errors.push("contentManifestPath does not resolve to valid JSON"); }
}
const serialized = JSON.stringify(config);
if (/(password|secret|token|api[-_]?key)"\s*:\s*"[^"]+/i.test(serialized)) errors.push("configuration appears to contain a secret value");

if (errors.length) {
  throw new Error(`Invalid property configuration ${path}:\n- ${errors.join("\n- ")}`);
}
process.stdout.write(`valid config: ${path}\n`);