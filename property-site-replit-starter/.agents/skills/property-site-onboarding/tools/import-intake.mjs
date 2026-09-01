#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";

const GENERATED = [
  "property-config.draft.json",
  "source-inventory.json",
  "candidate-facts.json",
  "gap-report.md",
  "UNCERTAINTY_REGISTER.md",
  "INTAKE_CHECKLIST.md",
  "NEXT_STEPS.md",
];
const TEXT_EXTENSIONS = new Set([".html", ".htm", ".js", ".mjs", ".json", ".md", ".txt", ".xml", ".css"]);
const MAX_FILES = 2000;
const MAX_ENTRY_BYTES = 25 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 250 * 1024 * 1024;
const MAX_SCAN_BYTES = 2 * 1024 * 1024;

function fail(message) {
  console.error(`intake-import: ${message}`);
  process.exit(1);
}

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === "--force") out.force = true;
    else if (key.startsWith("--")) out[key.slice(2)] = argv[++i];
    else fail(`unexpected argument: ${key}`);
  }
  if (!out.zip || !out.om || !out.out) {
    fail("usage: node import-intake.mjs --zip <claude.zip> --om <memorandum.pdf> --out <new-directory> [--force]");
  }
  return out;
}

function command(name, commandArgs, options = {}) {
  try {
    return execFileSync(name, commandArgs, {
      encoding: options.encoding === undefined ? "utf8" : options.encoding,
      maxBuffer: options.maxBuffer ?? 128 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    fail(`${name} failed: ${detail}`);
  }
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function extension(path) {
  const match = path.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
}

function safeArchivePath(path) {
  if (!path || path.includes("\0") || path.includes("\\") || path.startsWith("/") || /^[A-Za-z]:/.test(path)) return false;
  const parts = path.split("/");
  return !parts.some((part) => part === ".." || part === ".");
}

function lstatIfExists(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function prepareOutput(outDir, force) {
  const existingOutputStat = lstatIfExists(outDir);
  if (existingOutputStat) {
    const outputStat = existingOutputStat;
    if (outputStat.isSymbolicLink() || !outputStat.isDirectory()) fail(`output must be a real directory, not a link or special file: ${outDir}`);
    const existing = readdirSync(outDir);
    const foreign = existing.filter((name) => !GENERATED.includes(name));
    if (existing.length && !force) fail("output directory is not empty; choose a new directory or pass --force");
    if (foreign.length) fail(`refusing to modify a directory containing non-importer files: ${foreign.join(", ")}`);
  } else {
    mkdirSync(outDir, { recursive: true });
  }
  const realOut = realpathSync(outDir);
  const realParent = realpathSync(dirname(outDir));
  if (dirname(realOut) !== realParent) fail(`resolved output escapes its dedicated parent: ${outDir}`);
  for (const name of GENERATED) {
    const path = resolve(realOut, name);
    if (dirname(path) !== realOut) fail(`generated path escapes output directory: ${name}`);
    const stat = lstatIfExists(path);
    if (stat) {
      if (stat.isSymbolicLink() || !stat.isFile()) {
        fail(`refusing unsafe existing output (must be a regular file): ${path}`);
      }
    }
  }
  return realOut;
}

function atomicWrite(outDir, name, content) {
  if (!GENERATED.includes(name)) fail(`refusing unexpected generated filename: ${name}`);
  if (realpathSync(outDir) !== outDir || lstatSync(outDir).isSymbolicLink()) {
    fail(`output directory boundary changed while importing: ${outDir}`);
  }
  const destination = resolve(outDir, name);
  if (dirname(destination) !== outDir) fail(`generated path escapes output directory: ${name}`);
  const destinationStat = lstatIfExists(destination);
  if (destinationStat) {
    if (destinationStat.isSymbolicLink() || !destinationStat.isFile()) {
      fail(`refusing unsafe existing output (must be a regular file): ${destination}`);
    }
  }
  const temporary = resolve(outDir, `.${name}.${process.pid}.tmp`);
  if (dirname(temporary) !== outDir || lstatIfExists(temporary)) fail(`unsafe temporary output path: ${temporary}`);
  let descriptor;
  try {
    descriptor = openSync(
      temporary,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW,
      0o644,
    );
    writeSync(descriptor, content, null, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, destination);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    rmSync(temporary, { force: true });
  }
}

function zipEntries(zipPath) {
  const listing = command("unzip", ["-l", zipPath]);
  const entries = [];
  for (const line of listing.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+)$/);
    if (!match || match[2] === "Name") continue;
    const path = match[2].trim();
    if (!safeArchivePath(path)) fail(`unsafe archive path rejected: ${JSON.stringify(path)}`);
    entries.push({ path, bytes: Number(match[1]), directory: path.endsWith("/") });
  }
  if (!entries.length) fail("ZIP contains no entries or could not be inventoried");
  if (entries.length > MAX_FILES) fail(`ZIP has ${entries.length} entries; limit is ${MAX_FILES}`);
  const total = entries.reduce((sum, item) => sum + item.bytes, 0);
  if (total > MAX_ARCHIVE_BYTES) fail(`ZIP expands to ${total} bytes; limit is ${MAX_ARCHIVE_BYTES}`);
  const oversized = entries.find((item) => item.bytes > MAX_ENTRY_BYTES);
  if (oversized) fail(`ZIP entry exceeds ${MAX_ENTRY_BYTES} bytes: ${oversized.path}`);
  return entries;
}

function readZipEntry(zipPath, entry, encoding = null) {
  const data = command("unzip", ["-p", zipPath, entry.path], { encoding, maxBuffer: MAX_ENTRY_BYTES + 1024 });
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (buffer.length !== entry.bytes) fail(`ZIP entry size mismatch for ${entry.path}`);
  return buffer;
}

function scanArchive(zipPath, entries) {
  const inventory = [];
  const documents = [];
  for (const entry of entries) {
    if (entry.directory) {
      inventory.push({ ...entry, sha256: null, scanned: false });
      continue;
    }
    const buffer = readZipEntry(zipPath, entry);
    const macMetadata = entry.path.startsWith("__MACOSX/") || basename(entry.path).startsWith("._");
    const scan = !macMetadata && TEXT_EXTENSIONS.has(extension(entry.path)) && buffer.length <= MAX_SCAN_BYTES;
    inventory.push({ ...entry, sha256: sha256(buffer), scanned: scan });
    if (scan) documents.push({ path: entry.path, text: buffer.toString("utf8") });
  }
  return { inventory, documents };
}

function issue(id, severity, category, source, evidence, action) {
  return { id, severity, category, source, evidence: evidence.replace(/\s+/g, " ").trim().slice(0, 280), action };
}

function inspectPackage(documents) {
  const issues = [];
  const patterns = [
    ["placeholder", "BLOCKER", "placeholder", /\b(?:placeholder|mock|dummy|sample data)\b/i, "Replace with verified production data."],
    ["todo", "BLOCKER", "placeholder", /\b(?:TODO|FIXME|data-todo)\b/i, "Complete or remove unfinished behavior."],
    ["hash-link", "BLOCKER", "integration", /href\s*=\s*["']#["']/i, "Wire the control to an approved destination."],
    ["fake-submit", "BLOCKER", "integration", /(?:posts nowhere|preventDefault\s*\(|alert\s*\(\s*["'][^"']*(?:thank|submit))/i, "Wire and end-to-end verify the lead destination."],
    ["appfolio", "BLOCKER", "integration", /AppFolio[^.\n]{0,100}(?:mock|placeholder|swap|wire|replace)/i, "Verify AppFolio database, property name, feed, portal, and guest-card paths (G7)."],
  ];
  let sequence = 0;
  for (const document of documents) {
    for (const [name, severity, category, pattern, action] of patterns) {
      const match = document.text.match(pattern);
      if (match) issues.push(issue(`ZIP-${String(++sequence).padStart(3, "0")}-${name}`, severity, category, document.path, match[0], action));
    }
  }
  const joined = documents.map((item) => item.text).join("\n");
  const integrationChecks = [
    ["GA4/GTM implementation", /googletagmanager\.com\/(?:gtag\/js|gtm\.js)|\bgtag\s*\(\s*["']config/i],
    ["lead form destination", /<form\b[^>]*\baction\s*=\s*["'][^"'#]+/i],
    ["AppFolio live endpoint", /https?:\/\/[^\s"'<>]*appfolio/i],
    ["monitoring/health check", /healthz|monitoring|watchdog/i],
    ["IndexNow", /indexnow/i],
  ];
  for (const [label, pattern] of integrationChecks) {
    if (!pattern.test(joined)) {
      issues.push(issue(`ZIP-${String(++sequence).padStart(3, "0")}-missing`, "GAP", "integration", "Claude ZIP", `${label} not detected`, `Production kit must provide and operator must verify ${label}.`));
    }
  }
  const claimPattern = /\b(?:top[- ]rated|luxury|minutes? from|start(?:s|ing)? at|\$\d+|pet[- ]friendly|renovated|free parking|quiet residential)\b/i;
  for (const document of documents) {
    const lines = document.text.replace(/<[^>]+>/g, " ").split(/\r?\n/);
    for (const line of lines) {
      if (claimPattern.test(line) && line.replace(/\s+/g, " ").trim().length >= 20) {
        issues.push(issue(`ZIP-${String(++sequence).padStart(3, "0")}-claim`, "REVIEW", "unsupported-claim", document.path, line, "Confirm against owner-approved leasing source before publishing."));
        if (issues.filter((item) => item.category === "unsupported-claim").length >= 20) break;
      }
    }
  }
  return issues;
}

function fact(id, field, value, sourceType, source, evidence, page = null) {
  return { id, field, value, status: "UNCONFIRMED", sourceType, source, page, evidence: evidence.replace(/\s+/g, " ").trim() };
}

function extractOmFacts(pdfPath, pages, propertyName) {
  const labels = [
    ["nap.streetAddress", "Address", /Address\s+(.+?)(?=\s{2,}(?:Number of Units|Electric)|$)/i],
    ["property.unitCount", "Number of Units", /Number of Units\s+([0-9,]+)/i],
    ["property.yearCompleted", "Year Completed", /Year Completed\s+([0-9]{4})/i],
    ["property.netRentableSquareFeet", "Net Rentable Square Feet", /Net Rentable Square Feet\s+([±~]?\s*[0-9,]+)/i],
    ["property.averageUnitSizeSf", "Average Unit Size", /Average Unit Size \(SF\)\s+([±~]?\s*[0-9,]+)/i],
    ["property.buildingCount", "Number of Buildings", /Number of Buildings\s+([0-9]+)/i],
    ["property.floorCount", "Number of Floors", /Number of Floors\s+([0-9]+)/i],
    ["property.parcelSize", "Parcel Size", /Parcel Size\s+([0-9.]+\s+Acres?)/i],
    ["property.taxParcelNumber", "Tax Parcel Number", /Tax Parcel Number\s+([0-9-]+)/i],
    ["utilities.electric", "Electric utility", /Electric\s+(Rocky Mountain Power)/i],
    ["utilities.gas", "Gas utility", /Gas\s*(?:\[\d+\])?\s+(Enbridge Gas)/i],
    ["utilities.water", "Water utility", /Water\s+(City of South Salt Lake)/i],
    ["utilities.internet", "Internet provider", /Internet\s+(Xfinity)/i],
  ];
  const facts = [];
  let sequence = 0;
  const marker = propertyName.replace(/\s+Apartments?$/i, "").trim();
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const markerPattern = new RegExp(`^\\s*${escapedMarker}\\s*$`, "im");
  const markerPages = pages.flatMap((page, index) => markerPattern.test(page) ? [index] : []);
  const markerToken = marker.split(/\s+/)[0];
  const summaryPage = pages.findIndex((page) => /PROPERTY\s+summary/i.test(page) && new RegExp(markerToken, "i").test(page));
  const markerPage = summaryPage >= 0
    ? (markerPages.filter((index) => index <= summaryPage).at(-1) ?? summaryPage)
    : (markerPages[0] ?? -1);
  const scopedPages = markerPage >= 0 ? pages.map((page, index) => index >= markerPage ? page : "") : pages;
  scopedPages.forEach((raw, index) => {
    const page = index + 1;
    const text = raw.replace(/\r/g, "");
    for (const [field, , pattern] of labels) {
      const match = text.match(pattern);
      if (match) facts.push(fact(`OM-${String(++sequence).padStart(3, "0")}`, field, match[1].replace(/\s+/g, " ").trim(), "offering-memorandum", basename(pdfPath), match[0], page));
    }
    if (page >= 24 && page <= 27) {
      const amenityTerms = [
        "Open-concept floor plans", "Fully equipped kitchens + appliance package", "Refrigerator, oven, and dishwasher",
        "Central air conditioning", "Fireplace in select units", "Covered parking available", "Pet-Friendly Community",
        "Off-Street Parking", "Ample in-unit storage",
      ];
      for (const term of amenityTerms) {
        if (text.toLowerCase().includes(term.toLowerCase())) {
          facts.push(fact(`OM-${String(++sequence).padStart(3, "0")}`, "leasing.amenity", term, "offering-memorandum", basename(pdfPath), term, page));
        }
      }
    }
  });
  const seen = new Set();
  return facts.filter((item) => {
    const key = `${item.field}\0${JSON.stringify(item.value)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractZipFacts(documents, zipName, start = 0) {
  const facts = [];
  let sequence = start;
  for (const document of documents) {
    const jsonLd = [...document.text.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const match of jsonLd) {
      try {
        const value = JSON.parse(match[1]);
        const add = (field, candidate) => {
          if (candidate !== undefined && candidate !== null && candidate !== "") {
            facts.push(fact(`ZIP-${String(++sequence).padStart(3, "0")}`, field, candidate, "claude-package", `${zipName}:${document.path}`, JSON.stringify(candidate)));
          }
        };
        add("property.name", value.name);
        add("identity.canonicalOrigin", value.url?.replace(/\/$/, ""));
        add("nap.phone", value.telephone);
        add("nap.streetAddress", value.address?.streetAddress);
        add("nap.locality", value.address?.addressLocality);
        add("nap.region", value.address?.addressRegion);
        add("nap.postalCode", value.address?.postalCode);
        add("nap.geo.latitude", value.geo?.latitude);
        add("nap.geo.longitude", value.geo?.longitude);
        add("property.unitCount", value.numberOfAccommodationUnits?.value);
      } catch {
        // Malformed JSON-LD is reported as a gap below rather than trusted.
      }
    }
  }
  const seen = new Set();
  return facts.filter((item) => {
    const key = `${item.field}\0${JSON.stringify(item.value)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function slugify(value) {
  return value.toLowerCase().replace(/apartments?/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unconfirmed-property";
}

function choose(facts, field, fallback) {
  return facts.find((item) => item.field === field && item.sourceType === "claude-package")?.value
    ?? facts.find((item) => item.field === field)?.value
    ?? fallback;
}

function configDraft(facts) {
  const name = String(choose(facts, "property.name", "UNCONFIRMED PROPERTY NAME"));
  const origin = String(choose(facts, "identity.canonicalOrigin", "https://unconfirmed.invalid"));
  return {
    configVersion: "1",
    kitVersion: "kit-v2.0.0",
    property: { name, shortName: name.replace(/\s+Apartments?$/i, ""), slug: slugify(name) },
    identity: { canonicalOrigin: origin, domains: [new URL(origin).hostname] },
    nap: {
      streetAddress: String(choose(facts, "nap.streetAddress", "UNCONFIRMED")),
      locality: String(choose(facts, "nap.locality", "UNCONFIRMED")),
      region: String(choose(facts, "nap.region", "UNCONFIRMED")),
      postalCode: String(choose(facts, "nap.postalCode", "UNCONFIRMED")),
      phone: String(choose(facts, "nap.phone", "UNCONFIRMED")),
      timezone: "America/Denver",
    },
    leasing: { facts: {} },
  };
}

function markdownTable(rows, columns) {
  const header = `| ${columns.map((item) => item[0]).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  return [header, divider, ...rows.map((row) => `| ${columns.map((item) => String(row[item[1]] ?? "").replaceAll("|", "\\|").replace(/\s+/g, " ")).join(" | ")} |`)].join("\n");
}

function writeReports(outDir, inventory, facts, issues, meta, config) {
  atomicWrite(outDir, "property-config.draft.json", json(config));
  atomicWrite(outDir, "source-inventory.json", json({ dryRun: true, launchAuthorized: false, sources: meta, archiveEntries: inventory }));
  atomicWrite(outDir, "candidate-facts.json", json({ policy: "Every candidate is UNCONFIRMED until owner review (G1). OM investment claims are not leasing facts.", candidates: facts }));

  const blockers = issues.filter((item) => item.severity === "BLOCKER").length;
  const gaps = issues.filter((item) => item.severity === "GAP").length;
  atomicWrite(outDir, "gap-report.md", `# Intake gap report

> **DRY RUN — UNCONFIRMED — NO LAUNCH AUTHORIZED**

The Claude package is an input only, not production code. Detected ${blockers} blockers, ${gaps} missing capabilities, and ${issues.length} total review items. The production kit replaces package integrations and unsupported implementation.

${markdownTable(issues, [["ID", "id"], ["Severity", "severity"], ["Category", "category"], ["Source", "source"], ["Evidence", "evidence"], ["Required action", "action"]])}
`);
  atomicWrite(outDir, "UNCERTAINTY_REGISTER.md", `# Uncertainty register

> **All entries are UNCONFIRMED. Do not use in public copy, schema, feeds, or integrations until G1 owner review.**

${markdownTable(facts, [["ID", "id"], ["Status", "status"], ["Candidate field", "field"], ["Candidate value", "value"], ["Source", "source"], ["Page", "page"], ["Evidence", "evidence"]])}
`);
  atomicWrite(outDir, "INTAKE_CHECKLIST.md", `# Intake checklist

> **DRY RUN ONLY. Nothing in this folder approves publication or production launch.**

- [ ] G1: Owner marks every candidate fact CONFIRMED or REJECTED.
- [ ] Reconcile conflicts between the Claude package and OM (including unit size and any address wording).
- [ ] Confirm legal marketing name, canonical domain ownership, complete NAP, office hours, and timezone.
- [ ] Confirm current rents, deposits, fees, pet policy, utilities, parking, storage, accessibility, and floor-plan data from leasing records.
- [ ] G2: Confirm rights to reuse every photo, logo, font, and line of copy.
- [ ] G3: Approve a design direction; the Claude package does not constitute approval.
- [ ] G4: Crawl the live legacy site and approve the URL parity/redirect map.
- [ ] G7: Verify AppFolio database, exact property name, listing feed, application/portal URLs, and hidden tour unit.
- [ ] Create/approve property-specific GA4/GTM, Search Console, Google Business Profile, IndexNow, email routing, monitoring, and CSP configuration.
- [ ] Link secrets only through the approved secure operator flow; never copy values into config or reports.
- [ ] Complete legal, fair-housing, accessibility, performance, SEO/AEO, and prepublish review.
- [ ] G8: Obtain explicit publish approval. No DNS, deployment, or launch action was performed by this import.
`);
  atomicWrite(outDir, "NEXT_STEPS.md", `# Next steps

> **UNCONFIRMED BLAIR PILOT EVIDENCE — NOT A LAUNCH PLAN OR APPROVAL**

1. Review \`candidate-facts.json\` alongside each cited OM page and ZIP path; resolve every item through G1.
2. Resolve every BLOCKER and GAP in \`gap-report.md\`; replace mock/static integrations with the pinned production kit.
3. Obtain missing owner materials and decisions listed in \`INTAKE_CHECKLIST.md\`.
4. After fact and rights review, move only CONFIRMED values into a build-phase config.
5. Run legacy discovery/parity and all later human gates separately. Do not publish from these intake outputs.
`);
}

const options = args(process.argv.slice(2));
const zipPath = resolve(options.zip);
const pdfPath = resolve(options.om);
const outDir = resolve(options.out);
if (!existsSync(zipPath) || !lstatSync(zipPath).isFile()) fail(`ZIP not found: ${options.zip}`);
if (!existsSync(pdfPath) || !lstatSync(pdfPath).isFile()) fail(`PDF not found: ${options.om}`);
if (extension(zipPath) !== ".zip" || extension(pdfPath) !== ".pdf") fail("inputs must be a .zip and .pdf");
if (outDir === resolve(".") || outDir === resolve("/")) fail("output must be a dedicated directory");

const safeOutDir = prepareOutput(outDir, options.force);
const entries = zipEntries(zipPath);
const { inventory, documents } = scanArchive(zipPath, entries);
const pdfInfo = command("pdfinfo", [pdfPath]);
const pageCount = Number(pdfInfo.match(/^Pages:\s+(\d+)/m)?.[1]);
if (!pageCount) fail("could not determine PDF page count");
const pdfText = command("pdftotext", ["-layout", "-enc", "UTF-8", pdfPath, "-"]);
const pages = pdfText.split("\f").slice(0, pageCount);
if (pages.every((page) => !page.trim())) fail("PDF has no extractable text layer; OCR/manual review is required");

const zipFacts = extractZipFacts(documents, basename(zipPath));
const packagePropertyName = String(choose(zipFacts, "property.name", ""));
const omFacts = extractOmFacts(pdfPath, pages, packagePropertyName);
const facts = [...zipFacts, ...omFacts];
const issues = inspectPackage(documents);
const omMarketingTerms = /\b(?:investment|value-add|rent growth|rental demand|long-term growth|support occupancy|tenant appeal)\b/i;
pages.forEach((page, index) => {
  const line = page.split(/\r?\n/).find((candidate) => {
    const clean = candidate.replace(/\s+/g, " ").trim();
    return clean.length >= 45
      && omMarketingTerms.test(clean)
      && !/^INVESTMENT THESIS\b.*\bCOMPARABLES$/i.test(clean);
  });
  if (line) issues.push(issue(`OM-${String(index + 1).padStart(3, "0")}-claim`, "REVIEW", "unsupported-claim", `${basename(pdfPath)} p.${index + 1}`, line, "Treat as investment marketing only; owner must separately approve any leasing claim."));
});

const sources = [
  { type: "claude-package", file: basename(zipPath), bytes: lstatSync(zipPath).size, sha256: sha256(readFileSync(zipPath)), entries: entries.length, extractionPolicy: "streamed individual entries for inventory/scan; never extracted over project files" },
  { type: "offering-memorandum", file: basename(pdfPath), bytes: lstatSync(pdfPath).size, sha256: sha256(readFileSync(pdfPath)), pages: pageCount, extraction: "pdftotext -layout; page provenance retained" },
];
writeReports(safeOutDir, inventory, facts, issues, sources, configDraft(facts));
console.log(`Wrote deterministic dry-run intake evidence to ${safeOutDir}`);
console.log(`${facts.length} unconfirmed candidate facts; ${issues.length} gaps/review items; launchAuthorized=false`);