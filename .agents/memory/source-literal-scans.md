---
name: Source-literal fact scans
description: Gotchas when guard tests scan .ts/.tsx source files for hand-typed fact literals
---
Guard tests that scan raw TypeScript source (walkScores / propertyFacts pattern) for fact literals:

**Rule:** decode `\uXXXX` escape sequences before regex-matching — seo.ts and page strings use `\u2013`/`\u2019` escapes, so raw source shows `899\u20131,135` and a naive number regex matches the wrong token (`135` instead of `1,135`).

**Why:** hit this building the propertyFacts guard; without unescaping, en-dash-separated ranges and curly quotes split matches and produce false positives/negatives.

**How to apply:** run `s.replace(/\\u([0-9a-fA-F]{4})/g, ...)` on each source before scanning; also exclude phone numbers (312-450-0635) and Tailwind shade classes (gray-700) when scanning for 3-digit facts like credit scores.
