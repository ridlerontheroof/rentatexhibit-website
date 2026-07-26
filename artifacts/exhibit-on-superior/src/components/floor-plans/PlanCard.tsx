import { Maximize2, Accessibility } from 'lucide-react';
import { adaUnitsForGroup, type PlanGroup } from '../../data/floorPlans';

interface PlanCardProps {
  group: PlanGroup;
  onOpen: (group: PlanGroup) => void;
  /** When true (ADA filter active), list the designated (A)/(AC) apartments. */
  showAda?: boolean;
}

export function PlanCard({ group, onOpen, showAda = false }: PlanCardProps) {
  const adaUnits = showAda ? adaUnitsForGroup(group) : [];
  const sqftLabel =
    group.sqftMin === group.sqftMax
      ? `${group.sqftMin.toLocaleString()} sq ft`
      : `${group.sqftMin.toLocaleString()}\u2013${group.sqftMax.toLocaleString()} sq ft`;

  return (
    <button
      type="button"
      onClick={() => onOpen(group)}
      className="group flex flex-col text-left border border-border bg-white transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* No aria-label: the accessible name is the card's own visible text
          (unit badge + plan type + square footage), which keeps the label
          matching what sighted users see (WCAG label-in-name). */}
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <img
          src={group.images.thumb}
          alt=""
          loading="lazy"
          width={600}
          height={450}
          className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" />
        </span>
        <span className="absolute left-0 top-3 bg-primary px-3 py-1 text-xs uppercase tracking-wider text-white">
          Unit {String(group.unit).padStart(2, '0')}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg uppercase tracking-wider text-foreground">{group.typeLabel}</h3>
        <p className="mt-1 text-2xl font-semibold text-primary">{sqftLabel}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {group.bands.map((band) => (
            <span
              key={band.id}
              className="border border-border px-2.5 py-1 text-xs uppercase tracking-wide text-muted-foreground"
            >
              Flr {band.label}
            </span>
          ))}
        </div>

        {adaUnits.length > 0 && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
              <Accessibility className="h-4 w-4 text-primary" aria-hidden="true" />
              ADA-designated apartments
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {adaUnits.map((u) => (
                <span
                  key={u.unit}
                  className="border border-primary/40 px-2 py-0.5 text-xs tracking-wide text-muted-foreground"
                >
                  {u.unit} ({u.designation})
                </span>
              ))}
            </div>
          </div>
        )}

        <span className="mt-4 inline-block text-sm uppercase tracking-wider text-primary underline-offset-4 group-hover:underline">
          View floor plan
        </span>
      </div>
    </button>
  );
}
