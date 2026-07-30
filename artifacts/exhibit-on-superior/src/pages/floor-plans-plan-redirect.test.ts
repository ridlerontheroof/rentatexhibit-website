// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { landingPathForPlanId } from './FloorPlans';
import { planGroups, groupKey } from '../data/floorPlans';
import { FLOOR_PLAN_PAGES, PLAN_DEEP_LINK_REDIRECTS } from '../data/floorPlanPages';

// Legacy `?plan=<group id>` deep links to /available-units used to open the
// on-page catalog lightbox. The catalog moved to /floor-plans, so the page
// now client-redirects those links to the matching layout landing page.
describe('landingPathForPlanId', () => {
  it('resolves every plan group id to a /floor-plans landing page', () => {
    for (const g of planGroups) {
      const path = landingPathForPlanId(g.id);
      expect(path, `group ${g.id}`).toMatch(/^\/floor-plans\/[a-z0-9-]+$/);
      const slug = path!.split('/').pop()!;
      const page = FLOOR_PLAN_PAGES.find((fp) => fp.slug === slug)!;
      expect(groupKey(page.plan)).toBe(g.id);
    }
  });

  it('returns null for unknown or missing ids (no redirect)', () => {
    expect(landingPathForPlanId(null)).toBeNull();
    expect(landingPathForPlanId('')).toBeNull();
    expect(landingPathForPlanId('not-a-plan')).toBeNull();
  });

  // The production server 301s these deep links from the same map (written
  // to dist/plan-redirects.json by the prerenderer) — it must agree with the
  // client fallback for every group and contain nothing extra.
  it('PLAN_DEEP_LINK_REDIRECTS matches landingPathForPlanId for every group id', () => {
    expect(Object.keys(PLAN_DEEP_LINK_REDIRECTS).sort()).toEqual(
      planGroups.map((g) => g.id).sort(),
    );
    for (const g of planGroups) {
      expect(PLAN_DEEP_LINK_REDIRECTS[g.id], `group ${g.id}`).toBe(landingPathForPlanId(g.id));
    }
  });
});
