---
name: Post-hydration UI inserts need an inert SSR placeholder
description: Any control that mounts only after hydration above in-viewport content causes big CLS; reserve space with an inert aria-hidden twin.
---

Rule: a component that renders only after hydration (e.g. inside the `allRows`/DeferBelowFold-style transition) and sits ABOVE content visible in the viewport will push that content down and blow the desktop CLS budget (saw 0.40 from the unit-filter row inserting above the available-units list).

**Why:** prerendered HTML lacks the control; the post-hydration transition inserts it, shifting everything below. Heavy hydration work can hide the shift from Lighthouse (it lands after the trace), so removing unrelated heavy content can *surface* a pre-existing shift.

**How to apply:** render the same component inert during SSR + pre-transition client render — `<div inert aria-hidden="true" className="pointer-events-none select-none">` wrapping the real component with default state and no-op handlers — then swap to the interactive one. Geometry matches automatically. `aria-hidden` also keeps it out of the markdown twins (scripts/html-to-markdown.mjs skips aria-hidden nodes) and assistive tech. Same pattern the units skeleton uses.
