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
import { FAQ_HUB_TOPICS } from './seo';
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
