import { Slider } from '../ui/slider';
import { CATEGORIES, FLOOR_BANDS, type Category } from '../../data/floorPlans';

export interface FilterState {
  categories: Set<Category>;
  bands: Set<string>;
  sqft: [number, number];
}

interface PlanFiltersProps {
  state: FilterState;
  sqftMin: number;
  sqftMax: number;
  onToggleCategory: (c: Category) => void;
  onToggleBand: (id: string) => void;
  onSqftChange: (range: [number, number]) => void;
}

export function PlanFilters({
  state,
  sqftMin,
  sqftMax,
  onToggleCategory,
  onToggleBand,
  onSqftChange,
}: PlanFiltersProps) {
  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">
          Bedrooms
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = state.categories.has(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleCategory(cat.id)}
                className={`px-3 py-2 text-xs uppercase tracking-wide transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'border border-border hover:border-primary'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">
          Floor
        </legend>
        <div className="flex flex-wrap gap-2">
          {FLOOR_BANDS.map((band) => {
            const active = state.bands.has(band.id);
            return (
              <button
                key={band.id}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleBand(band.id)}
                className={`px-3 py-2 text-xs uppercase tracking-wide transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'border border-border hover:border-primary'
                }`}
              >
                {band.label}
                <span className="ml-1 opacity-70">{band.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">
          Square Footage
        </legend>
        <Slider
          min={sqftMin}
          max={sqftMax}
          step={10}
          value={state.sqft}
          onValueChange={(v) => onSqftChange([v[0], v[1]] as [number, number])}
          aria-label="Square footage range"
          className="my-4"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{state.sqft[0].toLocaleString()} sq ft</span>
          <span>{state.sqft[1].toLocaleString()} sq ft</span>
        </div>
      </fieldset>
    </div>
  );
}
