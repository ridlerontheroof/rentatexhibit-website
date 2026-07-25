# Highland Listings Facelift — Install Guide

A paste-in stylesheet that reskins the AppFolio listings widget on
highlandptrs.com's Chicago availability page toward the Exhibit design
language, adapted to Highland navy. No other page or widget is affected.

**What's in this kit**

| File | Purpose |
|---|---|
| `highland-listings.css` | Widget stylesheet — paste into the listings widget's **CSS tab** |
| `head-html.html` | Site-wide fonts & typography — paste into **Settings → Head HTML** |
| `preview/side-by-side.png` | Before/after mock for review |
| `preview/before.html` / `after.html` | The local mock pages behind the screenshots |

## 1. Where to paste it (verified against the live editor)

The AppFolio websites editor exposes two injection points:

**A. The listings widget's CSS tab** — on the availability page, open
the listings widget's HTML/CSS editor (the popup with **HTML** and
**CSS** tabs at the top).

1. Click the **CSS** tab (do NOT edit the HTML tab).
2. Paste the **entire contents** of `highland-listings.css` (including
   the comment banners — they mark the block for future rollback).
3. Click **Update**, then Preview / Republish.

**B. Settings → Head HTML** — site-wide typography.

1. In the left sidebar open **Settings → Head HTML**.
2. Paste the **entire contents** of `head-html.html` (it loads the
   Barlow Semi Condensed font and applies the uppercase/tracking/
   light-weight treatment the Theme panel can't).
3. Save and Republish.

**C. Theme panel fonts** — in **Theme → Text**, set every style to
**Barlow Semi Condensed** with sizes: DFLT 14, PAR 15, H1 34, H2 28,
H3 22, H4 18, H5 16, H6 14. (Weights, uppercase, and letter-spacing
come from the Head HTML block above.)

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

- **Widget:** open the listings widget's HTML/CSS editor, go to the
  **CSS** tab, delete the pasted block (everything between the
  `HIGHLAND PARTNERS — AppFolio Listings Widget Facelift` banner and
  the `End Highland facelift` banner), click Update, republish. The
  widget instantly returns to its stock AppFolio appearance.
- **Typography:** delete the pasted block from **Settings → Head
  HTML** and republish; site fonts return to the Theme panel settings.
Nothing else on the site is touched.
