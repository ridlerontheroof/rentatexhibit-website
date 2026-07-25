import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Guards the branded-lead-email logo assets that live under
// public/images/email/. These files are referenced by the API server
// (artifacts/api-server/src/lib), not by web source, so the site-wide
// orphan guard in siteImages.test.ts deliberately excludes them.
// This test closes both unguarded failure modes:
//   1. an email asset the api-server references could be deleted/renamed
//      on the web side, and lead emails would silently break;
//   2. stray files dropped into public/images/email/ would ship in every
//      deploy with nothing to flag them.
//
// The logo bytes are currently embedded in the api-server via
// src/lib/emailLogo.json (attached inline via CID), with the canonical
// PNG kept on the web side.
// We verify the two never drift apart, and still scan for any plain
// /images/email/ URL references in case templates go back to hosted URLs.

const WEB_ROOT = join(__dirname, '..', '..');
const EMAIL_IMAGES_DIR = join(WEB_ROOT, 'public', 'images', 'email');
const API_SERVER_SRC = join(WEB_ROOT, '..', 'api-server', 'src');
const EMAIL_LOGO_JSON = join(API_SERVER_SRC, 'lib', 'emailLogo.json');

const SOURCE_EXTS = new Set(['.ts', '.tsx']);
const EMAIL_IMAGE_PATH_RE = /\/images\/email\/[A-Za-z0-9_@%./-]+\.(?:png|jpe?g|webp|gif|svg|avif)/g;

/** Recursively list files under dir, skipping generated/test noise. */
function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      out.push(...listFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

/** Strip JS/TS comments so doc examples don't count as references. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** All /images/email/... paths referenced anywhere in api-server source. */
function collectEmailImageRefs(): Map<string, Set<string>> {
  const refs = new Map<string, Set<string>>();
  const sources = listFiles(API_SERVER_SRC).filter(
    (f) => SOURCE_EXTS.has(f.slice(f.lastIndexOf('.'))) && !f.endsWith('.test.ts'),
  );
  for (const file of sources) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const match of text.match(EMAIL_IMAGE_PATH_RE) ?? []) {
      if (!refs.has(match)) refs.set(match, new Set());
      refs.get(match)!.add(relative(join(WEB_ROOT, '..'), file));
    }
  }
  return refs;
}

/**
 * Read the embedded logo bytes from the api-server's emailLogo.json — a
 * plain JSON asset the api-server imports at build time. Reading data
 * directly (rather than regex-parsing TypeScript source or importing
 * across packages) keeps this test independent of the api-server's build
 * setup and immune to renames of the exporting constant.
 */
function readEmbeddedLogoBytes(): Buffer {
  const raw = readFileSync(EMAIL_LOGO_JSON, 'utf8');
  const parsed = JSON.parse(raw) as { base64?: unknown };
  expect(typeof parsed.base64, 'emailLogo.json must contain a "base64" string field').toBe(
    'string',
  );
  const base64 = parsed.base64 as string;
  expect(base64.length, 'emailLogo.json "base64" field is empty').toBeGreaterThan(0);
  // Reject anything that isn't strictly valid base64 — a truncated or
  // corrupted field must fail loudly, not decode to garbage bytes.
  expect(
    /^[A-Za-z0-9+/]+={0,2}$/.test(base64),
    'emailLogo.json "base64" field is not valid base64',
  ).toBe(true);
  return Buffer.from(base64, 'base64');
}

describe('branded lead email images', () => {
  it('the api-server email logo asset exists (path drift guard)', () => {
    // If the api-server moves/renames emailLogo.json, this test must be
    // updated rather than silently guarding nothing.
    expect(existsSync(EMAIL_LOGO_JSON), `missing ${EMAIL_LOGO_JSON}`).toBe(true);
  });

  it('api-server source actually imports emailLogo.json (vacuous-guard drift check)', () => {
    // If the api-server restructures its email code to stop reading
    // emailLogo.json, the byte-comparison below would keep passing while
    // guarding an asset nothing ships. Require at least one non-test
    // api-server source file to import it.
    const importers = listFiles(API_SERVER_SRC).filter((f) => {
      if (!SOURCE_EXTS.has(f.slice(f.lastIndexOf('.'))) || f.endsWith('.test.ts')) return false;
      return /from\s+["'][^"']*emailLogo\.json["']/.test(stripComments(readFileSync(f, 'utf8')));
    });
    expect(
      importers.length,
      'no api-server source imports emailLogo.json — the logo sync guard is checking dead data; update this test to follow where the embedded logo moved',
    ).toBeGreaterThan(0);
  });

  it('every /images/email/ URL referenced by api-server source exists on disk', () => {
    const missing: string[] = [];
    for (const [path, files] of collectEmailImageRefs()) {
      if (!existsSync(join(WEB_ROOT, 'public', path))) {
        missing.push(`${path} (referenced by ${[...files].join(', ')})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the embedded email logo matches its canonical PNG in public/images/email/', () => {
    // The CID-attached logo bytes live in emailLogo.ts; the canonical PNG
    // lives on the web side. If either is edited without the other, branded
    // emails and the published asset silently diverge.
    const embedded = readEmbeddedLogoBytes();
    const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    expect(
      pngSig.every((b, i) => embedded[i] === b),
      'embedded EMAIL_LOGO_BASE64 does not decode to a valid PNG',
    ).toBe(true);

    const canonical = join(EMAIL_IMAGES_DIR, 'exhibit-logo-email.png');
    expect(existsSync(canonical), `canonical email logo missing: ${canonical}`).toBe(true);
    expect(
      readFileSync(canonical).equals(embedded),
      'public/images/email/exhibit-logo-email.png differs from the api-server EMAIL_LOGO_BASE64 — regenerate one from the other',
    ).toBe(true);
  });

  it('no orphan files sit in public/images/email/ that no email code references', () => {
    const referenced = new Set(collectEmailImageRefs().keys());
    const embedded = readEmbeddedLogoBytes();

    const orphans = (existsSync(EMAIL_IMAGES_DIR) ? listFiles(EMAIL_IMAGES_DIR) : [])
      .map((f) => '/' + relative(join(WEB_ROOT, 'public'), f).split('\\').join('/'))
      .filter((p) => !referenced.has(p))
      // A file whose bytes equal the embedded CID logo is legitimately kept
      // as the canonical source of EMAIL_LOGO_BASE64.
      .filter((p) => !readFileSync(join(WEB_ROOT, 'public', p)).equals(embedded));

    expect(orphans).toEqual([]);
  });
});
