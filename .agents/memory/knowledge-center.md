---
name: Knowledge Center article system
description: Durable rules for the /knowledge answer-first Q&A pages.
---

The Knowledge Center follows the per-unit-page pattern: articles are pure content data rendered through a dynamic route, with paths exported from entry-server for the prerenderer. Build guards enforce the contract (answer under 100 words, FAQPage + Breadcrumb JSON-LD, question in title/H1, self-canonical), so trust the build to catch structural regressions.

**Rules:**
- Clean URLs need artifact.toml rewrites; a prerender parity guard fails the build when slugs and rewrites drift (both missing and stale directions), and a `/knowledge/*` fallback serves a noindex not-found stub so unknown slugs never soft-404 as homepage HTML.
- `llms.txt`'s Knowledge section and `llms-full.txt` are regenerated deterministically each build — never hand-edit them.
- Content accuracy rule: facts only from the leasing questionnaire + published copy; unpinned facts (ADA plan list, breed list, EV charger locations, short-term pricing, smoking policy) defer to the leasing office.
- **Why:** invented facts on AI-crawlable answer pages get quoted verbatim by assistants; drifted rewrites silently serve homepage meta to non-JS crawlers.
- Visible breadcrumbs must mirror the BreadcrumbList JSON-LD exactly (same final crumb text).
- Per user request (July 2026): no "Highland Partners"/"Highland Management" company names anywhere in site copy or fact sheets — say "on-site management team" (functional highlandptrs.com / appfolio URLs stay).
