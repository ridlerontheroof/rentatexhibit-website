// Build-time availability snapshot refresh: pulls the current available-units
// payload from the live site's own public API (which serves the server-cached
// AppFolio Unit Vacancy report) and bakes it into the bundle as
// src/data/availabilitySnapshot.json, so unit cards render in the prerendered
// HTML and paint instantly before the live fetch completes.
//
// Failure is NON-FATAL by design: on any error (offline build sandbox, upstream
// outage, malformed payload) the previously committed snapshot is left in place
// and the build proceeds with a warning — exactly today's behavior, just with
// an older baked snapshot. The client always refreshes with live data anyway,
// and the snapshot module ignores snapshots older than its max age.
import { promises as fs } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SNAPSHOT_URL = 'https://www.rentatexhibit.com/api/availability';
const outPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'availabilitySnapshot.json',
);

try {
  const res = await fetch(SNAPSHOT_URL, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const payload = await res.json();
  if (!payload || !Array.isArray(payload.units) || typeof payload.updatedAt !== 'string') {
    throw new Error('unexpected payload shape (expected { units: [], updatedAt })');
  }
  // Skip the write when only updatedAt moved: rewriting an otherwise-identical
  // snapshot dirties the working tree on every build, which blocks task merges
  // ("cannot apply changes") and produces noise commits. Compare the payload
  // against the committed snapshot with updatedAt normalized out.
  // …EXCEPT when the committed updatedAt is itself getting old: the prerender
  // guard fails the whole build once the stamp passes 48h, so a long quiet
  // stretch with zero unit changes must still refresh the stamp. Rewrite once
  // the committed stamp is older than half the max age (24h) — rare enough to
  // stay merge-friendly, early enough that a publish never hits the 48h wall.
  const STAMP_REFRESH_AGE_MS = 24 * 60 * 60 * 1000;
  let unchanged = false;
  try {
    const existing = JSON.parse(await fs.readFile(outPath, 'utf8'));
    const sameUnits =
      JSON.stringify({ ...existing, updatedAt: null }) ===
      JSON.stringify({ ...payload, updatedAt: null });
    const existingUpdated = Date.parse(existing?.updatedAt);
    const stampFresh =
      Number.isFinite(existingUpdated) && Date.now() - existingUpdated <= STAMP_REFRESH_AGE_MS;
    unchanged = sameUnits && stampFresh;
    if (sameUnits && !stampFresh) {
      console.log(
        'Availability snapshot units unchanged but committed updatedAt is >24h old; ' +
          'rewriting the stamp so the prerender freshness guard (48h) cannot trip.',
      );
    }
  } catch {
    /* missing/malformed existing snapshot — write the fresh one */
  }
  if (unchanged) {
    console.log(
      `Availability snapshot unchanged (${payload.units.length} unit(s)); keeping committed updatedAt to avoid dirtying the tree.`,
    );
  } else {
    await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(
      `Availability snapshot refreshed: ${payload.units.length} unit(s), updatedAt ${payload.updatedAt}.`,
    );
  }
  // Keep the per-unit rewrite block in artifact.toml in lockstep with the
  // snapshot we just wrote, so the "unit-rewrites" check stays green without a
  // manual regenerate step. Failures here propagate: a refreshed snapshot with
  // stale rewrites would fail the prerender parity guard later anyway, so fail
  // fast with the generator's own error message.
  execFileSync(
    process.execPath,
    [path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'generate-unit-rewrites.mjs')],
    { stdio: 'inherit' },
  );
  // A refreshed snapshot may introduce units with NEW tour videos. Top up the
  // committed YouTube metadata cache for any ids it doesn't cover yet so those
  // pages get VideoObject structured data without a manual step. Non-fatal by
  // design (like this snapshot fetch): --missing-only never fails the build,
  // and a total failure here shouldn't discard the snapshot we just wrote.
  try {
    execFileSync(
      process.execPath,
      [
        path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fetch-youtube-metadata.mjs'),
        '--missing-only',
      ],
      { stdio: 'inherit' },
    );
  } catch (ytErr) {
    console.warn(
      `WARN YouTube metadata top-up failed (${ytErr?.message ?? ytErr}); ` +
        'new tour videos will ship without VideoObject data until the next refresh.',
    );
  }
} catch (err) {
  console.warn(
    `WARN availability snapshot refresh failed (${err?.message ?? err}); ` +
      'keeping the existing baked snapshot. Unit cards still hydrate from live data.',
  );
  await reportExistingSnapshotAge();
}

// Staleness signal (never fails the build): when the refresh above fails we
// keep shipping the committed snapshot, so report how old it is relative to
// the 48h max age enforced by getBakedAvailability. Past that age the baked
// cards are ignored and visitors see skeletons until the live fetch lands.
async function reportExistingSnapshotAge() {
  const MAX_AGE_MS = 48 * 60 * 60 * 1000; // keep in sync with SNAPSHOT_MAX_AGE_MS
  try {
    const existing = JSON.parse(await fs.readFile(outPath, 'utf8'));
    const updated = Date.parse(existing?.updatedAt);
    if (!Number.isFinite(updated)) {
      console.warn('WARN existing baked snapshot has no parseable updatedAt; it will be ignored at runtime.');
      return;
    }
    const ageMs = Date.now() - updated;
    const ageHours = (ageMs / 3_600_000).toFixed(1);
    if (ageMs > MAX_AGE_MS) {
      console.warn(
        `WARN baked availability snapshot is STALE: ${ageHours}h old (max 48h). ` +
          'It will be ignored at runtime and visitors will see skeleton cards until the live fetch lands. ' +
          'Trigger a rebuild once the live API is reachable to refresh it.',
      );
    } else {
      const remaining = ((MAX_AGE_MS - ageMs) / 3_600_000).toFixed(1);
      console.warn(
        `NOTE baked availability snapshot is ${ageHours}h old; it expires in ${remaining}h (48h max age).`,
      );
    }
  } catch (readErr) {
    console.warn(
      `WARN could not read existing baked snapshot (${readErr?.message ?? readErr}); it may be missing or malformed.`,
    );
  }
}
