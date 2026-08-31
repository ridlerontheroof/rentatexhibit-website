import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const excludedDirectories = new Set(["node_modules", "dist", ".git", "onboarding", ".cache", ".vite", ".turbo", "coverage"]);
const excludedFiles = new Set(["release.json", "web/src/data/generated.ts", "web/src/data/selected-property.json"]);
const files = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (!excludedFiles.has(relative(root, path))) files.push(relative(root, path));
  }
}
await collect(root);
files.sort();
const hash = createHash("sha256");
for (const file of files) {
  const bytes = await readFile(resolve(root, file));
  hash.update(file.replaceAll("\\", "/"));
  hash.update("\0");
  hash.update(bytes);
  hash.update("\0");
}
const digest = hash.digest("hex");
const release = JSON.parse(await readFile(resolve(root, "release.json"), "utf8"));
const baseline = JSON.parse(await readFile(resolve(root, "standards/baseline-guards.json"), "utf8"));
const errors = [];
if (release.tag !== "kit-v2.0.0" || release.version !== "2.0.0") errors.push("release tag/version must be kit-v2.0.0/2.0.0");
if (!release.standardsCompatibility?.baselineGuardsVersion || !release.migration?.note || !release.verification?.evidence) errors.push("standardsCompatibility, migration note, and verification evidence are required");
if (release.implementationDigest !== digest) errors.push(`implementationDigest mismatch: expected ${digest}`);
if (release.standardsCompatibility?.baselineGuardsVersion !== baseline.version) errors.push("baseline guard compatibility version mismatch");
if (errors.length) throw new Error(`Invalid release metadata:\n- ${errors.join("\n- ")}`);
process.stdout.write(`release metadata valid: ${release.tag}; implementation digest ${digest}; ${files.length} release files\n`);