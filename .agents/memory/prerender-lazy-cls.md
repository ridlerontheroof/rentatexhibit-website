---
name: Prerender + lazy routes CLS trap
description: Why the site scored 0.31 CLS in GSC and how boot-order preloading fixed it; how to measure CLS locally.
---

**Rule:** With build-time prerendered HTML plus `React.lazy` route chunks and a plain `createRoot().render()`, the first client render replaces the full prerendered page with the Suspense fallback until the route chunk downloads — the footer jumps thousands of px (GSC measured 0.31 CLS site-wide, desktop). Boot must `await preloadRoute(location.pathname)` (routes.tsx) before rendering; App's route components prefer the preloaded component over the lazy wrapper so the first commit is synchronous.

**Why:** Google Core Web Vitals "CLS > 0.25 desktop" flagged all 19 URLs (July 2026); reproduced locally as a single footer shift at ~700ms; fix measured 0.00.

**How to apply:** Any new route must stay in `routes.tsx` (the preload map keys off it). Don't switch back to bare `render()` without hydration. Secondary guard: `useAvailability` falls back to the fresh baked snapshot on fetch error so the prerendered units section (~1,100px) never collapses.

**Measuring CLS locally:** playwright-core from `.agents/skills/playwright-skill/node_modules` (CJS — default-import) + nix chromium; PerformanceObserver `layout-shift` with buffered:true; run against `vite preview --port 4173` (note: no /api proxy there, so availability errors are expected locally).
