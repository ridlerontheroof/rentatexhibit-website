// Guards for the per-plan "living in this layout" copy and the unit-map
// facts behind it:
//  1. Coverage — every floor-plan landing page has copy, and no entry is
//     orphaned (a stale plan id would silently drop a page's section).
//  2. Fact discipline — direction words, balcony claims, and sq ft figures
//     inside the copy must agree with the governed sources (unit map +
//     floor-plan DB). Copy is hand-written; this keeps it honest.
//  3. Uniqueness — no paragraph is reused across plans (no spun boilerplate).
import { describe, expect, it } from 'vitest';
import { FLOOR_PLAN_COPY } from './floorPlanCopy';
import { FLOOR_PLAN_PAGES } from './floorPlanPages';
import { planFactsFor, directionPhrase, UNIT_MAP } from './planFacts';
import { planSqftLabel } from './floorPlans';

describe('floor-plan copy coverage', () => {
  it('every plan page has copy with exactly two non-empty paragraphs', () => {
    for (const page of FLOOR_PLAN_PAGES) {
      const copy = FLOOR_PLAN_COPY[page.plan.id];
      expect(copy, `missing copy for ${page.plan.id} (${page.slug})`).toBeTruthy();
      expect(copy.paragraphs).toHaveLength(2);
      for (const p of copy.paragraphs) expect(p.length).toBeGreaterThan(80);
    }
  });

  it('no orphaned copy entries', () => {
    const ids = new Set(FLOOR_PLAN_PAGES.map((p) => p.plan.id));
    for (const key of Object.keys(FLOOR_PLAN_COPY)) {
      expect(ids.has(key), `copy entry ${key} matches no plan page`).toBe(true);
    }
  });

  it('paragraphs are unique across plans (no boilerplate reuse)', () => {
    const seen = new Map<string, string>();
    for (const [id, copy] of Object.entries(FLOOR_PLAN_COPY)) {
      for (const p of copy.paragraphs) {
        expect(seen.has(p), `paragraph shared by ${seen.get(p)} and ${id}`).toBe(false);
        seen.set(p, id);
      }
    }
  });
});

describe('floor-plan copy fact discipline', () => {
  it('unit map facts exist and are uniform for every plan page', () => {
    for (const page of FLOOR_PLAN_PAGES) {
      const facts = planFactsFor(page.plan.id);
      expect(facts, `no unit-map facts for ${page.plan.id}`).toBeTruthy();
      expect(facts!.facing, `mixed facing for ${page.plan.id}`).not.toBe('');
      expect(directionPhrase(facts!.facing), `unmapped facing ${facts!.facing}`).not.toBe('');
      // The unit map's balcony answer must match the page's standing rule.
      expect(facts!.balcony, `balcony mismatch for ${page.plan.id}`).toBe(page.balcony);
    }
  });

  it('balcony hard rule holds in the unit map (02/03 stacks, floors 6-29 only)', () => {
    const noBalcony = UNIT_MAP.filter((u) => !u.balcony);
    expect(noBalcony).toHaveLength(48);
    for (const u of noBalcony) {
      expect([2, 3]).toContain(u.line);
      const floor = Number(u.floor);
      expect(floor).toBeGreaterThanOrEqual(6);
      expect(floor).toBeLessThanOrEqual(29);
    }
  });

  it('copy never contradicts facing or balcony facts', () => {
    const COMPASS = [
      'northeast',
      'northwest',
      'southeast',
      'southwest',
      'north',
      'south',
      'east',
      'west',
    ];
    for (const page of FLOOR_PLAN_PAGES) {
      const copy = FLOOR_PLAN_COPY[page.plan.id];
      const facts = planFactsFor(page.plan.id)!;
      const text = copy.paragraphs.join(' ').toLowerCase();
      const facing = facts.facing.toLowerCase();
      // Any "<direction>-facing" phrasing must name the plan's actual facing.
      for (const m of text.matchAll(/([a-z]+)-facing/g)) {
        expect(m[1], `${page.plan.id}: claims ${m[1]}-facing but sheet says ${facing}`).toBe(
          facing,
        );
      }
      // "faces <direction>" phrasing likewise.
      for (const m of text.matchAll(/faces ([a-z]+)/g)) {
        if (COMPASS.includes(m[1])) expect(m[1]).toBe(facing);
      }
      if (!page.balcony) {
        // Balcony-free plans must say so explicitly and never claim one.
        expect(
          /balcony-free|without a private balcony|no balcony/.test(text),
          `${page.plan.id}: no-balcony plan must state the exception`,
        ).toBe(true);
        expect(/(?:its|the|a) private balcony(?! \()/.test(text), `${page.plan.id}`).toBe(false);
      }
      // Skyline/Loop view language is approved ONLY for south-ish facings.
      if (text.includes('toward the loop')) {
        expect(facing.startsWith('south'), `${page.plan.id}: Loop view without south facing`).toBe(
          true,
        );
      }
      // Any explicit sq ft figure must be the plan's own printed figure.
      for (const m of text.matchAll(/([\d,]+)(?:\u2013([\d,]+))? sq ft/g)) {
        const label = planSqftLabel(page.plan).toLowerCase();
        const all = FLOOR_PLAN_PAGES.map((p) => planSqftLabel(p.plan).toLowerCase());
        const figure = m[2] ? `${m[1]}\u2013${m[2]}` : m[1];
        expect(
          all.includes(figure) || figure === label,
          `${page.plan.id}: sq ft figure ${figure} not a printed plan figure`,
        ).toBe(true);
      }
    }
  });
});
