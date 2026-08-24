#!/usr/bin/env node
// check-web-env-docs.mjs — prepublish guard
//
// Cross-checks the required web environment variables enforced by
// vite.config.ts against the Required=Yes rows in the environment-variable
// checklist.
//
// Usage (called automatically by check:prepublish):
//   node scripts/check-web-env-docs.mjs

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VITE_CONFIG = resolve(__dirname, "../vite.config.ts");
const ENV_DOCS = resolve(__dirname, "../../config/env-vars.md");

export function parseViteRequiredVars(source) {
  const arrayMatch = source.match(
    /\bconst\s+REQUIRED_VARS\s*=\s*\[([\s\S]*?)\]\s*as\s+const\s*;/,
  );

  if (!arrayMatch) {
    throw new Error(
      "Could not parse the REQUIRED_VARS array from vite.config.ts.",
    );
  }

  const variables = [
    ...arrayMatch[1].matchAll(/(['"])([A-Z][A-Z0-9_]*)\1/g),
  ].map((match) => match[2]);

  if (variables.length === 0) {
    throw new Error("The REQUIRED_VARS array in vite.config.ts is empty.");
  }

  // The client build variables are listed in REQUIRED_VARS. PORT is enforced
  // separately because a build does not bind a port, while `vite serve` does.
  // Include it in the comparison when that serve-time guard is present.
  if (
    /if\s*\(\s*command\s*===\s*['"]serve['"]\s*&&\s*!rawPort\s*\)/.test(
      source,
    ) &&
    !variables.includes("PORT")
  ) {
    variables.push("PORT");
  }

  return variables;
}

function parseMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return null;

  const cells = trimmed.split("|");
  if (cells.length < 3) return null;

  return cells.slice(1, -1).map((cell) => cell.trim());
}

export function parseRequiredWebVars(source) {
  const lines = source.split(/\r?\n/);
  const sectionStart = lines.findIndex((line) =>
    /^##\s+Web Artifact\b/.test(line.trim()),
  );

  if (sectionStart === -1) {
    throw new Error("Could not find the Web Artifact section in env-vars.md.");
  }

  const sectionEnd = lines.findIndex(
    (line, index) => index > sectionStart && /^##\s+/.test(line.trim()),
  );
  const section = lines.slice(
    sectionStart + 1,
    sectionEnd === -1 ? lines.length : sectionEnd,
  );

  const headerIndex = section.findIndex((line) => {
    const cells = parseMarkdownRow(line);
    return (
      cells?.some((cell) => cell.toLowerCase() === "variable") &&
      cells?.some((cell) => cell.toLowerCase() === "required")
    );
  });

  if (headerIndex === -1) {
    throw new Error(
      "Could not find the web environment variable table in env-vars.md.",
    );
  }

  const header = parseMarkdownRow(section[headerIndex]);
  const requiredIndex = header.findIndex(
    (cell) => cell.toLowerCase() === "required",
  );
  const variables = [];

  for (const line of section.slice(headerIndex + 1)) {
    const cells = parseMarkdownRow(line);
    if (!cells || cells.every((cell) => /^[-:]+$/.test(cell))) continue;

    const variableMatch = cells[0]?.match(/^`([A-Z][A-Z0-9_]*)`$/);
    const required = cells[requiredIndex]?.replace(/\*/g, "").trim();

    if (variableMatch && required === "Yes") {
      variables.push(variableMatch[1]);
    }
  }

  return variables;
}

export function compareRequiredWebVars(enforced, documented) {
  const documentedSet = new Set(documented);
  const enforcedSet = new Set(enforced);

  return {
    enforced,
    documented,
    onlyInVite: enforced.filter((name) => !documentedSet.has(name)),
    onlyInDocs: documented.filter((name) => !enforcedSet.has(name)),
  };
}

function readSource(file, label) {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${label} at ${file}: ${error.message}`);
  }
}

function run() {
  const enforced = parseViteRequiredVars(
    readSource(VITE_CONFIG, "vite.config.ts"),
  );
  const documented = parseRequiredWebVars(
    readSource(ENV_DOCS, "env-vars.md"),
  );
  const result = compareRequiredWebVars(enforced, documented);

  console.log("\nChecking web required env checklist sync (prepublish) …");
  console.log(
    `  vite.config.ts       (${result.enforced.length}): ${result.enforced.join(", ")}`,
  );
  console.log(
    `  config/env-vars.md   (${result.documented.length}): ${result.documented.join(", ")}`,
  );

  if (result.onlyInVite.length === 0 && result.onlyInDocs.length === 0) {
    console.log(
      `\n  PASS  All ${result.enforced.length} required web variable(s) are in sync.\n`,
    );
    return;
  }

  const lines = [
    "",
    "  FAIL  Required web environment variables are out of sync.",
  ];

  if (result.onlyInVite.length > 0) {
    lines.push(
      "        Enforced by vite.config.ts but missing from config/env-vars.md:",
      ...result.onlyInVite.map((name) => `          - ${name}`),
    );
  }

  if (result.onlyInDocs.length > 0) {
    lines.push(
      "        Marked Required=Yes in config/env-vars.md but not enforced by vite.config.ts:",
      ...result.onlyInDocs.map((name) => `          - ${name}`),
    );
  }

  lines.push(
    "",
    "        Keep the Vite REQUIRED_VARS array and the Web Artifact Required=Yes rows in lockstep.",
    "",
  );
  console.error(lines.join("\n"));
  process.exitCode = 1;
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  try {
    run();
  } catch (error) {
    console.error(`\n  FAIL  ${error.message}\n`);
    process.exitCode = 1;
  }
}