# Content & Keyword Cluster Plan

The editorial roadmap for the `/blog` content engine. Source of truth lives in
code — `src/data/blogClusterPlan.ts` (the machine-readable plan the future
`generate:article` pipeline reads) — this document is the human-readable
companion explaining the strategy behind it.

## Strategy

Per the SEO·AEO·GEO playbook, we build **topic clusters**: one pillar page per
theme plus 5–7 interlinked cluster articles, prioritized by **buyer intent**
("keywords that pay" over vanity search volume). Blog articles target
**informational** queries and link *down* to the transactional landing pages
(`/luxury-apartments-river-north`, `/apartments-near-the-loop`, etc.) — they
never compete with them for the same query.

## Authors (E-E-A-T)

- **Rebbekah Hallberg, Property Manager at Exhibit On Superior** — authoritative
  content leaning on building, management, and neighborhood expertise.
- **The Exhibit On Superior Leasing Team** (organization byline) — operational
  how-tos: applications, fees, moving logistics, insurance.

Byline data lives in `src/data/blogAuthors.ts` and is rendered both visibly and
in Article JSON-LD (`author`) so the two can never disagree.

## Pillars & clusters

### Pillar 1 — Living in River North, Chicago (neighborhood)
Owns "living in river north"; umbrellas neighborhood-fit questions renters ask
before touring.

| Priority | Slug | Target query | Intent | Author | Status |
|---|---|---|---|---|---|
| Pillar | `living-in-river-north-chicago` | living in river north chicago | pillar | Rebbekah | **Published** |
| 1 | `is-river-north-a-good-place-to-live` | is river north a good place to live | decision-support | Rebbekah | **Published** |
| 2 | `moving-to-river-north-chicago-checklist` | moving to river north chicago | decision-support | Leasing Team | **Published** |
| 3 | `river-north-vs-streeterville-renters` | river north vs streeterville | comparison | Rebbekah | **Published** |
| 4 | `river-north-commute-guide` | river north commute to the loop | informational | Leasing Team | **Published** |
| 5 | `river-north-with-a-dog` | river north dog friendly apartments | informational | Rebbekah | **Published** |

### Pillar 2 — How to Rent an Apartment in Chicago (process)
Owns application/leasing-process queries where the leasing team's daily
expertise is the differentiator.

| Priority | Slug | Target query | Intent | Author | Status |
|---|---|---|---|---|---|
| Pillar | `how-to-rent-an-apartment-in-chicago` | how to rent an apartment in chicago | pillar | Leasing Team | **Published** |
| 1 | `chicago-apartment-application-documents` | documents needed to rent an apartment chicago | decision-support | Leasing Team | Planned |
| 2 | `chicago-move-in-costs-explained` | apartment move in costs chicago | decision-support | Leasing Team | Planned |
| 3 | `first-apartment-chicago-guide` | first apartment chicago tips | informational | Leasing Team | Planned |
| 4 | `chicago-renters-insurance-basics` | renters insurance requirements chicago apartment | informational | Leasing Team | Planned |
| 5 | `when-to-start-apartment-hunting-chicago` | how far in advance to look for apartments chicago | informational | Leasing Team | Planned |

### Pillar 3 — High-Rise Apartment Living in Chicago (building expertise)
Owns floor-choice, layout, and amenity queries where a 34-story tower's team
has real authority.

| Priority | Slug | Target query | Intent | Author | Status |
|---|---|---|---|---|---|
| Pillar | `high-rise-apartment-living-chicago` | high rise apartment living | pillar | Rebbekah | Planned |
| 1 | `best-floor-high-rise-apartment` | best floor to live on in a high rise | decision-support | Rebbekah | Planned |
| 2 | `convertible-vs-studio-apartment` | what is a convertible apartment | comparison | Leasing Team | Planned |
| 3 | `floor-to-ceiling-windows-living` | floor to ceiling windows apartment pros cons | informational | Rebbekah | Planned |
| 4 | `high-rise-amenities-worth-it` | apartment amenities worth paying for | informational | Rebbekah | Planned |
| 5 | `pets-in-high-rise-apartments` | having a dog in a high rise apartment | informational | Leasing Team | Planned |

## Fact discipline

Every article draws facts **only** from committed fact modules
(`propertyFacts`, `walkScores`, `commute`, `floorPlans`, `fees`), live listing
data, or already-published page copy. Unconfirmed claims are deferred to the
leasing office — never guessed. The same fact-discipline guard suites that
police the Knowledge Center (`propertyFacts.test.ts`, `copy-quality.test.ts`)
now also scan `blogArticles.ts`, and `blog.test.ts` enforces page anatomy,
authorship, internal linking, and JSON-LD.

## Publishing flow (draft → published)

1. An article is authored (by hand today; by the `generate:article` pipeline in
   a follow-up task) as a `draft: true` entry in `blogArticles.ts`.
2. Draft articles are **excluded** from `BLOG_ARTICLES` and therefore from every
   downstream surface (routes, prerender, sitemap, llms.txt, the hub, and
   artifact.toml rewrites) until a human reviewer flips `draft` to `false`.
3. Publishing a slug requires adding its rewrite pair to `artifact.toml` (the
   prerender parity guard fails the build otherwise) — a deliberate,
   human-reviewed code change. AI drafting may never publish on its own.

## AI article drafter (`generate:article`)

The drafter is live. From `artifacts/exhibit-on-superior`:

```
pnpm run generate:article              # drafts the next unwritten slug from the plan
pnpm run generate:article -- --slug <slug>   # drafts a specific planned slug
pnpm run generate:article -- --dry-run       # prints the validated JSON, writes nothing
```

What it does:

1. Picks the highest-priority `planned` slug from `blogClusterPlan.ts` that is
   not yet in `blogArticles.ts` (published or draft).
2. Builds a fact pack from committed fact modules ONLY (`propertyFacts`,
   `walkScores`, `commute`, `floorPlans`, `fees`) plus the plan brief and the
   committed PAGE_SEO copy for the article's internal-link targets, and drafts
   via the Replit AI proxy (`AI_INTEGRATIONS_OPENAI_BASE_URL` /
   `AI_INTEGRATIONS_OPENAI_API_KEY`; `OPENAI_API_KEY` works as a fallback;
   model override via `BLOG_DRAFT_MODEL`).
3. Validates the draft against the same rules `blog.test.ts` enforces on
   published articles (summary length, body depth, citation domains, filler
   ban, link/related integrity, title/description bands), retrying with
   validation feedback up to 3 times.
4. Simulates the prospective published set (draft flipped + the inbound
   related link added) against the published-set linking guards — including
   the no-orphans inbound rule — and picks the published article that must
   gain the inbound `related` reference at publish time. It then appends the
   article to `src/data/blogArticles.ts` as a **`draft: true`** entry (with
   the exact publish edits written in a comment above it) and runs the blog +
   fact-discipline guard suites against the modified file — on any failure
   the draft is reverted and the rejected JSON is saved under `/tmp`.
5. Emails a review note to the leasing inbox (via
   `pnpm --filter @workspace/api-server run send:blog-draft-review`). The
   email is informational only — it is **never publish authority**.

## Flip-to-publish flow (human review required)

Drafts are invisible on every surface (routes, prerender, sitemap, llms.txt,
the hub). To publish a reviewed draft:

1. Review the entry in `src/data/blogArticles.ts` — verify every fact, fee,
   and claim; edit freely. Drafts are ordinary code, so edits are normal PRs.
2. Flip `draft: true` off (delete the line or set `false`).
3. Add the inbound `related` link: append the new slug to the `related:` list
   of the published article named in the comment above the draft. Every
   published article needs at least one inbound related link (the no-orphans
   guard in `blog.test.ts` fails otherwise), and existing articles cannot
   reference the slug before it exists — so this edit always happens at
   publish time.
4. Add the article's rewrite pair to `artifact.toml`:
   `/blog/<slug>` → `/blog/<slug>.html` (copy an existing `/blog/` pair).
   The prerender parity guard fails the build if the pair is missing, and the
   guard suites fail if the flag is flipped without it.

All three code edits (steps 2–4) are mandatory; the drafter writes them as a
checklist comment directly above each draft entry.

5. Run the test suite (`pnpm --filter @workspace/exhibit-on-superior run test`)
   and republish. Post-publish watchers and IndexNow handle the rest.

To discard a draft, delete its object literal — nothing else references it.
