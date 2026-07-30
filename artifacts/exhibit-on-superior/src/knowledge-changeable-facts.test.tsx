// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Route, Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import {
  CHANGEABLE_FACTS_NOTE,
  CHANGEABLE_FACTS_NOTE_PARTS,
  KNOWLEDGE_ARTICLES,
  knowledgePath,
} from './data/knowledge';
import { KnowledgeArticle } from './pages/KnowledgeArticle';

// Task: fact-heavy Knowledge answers (pricing, fees, specials, application
// requirements, utility charges, office hours, lease terms) carry a shared
// "may change" qualifier footer, driven by the changeableFacts flag — and
// untagged articles must NOT render it.

function renderArticle(slug: string) {
  const { hook } = memoryLocation({ path: knowledgePath(slug) });
  return render(
    <Router hook={hook}>
      <Route path="/knowledge/:slug" component={KnowledgeArticle} />
    </Router>,
  );
}

afterEach(cleanup);

describe('changeable-facts qualifier footer', () => {
  const flagged = KNOWLEDGE_ARTICLES.filter((a) => a.changeableFacts);
  const unflagged = KNOWLEDGE_ARTICLES.filter((a) => !a.changeableFacts);

  it('flags a meaningful set of fact-heavy articles', () => {
    expect(flagged.length).toBeGreaterThanOrEqual(20);
    expect(unflagged.length).toBeGreaterThan(0);
    // Spot-check the core fact-heavy topics are covered.
    for (const slug of [
      'how-much-is-rent',
      'what-fees-in-addition-to-rent',
      'move-in-specials',
      'how-much-does-parking-cost',
      'lease-terms',
      'leasing-office-hours',
      'what-utility-fee-covers',
      'how-do-i-apply',
    ]) {
      expect(flagged.map((a) => a.slug)).toContain(slug);
    }
  });

  // Rendering 20+ article components sequentially needs more than the default 5 s.
  it('renders the footer (with a real Available Units link) on every flagged article', () => {
    for (const a of flagged) {
      const { container } = renderArticle(a.slug);
      // The visible sentence matches the shared string exactly.
      expect(container.textContent).toContain(CHANGEABLE_FACTS_NOTE);
      const link = screen.getByRole('link', {
        name: CHANGEABLE_FACTS_NOTE_PARTS.linkLabel,
      });
      expect(link.getAttribute('href')).toBe(CHANGEABLE_FACTS_NOTE_PARTS.linkHref);
      cleanup();
    }
  }, 30_000);

  it('does not render the footer on untagged articles', () => {
    for (const a of unflagged) {
      const { container } = renderArticle(a.slug);
      expect(container.textContent).not.toContain('may change');
      cleanup();
    }
  });
});
