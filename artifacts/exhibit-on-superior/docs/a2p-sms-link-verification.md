# A2P registration — carrier SMS Terms link verification log

The SimpleVoIP A2P campaign registration points at the privacy-policy page's
`#sms-terms` anchor. The prerender guard
(`src/prerender-privacy-policy-anchors.test.ts`) protects the built HTML;
this log records post-publish smoke checks against the **live serving
layer**, for the A2P registration audit trail.

Registered anchor URL (production): https://www.rentatexhibit.com/privacy-policy#sms-terms

## Verification log

### 2026-08-19 — PASS

- Live build verified: `build-id.json` → `buildId: mt0ai6qw-7928149d`,
  built/published 2026-08-19T16:12:22Z (page "Last updated: August 18, 2026").
- `GET https://www.rentatexhibit.com/privacy-policy` → HTTP 200 through the
  production serving layer (no redirect hops on the canonical www URL).
- Prerendered live HTML contains exactly one `id="sms-terms"` and one
  `id="messaging-privacy-policy"` anchor, with the visible headings
  "SMS Terms & Conditions" and "Messaging Privacy Policy" both present.
- Hash landing: the anchor id is present in the server-delivered HTML, so
  the browser's native fragment scroll targets the SMS Terms section, and
  the SPA's scroll-to-top handler explicitly skips scrolling whenever
  `window.location.hash` is set (`App.tsx` ScrollToTop), so hydration does
  not override the landing position.
- Note: the check request referenced `exhibit-on-superior.com`, which is not
  a registered domain (DNS does not resolve). The production domain for the
  registered link is `www.rentatexhibit.com`.

<!-- Append new post-publish verifications above this line's section style:
     date, PASS/FAIL, buildId + builtAt, and what was observed. -->
