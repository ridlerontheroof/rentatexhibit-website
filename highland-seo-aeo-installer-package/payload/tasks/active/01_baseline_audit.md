# Task 01 — Baseline SEO/AEO Audit

## Mode
Read-only.

## Objective
Produce a source-backed baseline audit of the current website and repository without modifying production code or public content.

## Dependencies
- Root `AGENTS.md`
- Verified or clearly marked draft `config/property_context.yaml`
- Repository access
- Approved public-domain access if crawling is required

## Scope

Inspect:
- framework and package manager;
- route architecture;
- rendering model;
- content source;
- titles and meta descriptions;
- H1 and heading structure;
- canonicals;
- robots and sitemap;
- status and redirect behavior;
- structured data;
- Open Graph;
- images and alt text;
- internal links;
- floor-plan and unit architecture;
- availability feed;
- forms and conversion actions;
- analytics;
- mobile and accessibility risks;
- performance risks;
- AEO/entity consistency.

## Required Deliverables

Create:
- `reports/audits/baseline-audit.md`
- `reports/audits/url-inventory.csv`
- `reports/audits/schema-inventory.csv`
- `reports/audits/metadata-inventory.csv`
- `docs/REPOSITORY_COMMANDS.md` with verified commands

## Prioritization

Classify findings:
- P0: blocks crawling, indexing, lead capture, or deployment
- P1: high business impact
- P2: material improvement
- P3: cleanup or future opportunity

## Prohibitions

- Do not rewrite pages.
- Do not change routes.
- Do not add dependencies.
- Do not alter schema.
- Do not deploy.
- Do not infer current rent, availability, concessions, or fees.

## Acceptance Criteria

- Every finding includes evidence.
- Confirmed defects are separated from recommendations.
- Uncertain facts are labeled.
- Risks to analytics and leasing integrations are documented.
- No production files are changed.
