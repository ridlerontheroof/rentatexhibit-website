---
name: Tailwind v4 unlayered component classes beat utilities
description: Why utility overrides silently fail on this project's custom .btn-* classes, and the fix.
---

# Tailwind v4: unlayered custom classes override utilities

In `exhibit-on-superior`, custom component classes (e.g. `.btn-gold-outline`, `.btn-dark-outline`) are defined in `src/index.css` **outside any `@layer`** (plain unlayered rules). Tailwind is pulled in via `@import 'tailwindcss'`, which puts its utilities in cascade layers.

**Rule:** unlayered CSS always wins over layered CSS, regardless of source order or specificity. So a utility like `bg-black/50` added in JSX will NOT override the component class's `@apply ... bg-transparent`. The override silently no-ops.

**Why it looked intermittent:** it never actually worked — a darker patch of the background image can make it *look* applied in one screenshot but not another.

**How to apply:** to override a property that an unlayered `.btn-*` class already sets, use the Tailwind v4 important modifier (trailing `!`), e.g. `bg-black/50!` / `hover:bg-black/70!`. Alternatively edit the component class itself, or move the custom classes into `@layer components`.
