import { readdir, readFile } from "node:fs/promises";
import { extname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const propertyBearingRoots = [
  "api-server/src/runtime.ts",
  "packages",
  "web/src/App.tsx",
  "web/src/main.tsx",
  "content",
  "standards",
];
const forbidden = [/\bwoods crossing\b/i, /woodscrossing/i, /\bexhibit on superior\b/i, /rentatexhibit/i];
const files = [];
async function collect(path) {
  const stat = await readdir(path, { withFileTypes: true }).catch(() => null);
  if (!stat) return files.push(path);
  for (const entry of stat) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) await collect(child);
    else if ([".ts", ".tsx", ".mjs", ".json"].includes(extname(entry.name))) files.push(child);
  }
}
for (const item of propertyBearingRoots) await collect(resolve(root, item));
const failures = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  if (forbidden.some((pattern) => pattern.test(text))) failures.push(relative(root, file));
}
if (failures.length) throw new Error(`Property literals found in runnable release files:\n- ${failures.join("\n- ")}`);
process.stdout.write(`property-neutral runnable surface: ${files.length} files\n`);