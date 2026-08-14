# Woods Crossing design comps — porting notes

Three homepage design directions built as React components, ready to carry into the new
Woods Crossing project. `DIRECTIONS.md` has the full rationale per direction (palette, type
pairing, tradeoffs, when to pick it). `Board.tsx` renders all three side by side with labels.

## Contents
- `components/WasatchWarm.tsx` — warm outdoorsy direction (Fraunces + DM Sans)
- `components/CleanContemporary.tsx` — airy sage/ivory direction (Outfit + DM Sans)
- `components/BoldFriendly.tsx` — navy/yellow/coral direction (Bricolage Grotesque + DM Sans)
- `components/Board.tsx` — side-by-side comparison view
- `components/_shared/content.ts` — real property facts, copy, floor plans, and photo map
- `images/` — the 15 property photos and floor-plan images the comps reference

## Requirements in the new project
- **React + Tailwind CSS** — layout/styling is Tailwind utility classes.
- **lucide-react** — icons (`MapPin`, `Phone`, `Star`, etc.).
- **Google Fonts** — each comp `@import`s its own fonts inline; move those imports into the
  site-wide stylesheet when a direction is chosen.

## One required edit
`_shared/content.ts` builds image URLs with:

```ts
const img = (f: string) => `/__mockup/images/woods-crossing/${f}`;
```

That path is specific to the preview sandbox. In the new project, copy `images/` into the
public assets directory and update the `img()` helper to point there
(e.g. `/assets/source/${f}` to match the bundle's existing asset layout).

## Caveats
- These are homepage comps, not production pages: no routing, no forms wiring, no
  SEO head tags. Use the winning comp as the visual spec and build real pages per
  `docs/SEO_AEO_PLAYBOOK.md` and `docs/URL_PARITY_MAP.md`.
- Facts (rents, availability, pet policy) come from the Aug 6, 2026 scrape — confirm against
  `docs/MISSING_AND_UNCERTAIN_FACTS.md` before launch.
