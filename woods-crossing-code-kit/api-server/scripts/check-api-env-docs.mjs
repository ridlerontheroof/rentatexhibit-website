#!/usr/bin/env node
// check-api-env-docs.mjs — API server validation guard
//
// Cross-checks the environment variables enforced by validateEnv.ts against
// the Required=Yes rows in the API Server section of the shared checklist.
//
// Usage (called automatically by the API server validation workflow):
//   node scripts/check-api-env-docs.mjs

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VALIDATE_ENV = resolve(__dirname, "../src/lib/validateEnv.ts");
const ENV_DOCS = resolve(__dirname, "../../config/env-vars.md");

export function parseApiRequiredVars(source) {
  const arrayMatch = source.match(
    /\bconst\s+REQUIRED_VARS\s*=\s*\[([\s\S]*?)\]\s*as\s+const\s*;/,
  );

  if (!arrayMatch) {
    throw new Error(
      "Could not parse the REQUIRED_VARS array from validateEnv.ts.",
    );
  }

  const variables = [
    ...arrayMatch[1].matchAll(/(['"])([A-Z][A-Z0-9_]*)\1/g),
  ].map((match) => match[2]);

  if (variables.length === 0) {
    throw new Error("The REQUIRED_VARS array in validateEnv.ts is empty.");
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

export function parseRequiredApiVars(source) {
  const lines = source.split(/\r?\n/);
  const sectionStart = lines.findIndex((line) =>
    /^##\s+API Server\b/.test(line.trim()),
  );

  if (sectionStart === -1) {
    throw new Error("Could not find the API Server section in env-vars.md.");
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
      "Could not find the API environment variable table in env-vars.md.",
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

export function compareRequiredApiVars(enforced, documented) {
  const documentedSet = new Set(documented);
  const enforcedSet = new Set(enforced);

  return {
    enforced,
    documented,
    onlyInStartup: enforced.filter((name) => !documentedSet.has(name)),
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
  const enforced = parseApiRequiredVars(
    readSource(VALIDATE_ENV, "validateEnv.ts"),
  );
  const documented = parseRequiredApiVars(
    readSource(ENV_DOCS, "env-vars.md"),
  );
  const result = compareRequiredApiVars(enforced, documented);

  console.log("\nChecking API required env checklist sync …");
  console.log(
    `  validateEnv.ts       (${result.enforced.length}): ${result.enforced.join(", ")}`,
  );
  console.log(
    `  config/env-vars.md   (${result.documented.length}): ${result.documented.join(", ")}`,
  );

  if (result.onlyInStartup.length === 0 && result.onlyInDocs.length === 0) {
    console.log(
      `\n  PASS  All ${result.enforced.length} required API variable(s) are in sync.\n`,
    );
    return;
  }

  const lines = [
    "",
    "  FAIL  Required API environment variables are out of sync.",
  ];

  if (result.onlyInStartup.length > 0) {
    lines.push(
      "        Enforced by validateEnv.ts but missing from config/env-vars.md:",
      ...result.onlyInStartup.map((name) => `          - ${name}`),
    );
  }

  if (result.onlyInDocs.length > 0) {
    lines.push(
      "        Marked Required=Yes in config/env-vars.md but not enforced by validateEnv.ts:",
      ...result.onlyInDocs.map((name) => `          - ${name}`),
    );
  }

  lines.push(
    "",
    "        Keep the validateEnv.ts REQUIRED_VARS array and the API Server Required=Yes rows in lockstep.",
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