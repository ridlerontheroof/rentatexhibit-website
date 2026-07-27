# Accessibility report — QA evidence

Date of package: July 27, 2026

## Source of truth

The full accessibility QA pass is documented in
[`docs/a11y-audit-2026-07.md`](../docs/a11y-audit-2026-07.md). This report
summarises its findings and the keyboard test results as final QA evidence.

## Automated scan results

- Tooling: axe-core 4.12 via headless Chromium (`pnpm run check:a11y`, or
  `check:a11y:built` against the production build) — repeatable at any time;
  fails the run on any critical or serious violation.
- Pages scanned: `/`, `/available-units`, a live unit page, `/photo-gallery`,
  `/virtual-tour`, `/contact-us`, `/schedule-showing`, `/schedule-a-tour`,
  `/knowledge/how-much-is-rent`.
- Result: **zero violations of any severity** (including moderate/minor) at
  the end of the pass, with two documented rule exclusions:
  - `color-contrast` — palette verified against WCAG AA in an earlier
    dedicated contrast task; axe's flat-color heuristic false-flags the
    brand-gold accents.
  - `video-caption` — captions are managed inside the third-party
    Vimeo/YouTube players, not this codebase.

## Keyboard-only run-throughs (real browser, keyboard input only)

| Flow | Result |
| --- | --- |
| Browse → unit page → schedule showing | ✅ PASS — visible focus indicators throughout; per-field errors with `aria-invalid` + `aria-describedby` |
| Contact form | ✅ PASS — logical tab order, labelled fields, specific per-field errors (real submissions intentionally not sent) |
| Photo-gallery lightbox | ✅ PASS — focus trapped, arrows navigate, Escape closes and restores focus to the opening thumbnail |
| Forms at 200% zoom | ✅ PASS — fluid single-column layouts, no horizontal scroll, all controls operable |

## Key fixes shipped during the pass

- Gallery lightbox converted to a real modal dialog (focus-in, trap, restore).
- Focus-trap bug fixed in both lightboxes (hidden "?" shortcuts button let Tab
  escape the dialog) — verified with a real-browser CDP probe.
- Hero carousel gained an explicit Pause/Play control (WCAG 2.2.2).
- Body-copy links are always underlined (no colour-only links, WCAG 1.4.1).

## Regression protection

- `src/pages/photo-gallery-focus.test.tsx` — dialog semantics + focus trap.
- `src/components/hero-slider-pause.test.tsx` — pause control behaviour.
- `forms-error-a11y.test.tsx` / `forms-thankyou-a11y.test.tsx` — form error
  and confirmation announcement wiring.
- The axe scan itself is a re-runnable check (`pnpm run check:a11y`).
