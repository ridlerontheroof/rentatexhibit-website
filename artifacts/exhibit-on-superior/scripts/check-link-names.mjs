#!/usr/bin/env node
// Site-wide accessible-link-name guard (companion to the per-page test
// src/pages/FaqHub.link-names.test.tsx).
//
// Screen-reader users pull up a list of a page's links by name. When several
// links on one page share the same spoken name ("Read more", "View details",
// "Schedule a tour" …) but go to DIFFERENT places, they are indistinguishable.
// The fix is an aria-label that includes the link's subject, e.g.
// aria-label="View details for apartment 0208" (see FaqHub / AvailableUnits).
//
// This script audits every prerendered page (dist/public/**/index.html) — the
// exact HTML crawlers and first paints see — and fails when any page repeats
// one accessible name across links with more than one distinct destination.
//
// Rules:
// - The accessible name follows the accname algorithm: an aria-labelledby
//   that resolves to text (references are resolved within the same page)
//   wins, else the aria-label when present, else the link text (falling back
//   to nested <img alt="…"> text). A labelledby whose referenced ids are all
//   missing or empty contributes nothing and falls through.
// - Same name + same href is fine (e.g. header and footer nav to /amenities).
// - In-page hash links (href="#…") are skipped: a "#residents" jump link and
//   a "/residents" page link legitimately share a name.
// - A link with an EMPTY accessible name (no text, no aria-label, no img alt)
//   is a failure too: icon-only links announce as just "link" to screen
//   readers. Exceptions: links with aria-hidden="true" (removed from the
//   accessibility tree entirely — must be a decorative duplicate of an
//   adjacent named link) are skipped. No other exceptions exist today.
// - <button> elements get the same empty-name audit: icon-only buttons
//   (carousel arrows, close X, menu toggle) with no text, aria-label, or img
//   alt announce as just "button". Exceptions: aria-hidden="true" buttons
//   (removed from the a11y tree). Buttons carrying aria-labelledby have the
//   reference RESOLVED within the same page: if every referenced id is
//   missing, or the referenced elements have no text, the button still
//   announces as just "button" and it is a failure.
// - Elements with role="button" (div/span click targets) get the same
//   empty-name audit: screen readers announce them as buttons too, so an
//   icon-only one with no text, aria-label, or img alt announces as just
//   "button". Exceptions: same as <button> — aria-hidden="true"; their
//   aria-labelledby references are resolved the same way.
// - <input type="button|submit|reset|image"> is audited as well: the
//   accessible name comes from value (or alt for type="image"), falling back
//   to aria-label; submit/reset have spec default labels ("Submit"/"Reset")
//   so only button/image can end up nameless. Exceptions: same aria-hidden
//   escape; aria-labelledby references are resolved the same way.
// - Form fields (non-button <input>, <select>, <textarea>) are audited too:
//   the accessible name comes from aria-labelledby (resolved within the same
//   page), aria-label, or a <label for="…"> pointing at the field's id (or a
//   <label> wrapping the field). placeholder does NOT count as a name — it
//   disappears on input and many screen readers ignore it. A field with none
//   of these (including a labelledby/label[for] pointing at a missing or
//   empty element) announces with no name and is a failure. Exceptions:
//   type="hidden", aria-hidden="true", and style display:none (all removed
//   from the a11y tree — e.g. Radix Slider's hidden form-bridge <input>).
//
// Run after a build: node scripts/check-link-names.mjs   (wired into
// check:prepublish so a publish can't ship newly ambiguous links).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist', 'public');

if (!fs.existsSync(dist)) {
  console.error(`check-link-names: ${dist} not found — run the build first.`);
  process.exit(1);
}

/** All prerendered pages. */
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return e.name === 'index.html' ? [p] : [];
  });
}

/** Decode the entities React escapes, drop tags/SSR text markers, squash space. */
function decode(s) {
  return s
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve an aria-labelledby attribute against the page's HTML.
 * Returns the decoded, space-joined text of the referenced elements, or ''
 * when no referenced id exists or none of them carry any text — in either
 * case the control has no spoken name.
 */
function resolveLabelledby(attrs, html) {
  const ref = attrs.match(/aria-labelledby="([^"]*)"/);
  if (!ref) return null; // no aria-labelledby present
  const ids = decode(ref[1]).split(/\s+/).filter(Boolean);
  const parts = [];
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Element with matching id and inner content …
    const el = html.match(new RegExp(`<(\\w+)\\b[^>]*\\bid="${esc}"[^>]*>(.*?)</\\1>`, 's'));
    if (el) {
      const text = decode(el[2]);
      if (text) parts.push(text);
      continue;
    }
    // … or a void element (e.g. <input id value="…">).
    const voidEl = html.match(new RegExp(`<\\w+\\b[^>]*\\bid="${esc}"[^>]*/?>`, 's'));
    if (voidEl) {
      const value = voidEl[0].match(/\bvalue="([^"]*)"/);
      const text = decode(value ? value[1] : '');
      if (text) parts.push(text);
    }
    // id missing entirely: contributes nothing.
  }
  return parts.join(' ').toLowerCase();
}

const failures = [];
const unnamed = [];
const unnamedButtons = [];
const unnamedFields = [];
const pages = walk(dist);

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const page = file.slice(dist.length).replace(/\/index\.html$/, '') || '/';
  /** accessible name (lowercased) -> Set of hrefs */
  const names = new Map();
  for (const m of html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)) {
    const attrs = m[1];
    const inner = m[2];
    const href = (attrs.match(/href="([^"]*)"/) || [])[1];
    if (!href || href.startsWith('#')) continue;
    // accname precedence: aria-labelledby (when it resolves to text) beats
    // aria-label, which beats content. A labelledby whose referenced ids are
    // missing or empty contributes nothing and falls through to the next
    // source — so a broken reference with no other name source is flagged.
    const labelledby = resolveLabelledby(attrs, html);
    const label = attrs.match(/aria-label="([^"]*)"/);
    let name = labelledby || decode(label ? label[1] : inner).toLowerCase();
    if (!name) {
      // accname fallback: alt text of nested images.
      name = [...inner.matchAll(/<img\b[^>]*\balt="([^"]*)"/g)]
        .map((a) => decode(a[1]))
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    }
    if (!name) {
      // No spoken name: either icon-only with no text/label/alt, or an
      // aria-labelledby that points at a missing or empty element — the link
      // announces as just "link".
      if (!/aria-hidden="true"/.test(attrs)) {
        unnamed.push({ page, href: decode(href) });
      }
      continue;
    }
    if (!names.has(name)) names.set(name, new Set());
    names.get(name).add(decode(href));
  }
  for (const m of html.matchAll(/<button\b([^>]*)>(.*?)<\/button>/gs)) {
    const attrs = m[1];
    const inner = m[2];
    const label = attrs.match(/aria-label="([^"]*)"/);
    let name = decode(label ? label[1] : inner).toLowerCase();
    if (!name) {
      // accname fallback: alt text of nested images.
      name = [...inner.matchAll(/<img\b[^>]*\balt="([^"]*)"/g)]
        .map((a) => decode(a[1]))
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    }
    if (!name) name = resolveLabelledby(attrs, html) || '';
    if (!name && !/aria-hidden="true"/.test(attrs)) {
      // Icon-only button with no spoken name (including an aria-labelledby
      // that points at a missing or empty element) — announces as just "button".
      unnamedButtons.push({ page, snippet: m[0].slice(0, 100).replace(/\s+/g, ' ') });
    }
  }
  // role="button" elements (div/span click targets) announce as buttons too.
  for (const m of html.matchAll(/<(\w+)\b([^>]*\brole="button"[^>]*)>(.*?)<\/\1>/gs)) {
    const tag = m[1];
    if (tag === 'a' || tag === 'button' || tag === 'input') continue; // audited above/below
    const attrs = m[2];
    const inner = m[3];
    const label = attrs.match(/aria-label="([^"]*)"/);
    let name = decode(label ? label[1] : inner).toLowerCase();
    if (!name) {
      name = [...inner.matchAll(/<img\b[^>]*\balt="([^"]*)"/g)]
        .map((a) => decode(a[1]))
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    }
    if (!name) name = resolveLabelledby(attrs, html) || '';
    if (!name && !/aria-hidden="true"/.test(attrs)) {
      unnamedButtons.push({ page, snippet: m[0].slice(0, 100).replace(/\s+/g, ' ') });
    }
  }
  // Input buttons: name comes from value (alt for type="image") or aria-label.
  for (const m of html.matchAll(/<input\b([^>]*)\/?>/gs)) {
    const attrs = m[1];
    const type = ((attrs.match(/type="([^"]*)"/) || [])[1] || 'text').toLowerCase();
    if (!['button', 'submit', 'reset', 'image'].includes(type)) continue;
    const label = attrs.match(/aria-label="([^"]*)"/);
    const value = attrs.match(/value="([^"]*)"/);
    const alt = attrs.match(/alt="([^"]*)"/);
    let name = decode(label ? label[1] : (value ? value[1] : '')).toLowerCase();
    if (!name && type === 'image') name = decode(alt ? alt[1] : '').toLowerCase();
    if (!name) name = resolveLabelledby(attrs, html) || '';
    if (!name && (type === 'submit' || type === 'reset')) name = type; // spec default label
    if (!name && !/aria-hidden="true"/.test(attrs)) {
      unnamedButtons.push({ page, snippet: m[0].slice(0, 100).replace(/\s+/g, ' ') });
    }
  }
  // Form fields: non-button inputs, selects, textareas. Name comes from
  // aria-labelledby (resolved), aria-label, or an associated <label> — a
  // <label for="…"> pointing at the field's id, or a wrapping <label>.
  // placeholder does NOT count. A broken reference leaves the field unnamed.
  const fieldChecks = [
    ...[...html.matchAll(/<input\b([^>]*)\/?>/gs)].filter((m) => {
      const type = ((m[1].match(/type="([^"]*)"/) || [])[1] || 'text').toLowerCase();
      return !['button', 'submit', 'reset', 'image', 'hidden'].includes(type);
    }),
    ...html.matchAll(/<select\b([^>]*)>/gs),
    ...html.matchAll(/<textarea\b([^>]*)>/gs),
  ];
  for (const m of fieldChecks) {
    const attrs = m[1];
    if (/aria-hidden="true"/.test(attrs)) continue;
    // display:none removes the field from the a11y tree entirely (Radix
    // Slider renders a hidden form-bridge <input style="display:none">).
    if (/style="[^"]*display:\s*none/.test(attrs)) continue;
    // accname precedence: labelledby (resolved) > aria-label > label element.
    let name = resolveLabelledby(attrs, html) || '';
    if (!name) {
      const label = attrs.match(/aria-label="([^"]*)"/);
      name = decode(label ? label[1] : '').toLowerCase();
    }
    if (!name) {
      // <label for="id"> pointing at this field's id, resolved like
      // labelledby: a reference to a missing/empty label contributes nothing.
      const idm = attrs.match(/\bid="([^"]*)"/);
      if (idm && idm[1]) {
        const esc = idm[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const lab = html.match(new RegExp(`<label\\b[^>]*\\bfor="${esc}"[^>]*>(.*?)</label>`, 's'));
        if (lab) name = decode(lab[1]);
      }
    }
    if (!name) {
      // Wrapping <label> (no for=): find a label element whose body contains
      // this exact field markup.
      for (const lab of html.matchAll(/<label\b[^>]*>(.*?)<\/label>/gs)) {
        if (lab[1].includes(m[0])) {
          name = decode(lab[1]);
          break;
        }
      }
    }
    if (!name) {
      unnamedFields.push({ page, snippet: m[0].slice(0, 100).replace(/\s+/g, ' ') });
    }
  }
  for (const [name, hrefs] of names) {
    if (hrefs.size > 1) {
      failures.push({
        page: file.slice(dist.length).replace(/\/index\.html$/, '') || '/',
        name,
        hrefs: [...hrefs],
      });
    }
  }
}

if (failures.length > 0) {
  console.error(
    `check-link-names: ${failures.length} ambiguous spoken link name(s) — ` +
      `links sharing one accessible name but pointing at different URLs.\n` +
      `Fix: add an aria-label naming the subject (see FaqHub.tsx "Full answer" links).\n`,
  );
  for (const f of failures) {
    console.error(`  ${f.page}  "${f.name}" ->`);
    for (const h of f.hrefs) console.error(`      ${h}`);
  }
}

if (unnamed.length > 0) {
  console.error(
    `check-link-names: ${unnamed.length} link(s) with NO accessible name — ` +
      `icon-only links with no text, aria-label, or img alt announce as just "link".\n` +
      `Fix: add a descriptive aria-label (or aria-hidden="true" if it duplicates an adjacent named link).\n`,
  );
  for (const u of unnamed) console.error(`  ${u.page}  <a href="${u.href}"> (unnamed)`);
}

if (unnamedButtons.length > 0) {
  console.error(
    `check-link-names: ${unnamedButtons.length} button(s) with NO accessible name — ` +
      `icon-only buttons with no text, aria-label, or img alt announce as just "button".\n` +
      `Fix: add a descriptive aria-label (or aria-hidden="true" if decorative).\n`,
  );
  for (const u of unnamedButtons) console.error(`  ${u.page}  ${u.snippet}`);
}

if (unnamedFields.length > 0) {
  console.error(
    `check-link-names: ${unnamedFields.length} form field(s) with NO accessible name — ` +
      `inputs/selects/textareas without a label, aria-label, or resolvable aria-labelledby ` +
      `announce with no name (placeholder does not count).\n` +
      `Fix: add a <label for="…"> or aria-label, and make sure referenced ids exist.\n`,
  );
  for (const u of unnamedFields) console.error(`  ${u.page}  ${u.snippet}`);
}

if (failures.length > 0 || unnamed.length > 0 || unnamedButtons.length > 0 || unnamedFields.length > 0)
  process.exit(1);

console.log(
  `check-link-names: OK — ${pages.length} prerendered pages, no ambiguous or unnamed links, buttons, or form fields.`,
);
