import { ChevronDown, X } from 'lucide-react';
import {
  bathsOptions,
  bedsOptions,
  hasActiveUnitFilters,
  sqftBounds,
  type FilterableUnit,
  type MoveInFilter,
  type UnitFilterState,
} from '../../data/unitFilters';

/**
 * Thin filter row for the Available Residences strip: move-in date, beds,
 * baths, and square footage. Pure client-side narrowing of the live unit
 * list — the interactive row mounts after hydration only (see
 * AvailableUnits), but an inert aria-hidden twin of it renders during
 * SSR/prerender so its height is reserved from the first paint (no layout
 * shift when the live row swaps in). aria-hidden keeps it out of the
 * markdown twins, and the default (no filters) render is exactly the full
 * unit list.
 *
 * Native <select>/<input> controls throughout: compact, keyboard-operable,
 * labeled, and free of the hidden-clone issues Radix selects bring (same
 * reasoning as the floor-plans sort control).
 */

const MOVE_IN_OPTIONS = [
  { value: 'any', label: 'Any date' },
  { value: 'now', label: 'Available now' },
  { value: '30', label: 'Within 30 days' },
  { value: '60', label: 'Within 60 days' },
  { value: 'date', label: 'By a date…' },
] as const;

function moveInValue(f: MoveInFilter): string {
  switch (f.kind) {
    case 'any':
      return 'any';
    case 'now':
      return 'now';
    case 'days':
      return String(f.days);
    case 'date':
      return 'date';
  }
}

function selectClass(active: boolean): string {
  return `h-9 appearance-none rounded-md border bg-background pl-2.5 pr-7 text-xs shadow-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
    active ? 'border-primary text-foreground' : 'border-input text-muted-foreground'
  }`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="relative inline-flex items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectChevron() {
  return (
    <ChevronDown
      className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground opacity-50"
      aria-hidden="true"
    />
  );
}

export function UnitFilterRow({
  units,
  state,
  onChange,
  onClear,
  shownCount,
  inert = false,
}: {
  /** The full (unfiltered) live unit list — options derive from what's present. */
  units: FilterableUnit[];
  state: UnitFilterState;
  onChange: (next: UnitFilterState) => void;
  onClear: () => void;
  shownCount: number;
  /**
   * True for the SSR/skeleton twin rendered inside an `inert aria-hidden`
   * wrapper: every focusable control also carries tabindex="-1" so no
   * focusable element ever sits inside aria-hidden markup, even for
   * browsers/scanners that don't honor the `inert` attribute.
   */
  inert?: boolean;
}) {
  const twinTabIndex = inert ? -1 : undefined;
  const beds = bedsOptions(units);
  const baths = bathsOptions(units);
  const bounds = sqftBounds(units);
  const active = hasActiveUnitFilters(state);

  const setMoveIn = (value: string) => {
    let moveIn: MoveInFilter;
    if (value === 'now') moveIn = { kind: 'now' };
    else if (value === '30' || value === '60') moveIn = { kind: 'days', days: Number(value) };
    else if (value === 'date') moveIn = { kind: 'date', date: '' };
    else moveIn = { kind: 'any' };
    onChange({ ...state, moveIn });
  };

  const parseBound = (raw: string): number | null => {
    const n = Number(raw);
    return raw.trim() !== '' && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  };

  return (
    <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-y border-border py-2.5">
      <Field label="Move-in">
        <span className="relative inline-flex">
          <select
            aria-label="Move-in date filter"
            tabIndex={twinTabIndex}
            value={moveInValue(state.moveIn)}
            onChange={(e) => setMoveIn(e.target.value)}
            className={selectClass(state.moveIn.kind !== 'any')}
          >
            {MOVE_IN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <SelectChevron />
        </span>
      </Field>

      {state.moveIn.kind === 'date' && (
        <Field label="By">
          <input
            type="date"
            aria-label="By this date — show units available by this date"
            tabIndex={twinTabIndex}
            value={state.moveIn.date}
            onChange={(e) => onChange({ ...state, moveIn: { kind: 'date', date: e.target.value } })}
            className="h-9 rounded-md border border-primary bg-background px-2 text-xs shadow-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </Field>
      )}

      {beds.length > 1 && (
        <Field label="Beds">
          <span className="relative inline-flex">
            <select
              aria-label="Beds filter — bedroom type"
              tabIndex={twinTabIndex}
              value={state.beds ?? 'all'}
              onChange={(e) => onChange({ ...state, beds: e.target.value === 'all' ? null : e.target.value })}
              className={selectClass(state.beds !== null)}
            >
              <option value="all">All</option>
              {beds.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </span>
        </Field>
      )}

      {baths.length > 1 && (
        <Field label="Baths">
          <span className="relative inline-flex">
            <select
              aria-label="Baths filter — number of bathrooms"
              tabIndex={twinTabIndex}
              value={state.baths === null ? 'all' : String(state.baths)}
              onChange={(e) =>
                onChange({ ...state, baths: e.target.value === 'all' ? null : Number(e.target.value) })
              }
              className={selectClass(state.baths !== null)}
            >
              <option value="all">All</option>
              {baths.map((b) => (
                <option key={b} value={String(b)}>
                  {b}
                </option>
              ))}
            </select>
            <SelectChevron />
          </span>
        </Field>
      )}

      {bounds && (
        <Field label="Sq ft">
          <span className="inline-flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              aria-label="Sq ft minimum"
              tabIndex={twinTabIndex}
              placeholder={String(bounds[0])}
              min={bounds[0]}
              max={bounds[1]}
              value={state.sqftMin ?? ''}
              onChange={(e) => onChange({ ...state, sqftMin: parseBound(e.target.value) })}
              className={`h-9 w-[4.5rem] rounded-md border bg-background px-2 text-xs shadow-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                state.sqftMin !== null ? 'border-primary' : 'border-input'
              }`}
            />
            <span className="text-xs text-muted-foreground" aria-hidden="true">
              –
            </span>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Sq ft maximum"
              tabIndex={twinTabIndex}
              placeholder={String(bounds[1])}
              min={bounds[0]}
              max={bounds[1]}
              value={state.sqftMax ?? ''}
              onChange={(e) => onChange({ ...state, sqftMax: parseBound(e.target.value) })}
              className={`h-9 w-[4.5rem] rounded-md border bg-background px-2 text-xs shadow-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                state.sqftMax !== null ? 'border-primary' : 'border-input'
              }`}
            />
          </span>
        </Field>
      )}

      {active && (
        <span className="inline-flex items-center gap-3">
          {/* Screen-reader live region: filtering re-renders this count and
              role="status" (polite) announces it without moving focus. */}
          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            {shownCount} {shownCount === 1 ? 'residence' : 'residences'} shown
          </span>
          <button
            type="button"
            tabIndex={twinTabIndex}
            onClick={onClear}
            className="inline-flex min-h-9 items-center gap-1 text-xs uppercase tracking-wide text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
          </button>
        </span>
      )}
    </div>
  );
}
