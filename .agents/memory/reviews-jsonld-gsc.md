---
name: Review-snippet JSON-LD for GSC
description: Why the /reviews structured data uses a LocalBusiness node and why prerendered JSON-LD is stripped on hydration
---

Two GSC review-snippet failure modes and their fixes:

1. **Parent type**: Google review snippets only accept LocalBusiness/Product/etc. as the reviewed parent. `ApartmentComplex` is a Residence/Place subtype → GSC "Invalid object type for field \<parent_node\>". The reviews enrichment node is emitted as `@type: LocalBusiness` (string, not array — the local validator requires string @type) with the same `@id` as the base ApartmentComplex node so entities merge.

2. **Duplicate aggregate ratings**: react-helmet-async re-emits JSON-LD after hydration but never removes prerendered scripts, so Googlebot's rendered DOM held both sets (prerendered baked rating + live rating → "Review has multiple aggregate ratings"). Fix: prerenderer tags scripts with `data-ssr-jsonld`; `main.tsx` removes them synchronously **before** `createRoot(...).render`, so there is no window with two copies.

**How to apply:** any new JSON-LD carrying reviews/ratings must ride the LocalBusiness node; any script-tag regex over prerendered heads must allow attributes (`<script type="application/ld+json"[^>]*>`). New emitted @types need a RECOMMENDED_PROPERTIES or NO_CHECKLIST_TYPES entry in scripts/validate-jsonld.mjs.
