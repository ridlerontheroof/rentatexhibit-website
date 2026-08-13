---
name: Blog content engine (/blog)
description: Durable editorial/publishing decisions for the blog article pipeline.
---
**Rule:** Blog publishing is always a human-reviewed code change — an article ships as `draft: true` (invisible on every surface) and going live requires flipping the flag AND adding its artifact.toml rewrite pair; build guards enforce both. AI drafting (follow-up work) must never publish on its own.

**Why:** Fact-discipline risk on a leasing site; a wrong fee or sqft in an AI draft reaching production erodes trust and can create fair-housing/advertising liability. Reviewer also rejected uncited external claims — third-party facts (Walk Score, CTA travel times, ComEd) must cite the owning domain, and general advice must be attributed to the on-site team, not asserted as market fact.

**How to apply:** when authoring or generating blog content, keep facts to committed fact modules, attribute advice ("our leasing team recommends…"), and cite the owning domain for any external claim — the blog guard suite maps claim patterns to required citation domains.
