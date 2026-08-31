import { resolve } from "node:path";
import { loadSelectedProperty, publicPropertyConfig } from "@highland/property-config";

const defaultConfigPath = resolve(import.meta.dirname, "../../config/example-property-config.json");
if (process.env.NODE_ENV === "production" && !process.env.PROPERTY_CONFIG_PATH) {
  throw new Error("PROPERTY_CONFIG_PATH is required when NODE_ENV=production");
}
const { config, content } = loadSelectedProperty(process.env.PROPERTY_CONFIG_PATH || defaultConfigPath);
const setDefault = (name: string, value: string) => { if (!process.env[name]) process.env[name] = value; };
setDefault("APPFOLIO_DATABASE", config.appfolio.database);
setDefault("APPFOLIO_PROPERTY_NAME", config.appfolio.propertyName);
setDefault("APPFOLIO_LEAD_SOURCE_DEFAULT", config.appfolio.leadSourceDefault);
setDefault("PROPERTY_TIMEZONE", config.nap.timezone);
setDefault("SITE_URL", config.identity.canonicalOrigin);
setDefault("ALLOWED_ORIGIN", config.identity.canonicalOrigin);
setDefault("PROPERTY_NAME", config.property.name);
setDefault("PROPERTY_SLUG", config.property.slug);
setDefault("GMAIL_SMTP_USER", config.email.senderAddress);
setDefault("LEASING_INBOX_EMAIL", config.email.leasingInbox);
setDefault("SEED_ALERT_EMAIL", config.email.alertInbox);
setDefault("VITE_GA4_MEASUREMENT_ID", config.analytics.ga4MeasurementId);
setDefault("VITE_UTM_STORAGE_KEY", config.analytics.utmStorageKey);

const { configureAvailabilityFixture } = await import("./lib/availabilityFixture");
configureAvailabilityFixture(config.property.slug);
const contentNames = ["faqs", "knowledge", "blog", "neighborhoodGuides"] as const;
for (const name of contentNames) if (!Array.isArray(content[name])) throw new Error(`Content system is not live: ${name}`);

const { default: app } = await import("./app");
const { logger } = await import("./lib/logger");
app.get("/api/config/public", (_request, response) => response.json(publicPropertyConfig(config)));
app.get("/api/content/:system", (request, response) => {
  const system = request.params.system;
  if (!contentNames.includes(system as (typeof contentNames)[number])) return response.status(404).json({ error: "Unknown content system" });
  return response.json({ system, items: content[system] });
});

if (process.env.ENABLE_STARTUP_MONITORS === "1") {
  const [{ startRentedNoindexCheck }, { startLegacyRedirectCheck }, { startGtmTrackingCheck }] = await Promise.all([
    import("./lib/rentedCheck"), import("./lib/redirectCheck"), import("./lib/gtmCheck")
  ]);
  startRentedNoindexCheck();
  startLegacyRedirectCheck();
  startGtmTrackingCheck();
  logger.info("startup monitors enabled");
} else {
  logger.info("startup monitors disabled; set ENABLE_STARTUP_MONITORS=1 after deployment configuration");
}

const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1) throw new Error("PORT must be a positive integer");
app.listen(port, "0.0.0.0", () => logger.info({ port, propertySlug: config.property.slug }, "production route composition ready"));