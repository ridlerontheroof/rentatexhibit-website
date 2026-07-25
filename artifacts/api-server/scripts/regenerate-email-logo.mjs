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
import { inflateSync } from "node:zlib";

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

// Guard tolerances: refuse to render if the source SVG's viewBox aspect
// ratio drifts from the fixed output canvas (would letterbox/squash the
// wordmark), and refuse to publish a render that is effectively blank.
const ASPECT_TOLERANCE = 0.02; // 2% relative difference
const MIN_OPAQUE_PIXEL_FRACTION = 0.01; // at least 1% of pixels must be visible

/**
 * Reads the SVG viewBox and fails loudly if its aspect ratio no longer
 * matches the fixed WIDTH x HEIGHT output canvas.
 */
function assertAspectRatioMatches(svgText) {
  const m = svgText.match(/viewBox\s*=\s*["']\s*([\d.eE+-]+)[\s,]+([\d.eE+-]+)[\s,]+([\d.eE+-]+)[\s,]+([\d.eE+-]+)\s*["']/);
  if (!m) {
    console.error(
      `Could not find a viewBox in ${SOURCE_SVG}; refusing to render. ` +
        "Add a viewBox to the source SVG (or update this guard) before regenerating.",
    );
    process.exit(1);
  }
  const vbWidth = Number(m[3]);
  const vbHeight = Number(m[4]);
  if (!(vbWidth > 0) || !(vbHeight > 0)) {
    console.error(`Invalid viewBox dimensions (${m[3]} x ${m[4]}) in ${SOURCE_SVG}; refusing to render.`);
    process.exit(1);
  }
  const svgRatio = vbWidth / vbHeight;
  const outRatio = WIDTH / HEIGHT;
  const relDiff = Math.abs(svgRatio - outRatio) / outRatio;
  if (relDiff > ASPECT_TOLERANCE) {
    console.error(
      `Source SVG aspect ratio ${svgRatio.toFixed(4)} (viewBox ${vbWidth}x${vbHeight}) no longer matches ` +
        `the ${WIDTH}x${HEIGHT} output canvas (ratio ${outRatio.toFixed(4)}, ${(relDiff * 100).toFixed(1)}% off, ` +
        `tolerance ${(ASPECT_TOLERANCE * 100).toFixed(0)}%).\n` +
        "Rendering would letterbox or distort the wordmark. Update WIDTH/HEIGHT in " +
        "scripts/regenerate-email-logo.mjs (and the email template layout that displays the logo " +
        "at half size) to match the new artwork, then rerun.",
    );
    process.exit(1);
  }
  console.log(
    `viewBox ${vbWidth}x${vbHeight} (ratio ${svgRatio.toFixed(4)}) matches ${WIDTH}x${HEIGHT} within tolerance.`,
  );
}

/**
 * Decodes an 8-bit RGBA non-interlaced PNG just enough to count pixels with
 * alpha > 0. Returns the count, or null if the PNG is not in the expected
 * format (in which case the caller should fail rather than guess).
 */
function countOpaquePixels(png) {
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const bitDepth = png[24];
  const colorType = png[25];
  const interlace = png[28];
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) return null;

  // Concatenate IDAT chunks and inflate.
  const idats = [];
  let off = 8;
  while (off + 8 <= png.length) {
    const len = png.readUInt32BE(off);
    const type = png.toString("ascii", off + 4, off + 8);
    if (type === "IDAT") idats.push(png.subarray(off + 8, off + 8 + len));
    if (type === "IEND") break;
    off += 12 + len;
  }
  if (idats.length === 0) return null;
  const raw = inflateSync(Buffer.concat(idats));

  const bpp = 4; // RGBA, 8-bit
  const stride = width * bpp;
  if (raw.length !== height * (stride + 1)) return null;

  // Un-filter scanlines (PNG filter types 0-4) and count alpha > 0.
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);
  let opaque = 0;
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    raw.copy(cur, 0, rowStart + 1, rowStart + 1 + stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let add = 0;
      switch (filter) {
        case 0: add = 0; break;
        case 1: add = a; break;
        case 2: add = b; break;
        case 3: add = (a + b) >> 1; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default:
          return null;
      }
      cur[x] = (cur[x] + add) & 0xff;
    }
    for (let x = bpp - 1; x < stride; x += bpp) {
      if (cur[x] > 0) opaque++;
    }
    cur.copy(prev);
  }
  return opaque;
}

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
    const svgSource = readFileSync(SOURCE_SVG, "utf8");
    assertAspectRatioMatches(svgSource);
    const svgMarkup = svgSource.replace(
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

    // Blank-render guard: fail instead of shipping an empty/transparent logo.
    const opaque = countOpaquePixels(png);
    if (opaque === null) {
      console.error(
        "Could not decode the rendered PNG pixels (expected 8-bit non-interlaced RGBA); " +
          "refusing to publish an unverified render.",
      );
      process.exit(1);
    }
    const opaqueFraction = opaque / (WIDTH * HEIGHT);
    if (opaqueFraction < MIN_OPAQUE_PIXEL_FRACTION) {
      console.error(
        `Rendered PNG is effectively blank: only ${opaque} of ${WIDTH * HEIGHT} pixels ` +
          `(${(opaqueFraction * 100).toFixed(2)}%) are non-transparent (need >= ` +
          `${(MIN_OPAQUE_PIXEL_FRACTION * 100).toFixed(0)}%). Chromium likely failed to paint ` +
          "(see the --headless=old note above). Refusing to write an empty logo.",
      );
      process.exit(1);
    }
    console.log(
      `Render sanity check: ${opaque} non-transparent pixels (${(opaqueFraction * 100).toFixed(1)}%).`,
    );

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
