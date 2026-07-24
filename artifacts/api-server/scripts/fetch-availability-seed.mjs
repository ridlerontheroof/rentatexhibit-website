// Build-time availability seed refresh: pulls the current available-units
// payload from the live site's own public API (which serves the server-cached
// AppFolio Unit Vacancy report) and commits it into the bundle as
// src/data/availabilitySeed.json, so a cold-started autoscale instance can
// answer /api/availability instantly while its first live fetch completes.
//
// Failure is NON-FATAL by design: on any error (offline build sandbox,
// upstream outage, malformed payload) the previously committed seed is left in
// place and the build proceeds with a warning. At runtime seeds older than the
// 48h max age are ignored, so a stale committed seed simply degrades to
// today's cold-cache behavior. Mirrors the web artifact's
// scripts/fetch-availability-snapshot.mjs.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SNAPSHOT_URL = 'https://www.rentatexhibit.com/api/availability';
const outPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'availabilitySeed.json',
);

try {
  const res = await fetch(SNAPSHOT_URL, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const payload = await res.json();
  if (!payload || !Array.isArray(payload.units) || typeof payload.updatedAt !== 'string') {
    throw new Error('unexpected payload shape (expected { units: [], updatedAt })');
  }
  await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `Availability seed refreshed: ${payload.units.length} unit(s), updatedAt ${payload.updatedAt}.`,
  );
} catch (err) {
  console.warn(
    `WARN availability seed refresh failed (${err?.message ?? err}); ` +
      'keeping the existing committed seed. Runtime ignores seeds older than 48h.',
  );
  await reportExistingSeedAge();
}

// Staleness signal (never fails the build): report how old the committed seed
// is relative to the 48h max age enforced by seedCacheFromBakedSnapshot.
async function reportExistingSeedAge() {
  const MAX_AGE_MS = 48 * 60 * 60 * 1000; // keep in sync with SEED_MAX_AGE_MS
  try {
    const existing = JSON.parse(await fs.readFile(outPath, 'utf8'));
    const updated = Date.parse(existing?.updatedAt);
    if (!Number.isFinite(updated)) {
      console.warn('WARN existing seed has no parseable updatedAt; it will be ignored at runtime.');
      return;
    }
    const ageMs = Date.now() - updated;
    const ageHours = (ageMs / 3_600_000).toFixed(1);
    if (ageMs > MAX_AGE_MS) {
      console.warn(
        `WARN committed availability seed is STALE: ${ageHours}h old (max 48h). ` +
          'It will be ignored at runtime; a cold-started instance falls back to waiting on the live fetch.',
      );
    } else {
      const remaining = ((MAX_AGE_MS - ageMs) / 3_600_000).toFixed(1);
      console.warn(
        `NOTE committed availability seed is ${ageHours}h old; it expires in ${remaining}h (48h max age).`,
      );
    }
  } catch (readErr) {
    console.warn(
      `WARN could not read existing committed seed (${readErr?.message ?? readErr}); it may be missing or malformed.`,
    );
  }
}
