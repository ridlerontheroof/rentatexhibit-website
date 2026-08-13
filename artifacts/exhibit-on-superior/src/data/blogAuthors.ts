// Blog author registry — the E-E-A-T byline source of truth.
//
// Every blog article credits a real author (a person on the property team or
// the leasing team as the organization's editorial voice). The visible byline
// in pages/BlogArticle.tsx and the Article JSON-LD author node both render
// from this registry, so the two can never disagree (test-enforced).
//
// Attribution strategy (see docs/CONTENT_CLUSTER_PLAN.md):
//   - Rebbekah Hallberg (Property Manager) authors pieces that lean on
//     property-management authority: neighborhood expertise, building and
//     high-rise living guidance, lifestyle content.
//   - The leasing team authors operational how-to content: applications,
//     move-in logistics, fees, leasing-process guides.
import { SITE_URL } from './seo';

export type BlogAuthorId = 'rebbekah-hallberg' | 'leasing-team';

export interface BlogAuthor {
  id: BlogAuthorId;
  /** schema.org node type for the JSON-LD author. */
  type: 'Person' | 'Organization';
  /** Visible byline name. */
  name: string;
  /** Visible role, e.g. "Property Manager at Exhibit On Superior". */
  role: string;
  /** One-line credential shown under the byline and used in JSON-LD description. */
  bio: string;
}

export const BLOG_AUTHORS: Record<BlogAuthorId, BlogAuthor> = {
  'rebbekah-hallberg': {
    id: 'rebbekah-hallberg',
    type: 'Person',
    name: 'Rebbekah Hallberg',
    role: 'Property Manager at Exhibit On Superior',
    bio: 'Rebbekah manages Exhibit On Superior at 165 W Superior St and works with River North renters every day — from first tour to move-in and beyond.',
  },
  'leasing-team': {
    id: 'leasing-team',
    type: 'Organization',
    name: 'The Exhibit On Superior Leasing Team',
    role: 'On-site leasing team at Exhibit On Superior',
    bio: 'The on-site leasing team at 165 W Superior St guides renters through touring, applying, and moving in to Exhibit On Superior.',
  },
};

/** Stable JSON-LD @id for an author node (person nodes get a site-scoped id). */
export function blogAuthorNodeId(author: BlogAuthor): string {
  return author.type === 'Organization'
    ? `${SITE_URL}#organization`
    : `${SITE_URL}#author-${author.id}`;
}
