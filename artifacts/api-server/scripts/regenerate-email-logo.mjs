#!/usr/bin/env node
/**
 * Regenerates the branded email logo from the site's source SVG in one step.
 *
 * Renders artifacts/exhibit-on-superior/public/images/exhibit-logo-white.svg
 * to a 440x111 transparent PNG with headless Chromium, then writes both:
 *   - artifacts/exhibit-on-superior/public/images/email/exhibit-logo-email.png
 *     (the canonical published asset), and
 *   - artifacts/api-server/src/lib/emailLogo.json
 *     (the CID-embedded base64 copy the api-server ships in emails).
 *
 * Keeping both writes in one command guarantees they never drift; the sync
 * guard in artifacts/exhibit-on-superior/src/data/emailImages.test.ts
 * verifies the two stay byte-identical.
 *
 * Usage:  pnpm --filter @workspace/api-server run regenerate:email-logo
 */
import { execFileSync } from "node:child_process";
import { existsSync, globSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const API_SERVER_ROOT = resolve(HERE, "..");
const WEB_ROOT = resolve(API_SERVER_ROOT, "..", "exhibit-on-superior");

const SOURCE_SVG = join(WEB_ROOT, "public", "images", "exhibit-logo-white.svg");
const CANONICAL_PNG = join(WEB_ROOT, "public", "images", "email", "exhibit-logo-email.png");
const EMAIL_LOGO_JSON = join(API_SERVER_ROOT, "src", "lib", "emailLogo.json");

// Output size documented in src/lib/emailLogo.ts and expected by the email
// template layout (logo displayed at half size for retina sharpness).
const WIDTH = 440;
const HEIGHT = 111;

/** Same Chromium lookup chain as the fact-sheet printer / fold check. */
function findChromium() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  for (const name of ["chromium", "chromium-browser", "google-chrome"]) {
    try {
      const p = execFileSync("which", [name], { encoding: "utf8" }).trim();
      if (p) return p;
    } catch {
      /* not on PATH */
    }
  }
  // Prefer the nix-store playwright-browsers chromium (the ms-playwright
  // cache copy is missing libglib in this environment).
  const nixMatches = globSync(
    "/nix/store/*-playwright-browsers-chromium/chromium-*/chrome-linux/chrome",
  ).sort();
  if (nixMatches.length > 0) return nixMatches[nixMatches.length - 1];
  const cacheMatches = globSync(
    join(process.env.HOME ?? "", ".cache/ms-playwright/chromium-*/chrome-linux/chrome"),
  ).sort();
  if (cacheMatches.length > 0) return cacheMatches[cacheMatches.length - 1];
  return null;
}

function main() {
  if (!existsSync(SOURCE_SVG)) {
    console.error(`Source SVG not found: ${SOURCE_SVG}`);
    process.exit(1);
  }
  const chrome = findChromium();
  if (!chrome) {
    console.error(
      "No headless Chromium found (checked CHROME_BIN, PATH, nix store, ms-playwright cache).",
    );
    process.exit(1);
  }
  console.log(`Using Chromium: ${chrome}`);

  const workDir = mkdtempSync(join(tmpdir(), "email-logo-"));
  try {
    // Inline the SVG markup at an exact pixel size so the screenshot is a
    // tight, transparent-background render of the wordmark.
    const svgMarkup = readFileSync(SOURCE_SVG, "utf8").replace(
      /<svg /,
      `<svg width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid meet" `,
    );
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      * { margin: 0; padding: 0; }
      html, body { background: transparent; }
      svg { display: block; width: ${WIDTH}px; height: ${HEIGHT}px; }
    </style></head><body>${svgMarkup}</body></html>`;
    const htmlPath = join(workDir, "logo.html");
    const pngPath = join(workDir, "logo.png");
    writeFileSync(htmlPath, html);

    execFileSync(
      chrome,
      [
        // NOTE: --headless=new produces a blank (unpainted) screenshot with
        // this nix-store Chromium; old headless paints correctly.
        "--headless=old",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--default-background-color=00000000",
        `--window-size=${WIDTH},${HEIGHT}`,
        `--screenshot=${pngPath}`,
        htmlPath,
      ],
      { stdio: ["ignore", "ignore", "pipe"] }, // D-Bus noise on stderr is harmless
    );

    const png = readFileSync(pngPath);
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (!sig.every((b, i) => png[i] === b)) {
      console.error("Chromium output is not a valid PNG");
      process.exit(1);
    }
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    if (w !== WIDTH || h !== HEIGHT) {
      console.error(`Rendered PNG is ${w}x${h}, expected ${WIDTH}x${HEIGHT}`);
      process.exit(1);
    }

    // Write both destinations from the same buffer so they cannot drift.
    writeFileSync(CANONICAL_PNG, png);
    const existing = JSON.parse(readFileSync(EMAIL_LOGO_JSON, "utf8"));
    writeFileSync(
      EMAIL_LOGO_JSON,
      JSON.stringify({ ...existing, base64: png.toString("base64") }, null, 2) + "\n",
    );

    console.log(`Wrote ${CANONICAL_PNG} (${png.length} bytes, ${w}x${h})`);
    console.log(`Wrote ${EMAIL_LOGO_JSON} (base64, ${png.toString("base64").length} chars)`);
    console.log(
      "Done. Verify with: pnpm --filter @workspace/exhibit-on-superior run test -- emailImages",
    );
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main();
