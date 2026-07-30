// Tiny, dependency-free URL helper for Knowledge Center links.
//
// Lives in its own module (NOT knowledge.ts) on purpose: knowledge.ts pulls
// in the full article content (~200 KB of pure data via knowledgeArticles.ts),
// and site-wide components like FaqSection only need the path builder. Before
// this split, every page chunk dragged the whole knowledge bundle into its
// mobile critical path (parse cost + Slow-4G bandwidth competing with the LCP
// image). knowledge.ts re-exports this so article pages keep one import.
export function knowledgePath(slug: string): string {
  return `/knowledge/${slug}`;
}
