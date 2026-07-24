// Structured-data validator shared by the build-time prerenderer and the
// vitest suite. Given the raw payloads of every
// <script type="application/ld+json"> block on a page, it checks that:
//   1. every block parses as JSON;
//   2. every top-level block declares @context (schema.org);
//   3. every node — top-level, inside an @graph, or nested as a property
//      value — declares an @type (pure `{ "@id": ... }` reference nodes are
//      the only exception);
//   4. no internal @id reference (site-URL-prefixed) dangles — every
//      `{ "@id": "<site>#x" }` pointer must resolve to a node that DEFINES
//      that @id (with an @type) somewhere on the same page.
// Returns a list of human-readable problems; empty means the page is clean.

/** Extract raw JSON-LD payload strings from an HTML string. */
export function extractJsonLdPayloads(html) {
  return [
    ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
}

/**
 * @param {string[]} payloads raw JSON-LD script contents for one page
 * @param {string} siteUrl origin prefix that marks an @id as internal
 * @returns {string[]} problems (empty when valid)
 */
export function validateJsonLdPayloads(payloads, siteUrl) {
  // Note: an empty payload list is NOT an error here — noindex pages ship no
  // JSON-LD by design. Callers enforce presence on indexable pages themselves.
  const problems = [];

  const definedIds = new Set();
  const referencedIds = new Set();

  /** A node "defines" its @id when it carries any property beyond @id itself. */
  const walk = (value, where) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${where}[${i}]`));
      return;
    }
    if (value === null || typeof value !== 'object') return;

    const keys = Object.keys(value);
    const id = value['@id'];
    if (typeof id === 'string' && keys.length === 1) {
      // Pure reference node: { "@id": "..." } — the only untyped node allowed.
      referencedIds.add(id);
      return;
    }
    if (typeof id === 'string') {
      // Multiple blocks may deliberately re-define the same @id (crawlers
      // merge nodes by @id), so re-definition is not an error.
      definedIds.add(id);
    }
    // Every non-reference node — nested property values included — must be
    // typed, or Google treats it as an anonymous blob it cannot classify.
    if (typeof value['@type'] !== 'string' || value['@type'].length === 0) {
      problems.push(`missing @type on node at ${where}${id ? ` (id ${id})` : ''}`);
    }
    for (const k of keys) {
      if (k.startsWith('@')) continue;
      walk(value[k], `${where}.${k}`);
    }
  };

  payloads.forEach((raw, i) => {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      problems.push(`block ${i}: unparseable JSON (${e.message})`);
      return;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      problems.push(`block ${i}: top-level JSON-LD must be an object`);
      return;
    }
    const context = parsed['@context'];
    if (typeof context !== 'string' || !/schema\.org/.test(context)) {
      problems.push(`block ${i}: missing or non-schema.org @context`);
    }
    const nodes = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
    nodes.forEach((node, j) => {
      if (typeof node !== 'object' || node === null || Array.isArray(node)) {
        problems.push(`block ${i} node ${j}: not an object`);
        return;
      }
      walk(node, `block ${i} node ${j}`);
    });
  });

  // Dangling internal references: only enforced for site-URL @ids — external
  // ids (e.g. a Google Maps URL used as an identifier) resolve elsewhere.
  for (const id of referencedIds) {
    if (id.startsWith(siteUrl) && !definedIds.has(id)) {
      problems.push(`dangling internal @id reference "${id}" (no node defines it on this page)`);
    }
  }

  return problems;
}
