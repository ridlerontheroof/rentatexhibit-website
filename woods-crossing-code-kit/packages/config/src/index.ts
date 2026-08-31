import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface PropertyConfig {
  configVersion: "1";
  kitVersion: "kit-v2.0.0";
  environmentManifestPath: string;
  contentManifestPath: string;
  property: { name: string; shortName: string; slug: string };
  identity: { canonicalOrigin: string; domains: string[]; legacyOrigins?: string[] };
  nap: { streetAddress: string; locality: string; region: string; postalCode: string; country: string; phone: string; timezone: string };
  brand: { designDirection: string; tokens: Record<string, unknown> };
  leasing: { facts: Record<string, unknown> };
  appfolio: { database: string; propertyName: string; leadSourceDefault: string };
  seo: { defaultTitleSuffix: string; defaultDescription: string; ogSiteName: string };
  analytics: { ga4MeasurementId: string; utmStorageKey: string };
  email: { leasingInbox: string; alertInbox: string; senderAddress: string; senderName?: string };
  secrets: { required: string[]; optional?: string[] };
}

export interface PropertyContent {
  propertySlug: string;
  status: "DRAFT" | "APPROVED";
  reviewedBy?: string;
  reviewedAt?: string;
  provenance: { source: string; rightsConfirmed: boolean };
  faqs: unknown[];
  knowledge: unknown[];
  blog: unknown[];
  neighborhoodGuides: unknown[];
  [key: string]: unknown;
}

const G5_ROSTER = {
  APPFOLIO_CLIENT_ID: ["api-server", "account-secret-link"],
  APPFOLIO_CLIENT_SECRET: ["api-server", "account-secret-link"],
  DATABASE_URL: ["api-server", "property-secret"],
  GMAIL_APP_PASSWORD: ["api-server", "property-secret"],
  GMAIL_SMTP_USER: ["api-server", "non-secret"],
  LEASING_INBOX_EMAIL: ["api-server", "non-secret"],
  SEED_ALERT_EMAIL: ["api-server", "non-secret"],
  INDEXNOW_KEY: ["api-server", "property-secret"],
  SESSION_SECRET: ["api-server", "property-secret"],
  VITE_API_URL: ["web", "non-secret"],
  VITE_GA4_MEASUREMENT_ID: ["web", "non-secret"],
  VITE_UTM_STORAGE_KEY: ["web", "non-secret"],
} as const;

export function validateKitV2EnvironmentManifest(manifest: any): void {
  if (!manifest || manifest.reviewStatus !== "APPROVED" || !manifest.reviewedBy || !manifest.reviewedAt) throw new Error("kit-v2 production requires approved G5 review metadata");
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
  const seen = new Set<string>();
  for (const [name, [artifact, classification]] of Object.entries(G5_ROSTER)) {
    const matches = entries.filter((entry: any) => entry.name === name);
    if (matches.length !== 1) throw new Error(`G5 roster requires exactly one ${name} row`);
    const entry = matches[0];
    if (seen.has(name)) throw new Error(`duplicate G5 roster row: ${name}`);
    seen.add(name);
    if (entry.artifact !== artifact || entry.environment !== "production" || entry.classification !== classification || entry.required !== true) throw new Error(`G5 ${name} has wrong artifact/environment/classification`);
    const terminal = classification === "account-secret-link" ? "LINKED" : "CONFIGURED";
    if (entry.approval !== "APPROVED" || entry.status !== terminal || !entry.approvedBy || !entry.approvedAt) throw new Error(`G5 ${name} is not approved/${terminal}`);
    if (classification === "account-secret-link" && (entry.accountSecretName !== name || entry.scopeVerified !== true)) throw new Error(`G5 ${name} account-secret link is not scope verified`);
  }
}

function assertConfig(value: unknown): asserts value is PropertyConfig {
  if (!value || typeof value !== "object") throw new Error("Property configuration must be a JSON object");
  const config = value as Partial<PropertyConfig>;
  if (config.configVersion !== "1" || config.kitVersion !== "kit-v2.0.0") throw new Error("Property configuration does not pin kit-v2.0.0/config v1");
  if (!config.environmentManifestPath) throw new Error("environmentManifestPath is required");
  if (!config.contentManifestPath) throw new Error("contentManifestPath is required");
  if (!config.property?.name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.property.slug)) throw new Error("Property name and valid slug are required");
  if (!config.identity?.canonicalOrigin?.startsWith("https://") || !config.identity.domains?.length) throw new Error("Canonical HTTPS origin and domains are required");
  for (const section of ["nap", "brand", "leasing", "appfolio", "seo", "analytics", "email", "secrets"] as const) {
    if (!config[section] || typeof config[section] !== "object") throw new Error(`Missing property configuration section: ${section}`);
  }
  const hsl = /^hsl\(\s*(-?(?:\d+(?:\.\d+)?))\s+(-?(?:\d+(?:\.\d+)?))%\s+(-?(?:\d+(?:\.\d+)?))%\s*\)$/i;
  const hslChannels = /^(-?(?:\d+(?:\.\d+)?))\s+(-?(?:\d+(?:\.\d+)?))%\s+(-?(?:\d+(?:\.\d+)?))%$/;
  for (const [key, value] of Object.entries((config.brand as any)?.tokens?.colors || {})) {
    const match = typeof value === "string" ? (value.match(hsl) || value.match(hslChannels)) : null;
    if (!match || Number(match[1]) < 0 || Number(match[1]) > 360 || Number(match[2]) < 0 || Number(match[2]) > 100 || Number(match[3]) < 0 || Number(match[3]) > 100) throw new Error(`Invalid trusted HSL brand color: ${key}`);
  }
  for (const [key, value] of Object.entries((config.brand as any)?.tokens?.fonts || {})) {
    if (typeof value !== "string" || !value.trim() || value.length > 200 || /[;{}<>\\\r\n]/.test(value)) throw new Error(`Unsafe brand font value: ${key}`);
  }
}

export function loadPropertyConfig(path = process.env.PROPERTY_CONFIG_PATH): Readonly<PropertyConfig> {
  const isProduction = process.env.NODE_ENV === "production";
  if (!path && isProduction) throw new Error("PROPERTY_CONFIG_PATH is required in production");
  const resolved = resolve(path || "config/example-property-config.json");
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(resolved, "utf8"));
  } catch (error) {
    throw new Error(`Unable to load property configuration at ${resolved}: ${error instanceof Error ? error.message : String(error)}`);
  }
  assertConfig(value);
  const manifestPath = resolve(dirname(resolved), (value as PropertyConfig).environmentManifestPath);
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { manifestVersion?: string; propertySlug?: string; kitVersion?: string; reviewStatus?: string; reviewedBy?: string; reviewedAt?: string; entries?: Array<{required?: boolean; classification?: string; approval?: string; status?: string}> };
    if (manifest.manifestVersion !== "1.0.0") throw new Error("manifestVersion must be \"1.0.0\"");
    if (manifest.propertySlug !== (value as PropertyConfig).property.slug || manifest.kitVersion !== (value as PropertyConfig).kitVersion) throw new Error("manifest propertySlug/kitVersion must match property config");
    if (!Array.isArray(manifest.entries)) throw new Error("manifest entries are required");
    if (isProduction) validateKitV2EnvironmentManifest(manifest);
  } catch (error) {
    throw new Error(`Unable to load environment manifest at ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return Object.freeze(value);
}

export function loadSelectedProperty(path = process.env.PROPERTY_CONFIG_PATH): { config: Readonly<PropertyConfig>; content: Readonly<PropertyContent> } {
  const config = loadPropertyConfig(path);
  const resolved = resolve(path || "config/example-property-config.json");
  const contentPath = resolve(dirname(resolved), config.contentManifestPath);
  let content: PropertyContent;
  try { content = JSON.parse(readFileSync(contentPath, "utf8")) as PropertyContent; }
  catch (error) { throw new Error(`Unable to load selected content manifest at ${contentPath}: ${error instanceof Error ? error.message : String(error)}`); }
  if (content.propertySlug !== config.property.slug) throw new Error("selected content propertySlug does not match property config");
  for (const key of ["faqs", "knowledge", "blog", "neighborhoodGuides"]) if (!Array.isArray(content[key])) throw new Error(`selected content registry is invalid: ${key}`);
  if (process.env.NODE_ENV === "production" && (content.status !== "APPROVED" || !content.reviewedBy || !content.reviewedAt || content.provenance?.rightsConfirmed !== true)) throw new Error("production requires approved selected content with confirmed rights");
  return { config, content: Object.freeze(content) };
}

export function publicPropertyConfig(config: PropertyConfig) {
  return {
    kitVersion: config.kitVersion,
    property: config.property,
    identity: { canonicalOrigin: config.identity.canonicalOrigin },
    nap: config.nap,
    brand: config.brand,
    seo: config.seo
  };
}