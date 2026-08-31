import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const roots = ["api-server/src", "web/src", "web/scripts", "web/server", "guards"];
const files = [];
async function collect(directory) {
  for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
    const name = join(directory, entry.name);
    if (entry.isDirectory()) await collect(name);
    else if ([".ts", ".tsx", ".mjs"].includes(extname(entry.name))) files.push(name);
  }
}
for (const directory of roots) await collect(directory);

const errors = [];
for (const file of files) {
  const path = resolve(root, file);
  if (file.endsWith(".mjs")) {
    try { execFileSync(process.execPath, ["--check", path], { stdio: "pipe" }); }
    catch (error) { errors.push(`${file}: ${error.stderr?.toString().trim() || "invalid JavaScript"}`); }
    continue;
  }
  const source = await readFile(path, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
    fileName: file,
    reportDiagnostics: true
  });
  for (const diagnostic of result.diagnostics || []) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      errors.push(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
    }
  }
}
const staticContracts = [
  ["api-server/src/lib/appfolio.ts", "fetch("],
  ["api-server/src/routes/availability.ts", "getAvailabilitySnapshot"],
  ["api-server/src/routes/leads.ts", "botGuard"],
  ["api-server/src/routes/showings.ts", "showing"],
  ["web/scripts/prerender.mjs", "sitemap"],
  ["web/scripts/html-to-markdown.mjs", "markdown"],
  ["web/src/lib/analytics.ts", "gtag"],
  ["web/scripts/watch-postpublish.mjs", "postpublish"]
];
for (const [file, needle] of staticContracts) {
  const source = await readFile(resolve(root, file), "utf8");
  if (!source.includes(needle)) errors.push(`${file}: expected extracted machinery marker "${needle}"`);
}
if (errors.length) throw new Error(`Extracted source validation failed:\n- ${errors.join("\n- ")}`);
process.stdout.write(`source syntax validated: ${files.length} extracted modules; ${staticContracts.length} machinery contracts\n`);