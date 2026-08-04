// Guards for the search-intent landing pages (data/landingPages.ts):
//  - every landing page has its PAGE_SEO entry and client route (lockstep rule),
//  - the literal <PageHero image="..."> in pages/SeoLanding.tsx matches the
//    page's heroImage (the smartimg-sizes guard requires literals, so the two
//    sources could otherwise drift),
//  - category filtering resolves units through the floor-plan DB.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANDING_PAGES, categoryForUnit, unitMatchesCategories } from './landingPages';
import { PAGE_SEO } from './seo';
import { routes } from '../routes';

const SRC = dirname(dirname(fileURLToPath(import.meta.url)));

describe('search-intent landing pages', () => {
  it('every landing page has a PAGE_SEO entry and a route (lockstep)', () => {
    const routePaths = new Set(routes.map((r) => r.path));
    for (const page of LANDING_PAGES) {
      expect(PAGE_SEO[page.path], `${page.path} missing PAGE_SEO entry`).toBeDefined();
      expect(routePaths.has(page.path), `${page.path} missing routes.tsx entry`).toBe(true);
      expect(PAGE_SEO[page.path].noindex, `${page.path} must be indexable`).toBeFalsy();
    }
  });

  it('SeoLanding literal hero images match heroImage in the data module', () => {
    const source = readFileSync(join(SRC, 'pages', 'SeoLanding.tssx'.replace('tssx', 'tsx')), 'utf8');
    const literals = [...source.matchAll(/image="(\/images\/[^"]+)"/g)].map((m) => m[1]);
    expect(literals.length).toBe(LANDING_PAGES.length);
    for (const page of LANDING_PAGES) {
      expect(
        literals.includes(page.heroImage),
        `${page.path} heroImage ${page.heroImage} not found as a literal in SeoLanding.tsx`,
      ).toBe(true);
    }
  });

  it('unit numbers resolve to plan categories via the floor-plan DB', () => {
    expect(categoryForUnit('0606')).toBeTruthy();
    expect(unitMatchesCategories('0606', null)).toBe(true);
    const cat = categoryForUnit('0606');
    expect(unitMatchesCategories('0606', [cat!])).toBe(true);
  });

  it('bedroom-type pages cover disjoint categories (no cannibalizing overlap)', () => {
    const typed = LANDING_PAGES.filter((p) => p.categories);
    const seen = new Set<string>();
    for (const p of typed) {
      for (const c of p.categories!) {
        expect(seen.has(c), `category ${c} appears on two landing pages`).toBe(false);
        seen.add(c);
      }
    }
  });
});
