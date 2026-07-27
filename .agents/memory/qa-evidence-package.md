---
name: QA evidence package
description: How the reports/ QA evidence package stays internally consistent
---
The final QA evidence lives in `artifacts/exhibit-on-superior/reports/` and regenerates via `scripts/generate-qa-evidence.mjs` (crawl CSV, headers.md, structured-data.md, performance.md).

**Rule:** never hand-write evidence that summarises machine-generated data — derive it in the script from the source files (perf/baseline.json, perf/latest.json, live sitemap, legacyRedirects.ts).

**Why:** the `perf` workflow re-ran mid-package and rewrote perf/latest.json (introducing a lab-variance threshold miss); a hand-written performance summary citing the older run made the package inconsistent and the completion review rejected it.

**How to apply:** after any perf run or publish, re-run the generator; document threshold misses with a disposition (lab variance band ±10%) instead of claiming all-pass. Also revert runtime drift in src/data/availabilitySnapshot.json (updatedAt-only) before completing.
