// Accessible-name guard for the FAQ hub's "Full answer →" links.
//
// Every FAQ with a knowledgeSlug renders a "Full answer →" link. Visually the
// links are told apart by the question above them, but a screen reader reads
// only the link's accessible name — without extra context all ~30 links would
// announce identically as "Full answer". The JSX appends the question in a
// visually-hidden span (name-from-content) so the accessible name BEGINS with
// the visible text verbatim — WCAG 2.5.3 label-in-name. An aria-label here
// would fail 2.5.3 because it drops the visible "→"; this test keeps a future
// edit from reintroducing that pattern or dropping the hidden context.
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

interface FullAnswerLink {
  tag: string;
  /** Full text content = accessible name (name from content, no aria-label). */
  name: string;
  /** Text content with sr-only spans removed = what sighted users see. */
  visible: string;
  ariaLabel: string | null;
}

/** Every <a> tag whose text content starts with "Full answer". */
function fullAnswerLinks(html: string): FullAnswerLink[] {
  const links: FullAnswerLink[] = [];
  for (const m of html.matchAll(/<a\b[^>]*>(.*?)<\/a>/gs)) {
    const inner = m[1];
    const name = decode(inner.replace(/<[^>]+>/g, '')).trim();
    if (!name.startsWith('Full answer')) continue;
    const visible = decode(
      inner.replace(/<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>.*?<\/span>/gs, '').replace(/<[^>]+>/g, ''),
    ).trim();
    const label = m[0].match(/aria-label="([^"]*)"/);
    links.push({ tag: m[0], name, visible, ariaLabel: label ? decode(label[1]) : null });
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

  it('no link uses an aria-label (it would override name-from-content and break 2.5.3)', () => {
    for (const l of links) {
      expect(l.ariaLabel, `unexpected aria-label on: ${l.tag}`).toBeNull();
    }
  });

  it('every accessible name begins with the visible text verbatim (WCAG 2.5.3)', () => {
    for (const l of links) {
      expect(
        l.name.startsWith(l.visible),
        `accessible name "${l.name}" must start with visible text "${l.visible}"`,
      ).toBe(true);
    }
  });

  it('every Full-answer accessible name includes its question', () => {
    // Each linked question appears in exactly one name (order-independent).
    for (const q of LINKED_QUESTIONS) {
      const matching = links.filter((l) => l.name.includes(q));
      expect(
        matching.length,
        `no Full-answer link's accessible name includes the question "${q}"`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('all Full-answer accessible names are unique', () => {
    const names = links.map((l) => l.name);
    const dupes = names.filter((l, i) => names.indexOf(l) !== i);
    expect(dupes, `duplicate spoken link names: ${dupes.join(' | ')}`).toEqual([]);
  });
});
