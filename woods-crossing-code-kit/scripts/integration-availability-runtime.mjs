import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "kit-availability-acceptance-"));
const configPath = resolve(root, "config/example-property-config.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const fixturePath = resolve(temp, "availability.json");
const sentinel = "ACCEPTANCE-UNIT-7F91";
const fixture = {
  propertySlug: config.property.slug,
  availability: {
    units: [{
      unit: sentinel, bedrooms: 2, bathrooms: 1.5, sqft: 987, rent: 2345,
      availableOn: "2030-04-05", photoUrl: null, listingUrl: null, videoUrl: null,
      photos: [], details: [{ title: "Amenities", items: ["Fictional test feature"] }],
      marketingTitle: "Acceptance residence", description: "Deterministic acceptance-only unit"
    }],
    updatedAt: "2030-01-02T03:04:05.000Z"
  }
};
await writeFile(fixturePath, JSON.stringify(fixture));

const baseEnv = {
  ...process.env, NODE_ENV: "production", PROPERTY_CONFIG_PATH: configPath,
  DATABASE_URL: "postgresql://acceptance.invalid/property", ENABLE_STARTUP_MONITORS: "0",
  APPFOLIO_CLIENT_ID: "acceptance-dummy", APPFOLIO_CLIENT_SECRET: "acceptance-dummy",
  INDEXNOW_KEY: "acceptance-dummy", SESSION_SECRET: "acceptance-dummy",
  VITE_API_URL: "https://api.example.invalid"
};
const start = (port, env) => spawn("pnpm", ["--filter", "@highland/property-api", "start"], {
  cwd: root, env: { ...baseEnv, PORT: String(port), ...env }, detached: true, stdio: "ignore"
});
const stop = async (child) => {
  try { process.kill(-child.pid, "SIGTERM"); } catch {}
  await Promise.race([new Promise((done) => child.once("exit", done)), new Promise((done) => setTimeout(done, 1500))]);
};
const wait = async (url) => {
  for (let i = 0; i < 80; i++) {
    try { const response = await fetch(url); if (response.status < 500) return response; } catch {}
    await new Promise((done) => setTimeout(done, 75));
  }
  throw new Error(`availability runtime timeout: ${url}`);
};
const expectStartupFailure = async (env, label) => {
  const child = start(4488, env);
  const result = await Promise.race([
    new Promise((done) => child.once("exit", (code) => done(code))),
    new Promise((done) => setTimeout(() => done("running"), 4000))
  ]);
  if (result === "running") { await stop(child); throw new Error(`${label} did not fail closed`); }
  if (result === 0) throw new Error(`${label} unexpectedly succeeded`);
};

try {
  const live = start(4485, { KIT_ACCEPTANCE_MODE: "1", AVAILABILITY_FIXTURE_PATH: fixturePath });
  try {
    const response = await wait("http://127.0.0.1:4485/api/availability");
    const payload = await response.json();
    if (response.status !== 200 || JSON.stringify(payload) !== JSON.stringify(fixture.availability)) throw new Error("runtime fixture payload was not exact");
    const unit = payload.units[0];
    for (const field of ["unit", "bedrooms", "bathrooms", "sqft", "rent", "availableOn", "photos", "details"]) if (!(field in unit)) throw new Error(`normalized field missing: ${field}`);
    for (const forbidden of ["floorPlanId", "floorPlanName", "availableDate"]) if (forbidden in unit) throw new Error(`nonexistent field leaked: ${forbidden}`);
    for (const registry of ["faqs", "knowledge", "blog", "neighborhoodGuides"]) {
      const selected = await (await fetch(`http://127.0.0.1:4485/api/content/${registry}`)).json();
      const expected = JSON.parse(await readFile(resolve(root, "config/release-content-manifest.json"), "utf8"))[registry];
      if (selected.system !== registry || JSON.stringify(selected.items) !== JSON.stringify(expected)) throw new Error(`selected content runtime mismatch: ${registry}`);
    }
  } finally { await stop(live); }

  const oldMode = process.env.KIT_ACCEPTANCE_MODE, oldPath = process.env.AVAILABILITY_FIXTURE_PATH;
  process.env.KIT_ACCEPTANCE_MODE = ""; process.env.AVAILABILITY_FIXTURE_PATH = fixturePath;
  const fixtureModule = await import("../api-server/src/lib/availabilityFixture.ts");
  fixtureModule.configureAvailabilityFixture(config.property.slug);
  if (fixtureModule.getAvailabilityFixture() !== null) throw new Error("fixture path was available without KIT_ACCEPTANCE_MODE=1");
  if (oldMode === undefined) delete process.env.KIT_ACCEPTANCE_MODE; else process.env.KIT_ACCEPTANCE_MODE = oldMode;
  if (oldPath === undefined) delete process.env.AVAILABILITY_FIXTURE_PATH; else process.env.AVAILABILITY_FIXTURE_PATH = oldPath;

  await writeFile(resolve(temp, "malformed.json"), "{\"propertySlug\":");
  await expectStartupFailure({ KIT_ACCEPTANCE_MODE: "1", AVAILABILITY_FIXTURE_PATH: resolve(temp, "malformed.json") }, "malformed fixture");
  await writeFile(resolve(temp, "wrong-shape.json"), JSON.stringify({ propertySlug: config.property.slug, availability: { units: [{ unit: sentinel, availableDate: "2030-04-05" }], updatedAt: "not-iso" } }));
  await expectStartupFailure({ KIT_ACCEPTANCE_MODE: "1", AVAILABILITY_FIXTURE_PATH: resolve(temp, "wrong-shape.json") }, "malformed fixture payload");
  await writeFile(resolve(temp, "mismatch.json"), JSON.stringify({ ...fixture, propertySlug: "wrong-property" }));
  await expectStartupFailure({ KIT_ACCEPTANCE_MODE: "1", AVAILABILITY_FIXTURE_PATH: resolve(temp, "mismatch.json") }, "mismatched fixture");
  await expectStartupFailure({ KIT_ACCEPTANCE_MODE: "1", AVAILABILITY_FIXTURE_PATH: "" }, "missing fixture");
  process.stdout.write("production availability runtime acceptance passed\n");
} finally {
  await rm(temp, { recursive: true, force: true });
}