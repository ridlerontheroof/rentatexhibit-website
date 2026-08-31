import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AvailabilityPayload, AvailableUnit, DetailSection } from "./appfolio";

let fixture: AvailabilityPayload | null = null;

const exactKeys = (value: object, keys: string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => key in value);
const nullable = (value: unknown, type: "string" | "number") =>
  value === null || typeof value === type;
const validDetails = (value: unknown): value is DetailSection[] =>
  Array.isArray(value) && value.every((section) =>
    section && typeof section === "object" &&
    exactKeys(section, ["title", "items"]) &&
    typeof section.title === "string" && section.title.length > 0 &&
    Array.isArray(section.items) && section.items.every((item: unknown) => typeof item === "string"));
const validUnit = (unit: unknown): unit is AvailableUnit => {
  if (!unit || typeof unit !== "object") return false;
  const value = unit as Record<string, unknown>;
  return exactKeys(value, ["unit", "bedrooms", "bathrooms", "sqft", "rent", "availableOn", "photoUrl", "listingUrl", "videoUrl", "photos", "details", "marketingTitle", "description"]) &&
    typeof value.unit === "string" && value.unit.length > 0 &&
    nullable(value.bedrooms, "number") && nullable(value.bathrooms, "number") &&
    nullable(value.sqft, "number") && nullable(value.rent, "number") &&
    nullable(value.availableOn, "string") && nullable(value.photoUrl, "string") &&
    nullable(value.listingUrl, "string") && nullable(value.videoUrl, "string") &&
    Array.isArray(value.photos) && value.photos.every((photo) => typeof photo === "string") &&
    validDetails(value.details) && nullable(value.marketingTitle, "string") &&
    nullable(value.description, "string");
};

export function configureAvailabilityFixture(propertySlug: string): void {
  fixture = null;
  if (process.env.KIT_ACCEPTANCE_MODE !== "1") return;
  const path = process.env.AVAILABILITY_FIXTURE_PATH;
  if (!path) throw new Error("AVAILABILITY_FIXTURE_PATH is required when KIT_ACCEPTANCE_MODE=1");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolve(path), "utf8"));
  } catch (error) {
    throw new Error(`Availability acceptance fixture is unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Availability acceptance fixture must be an object");
  const root = parsed as Record<string, unknown>;
  if (!exactKeys(root, ["propertySlug", "availability"]) || root.propertySlug !== propertySlug) {
    throw new Error("Availability acceptance fixture propertySlug mismatch");
  }
  const payload = root.availability;
  if (!payload || typeof payload !== "object") throw new Error("Availability acceptance fixture payload is invalid");
  const value = payload as Record<string, unknown>;
  if (!exactKeys(value, ["units", "updatedAt"]) || !Array.isArray(value.units) ||
      !value.units.every(validUnit) || typeof value.updatedAt !== "string" ||
      !Number.isFinite(Date.parse(value.updatedAt)) || new Date(value.updatedAt).toISOString() !== value.updatedAt) {
    throw new Error("Availability acceptance fixture must contain an exact normalized AvailabilityPayload");
  }
  fixture = payload as AvailabilityPayload;
}

export function getAvailabilityFixture(): AvailabilityPayload | null {
  return fixture;
}