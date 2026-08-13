# SEO/AEO/GEO Playbook Compliance Report

Maps every theme of the babylovegrowth.ai SEO·AEO·GEO Academy master checklist
to its status on www.rentatexhibit.com.

Status key: **Compliant** (already in place) · **Fixed here** (this task) ·
**Owner action** (human, off-site) · **Follow-up** (scheduled as a separate
task).

## 1. Technical foundation & machine readability
| Theme | Status | Notes |
|---|---|---|
| Per-page prerendered HTML for crawlers | Compliant | Browserless SSG; every route ships its own index.html. |
| Canonical URLs, single-hop 301s | Compliant | Legacy redirects are single-hop; self-canonical on every page. |
| XML sitemap with honest lastmod | Fixed here | Blog URLs added; lastmod stays content-hash-derived. |
| llms.txt / llms-full.txt / AGENTS.md | Fixed here | New **Blog** sections added to llms.txt + llms-full.txt; AGENTS counts updated. |
| Markdown twins of every page | Compliant | Blog pages inherit the twin pipeline automatically. |
| Deep JSON-LD (Article/LocalBusiness/FloorPlan/Video/reviews) | Compliant | Blog adds Article + Person(author) + FAQPage + BreadcrumbList. |
| Core Web Vitals lab suite | Compliant | Blog hub added to `LCP_NO_HERO_ROUTES`; article routes preload their chunk (CLS guard). |
| GA4 + Search Console wired | Compliant | Existing instrumentation. |
| **AI-crawler access (robots.txt)** | Fixed here | Added **Google-Extended: Allow /** (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Applebot-Extended, Bingbot already present). |

## 2. On-page basics
| Theme | Status | Notes |
|---|---|---|
| Unique titles/descriptions, meta hygiene | Compliant | Handled by the earlier audit-remediation task; blog enforces the 150–160 char band + ~65-char title cap via `blog.test.ts`. |
| NAP consistency | Compliant | Canonical values in `propertyFacts.ts`; blog prose scanned by the fact-discipline suites. |
| Accessibility | Compliant | Prior task. |

## 3. Content, topic clusters & keyword strategy
| Theme | Status | Notes |
|---|---|---|
| Keyword & cluster map (buyer-intent) | Fixed here | `src/data/blogClusterPlan.ts` + `docs/seo/CONTENT_CLUSTER_PLAN.md`: 3 pillars × 5 clusters, prioritized by intent. |
| Blog/articles section | Fixed here | New `/blog` hub + article pages reusing the Knowledge Center machinery. |
| Pillar + interlinked clusters | Fixed here | 1 pillar + 2 clusters shipped by hand to prove the template; internal-link/no-orphan guard enforces the cluster graph. |
| Page anatomy (answer-first, one H1, H2s, FAQ, internal links, CTAs) | Fixed here | Enforced by `blog.test.ts` + prerender post-build guard. |
| Automated authoring pipeline | **Follow-up** | Foundation shipped (draft-gating, cluster plan, fact modules, slug parser); the `generate:article` AI generator is a scoped follow-up task. |

## 4. E-E-A-T / authority
| Theme | Status | Notes |
|---|---|---|
| Real author names + credentials | Fixed here | `blogAuthors.ts`: Rebbekah Hallberg (Property Manager) + Leasing Team; visible byline + Person/Organization JSON-LD. |
| Visible published + dateModified | Fixed here | Byline `<time>` + Article `datePublished`/`dateModified`. |
| Cited sources for external claims | Fixed here | `sources[]` rendered visibly + `citation` in JSON-LD; guard requires https. |
| Publisher entity | Compliant | Organization node with logo. |
| Off-site: GBP, directories, unlinked mentions | **Owner action** | `docs/seo/OFFSITE_OWNER_CHECKLIST.md`. |

## 5. AI visibility / GEO
| Theme | Status | Notes |
|---|---|---|
| AI-crawler allowances | Fixed here | robots.txt (see §1). |
| llms.txt links new cluster/pillar pages | Fixed here | Blog section regenerated each build. |
| Quarterly AI brand-mention check | Fixed here (doc) | `docs/seo/AI_VISIBILITY_PROMPT_PACK.md` — manual prompt pack (no programmatic chat access). |

## 6. Measurement cadence
| Theme | Status | Notes |
|---|---|---|
| Weekly GSC/GA4 movers + near-winner digest | Fixed here | api-server `seoWeeklyDigest` watchdog: once per ISO week it pulls GSC rising/falling queries+pages, near-winners (pos 8–20), per-`/blog`-article stats, and GA4 page movers, and emails the leasing inbox. Alerts ops with grant instructions until the service account is added in Search Console. Manual run: `pnpm run send:seo-digest`. |
| Quarterly AI-visibility spot-check | Fixed here (doc) | Prompt pack committed; aligned to the Jan/Apr/Jul/Oct cadence. |
| Draft-review email + IndexNow on publish | **Follow-up** | Weekly auto-draft/review-email and IndexNow submission of new blog URLs are scoped follow-up tasks. |

## Summary
- **Fixed in this task**: the content/authority pillars — cluster plan, `/blog`
  section with full page anatomy, E-E-A-T authorship, robots.txt Google-Extended,
  llms/sitemap integration, and the three owner/measurement documents.
- **Owner actions**: off-site authority (checklist delivered).
- **Follow-ups**: the AI `generate:article` generator, weekly draft-review +
  IndexNow automation, and the weekly GSC/GA4 digest — proposed at task
  completion.
