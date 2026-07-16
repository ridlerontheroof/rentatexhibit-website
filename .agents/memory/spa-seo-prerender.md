---
name: exhibit-on-superior SPA has no per-page HTML for crawlers
description: Why deep-route SEO/social meta silently fails and what fixes it.
---

# SPA serves home meta on every deep route

`exhibit-on-superior` is a client-rendered Vite + wouter SPA using react-helmet-async. Only `index.html` (home) has hardcoded meta. Every other route's **initial HTML** contains the home `<title>`, an empty meta description, and **zero** JSON-LD — the per-page tags in `src/data/seo.ts` are injected only after JS hydration.

**Why it matters:** Googlebot renders JS eventually, but Facebook/LinkedIn/Slack/X link-preview scrapers and most AI/answer-engine crawlers do NOT execute JS. So deep-page link previews fall back to home content and all per-page JSON-LD is invisible to them. The strong SEO data layer (titles, descriptions, canonicals, ApartmentComplex/FAQ/Breadcrumb schema) never reaches non-JS clients.

**How to verify:** `curl` a deep route (e.g. `/amenities`) and check the raw `<title>` and count of `application/ld+json` blocks — you'll get the home title and 0 schema blocks.

**Fix (the highest-leverage SEO item):** add build-time prerendering / SSG so each indexable route in `PAGE_SEO` emits its own fully-formed static HTML (title, description, canonical, OG/Twitter, JSON-LD, visible content). Generate `sitemap.xml` from `PAGE_SEO` in the same step so it can't drift (and exclude external-redirect routes like `/available-units`). Full audit lives in `artifacts/exhibit-on-superior/SEO_PLAN.md`.
