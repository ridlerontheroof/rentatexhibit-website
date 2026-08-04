// Shared SVG symbol sprite for the four fact icons repeated on every unit
// row of /available-units (bed, bath, ruler, paw). Inline lucide-react
// components duplicate ~600 bytes of paths per row; the sprite emits each
// icon's paths ONCE and every row references them with a 60-byte <use> —
// visually identical output (same viewBox, stroke attributes, and classes
// as lucide-react v0.545 renders).
//
// Path data: lucide (ISC license), icons bed-double / bath / ruler / paw-print.

// Path strings are copied verbatim from lucide's icon nodes (each entry is
// one <path d>), never merged: a leading lowercase "m" is only absolute at
// the start of its own path, so concatenation would corrupt the geometry.
const ICON_PATHS: Record<string, string[]> = {
  'bed-double': [
    'M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8',
    'M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4',
    'M12 4v6',
    'M2 18h20',
  ],
  bath: [
    'M10 4 8 6',
    'M17 19v2',
    'M2 12h20',
    'M7 19v2',
    'M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5',
  ],
  ruler: [
    'M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z',
    'm14.5 12.5 2-2',
    'm11.5 9.5 2-2',
    'm8.5 6.5 2-2',
    'm17.5 15.5 2-2',
  ],
};

// PawPrint uses circles + a path, so it keeps its own symbol markup.
export function UnitFactIconDefs() {
  return (
    // Inline styles (not utility classes) so the sprite never takes layout
    // space even before the stylesheet applies — the fold guard measures the
    // first unit row's position and a transient line box here shifts it.
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {Object.entries(ICON_PATHS).map(([id, ds]) => (
          <symbol key={id} id={`ufi-${id}`} viewBox="0 0 24 24">
            {ds.map((d) => (
              <path key={d} d={d} />
            ))}
          </symbol>
        ))}
        <symbol id="ufi-paw-print" viewBox="0 0 24 24">
          <circle cx="11" cy="4" r="2" />
          <circle cx="18" cy="8" r="2" />
          <circle cx="20" cy="16" r="2" />
          <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
        </symbol>
      </defs>
    </svg>
  );
}

export type UnitFactIconName = 'bed-double' | 'bath' | 'ruler' | 'paw-print';

/** Drop-in replacement for the lucide icon components on unit rows. */
export function UnitFactIcon({ name, className }: { name: UnitFactIconName; className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#ufi-${name}`} />
    </svg>
  );
}
