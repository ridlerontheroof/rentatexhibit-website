---
name: SSR-reserved inert control rows
description: How client-only UI rows (e.g. the available-units filter row) reserve their space at first paint without leaking into markdown twins.
---

Client-only interactive rows must reserve their height in the prerender or they blow desktop CLS.

**Why:** the available-units filter row originally mounted post-hydration only ("prerendered HTML byte-identical"). Mobile lab CLS stayed within budget (slow paint), but desktop paints early so the late insertion shifted the whole unit list — CLS 0.402 vs the 0.1 budget. Layout-effect timing doesn't help: any insertion after the prerendered frame paints counts as a shift.

**How to apply:** render the same component inert + `aria-hidden="true"` during SSR and pre-hydration frames (real data, default state) and swap the interactive version in place post-hydration. Geometry tracks automatically at every breakpoint (same trick as the units skeleton). The markdown-twin converter (`scripts/html-to-markdown.mjs`) skips `aria-hidden="true"` nodes, so twins stay clean; `inert` keeps controls unfocusable so a11y scanners stay quiet. After the fix: desktop CLS 0.039, mobile 0.085, both within budget.
