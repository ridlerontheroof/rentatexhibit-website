# UTM Attribution & Analytics Playbook — Woods Crossing

How campaign attribution and analytics were wired on Exhibit On Superior, verified live
against production. Replicate this pipeline on the Woods Crossing site.

## 1. Visit-scoped attribution pipeline (landing URL → AppFolio lead source)

Flow: landing URL → captured ONCE on boot into sessionStorage → injected into every
lead/showing request AND every Apply/tour deep link → server re-validates → AppFolio
guest-card `source`.

**Capture priority (order matters, confirmed against live Google Ads campaigns):**
1. `?source=<token>` — the live ad campaigns tag final URLs with a ready-made token
   (e.g. `?source=GoogleAds_UT-SLC_Apartments`), NOT UTM params. Pass a label-safe token
   through verbatim.
2. UTM params (`utm_source`/`utm_campaign` → composed token).
3. Click IDs — `gclid`/`gbraid`/`wbraid` → generic `Website (GoogleAds)`. Google
   auto-tagging sends NO utm_source, so without this rung auto-tagged traffic looks organic.

**Label convention (owner-mandated, do not restyle):** exactly `Website (Token)`,
Token = alphanumerics/hyphens/underscores only, no spaces inside the parens.
Default fallback for Woods Crossing: `Website (WoodsCrossing)` (confirm wording with owner).
Server-side `sanitizeLeadSource()` (strict regex + hard default) is the trust boundary;
client sanitization is convenience only. The label renders on AppFolio lead screens and
leasing emails — one consistent, filterable prefix.

**Traps:**
- Registrar/DNS-forwarding apex→www 301s STRIP the query string. All ad final URLs must
  use `https://www.` directly or attribution is lost before the page loads.
- Unregistered source tokens are fine — AppFolio accepts any string (verified live).
- Verify labels landed via the guest_cards Reports API (`POST /api/v2/reports/guest_cards.json`).
- Any new lead pathway (hidden channel landing pages, etc.) must reuse the same
  visit-source module — never invent a second capture path.

## 2. GA4 + GTM event routing (the silent-drop trap)

Verified live with headless-chromium tests capturing `/g/collect` hits:

- **GTM never installs `window.gtag`** and ignores gtag() commands queued into dataLayer
  by a page stub — even `gtag('config', …)`. A stub-only setup silently drops every custom
  event while GTM's own events (page_view, form_start) still flow, so the breakage is
  invisible unless you test.
- **Fix:** the page self-loads real `gtag.js` and calls
  `gtag('config', '<G-ID>', { send_page_view: false })`. If only a GTM ID is known, the
  GA4 stream ID is public — grep `G-[A-Z0-9]+` out of `googletagmanager.com/gtm.js?id=GTM-…`.
- **Every custom event needs an explicit `send_to`** when GTM is also on the page, or the
  default fan-out drops it even after config.
- **page_views are stream-owned in GTM mode:** GTM's Google tag sends the initial one and
  enhanced measurement covers SPA navigations. Manual page_views DOUBLE every SPA nav —
  suppress them, but keep updating SPA path history for lead attribution.
- Verify by parsing `en=` from `/g/collect` POST bodies (batched events are
  newline-separated). Test `generate_lead` without creating a real lead by route-mocking
  the leads API with a 201.

## 3. Deferred tag loading (analytics without wrecking mobile scores)

Eager GTM cost ~20+ mobile Lighthouse points on Exhibit (gtm.js ~112KB + ~180ms eval;
gtag alone adds a fixed ~150ms TBT floor).

- Inline snippet initializes `dataLayer` immediately (pre-load pushes queue and deliver),
  then loads gtm.js on first real gesture (pointerdown/touchstart/keydown — **never
  `scroll`**, scroll anchoring fires it synthetically), or shortly after the `load` event,
  or an absolute fallback timer — whichever fires first. Bounces are still covered.
- The same deferral applies to the self-loaded gtag.js: its `gtag()` stub queues events,
  so deferring the script loses nothing.
- New-property gotcha: a freshly created GTM container published EMPTY loads fine but can
  never send a collect hit — confirm a GA4 tag actually exists in the container before
  concluding the site integration is broken.

## 4. Tags vs a hashed Content-Security-Policy

If the site enforces a hash-only inline-script CSP (recommended over 'unsafe-inline'):
- GTM Custom HTML tags inject inline scripts at runtime that the build-time hash walk
  can't see — keep an explicit constant of their sha256 hashes next to the CSP definition.
  When a CSP check fails naming a missing hash, the GTM container changed a tag: inspect
  the blocked script's textContent in the DOM, then update the constant.
- Google Ads conversion tags load scripts from `googleads.g.doubleclick.net` and
  `www.googleadservices.com` — both need script-src entries (connect-src alone fails).
- Beacon hosts for connect-src: `www.google.com` (/g/collect, /ccm/collect),
  `analytics.google.com`, doubleclick stats/ad hosts.

## 5. GA4 reporting (server-side)

`GA4_SERVICE_ACCOUNT_JSON` + `GA4_PROPERTY_ID` power Data API reporting (lead-volume
alerts, dashboards). Reuse the same service account for Woods Crossing by granting it
Viewer on the NEW GA4 property; never mix two properties' traffic in one stream.
