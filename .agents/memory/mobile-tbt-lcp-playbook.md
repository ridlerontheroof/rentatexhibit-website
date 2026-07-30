---
name: Mobile TBT/LCP playbook
description: Durable decisions for keeping mobile Lighthouse TBT/LCP within limits on this site.
---

- Shared site-wide components must not statically import heavy data modules — split a tiny path/lookup module out and keep the content behind the page's lazy chunk. **Why:** one import drags the whole module into every page bundle.
- TBT counts single >50 ms tasks, not total JS. Below-fold sections mount client-side inside `startTransition` (`DeferBelowFold` + `content-visibility: auto`) so React time-slices the work. This is safe here because the app boots with `createRoot` (render-replace), so there is no hydration-mismatch risk.
- Eager non-hero images get `fetchPriority="low"` (hero stays `high`). **Why:** they otherwise race the hero for Slow-4G bandwidth and make page LCP bimodal.
- Third-party analytics loads on real user gestures, tab-backgrounding, or shortly after `load` — never eagerly, and never on `scroll` (scroll anchoring fires it synthetically when deferred content mounts). Applies to every injection point (inline GTM bootstrap AND analytics module); the `gtag()` stub queues events so deferral loses nothing, and the visibility-hidden trigger preserves short-bounce pageviews.
- Offscreen third-party CDN images need an IntersectionObserver facade; `loading="lazy"` alone still downloads them at startup on slow connections. SSR keeps emitting the plain lazy `<img>` for crawlers.
- Any fetch error path that throws on `!response.ok` must `response.body?.cancel()` first. **Why:** an unread body keeps the request "in flight", the page never reaches network-quiet, Lighthouse observes to its cap, and deferred third-parties get pulled back into TBT.
- External AppFolio listing photos come in path renditions (`/medium.jpg`, `/large.jpg`, `/orig…`); render the smallest rendition that covers the displayed size and keep originals for the lightbox.

**How to apply:** profile one page (`scripts/profile-page.mjs`), look only at >50 ms long tasks and `observedTraceEnd` (pinned at the wait cap ⇒ something holds network/CPU-quiet open). Never trust suite numbers taken while any other workload runs — confirm failures solo.
