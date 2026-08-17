#!/usr/bin/env node
// Starting-price parity guard (production smoke-check).
//
// The homepage FAQ bakes a starting rent at build time from the availability
// snapshot (startingRentSentence() → PRICING_FAQ_ANSWER → PAGE_SEO['/'].faqs).
// If the snapshot is stale at build time — or if the snapshot-fetch step is
// skipped — the published homepage can advertise a wrong price while the live
// availability feed already shows a different minimum. This script makes that
// discrepancy detectable after every publish.
//
// What it does (all against production):
//   1. Fetches <base>/api/availability for the live minimum rent.
//   2. Fetches the raw homepage HTML and:
//        a. Extracts every "$X,XXX" figure matching the startingRentSentence
//           pattern ("Apartments currently start at $X,XXX") from the visible
//           FAQ copy.
//        b. Parses every FAQPage JSON-LD blob and extracts the same figure from
//           the pricing FAQ answer (same pattern).
//   3. Compares any extracted figures against the API minimum; fails when they
//      differ.
//   4. Tolerates the no-price fallback: if neither the copy nor the JSON-LD
//      contains a "currently start at $X,XXX" sentence, the build used the
//      fallback wording (no usable snapshot), so there is no baked price to
//      drift — passes with a note.
//
// The check is intentionally HTTP-only: the starting-rent figure lives in the
// prerendered HTML (baked at build time), so there is no need for a JS-capable
// browser. The visible copy and the JSON-LD are both in the raw SSR HTML.
//
// Usage: node scripts/check-starting-price.mjs [baseUrl]
//   default baseUrl: https://www.rentatexhibit.com

const args = process.argv.slice(2);
// Accept the target base URL from: 1) positional CLI arg, 2) POSTPUBLISH_BASE
// env var (set by the watcher when it targets a non-default host), 3) default.
const BASE = (
  args.find((a) => !a.startsWith('--')) ??
  process.env.POSTPUBLISH_BASE ??
  'https://www.rentatexhibit.com'
).replace(/\/$/, '');

const failures = [];
const fail = (what, msg) => {
  failures.push(`${what}: ${msg}`);
  console.error(`FAIL  ${what}: ${msg}`);
};
const ok = (what, msg) => console.log(`ok    ${what}: ${msg}`);

/**
 * Parse every "$X,XXX" figure from the "Apartments currently start at $X,XXX"
 * pattern.  Returns the numeric dollar amount, or null if the pattern is
 * absent (fallback wording used — no baked price to check).
 *
 * The sentence from startingRentSentence():
 *   "Apartments currently start at $2,350 per month for a one-bedroom residence."
 */
function extractStartingRentFromText(text) {
  // Match the canonical sentence produced by startingRentSentence()
  const m = /Apartments currently start at \$(\d[\d,]+) per month/i.exec(text);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

/**
 * When the live availability feed cannot produce a minimum rent (zero units or
 * no usable prices), we still fetch the homepage and check whether it contains
 * a baked price. If it does, we FAIL — we cannot verify that figure is current
 * against a broken/empty feed, and a wrong price is worse than no price. If it
 * does not (fallback wording used), we PASS: there is nothing to drift.
 */
async function checkHomepageWithNoMinimum() {
  const homeUrl = `${BASE}/`;
  let html = '';
  try {
    const res = await fetch(homeUrl, { headers: { 'user-agent': 'starting-price-check' } });
    if (!res.ok) {
      fail('homepage', `HTTP ${res.status} — cannot inspect the baked starting price.`);
      process.exitCode = 1;
      return;
    }
    html = await res.text();
  } catch (err) {
    fail('homepage', `fetch failed: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const visibleRent = extractStartingRentFromText(html);
  if (visibleRent !== null) {
    fail(
      'visible FAQ copy',
      `homepage bakes a starting price of $${visibleRent.toLocaleString('en-US')} but the live availability feed ` +
        'returned no usable minimum rent — cannot verify this figure is current. ' +
        'Investigate the /api/availability feed and re-publish once it returns valid data.',
    );
    process.exitCode = 1;
  } else {
    console.log(
      'note  Homepage uses the no-price fallback wording — no baked figure to verify against the empty feed. OK.',
    );
  }
  // Also scan JSON-LD so the check is symmetric with the normal path.
  for (const m of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const blob = JSON.parse(m[1]);
      const walkForPrice = (v) => {
        if (Array.isArray(v)) return v.some(walkForPrice);
        if (!v || typeof v !== 'object') return false;
        const t = v['@type'];
        const types = Array.isArray(t) ? t : t ? [t] : [];
        if (types.includes('FAQPage')) {
          const entities = Array.isArray(v.mainEntity) ? v.mainEntity : v.mainEntity ? [v.mainEntity] : [];
          for (const e of entities) {
            const text = String(e?.acceptedAnswer?.text ?? e?.acceptedAnswer ?? '');
            const r = extractStartingRentFromText(text);
            if (r !== null) return true;
          }
        }
        return Object.values(v).some(walkForPrice);
      };
      if (walkForPrice(blob)) {
        // Only report if the visible copy didn't already fail to avoid duplication.
        if (visibleRent === null) {
          fail(
            'FAQPage JSON-LD',
            'homepage JSON-LD bakes a starting price but the live availability feed returned no usable minimum rent — cannot verify this figure is current.',
          );
          process.exitCode = 1;
        }
        break;
      }
    } catch {
      /* malformed blob — skip */
    }
  }
}

async function main() {
  // --- 1. Live availability minimum rent (source of truth). ------------------
  const feedUrl = `${BASE}/api/availability`;
  let liveMin = null;
  try {
    const res = await fetch(feedUrl, { headers: { 'user-agent': 'starting-price-check' } });
    if (!res.ok) {
      fail('availability API', `HTTP ${res.status} — cannot establish the live minimum rent.`);
      process.exitCode = 1;
      return;
    }
    const feed = await res.json();
    const units = feed.units ?? [];
    if (units.length === 0) {
      // Zero-unit feed cannot provide a live minimum. Fail closed if the
      // homepage baked a price (we cannot verify it); pass if fallback wording.
      console.log(
        'note  /api/availability returned zero units — cannot compute a live minimum; checking homepage for a baked price.',
      );
      await checkHomepageWithNoMinimum();
      return;
    }
    for (const u of units) {
      const rent = typeof u.rent === 'number' && Number.isFinite(u.rent) && u.rent > 0 ? u.rent : null;
      if (rent !== null && (liveMin === null || rent < liveMin)) liveMin = rent;
    }
    if (liveMin === null) {
      // No usable rent in the feed — we cannot verify any baked price.
      // Fetch the homepage and fail if a baked price IS present (we cannot
      // confirm it is current); pass only if the fallback wording is used.
      console.log(
        'note  No units in /api/availability carry a usable rent figure — checking whether the homepage baked a price anyway.',
      );
      await checkHomepageWithNoMinimum();
      return;
    }
    console.log(
      `Live feed: ${units.length} unit(s), minimum rent $${liveMin.toLocaleString('en-US')}.`,
    );
  } catch (err) {
    fail('availability API', `fetch failed: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  // --- 2. Homepage raw HTML. -------------------------------------------------
  const homeUrl = `${BASE}/`;
  let html = '';
  try {
    const res = await fetch(homeUrl, { headers: { 'user-agent': 'starting-price-check' } });
    if (!res.ok) {
      fail('homepage', `HTTP ${res.status} — cannot check the baked starting price.`);
      process.exitCode = 1;
      return;
    }
    html = await res.text();
    ok('homepage', `HTTP ${res.status} (${html.length.toLocaleString()} bytes).`);
  } catch (err) {
    fail('homepage', `fetch failed: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  let checkedAny = false;

  // --- 3a. Visible FAQ copy. -------------------------------------------------
  // The FaqSection renders faq.a as plain text in a <p> element.  The raw
  // prerendered HTML contains the answer text verbatim.
  {
    const visibleRent = extractStartingRentFromText(html);
    if (visibleRent === null) {
      console.log(
        'note  Visible copy: no "Apartments currently start at $X,XXX" sentence found — ' +
          'build used the no-price fallback wording; no stale figure to check.',
      );
    } else {
      checkedAny = true;
      if (visibleRent !== liveMin) {
        fail(
          'visible FAQ copy',
          `baked price $${visibleRent.toLocaleString('en-US')} ≠ live API minimum ` +
            `$${liveMin.toLocaleString('en-US')} — the homepage is advertising a stale starting rent. ` +
            `Re-publish to bake the current minimum.`,
        );
      } else {
        ok(
          'visible FAQ copy',
          `baked price $${visibleRent.toLocaleString('en-US')} matches live API minimum.`,
        );
      }
    }
  }

  // --- 3b. FAQPage JSON-LD. --------------------------------------------------
  // The prerendered HTML carries one or more <script type="application/ld+json">
  // blobs. Find FAQPage nodes and check the pricing-FAQ answer for the sentence.
  {
    const jsonLdBlobs = [];
    for (const m of html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        jsonLdBlobs.push(JSON.parse(m[1]));
      } catch {
        /* malformed blob — skip */
      }
    }

    // Flatten all nodes (top-level + @graph children).
    const allNodes = [];
    const walk = (v) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') {
        allNodes.push(v);
        if (Array.isArray(v['@graph'])) v['@graph'].forEach(walk);
      }
    };
    jsonLdBlobs.forEach(walk);

    const isType = (node, type) => {
      const t = node['@type'];
      return Array.isArray(t) ? t.includes(type) : t === type;
    };

    // Collect every mainEntity / acceptedAnswer text from FAQPage nodes.
    const faqPageNodes = allNodes.filter((n) => isType(n, 'FAQPage'));
    if (faqPageNodes.length === 0) {
      console.log('note  JSON-LD: no FAQPage node found in the raw homepage HTML.');
    } else {
      let faqLdRent = null;
      for (const faqPage of faqPageNodes) {
        const entities = Array.isArray(faqPage.mainEntity)
          ? faqPage.mainEntity
          : faqPage.mainEntity
            ? [faqPage.mainEntity]
            : [];
        for (const entity of entities) {
          // acceptedAnswer.text or acceptedAnswer itself
          const answerText =
            entity?.acceptedAnswer?.text ?? entity?.acceptedAnswer ?? '';
          const r = extractStartingRentFromText(String(answerText));
          if (r !== null) {
            faqLdRent = r;
            break;
          }
        }
        if (faqLdRent !== null) break;
      }

      if (faqLdRent === null) {
        console.log(
          'note  FAQPage JSON-LD: no "Apartments currently start at $X,XXX" sentence found — ' +
            'build used the no-price fallback wording; no stale figure to check.',
        );
      } else {
        checkedAny = true;
        if (faqLdRent !== liveMin) {
          fail(
            'FAQPage JSON-LD',
            `baked price $${faqLdRent.toLocaleString('en-US')} ≠ live API minimum ` +
              `$${liveMin.toLocaleString('en-US')} — the FAQPage structured data carries a stale starting rent. ` +
              `Re-publish to bake the current minimum.`,
          );
        } else {
          ok(
            'FAQPage JSON-LD',
            `baked price $${faqLdRent.toLocaleString('en-US')} matches live API minimum.`,
          );
        }
      }
    }
  }

  // --- 4. Summary. -----------------------------------------------------------
  if (!checkedAny) {
    console.log(
      '\nNo baked starting-price figure found on the homepage (fallback wording used) — nothing to drift.',
    );
  } else if (failures.length) {
    console.error(
      `\n${failures.length} starting-price check(s) FAILED against ${BASE}. ` +
        'The homepage is advertising a stale minimum rent. Re-publish after the next availability sync to correct it.',
    );
    process.exitCode = 1;
  } else {
    console.log('\nAll starting-price checks passed against ' + BASE + '.');
  }
}

main().catch((err) => {
  console.error(`Starting-price check errored: ${err.message}`);
  process.exitCode = 1;
});
