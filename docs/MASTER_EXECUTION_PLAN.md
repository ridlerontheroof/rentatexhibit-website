# Master Execution Plan

## Objective

Increase qualified organic visibility and leasing conversion for Exhibit on Superior, then preserve the work as a reusable Highland property-marketing framework.

## Phase 0 — Repository and Source Setup

Dependencies: none.

Tasks:
1. Confirm the website repository and default branch.
2. Add this agent scaffold.
3. Export relevant Exhibit knowledge files into `knowledge/`.
4. Review and approve `config/property_context.yaml`.
5. Identify build, lint, test, and deployment commands.
6. Confirm whether Codex may access the public internet and approved domains.

Exit criteria:
- repository opens in Codex;
- knowledge exports are present;
- property context is verified;
- baseline commands are documented.

## Phase 1 — Read-Only Discovery Audit

Dependencies: Phase 0.

Tasks:
- crawl routes or inspect the route tree;
- inventory indexable URLs;
- inventory titles, descriptions, H1s, canonicals, schema, images, internal links, robots, sitemap, and status codes;
- identify the availability-feed architecture;
- identify analytics and lead-form dependencies;
- produce `reports/audits/baseline-audit.md`.

No production changes.

Exit criteria:
- complete URL/content inventory;
- prioritized defects;
- implementation risks documented.

## Phase 2 — Search Intent and URL Map

Dependencies: Phase 1.

Tasks:
- map current pages to primary search intents;
- identify missing page types;
- identify cannibalization;
- approve proposed URL changes before implementation;
- produce `reports/keyword-page-map.csv` and a written summary.

Exit criteria:
- every proposed page has a distinct intent and business purpose;
- no doorway-page plan;
- no unapproved URL migration.

## Phase 3 — Technical Foundation

Dependencies: Phase 2.

Tasks:
- centralized metadata helpers;
- canonical logic;
- robots and sitemap corrections;
- stable entity IDs;
- reusable schema generators;
- breadcrumb support;
- image and semantic markup corrections;
- baseline automated tests.

Exit criteria:
- build and tests pass;
- metadata and schema are generated consistently;
- no analytics or leasing integrations break.

## Phase 4 — Core Conversion Pages

Dependencies: Phase 3.

Order:
1. Homepage
2. Availability/floor-plan hub
3. Amenities
4. Neighborhood
5. Contact/tour paths

Exit criteria:
- target intent satisfied;
- content fact-checked;
- calls to action work;
- no duplicated titles or H1s.

## Phase 5 — Floor-Plan and Unit Architecture

Dependencies: Phase 4 and structured floor-plan/unit data.

Tasks:
- create data model;
- create category pages;
- create or improve individual floor-plan pages;
- distinguish permanent floor-plan facts from live unit availability;
- apply balcony and view qualifiers correctly.

Exit criteria:
- no duplicate descriptions;
- no permanent caching of transient pricing;
- canonical and indexing rules documented.

## Phase 6 — Local and Informational Content

Dependencies: Phase 4.

Tasks:
- River North guide;
- useful landmark pages with verified local context;
- renter FAQs;
- moving and floor-plan education;
- internal linking.

Exit criteria:
- pages are substantial and distinct;
- facts and distances are verified;
- no thin doorway pages.

## Phase 7 — AEO and Entity Consistency

Dependencies: Phases 3–6.

Tasks:
- reconcile visible facts and JSON-LD;
- update `llms.txt` only if technically appropriate;
- create machine-readable property-fact exports;
- improve answer-first copy blocks;
- verify stable entity references.

Exit criteria:
- no schema/content mismatch;
- no unverifiable claims;
- entity facts are consistent across the site.

## Phase 8 — Full QA and Release Candidate

Dependencies: all prior implementation phases.

Tasks:
- build, lint, tests;
- link check;
- schema check;
- responsive review;
- accessibility review;
- conversion-path review;
- analytics review;
- content duplication review;
- create release report and rollback notes.

Exit criteria:
- all blocking issues resolved;
- human approval received;
- release candidate ready.

## Phase 9 — Deployment and Measurement

Dependencies: Phase 8 and explicit authorization.

Tasks:
- deploy through existing controlled process;
- verify production;
- submit/update sitemap if applicable;
- establish Search Console and analytics baseline;
- schedule 30-, 60-, and 90-day reviews.

Exit criteria:
- production checks pass;
- measurement baseline documented;
- next iteration driven by query and conversion data.
