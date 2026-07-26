// FAQ ↔ Knowledge Center alignment guard.
//
// The FAQ hub (/faq) and the Knowledge Center (/knowledge) intentionally
// coexist: quick scannable answers vs. one-question-per-page deep answers.
// Overlapping Q&As are tied together by Faq.knowledgeSlug (data/seo.ts), which
// drives the "Full answer →" link on /faq. This suite fails the build when:
//   - a knowledgeSlug points at a slug that no longer exists (dead link),
//   - a linked pair ships materially different concrete facts (diverging
//     dollar amounts / large numbers / decimals like distances),
//   - a hub question that duplicates a knowledge article's question ships
//     without the cross-link (a new overlap must be declared, not hand-copied).
import { describe, expect, it } from 'vitest';
import { FAQ_HUB_TOPICS, PAGE_SEO } from './seo';
import { knowledgeArticle, KNOWLEDGE_ARTICLES, type KnowledgeArticle } from './knowledge';

const HUB_FAQS = FAQ_HUB_TOPICS.flatMap((t) => t.faqs.map((f) => ({ topic: t.title, ...f })));

/** Question text normalized for duplicate detection. */
function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/at exhibit on superior/g, '')
    .replace(/exhibit on superior/g, 'exhibit')
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** All prose an article commits to: question + answer + expanded sections. */
function articleText(a: KnowledgeArticle): string {
  return [a.question, a.answer, ...a.sections.flatMap((s) => s.paragraphs)].join(' ');
}

/**
 * Concrete fact tokens: dollar amounts, thousands-grouped numbers, decimals
 * (distances), and standalone numbers of 3+ digits (credit scores, street
 * numbers, phone segments). Small integers (floors, pet counts) are too
 * ambiguous to match reliably and are deliberately excluded.
 */
function factTokens(text: string): string[] {
  return [...text.matchAll(/\$\d+(?:,\d{3})*|\b\d+\.\d+\b|\b\d{1,3}(?:,\d{3})+\b|\b\d{3,}\b/g)].map(
    (m) => m[0],
  );
}

describe('FAQ ↔ Knowledge Center alignment', () => {
  it('every FAQ knowledgeSlug resolves to a live article (no dead "Full answer" links)', () => {
    for (const f of HUB_FAQS) {
      if (!f.knowledgeSlug) continue;
      expect(
        knowledgeArticle(f.knowledgeSlug),
        `FAQ "${f.q}" links unknown knowledge slug "${f.knowledgeSlug}"`,
      ).toBeDefined();
    }
  });

  it('most hub answers carry a Full-answer cross-link (regression floor)', () => {
    const linked = HUB_FAQS.filter((f) => f.knowledgeSlug).length;
    expect(linked, 'cross-links were removed from the FAQ hub').toBeGreaterThanOrEqual(30);
  });

  it('linked FAQ/article pairs agree on every concrete fact (no diverging answers)', () => {
    for (const f of HUB_FAQS) {
      if (!f.knowledgeSlug) continue;
      const article = knowledgeArticle(f.knowledgeSlug);
      if (!article) continue; // dead-link test reports this
      const haystack = articleText(article);
      for (const token of factTokens(f.a)) {
        expect(
          haystack.includes(token),
          `FAQ "${f.q}" states "${token}" but article "${article.slug}" never mentions it — ` +
            'the two surfaces have drifted apart; fix whichever is stale.',
        ).toBe(true);
      }
    }
  });

  it('every concrete fact on any page (quickAnswer + per-page FAQs) is backed by a knowledge article', () => {
    // Site-wide fact-drift guard. The pairwise test above only covers /faq
    // answers that declare a knowledgeSlug; per-page FAQs and quickAnswers in
    // PAGE_SEO (e.g. /fees, /pet-friendly) can drift on the same facts without
    // it. The Knowledge Center is the site's verified-facts corpus (every
    // article fact is leasing-approved — see knowledgeArticles.ts authoring
    // rules), so any dollar amount / distance / score / large number a page
    // states must also appear somewhere in that corpus. When a fact changes
    // (say $335 parking is re-priced), updating only the article makes every
    // page still stating the old number fail here — and vice versa updating a
    // page without its article fails the pairwise guard. Small integers stay
    // excluded via the shared factTokens() regex.
    const corpus = KNOWLEDGE_ARTICLES.map(articleText).join(' ');
    for (const page of Object.values(PAGE_SEO)) {
      // noindex utility pages (privacy policy, accessibility statement) state
      // legal/spec versions (e.g. WCAG 2.1), not leasing facts — out of scope.
      if (page.noindex) continue;
      const surfaces: Array<[string, string]> = [
        ['quickAnswer', page.quickAnswer],
        ...page.faqs.map((f): [string, string] => [`FAQ "${f.q}"`, f.a]),
      ];
      for (const [where, text] of surfaces) {
        for (const token of factTokens(text)) {
          expect(
            corpus.includes(token),
            `${page.path} ${where} states "${token}" but no knowledge article mentions it — ` +
              'the page has drifted from the verified-facts corpus; fix whichever is stale ' +
              '(or add/update the knowledge article that verifies this fact).',
          ).toBe(true);
        }
      }
    }
  });

  it('every concrete fact in an indexable page title/description is backed by a knowledge article', () => {
    // Same guard as above, but for the meta surfaces Google actually shows in
    // search results: PAGE_SEO title and description. A stale price or
    // distance there is arguably worse than in on-page copy — it's the first
    // thing a searcher reads. Uses the same shared factTokens() regex, so
    // small integers stay excluded and noise-prone tokens (zip codes, street
    // numbers, phone segments) are held to the same standard: they must
    // appear somewhere in the verified-facts corpus, which already carries
    // the address and phone number.
    const corpus = KNOWLEDGE_ARTICLES.map(articleText).join(' ');
    for (const page of Object.values(PAGE_SEO)) {
      if (page.noindex) continue; // not shown in search results
      const surfaces: Array<[string, string]> = [
        ['title', page.title],
        ['description', page.description],
      ];
      for (const [where, text] of surfaces) {
        for (const token of factTokens(text)) {
          expect(
            corpus.includes(token),
            `${page.path} ${where} states "${token}" but no knowledge article mentions it — ` +
              'the meta shown in Google has drifted from the verified-facts corpus; fix whichever ' +
              'is stale (or add/update the knowledge article that verifies this fact).',
          ).toBe(true);
        }
      }
    }
  });

  it('the site-wide fact guard actually sees fact tokens (self-check)', () => {
    // If the factTokens regex or PAGE_SEO shape changes so nothing matches,
    // the guard above would pass vacuously. Anchor on a floor: today the
    // pages state well over 50 concrete fact tokens.
    const total = Object.values(PAGE_SEO)
      .flatMap((p) => [p.quickAnswer, ...p.faqs.map((f) => f.a)])
      .flatMap(factTokens).length;
    expect(total, 'fact-token extraction went vacuous').toBeGreaterThanOrEqual(50);
    // The meta guard needs its own floor: titles/descriptions state street
    // numbers, phone digits, and prices today (e.g. 165 W Superior St).
    const metaTotal = Object.values(PAGE_SEO)
      .filter((p) => !p.noindex)
      .flatMap((p) => [p.title, p.description])
      .flatMap(factTokens).length;
    expect(metaTotal, 'meta fact-token extraction went vacuous').toBeGreaterThanOrEqual(5);
  });

  it('a hub question duplicating an article question must declare the overlap', () => {
    const byQuestion = new Map(KNOWLEDGE_ARTICLES.map((a) => [normalizeQuestion(a.question), a]));
    for (const f of HUB_FAQS) {
      const match = byQuestion.get(normalizeQuestion(f.q));
      if (!match) continue;
      expect(
        f.knowledgeSlug,
        `FAQ "${f.q}" duplicates knowledge article "${match.slug}" but has no knowledgeSlug ` +
          'cross-link — overlapping Q&As must be tied together, not hand-copied.',
      ).toBe(match.slug);
    }
  });
});
