---
name: highland-seo-aeo
description: Audit and improve Highland residential property websites for SEO, local search, AI answer engines, structured data, content quality, internal linking, accessibility, and conversion while enforcing verified property facts.
---

# Highland SEO/AEO Skill

Use this skill for:
- technical SEO audits;
- keyword-to-page mapping;
- residential property content architecture;
- metadata and canonical review;
- JSON-LD generation;
- llms.txt and machine-readable property facts;
- floor-plan and unit-page improvements;
- neighborhood and landmark content;
- internal-link planning;
- post-change QA.

## Required Inputs

Before writing:
1. `AGENTS.md`
2. `config/source_governance.yaml`
3. `config/property_context.yaml`
4. `config/keyword_strategy.yaml`
5. the active task

## Workflow

### 1. Inspect
Identify:
- framework and package manager;
- page routes;
- content storage;
- metadata system;
- schema system;
- availability integration;
- analytics and forms;
- build and test commands.

### 2. Audit
Create evidence-based findings. Cite file paths and line numbers when possible. Separate:
- confirmed defects;
- opportunities;
- assumptions;
- blocked items.

### 3. Map
Assign one primary search intent to each target page. Prevent cannibalization.

### 4. Implement
Prefer centralized helpers and structured content. Keep public copy factual, clear, local, and conversion-oriented.

### 5. Validate
Run build, lint, tests, link checks, schema checks, and any repository-specific commands.

### 6. Report
Use the completion format in `AGENTS.md`.

## Content Rules

- Start with the renter's need, not the property name.
- Keep titles readable.
- Use answer-first sections for conversational and AI retrieval.
- Use descriptive headings.
- Include useful local context only when validated.
- Do not publish thin, repetitive location pages.
- Avoid unsupported superlatives.
- Preserve fair-housing-neutral language.

## Structured Data Rules

Use only types supported by the visible page and current search-engine guidance. Typical candidates:
- ApartmentComplex
- Residence
- Offer
- BreadcrumbList
- FAQPage
- ImageObject
- VideoObject
- Organization

Do not force every type onto every page.

## Stop Conditions

Stop and report when:
- source facts conflict;
- current pricing or availability cannot be validated;
- the active task would create duplicate or doorway pages;
- build or tests fail for reasons not safely repairable within scope;
- deployment is requested but not explicitly authorized.
