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
  await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `Availability snapshot refreshed: ${payload.units.length} unit(s), updatedAt ${payload.updatedAt}.`,
  );
} catch (err) {
  console.warn(
    `WARN availability snapshot refresh failed (${err?.message ?? err}); ` +
      'keeping the existing baked snapshot. Unit cards still hydrate from live data.',
  );
}
