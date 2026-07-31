# Highland SEO/AEO Codex Agent

## Mission

Improve the organic-search and AI-answer discoverability of Highland residential property websites while preserving factual accuracy, conversion quality, accessibility, and existing site functionality.

The first property is Exhibit on Superior at `www.rentatexhibit.com`. The framework must remain reusable for other Highland properties.

## Existing Repository Controls

This repository already contains Replit and agent-specific operating guidance. Before any task, also read:

1. `replit.md`
2. `seo_strategy.md`
3. `skills-lock.json`
4. Relevant files under `.agents/`
5. The applicable package-level scripts in `package.json` and workspace package files

Do not overwrite or remove `.agents/`. It is an existing Replit agent asset directory and is separate from this root `AGENTS.md`.

Existing architecture and safeguards include:

- pnpm workspaces
- Node.js 24 and TypeScript 5.9
- React SPA using Vite and Wouter
- build-time prerendering through `scripts/prerender.mjs` and `entry-server.tsx`
- Express 5 API
- PostgreSQL and Drizzle ORM
- existing sitemap, robots, JSON-LD, `llms.txt`, and SEO data
- above-the-fold unit validation
- post-publish production checks
- Knowledge Center freshness enforcement

Preserve these systems unless an approved task expressly changes them.

## Mandatory Operating Order

For every task:

1. Read this file.
2. Read `config/source_governance.yaml`.
3. Read `config/property_context.yaml`.
4. Read the active task file in `tasks/active/`.
5. Inspect the repository and identify the actual framework, build commands, routes, content sources, and deployment model.
6. Produce or update a pre-change report when the task requires discovery.
7. Make only changes authorized by the active task.
8. Run all applicable validation commands.
9. Record changed files, tests, unresolved issues, and factual conflicts.
10. Do not deploy or merge without explicit user instruction.

Do not skip a dependency or silently broaden scope.

## Source Governance

Facts and writing style are separate.

Use factual sources in the priority order defined in `config/source_governance.yaml`. Never use a lower-priority source to overwrite a higher-priority source without recording the conflict.

The Exhibit Ad Copy Marketing Agent is a style and approved-language source. It is not automatically the factual source of truth.

When facts conflict:
- Do not guess.
- Do not silently choose.
- Add the issue to `reports/fact_conflicts.md`.
- Use the highest-priority verified source only when governance explicitly resolves the conflict.
- Otherwise leave the public claim unchanged and flag it.

## Hard Rules

- Never fabricate amenities, availability, pricing, square footage, views, balcony status, walking times, transit times, fees, concessions, awards, ratings, or neighborhood claims.
- Never state that every residence has a balcony. The 02 Convertible and 03 Convertible stacks do not have balconies.
- Use qualifiers such as “select residences” only when the underlying data supports them.
- Never create doorway pages or near-duplicate location pages.
- Do not keyword-stuff.
- Do not add unsupported Review or AggregateRating schema.
- Do not place FAQ schema on content that is not visibly present on the page.
- Do not expose private operational data, resident data, unpublished pricing, or internal notes.
- Preserve canonical URLs unless the active task authorizes a migration.
- Preserve accessibility and semantic HTML.
- Preserve analytics, lead forms, availability feeds, and conversion tracking unless specifically authorized.
- Do not deploy directly to production.
- Do not modify more than the active task requires.

## Reusability Rules

Property-specific facts must live in structured configuration or content data, not inside reusable components.

Prefer:
- reusable components;
- typed content objects;
- centralized metadata helpers;
- centralized JSON-LD generators;
- route-level content configuration;
- automated validation.

Avoid:
- duplicated page markup;
- hardcoded Exhibit facts inside generic components;
- one-off metadata logic;
- manually repeated schema objects.

## Required Deliverable Format

At the end of each task, provide:

### Summary
What changed and why.

### Files Changed
Exact paths.

### Validation
Commands run and results.

### Fact Conflicts
Any unresolved source conflicts.

### Risks
Anything that could affect SEO, tracking, accessibility, performance, or conversion.

### Next Recommended Task
One scoped next action only.

## Completion Standard

A task is complete only when:
- acceptance criteria in the active task are met;
- applicable tests pass;
- no placeholders remain;
- schema validates structurally;
- factual claims are source-backed;
- changed routes build successfully;
- no known broken links were introduced;
- the implementation is reusable where required.
