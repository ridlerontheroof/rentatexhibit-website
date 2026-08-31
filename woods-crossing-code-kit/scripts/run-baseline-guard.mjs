import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const id = process.argv[2];
const fixture = JSON.parse(readFileSync(resolve(root, "fixtures/baseline-contracts.json"), "utf8"));
const requirements = fixture.requirements[id];
if (!requirements) throw new Error(`No deterministic fixture for baseline guard: ${id}`);
let assertions = 0;
execFileSync(process.execPath, ["--import", "tsx", resolve(root, "scripts/behavioral-baseline.mjs"), id], { cwd: root, stdio: "inherit" });
for (const requirement of requirements) {
  const sourcePath = resolve(root, requirement.path);
  if (!existsSync(sourcePath)) throw new Error(`${id}: required implementation missing: ${requirement.path}`);
  const source = readFileSync(sourcePath, "utf8");
  for (const expression of requirement.patterns) {
    assertions += 1;
    if (!new RegExp(expression, "i").test(source)) {
      throw new Error(`${id}: ${requirement.path} does not satisfy required assertion /${expression}/i`);
    }
  }
}

const liveScripts = {
  "head.per-url": "guards/check-hydrated-seo.mjs",
  "index.real-404": "guards/check-hydrated-seo.mjs",
  "jsonld.valid": "guards/check-schema-validator.mjs",
  "a11y.axe": "guards/check-a11y.mjs",
  "redirects.one-hop": "guards/check-legacy-redirects.mjs",
  "leads.bot-guard": "guards/check-hydrated-seo.mjs",
  "appfolio.feed-health": "guards/check-rented-noindex.mjs",
  "ops.postpublish-watch": "web/scripts/watch-postpublish.mjs",
  "content.systems-live": "guards/check-knowledge-pages.mjs"
};
if (process.env.KIT_GUARD_MODE === "online") {
  if (["index.real-404", "leads.bot-guard", "ops.postpublish-watch"].includes(id)) {
    execFileSync(process.execPath, [resolve(root, "scripts/online-contract.mjs"), id], { stdio: "inherit", env: process.env });
    process.exit(0);
  }
  const script = liveScripts[id];
  if (!script) throw new Error(`${id}: no live guard adapter; use deterministic offline mode`);
  const baseUrl = process.env.SITE_URL;
  if (!baseUrl) throw new Error("SITE_URL is required when KIT_GUARD_MODE=online");
  execFileSync(process.execPath, [resolve(root, script), baseUrl], { stdio: "inherit" });
  process.stdout.write(`baseline guard passed online: ${id}\n`);
} else {
  process.stdout.write(`baseline guard passed offline implementation assertions: ${id} (${assertions})\n`);
}