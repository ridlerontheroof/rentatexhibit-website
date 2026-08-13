// Parity guard: the api-server's committed blog-queue snapshot
// (artifacts/api-server/src/lib/blogQueueSnapshot.json) must stay in sync
// with the cluster plan + article list in this artifact. It feeds the weekly
// "next guide up" reminder in the SEO digest email, so a stale snapshot means
// the leasing inbox gets reminded about the wrong guide.
//
// Fails after publishing an article (draft flip), adding a draft, or editing
// blogClusterPlan.ts until you run:
//   pnpm --filter @workspace/exhibit-on-superior run generate:blog-queue
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildBlogQueueSnapshot,
  serializeBlogQueueSnapshot,
} from '../../scripts/lib/blog-queue';

const SNAPSHOT_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'api-server',
  'src',
  'lib',
  'blogQueueSnapshot.json',
);

describe('blog-queue snapshot parity (api-server weekly reminder)', () => {
  it('committed snapshot matches the cluster plan and article list', () => {
    const committed = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
    const expected = serializeBlogQueueSnapshot(buildBlogQueueSnapshot());
    expect(committed, 'blogQueueSnapshot.json is stale — run generate:blog-queue').toBe(
      expected,
    );
  });

  it('queue entries carry everything the reminder email needs', () => {
    const snap = buildBlogQueueSnapshot();
    for (const entry of snap.queue) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/);
      expect(entry.workingTitle.length).toBeGreaterThan(0);
      expect(entry.targetQuery.length).toBeGreaterThan(0);
      expect(entry.pillarTitle.length).toBeGreaterThan(0);
    }
    expect(snap.publishedCount + snap.queue.length).toBeLessThanOrEqual(
      snap.plannedTotal + snap.pendingDrafts.length,
    );
  });
});
