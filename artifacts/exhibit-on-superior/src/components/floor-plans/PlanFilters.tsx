import { Slider } from '../ui/slider';
import { Accessibility } from 'lucide-react';
import { CATEGORIES, FLOOR_BANDS, type Category } from '../../data/floorPlans';
import { ADA_KEY, ADA_DISCLAIMER } from '../../data/ada';

export interface FilterState {
  categories: Set<Category>;
  bands: Set<string>;
  sqft: [number, number];
  ada: boolean;
}

interface PlanFiltersProps {
  state: FilterState;
  sqftMin: number;
  sqftMax: number;
  onToggleCategory: (c: Category) => void;
  onToggleBand: (id: string) => void;
  onSqftChange: (range: [number, number]) => void;
  onToggleAda: () => void;
}

export function PlanFilters({
  state,
  sqftMin,
  sqftMax,
  onToggleCategory,
  onToggleBand,
  onSqftChange,
  onToggleAda,
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

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">
          Accessibility
        </legend>
        <button
          type="button"
          aria-pressed={state.ada}
          onClick={onToggleAda}
          className={`flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wide transition-colors ${
            state.ada ? 'bg-primary text-white' : 'border border-border hover:border-primary'
          }`}
        >
          <Accessibility className="h-4 w-4" aria-hidden="true" />
          ADA-accessible
        </button>
        {state.ada && (
          <div className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
            {ADA_KEY.map((k) => (
              <p key={k.code}>
                <span className="font-semibold text-foreground">{k.label}</span>: {k.description}
              </p>
            ))}
            <p>{ADA_DISCLAIMER}</p>
          </div>
        )}
      </fieldset>
    </div>
  );
}
