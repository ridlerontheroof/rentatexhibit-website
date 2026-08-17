#!/usr/bin/env node
// check-watchdog-sync.mjs — prepublish guard
//
// Cross-checks EXPECTED_WATCHDOGS in startupSummary.ts against every
// announceWatchdogStarted("…") call in the api-server source (non-test files).
//
// A mismatch exits non-zero and names the diverging entry, catching
// registration drift before a publish ships — unlike the postpublish
// check-watchdog-roster.mjs which runs against the live server after deploy.
//
// Usage (called automatically by check:prepublish):
//   node scripts/check-watchdog-sync.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const STARTUP_SUMMARY = resolve(
  __dirname,
  "../../api-server/src/lib/startupSummary.ts",
);
const API_SRC_DIR = resolve(__dirname, "../../api-server/src");

// ── 1. Extract EXPECTED_WATCHDOGS from startupSummary.ts ─────────────────────

let summarySource;
try {
  summarySource = readFileSync(STARTUP_SUMMARY, "utf8");
} catch (err) {
  console.error(
    `FAIL  Cannot read startupSummary.ts: ${err.message}\n` +
      `      Expected at: ${STARTUP_SUMMARY}`,
  );
  process.exit(1);
}

const arrayMatch = summarySource.match(
  /export\s+const\s+EXPECTED_WATCHDOGS\s*=\s*\[([\s\S]*?)\]\s*as\s+const/,
);
if (!arrayMatch) {
  console.error(
    "FAIL  Could not parse EXPECTED_WATCHDOGS array from startupSummary.ts.\n" +
      "      Make sure the export uses the exact form:\n" +
      '        export const EXPECTED_WATCHDOGS = [...] as const;',
  );
  process.exit(1);
}

const expectedNames = [...arrayMatch[1].matchAll(/"([^"]+)"/g)].map(
  (m) => m[1],
);

if (expectedNames.length === 0) {
  console.error(
    "FAIL  EXPECTED_WATCHDOGS parsed as empty — check startupSummary.ts.",
  );
  process.exit(1);
}

// ── 2. Walk api-server/src, collect announceWatchdogStarted("…") calls ───────

/** Recursively collect *.ts files, excluding *.test.ts and *.spec.ts */
function walkTs(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkTs(full, files);
    } else if (
      entry.endsWith(".ts") &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".spec.ts")
    ) {
      files.push(full);
    }
  }
  return files;
}

/** Map from watchdog name → first source file path (relative to api-server/src) */
const announcedSites = {};

for (const file of walkTs(API_SRC_DIR)) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const m of src.matchAll(/announceWatchdogStarted\(\s*"([^"]+)"\s*\)/g)) {
    const name = m[1];
    if (!(name in announcedSites)) {
      announcedSites[name] = file.slice(API_SRC_DIR.length + 1); // relative path
    }
  }
}

const announcedNames = new Set(Object.keys(announcedSites));

// ── 3. Cross-check both directions ────────────────────────────────────────────

const expectedSet = new Set(expectedNames);

/** In EXPECTED_WATCHDOGS but no announceWatchdogStarted() call found */
const expectedNotAnnounced = expectedNames.filter((n) => !announcedNames.has(n));

/** Has an announceWatchdogStarted() call but missing from EXPECTED_WATCHDOGS */
const announcedNotExpected = [...announcedNames].filter(
  (n) => !expectedSet.has(n),
);

// ── 4. Report ─────────────────────────────────────────────────────────────────

console.log("\nChecking watchdog roster sync (prepublish) …");
console.log(
  `  EXPECTED_WATCHDOGS    (${expectedNames.length}): ${expectedNames.join(", ")}`,
);
console.log(
  `  announceWatchdogStarted (${announcedNames.size}): ${[...announcedNames].join(", ")}`,
);

if (expectedNotAnnounced.length === 0 && announcedNotExpected.length === 0) {
  console.log(
    `\n  PASS  All ${expectedNames.length} watchdog(s) are in sync.\n`,
  );
  process.exit(0);
}

const lines = [""];

if (expectedNotAnnounced.length > 0) {
  lines.push(
    `  FAIL  ${expectedNotAnnounced.length} name(s) in EXPECTED_WATCHDOGS have no announceWatchdogStarted() call:`,
    ...expectedNotAnnounced.map(
      (n) =>
        `        ✗ "${n}" — add announceWatchdogStarted("${n}") inside the watchdog's start function`,
    ),
    "",
  );
}

if (announcedNotExpected.length > 0) {
  lines.push(
    `  FAIL  ${announcedNotExpected.length} announceWatchdogStarted() call(s) have no matching EXPECTED_WATCHDOGS entry:`,
    ...announcedNotExpected.map(
      (n) =>
        `        ✗ "${n}" (${announcedSites[n]}) — add "${n}" to EXPECTED_WATCHDOGS in startupSummary.ts`,
    ),
    "",
  );
}

lines.push(
  "  Fix: keep EXPECTED_WATCHDOGS in startupSummary.ts and every watchdog's",
  "  announceWatchdogStarted() call in lockstep. One entry per watchdog, same name.",
  "",
);

console.error(lines.join("\n"));
process.exit(1);
