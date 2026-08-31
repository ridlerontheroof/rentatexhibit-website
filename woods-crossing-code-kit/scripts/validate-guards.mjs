import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const content = JSON.parse(await readFile(resolve(root, "content/content-systems.json"), "utf8"));
const requiredSystems = ["faqs", "knowledge", "blog", "neighborhoodGuides"];
const missingSystems = requiredSystems.filter((key) => !Array.isArray(content[key]));
if (missingSystems.length) throw new Error(`Missing live content registries: ${missingSystems.join(", ")}`);

const baseline = JSON.parse(await readFile(resolve(root, "standards/baseline-guards.json"), "utf8"));
if (!Array.isArray(baseline.contracts) || baseline.contracts.length < 10) throw new Error("Baseline guard contract is incomplete");
const ids = new Set();
for (const contract of baseline.contracts) {
  if (!contract.id || !contract.command || contract.required !== true) throw new Error("Every baseline contract needs id, command, and required=true");
  if (ids.has(contract.id)) throw new Error(`Duplicate baseline guard id: ${contract.id}`);
  ids.add(contract.id);
}
process.stdout.write(`live content systems: ${requiredSystems.join(", ")} (empty content is valid)\nbaseline guards: ${ids.size}\n`);