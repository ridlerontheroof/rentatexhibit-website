# Content-system wiring contract

How the kit's four content systems get instantiated for a NEW property: machinery live, guards
green, property-specific content slots empty. "Empty but live" means every system builds, its guard
runs in CI/prepublish, and the first real content item needs only data — no plumbing.

For each system: **Config inputs** (from property-config.json), **Empty state**, **Live proof**
(what must pass before phase 4 completes), and **First-content path**.

## 1. Interpage linking (hubs, related links, breadcrumbs, link-name guard)

- **Config inputs:** page set from the approved IA (parity map §A + kit-standard pages); property short name (used in link-name templates).
- **Empty state:** floor-plans hub renders from floor-plan data (may be a single plan); knowledge/blog hubs render their "no articles yet" states; breadcrumbs on every nested route mirror BreadcrumbList JSON-LD exactly; nav/footer built from the route data model, not hand-lists.
- **Live proof:** link-name guard passes (no ambiguous/duplicate link names, no bare "click here"); breadcrumb JSON-LD validator passes; every route reachable from nav or a hub (no orphan pages).
- **First-content path:** adding a page = data entry in the route/SEO model + rewrite pair; hub and breadcrumbs pick it up automatically.

## 2. FAQ machinery (FaqSection / QuickAnswer + FAQPage JSON-LD)

- **Config inputs:** none beyond property identity; FAQ items come later from CONFIRMED facts only (gate G1).
- **Empty state:** components ship; the FAQ page exists with a minimal set of property-agnostic questions ONLY if confirmed (else the page stays out of the route set until content lands — never ship placeholder answers).
- **Live proof:** schema validator accepts FAQPage JSON-LD wherever a FaqSection renders; QuickAnswer blocks are <~100 words and sit above the fold of their section; each answer's facts trace to CONFIRMED register rows.
- **First-content path:** append to the FAQ data file; JSON-LD and rendering are derived.

## 3. Knowledge Center (data-driven Q&A pages)

- **Config inputs:** canonical origin (self-canonicals), property name (title templates).
- **Empty state:** the /knowledge hub route + machinery deploy with zero articles: slug data file empty, llms.txt/llms-full.txt regenerate (listing only core pages), review-date cadence checker runs with nothing to flag.
- **Live proof:** knowledge guard (slugs ⇄ rewrite pairs parity, head parity, llms regeneration) passes on the empty set; adding a test slug in a branch produces: route + rewrite pair + md twin + llms entry, then delete it.
- **First-content path:** new slug = data entry + rewrite pair (the unit-rewrites-style generator emits the pair); set a review-by date; llms files regenerate at build.

## 4. Blog engine (draft gating, publish-readiness, citations, queue)

- **Config inputs:** property name; leasing inbox (the "next guide up" reminder recipient).
- **Empty state:** /blog hub live with zero published posts; queue file empty; draft directory empty; blog-queue check passes on empty.
- **Live proof:** `generate:blog-queue --check` green on the empty set; a draft article added in a branch passes the publish-readiness simulation (published-set guards including inbound related links) before `draft:false`, then removed.
- **Live proof (citations):** citation JSON-LD renders as CreativeWork nodes on any article that has sources.
- **First-content path:** draft from a fact pack of CONFIRMED facts only; simulation must pass before the draft flag flips; queue reminder wiring points at the property's leasing inbox.

## Verification in the pilot/beta

The pilot confirms this contract is enforceable by checking the kit ships each system's guard and
that each guard has a defined "empty" success state (not "skips when empty" — runs and passes).
Any kit guard that cannot pass on an empty content set is a kit bug; file it against the kit release.
