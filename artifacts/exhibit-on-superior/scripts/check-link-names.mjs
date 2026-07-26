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
// - The accessible name is the aria-label when present, else the link text
//   (falling back to nested <img alt="…"> text, per the accname algorithm).
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
//   (removed from the a11y tree), and buttons carrying aria-labelledby
//   (named by another element — we can't resolve the reference with this
//   regex scan, so they're trusted). No other exceptions exist today.
// - Elements with role="button" (div/span click targets) get the same
//   empty-name audit: screen readers announce them as buttons too, so an
//   icon-only one with no text, aria-label, or img alt announces as just
//   "button". Exceptions: same as <button> — aria-hidden="true" and
//   aria-labelledby carriers are skipped. No other exceptions exist today.
// - <input type="button|submit|reset|image"> is audited as well: the
//   accessible name comes from value (or alt for type="image"), falling back
//   to aria-label; submit/reset have spec default labels ("Submit"/"Reset")
//   so only button/image can end up nameless. Exceptions: same aria-hidden /
//   aria-labelledby escapes. No other exceptions exist today.
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

const failures = [];
const unnamed = [];
const unnamedButtons = [];
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
    if (!name) {
      // Icon-only link with no spoken name at all — announces as just "link".
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
    if (!name && !/aria-hidden="true"/.test(attrs) && !/aria-labelledby="/.test(attrs)) {
      // Icon-only button with no spoken name — announces as just "button".
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
    if (!name && !/aria-hidden="true"/.test(attrs) && !/aria-labelledby="/.test(attrs)) {
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
    if (!name && (type === 'submit' || type === 'reset')) name = type; // spec default label
    if (!name && !/aria-hidden="true"/.test(attrs) && !/aria-labelledby="/.test(attrs)) {
      unnamedButtons.push({ page, snippet: m[0].slice(0, 100).replace(/\s+/g, ' ') });
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

if (failures.length > 0 || unnamed.length > 0 || unnamedButtons.length > 0) process.exit(1);

console.log(
  `check-link-names: OK — ${pages.length} prerendered pages, no ambiguous or unnamed links or buttons.`,
);
