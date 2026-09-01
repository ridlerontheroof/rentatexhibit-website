#!/usr/bin/env node
/**
 * generate-parity-map.mjs — URL-parity / 301-map generator with human review output.
 *
 * Input:  a page-inventory CSV (from crawl-legacy-site.mjs, or the hand-built
 *         source-page-inventory.csv format — column names are matched loosely).
 * Output: parity-map.csv (machine, with review_status column) and
 *         URL_PARITY_MAP.draft.md (human review document).
 *
 * Classification heuristics (every row still requires human review — gate G4):
 *   SERVE      — canonical page: 200, self-canonical (or no canonical), unique title.
 *   REDIRECT   — canonical points elsewhere (301 to the canonical's path), or the
 *                path matches a known duplicate/apply-deep-link/platform pattern.
 *   DROP       — platform machinery, auto-generated duplicates → noindex 404/410.
 *   REVIEW     — anything ambiguous (duplicate titles, thin/broken pages).
 *
 * The output always includes the domain-level redirect requirements block
 * (apex→www, http→https, one hop each) and the guard-discipline footer.
 *
 * Usage:
 *   node generate-parity-map.mjs --inventory page-inventory.csv --canonical-origin https://www.example.com --out outdir
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null)).filter(Boolean));
const invPath = args.inventory;
const origin = args['canonical-origin'];
const outDir = args.out ?? '.';
if (!invPath || !origin) { console.error('usage: --inventory <csv> --canonical-origin <https://www.x.com> [--out dir]'); process.exit(2); }
mkdirSync(outDir, { recursive: true });

// -- tiny CSV parser (handles quoted fields) --
function parseCsv(text) {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCsv(readFileSync(invPath, 'utf8'));
const header = rows[0].map((h) => h.trim().toLowerCase());
const col = (names) => { for (const n of names) { const i = header.indexOf(n); if (i >= 0) return i; } return -1; };
const cUrl = col(['url', 'source_url']);
const cStatus = col(['status']);
const cTitle = col(['title']);
const cCanonical = col(['canonical']);
const cRobots = col(['robots']);
const cWords = col(['word_count']);
const cNotes = col(['notes']);
if (cUrl < 0) { console.error('inventory has no url/source_url column'); process.exit(1); }

const pathOf = (u) => { try { const x = new URL(u, origin); return (x.pathname.replace(/\/+$/, '') || '/'); } catch { return null; } };

const dropPatterns = [
  [/accessible-one-page/i, 'auto-generated single-page accessibility rendering — duplicate content'],
  [/\/(Apartments\/module|cdn-cgi)\//i, 'legacy platform machinery endpoint'],
  [/\/(wp-json|wp-admin|xmlrpc)/i, 'CMS machinery'],
];
const redirectPatterns = [
  [/^\/apply-now(\/|$)/i, '/apply-online', 'duplicate apply entry point / per-unit deep link (old platform unit tokens will not exist)'],
  [/^\/terms$|^\/termsofservice$/i, '/terms-of-service', 'near-duplicate terms URL'],
];

const entries = [];
const titleCount = new Map();
for (const r of rows.slice(1)) {
  if (!r[cUrl]) continue;
  const t = (r[cTitle] ?? '').trim();
  if (t) titleCount.set(t, (titleCount.get(t) ?? 0) + 1);
}

for (const r of rows.slice(1)) {
  const url = r[cUrl]; if (!url) continue;
  const path = pathOf(url); if (path == null) continue;
  const status = (r[cStatus] ?? '').toString();
  const title = (r[cTitle] ?? '').trim();
  const canonical = (r[cCanonical] ?? '').trim();
  const robots = (cRobots >= 0 ? r[cRobots] : '') ?? '';
  const words = cWords >= 0 ? Number(r[cWords] || 0) : null;
  const notes = (cNotes >= 0 ? r[cNotes] : '') ?? '';
  const canonicalPath = canonical ? pathOf(canonical) : null;

  let cls = 'SERVE', target = '', rationale = '';
  const drop = dropPatterns.find(([re]) => re.test(path));
  const redir = redirectPatterns.find(([re]) => re.test(path));
  if (drop) { cls = 'DROP'; rationale = drop[1]; }
  else if (redir) { cls = 'REDIRECT'; target = redir[1]; rationale = redir[2]; }
  else if (canonicalPath && canonicalPath !== path) { cls = 'REDIRECT'; target = canonicalPath; rationale = 'source canonical points elsewhere — consolidate with a single-hop 301'; }
  else if (/noindex/i.test(robots)) { cls = 'REVIEW'; rationale = 'source page was noindexed — decide keep/drop'; }
  else if (status && status !== '200' && status !== 'fetched') { cls = 'REVIEW'; rationale = `source status ${status}${notes ? ` (${notes})` : ''}`; }
  else if (title && titleCount.get(title) > 1) { cls = 'REVIEW'; rationale = 'duplicate title with another URL — likely near-duplicate content, pick one canonical'; }
  else if (words != null && words > 0 && words < 40) { cls = 'REVIEW'; rationale = `very thin page (${words} words) — may have been broken/JS-only at scrape time`; }

  entries.push({ path, cls, target, rationale, title, canonical, status, review: 'NEEDS_REVIEW' });
}

entries.sort((a, b) => (a.cls === b.cls ? a.path.localeCompare(b.path) : a.cls.localeCompare(b.cls)));

const csvEsc = (s) => { s = String(s ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csvOut = ['path,classification,redirect_target,rationale,source_title,source_canonical,review_status',
  ...entries.map((e) => [e.path, e.cls, e.target, e.rationale, e.title, e.canonical, e.review].map(csvEsc).join(','))].join('\n') + '\n';
writeFileSync(join(outDir, 'parity-map.csv'), csvOut);

const host = new URL(origin).host;
const apex = host.replace(/^www\./, '');
const section = (cls, title, fmt) => {
  const list = entries.filter((e) => e.cls === cls);
  if (!list.length) return '';
  return `\n## ${title}\n\n${fmt(list)}\n`;
};
const md = `# URL Parity Map (DRAFT — requires human review) — ${apex}

Generated by generate-parity-map.mjs from \`${invPath}\` on ${new Date().toISOString().slice(0, 10)}.
Every row below is a *proposal*. A human must flip each row's review_status in \`parity-map.csv\`
from NEEDS_REVIEW to APPROVED (or edit it) before the build may consume this map (gate G4).
Goal: nothing the old site ranked for returns a soft-404 or an unnecessary redirect chain.

## Domain-level redirect requirements (do these first)

All of the following must reach the canonical page in **one 301 hop** each (verify every variant with \`curl -sI\`, chasing hops):

| From | To |
|---|---|
| \`http://${apex}/*\` | \`${origin}/*\` |
| \`http://${host}/*\` | \`${origin}/*\` |
| \`https://${apex}/*\` | \`${origin}/*\` |

Trap: registrar-level forwarding (Squarespace and similar) strips query strings (kills ad
attribution) and silently fails to save while Domain Connect presets hold the apex records —
delete the presets first, then verify with curl.
${section('SERVE', 'A. Serve as-is (exact path match, canonical, indexable)', (l) => `| Path | Source title |\n|---|---|\n${l.map((e) => `| \`${e.path}\` | ${e.title || ''} |`).join('\n')}`)}${section('REDIRECT', 'B. 301-consolidate (single-hop redirect to a canonical page)', (l) => `| From | 301 to | Rationale |\n|---|---|---|\n${l.map((e) => `| \`${e.path}\` | \`${e.target}\` | ${e.rationale} |`).join('\n')}`)}${section('DROP', 'C. Drop (noindex 404/410 — confirm no inbound links first)', (l) => `| Path | Rationale |\n|---|---|\n${l.map((e) => `| \`${e.path}\` | ${e.rationale} |`).join('\n')}`)}${section('REVIEW', 'D. Needs a human decision', (l) => `| Path | Why flagged |\n|---|---|\n${l.map((e) => `| \`${e.path}\` | ${e.rationale} |`).join('\n')}`)}
## Guard discipline

- All §B redirects must be single-hop. Keep the map in one committed redirect module; add a
  guard test that every entry answers 301 with the exact target.
- Every §A path returns 200 with its own title/canonical; unknown paths return a noindex 404
  stub with a real 404 status — never homepage HTML (soft-404).
- After launch, watch Search Console's page-indexing report for the §B sources to confirm
  consolidation, and submit new/changed URLs to IndexNow.
`;
writeFileSync(join(outDir, 'URL_PARITY_MAP.draft.md'), md);
console.log(`parity map: ${entries.length} URLs (${['SERVE', 'REDIRECT', 'DROP', 'REVIEW'].map((c) => `${c}=${entries.filter((e) => e.cls === c).length}`).join(', ')}) → ${outDir}`);
