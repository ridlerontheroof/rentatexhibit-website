// @vitest-environment jsdom
// Rendered-output guard for task: a floor-plan card must never show a broader
// floor range than its plan sheets. The data-level test
// (src/data/floor-range-consistency.test.ts) checks the dataset agrees across
// surfaces, but couldn't catch a PlanCard refactor that renders the
// consolidated FLOOR_BANDS labels (e.g. "Flr 2–4M") instead of the exact
// per-variant sheet ranges. This test renders the real PlanCard for every
// group and asserts the visible chips are exactly the variant floor labels.
import { afterEach, describe, expect, it } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { PlanCard } from './PlanCard';
import { planGroups, FLOOR_BANDS, bandLabelForGroup } from '../../data/floorPlans';

afterEach(cleanup);

/** The visible "Flr …" chip texts rendered by a card, in DOM order. */
function renderedFloorChips(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('span'))
    .map((el) => el.textContent?.trim() ?? '')
    .filter((t) => /^Flr /.test(t));
}

describe('PlanCard rendered floor chips match the plan sheets exactly', () => {
  it('renders one chip per plan variant with the exact sheet floor range', () => {
    for (const group of planGroups) {
      const { container } = render(
        <PlanCard group={group} onOpen={() => {}} />,
      );
      const chips = renderedFloorChips(container);
      const expected = group.variants.map(
        (v) => `Flr ${v.floorLabel.replace(/-/g, '\u2013')}`,
      );
      expect(chips, `group ${group.id}`).toEqual(expected);
      cleanup();
    }
  });

  it('never renders a consolidated FLOOR_BANDS label unless it is itself an exact sheet range', () => {
    const bandTexts = new Set(FLOOR_BANDS.map((b) => `Flr ${b.label}`));
    for (const group of planGroups) {
      const { container } = render(
        <PlanCard group={group} onOpen={() => {}} />,
      );
      const exactLabels = new Set(
        group.variants.map((v) => `Flr ${v.floorLabel.replace(/-/g, '\u2013')}`),
      );
      for (const chip of renderedFloorChips(container)) {
        // A band label may only appear when a sheet's range happens to equal
        // the band exactly — otherwise it's the consolidated-band regression.
        if (bandTexts.has(chip)) {
          expect(exactLabels.has(chip), `group ${group.id} shows band label "${chip}"`).toBe(true);
        }
      }
      // The card must also never show the joined band summary label.
      const joined = `Flr ${bandLabelForGroup(group)}`;
      if (!exactLabels.has(joined)) {
        expect(renderedFloorChips(container), `group ${group.id}`).not.toContain(joined);
      }
      cleanup();
    }
  });
});
