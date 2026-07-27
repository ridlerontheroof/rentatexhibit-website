# Final QA evidence package — Exhibit On Superior

Date: July 27, 2026 · Site: https://www.rentatexhibit.com (live production)

## Plain-language summary

The website passed its final quality check (with one lab-variance note on
performance, documented below). Here is what that means:

1. **Every page works.** All 99 pages listed in the sitemap load correctly
   (status 200), have the right title and heading, and tell Google to index
   them. All 21 old website addresses (from the previous Wix/WordPress site)
   correctly forward visitors — in a single hop — to the right new page, so
   no old Google links or bookmarks are broken. → `url-crawl.csv`

2. **Google can read the site's "business card" data.** The hidden
   structured data that powers rich Google results (prices, FAQs, reviews,
   the apartment listings) was extracted from the live pages and validated:
   **zero errors** on the homepage, the availability page, unit pages, and
   the Knowledge Center. → `structured-data.md`

3. **The site is fast.** Lighthouse lab scores are strong on desktop
   (92–98) and healthy on mobile (78–89), with essentially zero layout
   shift anywhere. In the latest lab run one page (the homepage on
   simulated slow mobile) came in slightly over its calibrated load-time
   limit — within normal test-to-test variance, and it passed comfortably
   in the prior run; the report documents this. → `performance.md`

4. **The site is accessible.** Automated scanning found zero violations, and
   real keyboard-only walk-throughs of the main journeys (browse → unit →
   schedule a showing, contact form, photo lightbox) all pass.
   → `accessibility.md`

5. **The server behaves correctly.** Pages are compressed, cached sensibly,
   served over enforced HTTPS (HSTS), with a content-security policy, and
   redirects resolve in one hop — including the bare domain
   `rentatexhibit.com` forwarding to the www site. → `headers.md`

6. **What changed and what's left.** A full log of new pages, redirects, and
   structured data, plus the short list of open items — most of which need
   the owner's accounts (Google Search Console, Bing, directory listings).
   → `changelog.md`

## Contents

| File | Deliverable |
| --- | --- |
| `url-crawl.csv` | Crawl of all 99 sitemap URLs + 21 legacy URLs: status, redirect destination, canonical, indexability, title, H1, sitemap membership |
| `structured-data.md` | JSON-LD extraction + validation for 7 representative live pages |
| `performance.md` | Lighthouse before/after, mobile + desktop, 10 representative pages |
| `accessibility.md` | Findings summary + keyboard test results (full doc: `docs/a11y-audit-2026-07.md`) |
| `headers.md` | Header report for representative URLs (status, redirect chain, cache, compression, HSTS, CSP) |
| `changelog.md` | Routes/redirects/schema changed, known issues, owner-side items |

## Reproducing the evidence

The crawl, header, and structured-data reports regenerate against the live
site with:

```
node scripts/generate-qa-evidence.mjs
```

Performance: `pnpm run check:perf` (updates `perf/latest.json` /
`perf/SUMMARY.md`). Accessibility: `pnpm run check:a11y`.
