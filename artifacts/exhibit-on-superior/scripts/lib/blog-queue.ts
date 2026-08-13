// Pure builder for the blog-queue snapshot the api-server's weekly SEO
// digest reads (artifacts/api-server/src/lib/blogQueueSnapshot.json).
//
// The cluster plan and the article list live in this web artifact; the
// api-server must never import them across the artifact boundary (fragile
// build coupling), so the queue state is exported as a committed JSON
// snapshot instead. scripts/generate-blog-queue.ts writes it; the parity
// test src/data/blogQueueSnapshot.test.ts fails whenever the plan or the
// article set changes without regenerating.
//
// Determinism: no timestamps — the snapshot is a pure function of the plan
// and the article list, so `--check` mode and the parity test can compare
// bytes.
import { CLUSTER_PLAN, unwrittenSlugs } from '../../src/data/blogClusterPlan';
import { ALL_BLOG_ARTICLES } from '../../src/data/blogArticles';

export interface BlogQueueEntry {
  slug: string;
  workingTitle: string;
  targetQuery: string;
  pillarTitle: string;
}

export interface BlogPendingDraft {
  slug: string;
  title: string;
}

export interface BlogQueueSnapshot {
  /** Planned-but-unpublished guides, in generation-priority order. */
  queue: BlogQueueEntry[];
  /** Articles sitting at draft: true — written, awaiting human review. */
  pendingDrafts: BlogPendingDraft[];
  publishedCount: number;
  plannedTotal: number;
}

export function buildBlogQueueSnapshot(): BlogQueueSnapshot {
  const bySlug = new Map<string, BlogQueueEntry>();
  for (const p of CLUSTER_PLAN) {
    bySlug.set(p.pillarSlug, {
      slug: p.pillarSlug,
      workingTitle: p.pillarTitle,
      targetQuery: p.pillarSlug.replace(/-/g, ' '),
      pillarTitle: p.pillarTitle,
    });
    for (const c of p.clusters) {
      bySlug.set(c.slug, {
        slug: c.slug,
        workingTitle: c.workingTitle,
        targetQuery: c.targetQuery,
        pillarTitle: p.pillarTitle,
      });
    }
  }
  const queue: BlogQueueEntry[] = [];
  for (const slug of unwrittenSlugs()) {
    const entry = bySlug.get(slug);
    if (entry) queue.push(entry);
  }
  const pendingDrafts: BlogPendingDraft[] = ALL_BLOG_ARTICLES.filter((a) => a.draft).map(
    (a) => ({ slug: a.slug, title: a.title }),
  );
  const publishedCount = ALL_BLOG_ARTICLES.filter((a) => !a.draft).length;
  return { queue, pendingDrafts, publishedCount, plannedTotal: bySlug.size };
}

/** Canonical serialized form — both the generator and the guards use this. */
export function serializeBlogQueueSnapshot(snapshot: BlogQueueSnapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}
