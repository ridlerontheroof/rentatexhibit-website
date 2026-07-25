# Highland Listings Facelift — Install Guide

A paste-in stylesheet that reskins the AppFolio listings widget on
highlandptrs.com's Chicago availability page toward the Exhibit design
language, adapted to Highland navy. No other page or widget is affected.

**What's in this kit**

| File | Purpose |
|---|---|
| `highland-listings.css` | The stylesheet — paste this into the site editor |
| `preview/side-by-side.png` | Before/after mock for review |
| `preview/before.html` / `after.html` | The local mock pages behind the screenshots |

## 1. Where to paste it

The Highland site runs on AppFolio's website builder (built on Duda).

1. Log in to the AppFolio websites editor for highlandptrs.com.
2. Open the developer / custom-code panel:
   - In the left sidebar choose **Settings → Developer Mode** (on some
     plans it appears as **Edit HTML/CSS** under the site settings or
     the paintbrush/Design menu). It opens a code editor with a
     `global.css` tab.
3. In **global.css**, scroll to the bottom and paste the **entire
   contents** of `highland-listings.css` (including the comment
   banners — they mark the block for future rollback).
4. Save / publish. Duda applies custom CSS site-wide, but every rule in
   this file is scoped to `.listings-widget`, so only the availability
   listings are restyled.

**If Developer Mode isn't available on the plan:** open the
availability page, add an **HTML embed** element to the page header
area, and paste the CSS wrapped in `<style> … </style>` tags instead.
Same effect, page-scoped.

## 2. Widget configuration

- Keep the listings widget's **color setting at `rgba(3,49,72,1)`**
  (Highland navy — it is already set to this today). The widget uses
  it for the Apply Now button and dropdown highlights; the stylesheet
  assumes and reinforces the same navy.
- No other widget settings need to change; filter toggles work as-is.

## 3. Optional: the Exhibit typeface

The first line of the CSS `@import`s **Barlow Semi Condensed** from
Google Fonts (the typeface used on the Exhibit site). If you'd rather
not load an external font, delete that one `@import` line — everything
falls back to the site's default fonts and all other styling still
applies.

## 4. Caveats & limitations

- **AppFolio may update the widget markup.** The stylesheet targets
  the widget's current class names (`.listing-item`, `.rent`,
  `.lower-buttons`, etc.). Selectors were kept as shallow as the
  widget's own specificity allows, but a future widget update could
  change class names and quietly drop some styling. If the page ever
  looks half-styled after an AppFolio update, that's why — the CSS
  fails safe (widget still works, just partially default-looking).
- **Unit-detail pages cannot be styled.** "View Details" and "Apply
  Now" lead to pages hosted on appfolio.com; custom CSS on
  highlandptrs.com cannot reach them. Restyling those is the separate
  Phase 2 project (self-hosted availability & unit pages).
- **The widget loads listings with JavaScript.** The new look applies
  the moment cards render; there is no flash-of-old-style beyond the
  widget's normal loading state.
- Preview screenshots use placeholder photo gradients and sample
  units; real listing photos and data appear unchanged.

## 5. Rollback

Delete the pasted block (everything between the
`HIGHLAND PARTNERS — AppFolio Listings Widget Facelift` banner and the
`End Highland facelift` banner) from global.css and republish. The
widget instantly returns to its stock AppFolio appearance. Nothing
else on the site is touched.
