// Accessible-name guard for the FAQ hub's "Full answer →" links.
//
// Every FAQ with a knowledgeSlug renders a "Full answer →" link. Visually the
// links are told apart by the question above them, but a screen reader reads
// only the link's accessible name — without an aria-label all ~30 links would
// announce identically as "Full answer". The JSX carries
// aria-label={`Full answer: ${faq.q}`} today, but only this test keeps a
// future edit or a new link pattern from silently dropping it.
//
// The page is rendered with the same server renderer the prerenderer uses, so
// what we assert here is exactly what ships in dist/public/faq/index.html.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { FaqHub } from './FaqHub';
import { FAQ_HUB_TOPICS } from '../data/seo';

/** Decode the handful of HTML entities React escapes in attributes/text. */
function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<!-- -->/g, '');
}

/** Every <a> tag whose visible text starts with "Full answer". */
function fullAnswerLinks(html: string): { tag: string; ariaLabel: string | null }[] {
  const links: { tag: string; ariaLabel: string | null }[] = [];
  for (const m of html.matchAll(/<a\b[^>]*>(.*?)<\/a>/gs)) {
    const text = decode(m[1].replace(/<[^>]+>/g, '')).trim();
    if (!text.startsWith('Full answer')) continue;
    const label = m[0].match(/aria-label="([^"]*)"/);
    links.push({ tag: m[0], ariaLabel: label ? decode(label[1]) : null });
  }
  return links;
}

const LINKED_QUESTIONS = FAQ_HUB_TOPICS.flatMap((t) => t.faqs)
  .filter((f) => f.knowledgeSlug)
  .map((f) => f.q);

describe('FAQ hub "Full answer" link accessible names', () => {
  // Same server renderer + Router setup as entry-server.tsx uses to prerender.
  const html = renderToString(
    <Router ssrPath="/faq">
      <FaqHub />
    </Router>,
  );
  const links = fullAnswerLinks(html);

  it('renders one Full-answer link per cross-linked FAQ', () => {
    expect(links.length, 'Full-answer link count drifted from the data').toBe(
      LINKED_QUESTIONS.length,
    );
    expect(links.length).toBeGreaterThan(0);
  });

  it('every Full-answer link has an accessible name that includes its question', () => {
    const labels = links.map((l) => l.ariaLabel);
    for (const [i, label] of labels.entries()) {
      expect(
        label,
        `Full-answer link #${i + 1} lost its aria-label — all these links would ` +
          `announce identically to screen readers: ${links[i].tag}`,
      ).toBeTruthy();
    }
    // Each linked question appears in exactly one label (order-independent).
    for (const q of LINKED_QUESTIONS) {
      const matching = labels.filter((l) => l && l.includes(q));
      expect(
        matching.length,
        `no Full-answer link's accessible name includes the question "${q}"`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('all Full-answer accessible names are unique', () => {
    const labels = links.map((l) => l.ariaLabel ?? 'Full answer');
    const dupes = labels.filter((l, i) => labels.indexOf(l) !== i);
    expect(dupes, `duplicate spoken link names: ${dupes.join(' | ')}`).toEqual([]);
  });
});
