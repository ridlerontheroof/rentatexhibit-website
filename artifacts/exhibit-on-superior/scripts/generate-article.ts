/**
 * generate:article — the AI blog-article drafter.
 *
 * Takes the next unwritten slug from the cluster plan (or --slug <slug>),
 * builds a fact pack drawn ONLY from committed fact modules (propertyFacts,
 * walkScores, commute, floorPlans, fees) plus the plan brief and committed
 * PAGE_SEO copy for the link targets, drafts the article via the Replit AI
 * proxy (OpenAI-compatible), validates the result against the same rules the
 * blog guard suite enforces, and appends it to src/data/blogArticles.ts as a
 * `draft: true` entry.
 *
 * Drafts are invisible on every surface. Publishing stays a human code
 * change: flip `draft: true` off AND add the /blog/<slug> rewrite pair in
 * artifact.toml (the prerender parity guard enforces both). This script can
 * NEVER publish — it only writes drafts and emails a review note.
 *
 * Configuration:
 *   AI_INTEGRATIONS_OPENAI_BASE_URL / AI_INTEGRATIONS_OPENAI_API_KEY
 *       Replit AI proxy credentials (preferred; provisioned by the Replit
 *       OpenAI AI integration). Falls back to OPENAI_API_KEY against
 *       https://api.openai.com/v1 when the proxy is not configured.
 *   BLOG_DRAFT_MODEL   model override (default gpt-5.6-terra)
 *   SKIP_REVIEW_EMAIL=1  skip the review-note email (draft still lands)
 *
 * Flags:
 *   --slug <slug>   draft a specific planned slug instead of the queue head
 *   --dry-run       print the validated draft JSON; write nothing, email nothing
 *
 * After a draft lands the script runs the blog + fact-discipline guard suites
 * against the modified data file; if they fail, the draft is reverted and the
 * rejected JSON is saved to /tmp for inspection.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

// @ts-ignore - importing app TS modules directly via tsx
import { CLUSTER_PLAN, unwrittenSlugs, type ClusterArticlePlan } from '../src/data/blogClusterPlan';
// @ts-ignore
import { BLOG_ARTICLES, blogTitle, blogDescription, blogWordCount, type BlogArticle } from '../src/data/blog';
// @ts-ignore
import { BLOG_AUTHORS, type BlogAuthorId } from '../src/data/blogAuthors';
// @ts-ignore
import { PAGE_SEO } from '../src/data/seo';
// @ts-ignore
import {
  CREDIT_SCORE_MIN,
  CREDIT_SCORE_COSIGNER_MIN,
  RENTERS_INSURANCE_LLI_DISPLAY,
  APPROVAL_WINDOW_DISPLAY,
  UNIT_TOTAL,
  SQFT_RANGE_DISPLAY,
  OFFICE_HOURS_LINES,
} from '../src/data/propertyFacts';
// @ts-ignore
import { FEE_SUMMARY, UTILITY_FEE_RANGE, UTILITY_BUNDLE } from '../src/data/fees';
// @ts-ignore
import {
  WALK_SCORES_CITATION,
  WALK_SCORE_SOURCE_URL,
  WALK_SCORES_CHECKED,
} from '../src/data/walkScores';
// @ts-ignore
import { COMMUTE_ROWS } from '../src/data/commute';
// @ts-ignore
import { CATEGORIES, SQFT_MIN, SQFT_MAX, planGroups } from '../src/data/floorPlans';

const HERE = dirname(fileURLToPath(import.meta.url));
const ARTICLES_PATH = join(HERE, '..', 'src', 'data', 'blogArticles.ts');
const WEB_ROOT = join(HERE, '..');
const REPO_ROOT = join(HERE, '..', '..', '..');

// ---------------------------------------------------------------------------
// Allowed external citations (the ONLY sources a draft may cite).
// ---------------------------------------------------------------------------
const ALLOWED_SOURCES: { label: string; href: string }[] = [
  { label: 'Walk Score for 165 W Superior St', href: WALK_SCORE_SOURCE_URL },
  { label: 'CTA \u2014 train schedules and travel times', href: 'https://www.transitchicago.com/schedules/' },
  {
    label: 'ComEd \u2014 start, stop, or move electric service',
    href: 'https://www.comed.com/my-account/customer-support/start-stop-move',
  },
];

/** Claim → required citation domain (mirrors blog.test.ts exactly). */
const CLAIM_SOURCES: Array<[RegExp, string, string]> = [
  [/walk score|transit score|bike score/i, 'walkscore.com', 'Walk Score claims'],
  [/\b(cta|brown line|purple line|red line|blue line|orange line|l stop|l station)\b/i, 'transitchicago.com', 'CTA/transit claims'],
  [/\bcomed\b/i, 'comed.com', 'ComEd claims'],
];

const FILLER = [
  'world-class', 'best-in-class', 'unparalleled', 'second to none',
  'nestled', 'stunning array', 'plethora',
];

/** Existing share cards in public/images/og — per-pillar defaults. */
const OG_CARD_BY_PILLAR: Record<string, string> = {
  'living-in-river-north-chicago': 'neighborhood',
  'how-to-rent-an-apartment-in-chicago': 'application-guide',
  'high-rise-apartment-living-chicago': 'floor-plans',
};

export interface PlanTarget {
  slug: string;
  role: 'pillar' | 'cluster';
  pillar: string;
  workingTitle: string;
  targetQuery: string;
  authorId: BlogAuthorId;
  brief: string;
  internalLinks: string[];
}

export function resolvePlan(slug: string): PlanTarget {
  for (const p of CLUSTER_PLAN) {
    if (p.pillarSlug === slug) {
      // Pillar plans carry a theme instead of a cluster brief.
      const authors = p.clusters.map((c: ClusterArticlePlan) => c.authorId);
      const authorId = (authors.sort(
        (a: string, b: string) =>
          authors.filter((x: string) => x === b).length - authors.filter((x: string) => x === a).length,
      )[0] ?? 'leasing-team') as BlogAuthorId;
      return {
        slug,
        role: 'pillar',
        pillar: slug,
        workingTitle: p.pillarTitle,
        targetQuery: slug.replace(/-/g, ' '),
        authorId,
        brief:
          `${p.theme} This is the PILLAR article: a comprehensive guide that umbrellas the whole topic `,
        internalLinks: [...new Set(p.clusters.flatMap((c: ClusterArticlePlan) => c.internalLinks))] as string[],
      };
    }
    const c = p.clusters.find((x: ClusterArticlePlan) => x.slug === slug);
    if (c) {
      return {
        slug,
        role: 'cluster',
        pillar: p.pillarSlug,
        workingTitle: c.workingTitle,
        targetQuery: c.targetQuery,
        authorId: c.authorId,
        brief: c.brief,
        internalLinks: c.internalLinks,
      };
    }
  }
  throw new Error(`Slug "${slug}" is not in the cluster plan (src/data/blogClusterPlan.ts).`);
}

// ---------------------------------------------------------------------------
// Fact pack — committed fact modules + committed PAGE_SEO copy ONLY.
// Nothing in this pack may be hard-coded prose: every claim is derived from
// an exported constant or from PAGE_SEO (canonical committed site copy), so
// the pack can never silently drift from the canonical data.
// ---------------------------------------------------------------------------
export function buildFactPack(target: PlanTarget): string {
  const perCategory = CATEGORIES.map((c: { id: string; label: string }) => {
    const groups = planGroups.filter((g: { category: string }) => g.category === c.id);
    if (!groups.length) return null;
    const mins = groups.map((g: { sqftMin: number }) => g.sqftMin);
    const maxs = groups.map((g: { sqftMax: number }) => g.sqftMax);
    return `${c.label}: about ${Math.min(...mins)}\u2013${Math.max(...maxs)} sq ft`;
  }).filter(Boolean);

  const linkContext = target.internalLinks
    .map((href) => {
      const seo = PAGE_SEO[href];
      return seo ? `${href} \u2014 ${seo.description ?? seo.title ?? ''}` : href;
    })
    .join('\n');

  const homeSeo = PAGE_SEO['/'];
  const amenitiesSeo = PAGE_SEO['/amenities'];

  // Fee facts come verbatim from the committed FEE_SUMMARY rows (amounts,
  // frequencies, and conditions like refund rules and pet caps all live in
  // src/data/fees.ts, never here).
  const feeLines = FEE_SUMMARY.map(
    (r: { item: string; amount: string; frequency: string; notes: string }) =>
      `- ${r.item}: ${r.amount} (${r.frequency}) \u2014 ${r.notes}`,
  );
  const utilityTiers = UTILITY_BUNDLE.map(
    (r: { type: string; fee: string }) => `${r.type} ${r.fee}`,
  ).join(', ');

  // Utilities/ComEd and bike-storage claims come from committed PAGE_SEO FAQ
  // answers (canonical site copy), located by content so they track edits.
  const faqAnswer = (needle: RegExp): string => {
    for (const page of Object.values(PAGE_SEO) as { faqs?: { a: string }[] }[]) {
      const hit = page.faqs?.find((f) => needle.test(f.a));
      if (hit) return hit.a;
    }
    return '';
  };
  const comEdCopy = faqAnswer(/ComEd/);
  const bikeCopy = faqAnswer(/bike storage/i);

  return [
    `PROPERTY (committed site copy): ${homeSeo?.quickAnswer ?? homeSeo?.description ?? ''}`,
    `SIZE FACTS: ${UNIT_TOTAL} apartments; ${SQFT_RANGE_DISPLAY} sq ft overall (${SQFT_MIN}\u2013${SQFT_MAX}).`,
    `FLOOR PLAN SIZES: ${perCategory.join('; ')}.`,
    `AMENITIES (committed site copy): ${amenitiesSeo?.quickAnswer ?? amenitiesSeo?.description ?? ''}`,
    `SCREENING: minimum credit score ${CREDIT_SCORE_MIN}, or ${CREDIT_SCORE_COSIGNER_MIN} with a qualified co-signer; approval decision in ${APPROVAL_WINDOW_DISPLAY}; renters insurance required with ${RENTERS_INSURANCE_LLI_DISPLAY} liability-to-landlord coverage.`,
    `FEES (from the committed fee table):\n${feeLines.join('\n')}\nUtility & Service Amenity fee range ${UTILITY_FEE_RANGE}; tiers: ${utilityTiers}.`,
    comEdCopy ? `UTILITIES (committed site copy): ${comEdCopy}` : '',
    bikeCopy ? `BIKE STORAGE (committed site copy): ${bikeCopy}` : '',
    `WALK/TRANSIT/BIKE SCORES (verified ${WALK_SCORES_CHECKED}): ${WALK_SCORES_CITATION}`,
    `COMMUTE FACTS (all times approximate, from the committed commute table):\n${COMMUTE_ROWS.map((r: { destination: string; transit: string; time: string }) => `- ${r.destination}: ${r.transit} (${r.time})`).join('\n')}`,
    `OFFICE HOURS: ${OFFICE_HOURS_LINES.join('; ')}.`,
    `INTERNAL LINK TARGETS (committed page copy for context):\n${linkContext}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
function buildPrompt(target: PlanTarget, feedback: string[]): { system: string; user: string } {
  const author = BLOG_AUTHORS[target.authorId];
  const publishedSlugs = BLOG_ARTICLES.map((a: BlogArticle) => `${a.slug} (${a.title})`).join('\n');
  const system = [
    'You draft renter-guide blog articles for Exhibit On Superior, a luxury high-rise at 165 W Superior St, River North, Chicago.',
    'HARD RULES:',
    '1. FACTS: every number, fee, score, time, or requirement MUST come verbatim from the FACT PACK. If a fact is not in the pack, do not state it — write "varies by building" or defer to the leasing office. Never invent statistics, prices, dates, or named places.',
    '2. CITATIONS: third-party claims (Walk Score, CTA/L-train, ComEd) require the matching source from ALLOWED SOURCES. Cite ONLY sources from that list, and only ones you actually rely on.',
    '3. VOICE: practical, specific, first-person-plural leasing-team perspective (or first-person property manager when the byline is Rebbekah Hallberg). Attribute advice ("our leasing team recommends...") — never assert general market claims as fact. No marketing filler (banned: world-class, best-in-class, unparalleled, second to none, nestled, stunning array, plethora). Never name the management company.',
    '4. STRUCTURE (strictly enforced): summary is a self-contained 40-60 word answer to the target query; 4-6 sections, each with a descriptive heading and 1-3 paragraphs (optional bullet list); total body at least 400 words; 2-3 FAQs with self-contained answers; metaTitle at most 43 characters.',
    '5. Internal links: pick 2-3 from ALLOWED INTERNAL LINKS with natural descriptive labels. related: pick 1-2 from PUBLISHED ARTICLES.',
    '6. Typography: use real Unicode punctuation (\u2019 \u2013 \u2014), never a double hyphen "--".',
    'Respond with ONLY a JSON object: {"title": string, "metaTitle": string, "summary": string, "sections": [{"heading": string, "paragraphs": string[], "list"?: string[]}], "faqs": [{"question": string, "answer": string}], "links": [{"label": string, "href": string}], "sources": [{"label": string, "href": string}], "related": string[]}',
  ].join('\n');

  const user = [
    `ARTICLE TO DRAFT`,
    `Slug: ${target.slug} (role: ${target.role}, pillar: ${target.pillar})`,
    `Working title: ${target.workingTitle}`,
    `Target query: ${target.targetQuery}`,
    `Byline: ${author.name}${author.type === 'Person' ? ' (Property Manager)' : ' (the on-site leasing team)'}`,
    ``,
    `BRIEF: ${target.brief}`,
    ``,
    `FACT PACK (the only permitted facts):`,
    buildFactPack(target),
    ``,
    `ALLOWED SOURCES:`,
    ...ALLOWED_SOURCES.map((s) => `- ${s.label}: ${s.href}`),
    ``,
    `ALLOWED INTERNAL LINKS: ${target.internalLinks.join(', ')}`,
    ``,
    `PUBLISHED ARTICLES (for "related"):`,
    publishedSlugs,
    ...(feedback.length
      ? ['', 'YOUR PREVIOUS ATTEMPT FAILED VALIDATION. Fix ALL of these problems:', ...feedback.map((f) => `- ${f}`)]
      : []),
  ].join('\n');

  return { system, user };
}

// ---------------------------------------------------------------------------
// AI proxy call
// ---------------------------------------------------------------------------
/**
 * Parse the model's message content into JSON, returning retryable errors
 * instead of throwing — malformed output must consume a retry attempt, not
 * abort the run.
 */
export function parseModelContent(content: unknown): { raw?: unknown; errors: string[] } {
  if (typeof content !== 'string' || !content.trim()) {
    return { errors: ['model returned no text content'] };
  }
  try {
    return { raw: JSON.parse(content), errors: [] };
  } catch (err) {
    return {
      errors: [
        `response was not valid JSON (${err instanceof Error ? err.message : String(err)}) — respond with ONLY the JSON object, no prose or code fences`,
      ],
    };
  }
}

async function draftViaAI(target: PlanTarget, feedback: string[]): Promise<{ raw?: unknown; errors: string[] }> {
  const base =
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ??
    (process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : undefined);
  const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!base || !key) {
    throw new Error(
      'AI drafting is not configured. Set up the Replit OpenAI AI integration ' +
        '(provisions AI_INTEGRATIONS_OPENAI_BASE_URL / AI_INTEGRATIONS_OPENAI_API_KEY), ' +
        'or provide OPENAI_API_KEY as a fallback.',
    );
  }
  const model = process.env.BLOG_DRAFT_MODEL ?? 'gpt-5.6-terra';
  const { system, user } = buildPrompt(target, feedback);
  const res = await fetch(`${base.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_completion_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AI proxy returned ${res.status}: ${body.slice(0, 500)}`);
  }
  const json = (await res.json().catch(() => null)) as
    | { choices?: { message?: { content?: string } }[] }
    | null;
  return parseModelContent(json?.choices?.[0]?.message?.content);
}

// ---------------------------------------------------------------------------
// Runtime shape validation — the model's JSON is untrusted. Coerce it into a
// BlogArticle candidate or return retryable schema errors (never throw on
// malformed-but-valid JSON).
// ---------------------------------------------------------------------------
export function coerceCandidate(
  raw: unknown,
  target: PlanTarget,
  today: string,
): { candidate?: BlogArticle; errors: string[] } {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { errors: ['response must be a JSON object'] };
  }
  const r = raw as Record<string, unknown>;
  const str = (key: string): string => {
    if (typeof r[key] !== 'string') {
      errors.push(`"${key}" must be a string`);
      return '';
    }
    return r[key] as string;
  };
  const strArray = (v: unknown, label: string): string[] => {
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
      errors.push(`${label} must be an array of strings`);
      return [];
    }
    return v as string[];
  };
  const objArray = (key: string): Record<string, unknown>[] => {
    const v = r[key];
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'object' || x === null || Array.isArray(x))) {
      errors.push(`"${key}" must be an array of objects`);
      return [];
    }
    return v as Record<string, unknown>[];
  };

  const sections: BlogArticle['sections'] = objArray('sections').map((s, i) => ({
    ...(s.heading === undefined
      ? {}
      : typeof s.heading === 'string'
        ? { heading: s.heading }
        : (errors.push(`sections[${i}].heading must be a string`), {})),
    paragraphs: strArray(s.paragraphs, `sections[${i}].paragraphs`),
    ...(s.list === undefined ? {} : { list: strArray(s.list, `sections[${i}].list`) }),
  }));
  const faqs: BlogArticle['faqs'] = objArray('faqs').map((f, i) => {
    if (typeof f.question !== 'string' || typeof f.answer !== 'string') {
      errors.push(`faqs[${i}] needs string "question" and "answer"`);
      return { question: '', answer: '' };
    }
    return { question: f.question, answer: f.answer };
  });
  const pairArray = (key: string): { label: string; href: string }[] =>
    objArray(key).map((x, i) => {
      if (typeof x.label !== 'string' || typeof x.href !== 'string') {
        errors.push(`${key}[${i}] needs string "label" and "href"`);
        return { label: '', href: '' };
      }
      return { label: x.label, href: x.href };
    });

  const candidate: BlogArticle = {
    slug: target.slug,
    title: str('title'),
    metaTitle: str('metaTitle'),
    targetQuery: target.targetQuery,
    role: target.role,
    pillar: target.pillar,
    authorId: target.authorId,
    summary: str('summary'),
    sections,
    faqs,
    related: strArray(r.related, '"related"'),
    links: pairArray('links'),
    sources: pairArray('sources'),
    ogCard: OG_CARD_BY_PILLAR[target.pillar] ?? 'home',
    published: today,
    updated: today,
    draft: true,
  };
  return errors.length ? { errors } : { candidate, errors: [] };
}

// ---------------------------------------------------------------------------
// Validation — mirrors the published-article rules in blog.test.ts so a
// reviewer can flip `draft` without the guard suite failing.
// ---------------------------------------------------------------------------
export function validateDraft(a: BlogArticle, target: PlanTarget): string[] {
  const errors: string[] = [];
  if (!a.title?.trim()) errors.push('title must be nonempty');
  if (!a.metaTitle?.trim()) errors.push('metaTitle must be nonempty');
  for (const s of a.sections ?? []) {
    if (s.heading !== undefined && !s.heading.trim()) errors.push('section headings must be nonempty when present');
    if (!s.paragraphs?.length || s.paragraphs.some((p) => !p?.trim())) {
      errors.push('every section needs at least one nonempty paragraph');
    }
    for (const li of s.list ?? []) if (!li?.trim()) errors.push('list items must be nonempty');
  }
  for (const f of a.faqs ?? []) {
    if (!f.question?.trim() || !f.answer?.trim()) errors.push('FAQ questions and answers must be nonempty');
  }
  for (const l of a.links ?? []) if (!l.label?.trim()) errors.push('internal link labels must be nonempty');
  for (const s of a.sources ?? []) if (!s.label?.trim()) errors.push('source labels must be nonempty');
  const summaryWords = blogWordCount(a.summary);
  if (summaryWords < 40 || summaryWords > 60) {
    errors.push(`summary must be 40-60 words (got ${summaryWords})`);
  }
  if (!Array.isArray(a.sections) || a.sections.length < 3) {
    errors.push('need at least 3 sections with descriptive headings');
  }
  const body = (a.sections ?? [])
    .flatMap((s) => [...(s.paragraphs ?? []), ...(s.list ?? [])])
    .join(' ');
  const bodyWords = blogWordCount(body);
  if (bodyWords < 300) errors.push(`body must be at least 300 words (got ${bodyWords})`);
  const rendered = blogTitle(a);
  if (rendered.length > 65) errors.push(`rendered <title> "${rendered}" is ${rendered.length} chars (max 65). Shorten metaTitle to at most 43 characters.`);
  const desc = blogDescription(a);
  if (desc.length < 150 || desc.length > 160) {
    errors.push(`meta description is ${desc.length} chars (need 150-160) — adjust the summary length slightly`);
  }
  if (!a.sources?.length) errors.push('cite at least one source from ALLOWED SOURCES');
  const allowedHrefs = new Set(ALLOWED_SOURCES.map((s) => s.href));
  for (const s of a.sources ?? []) {
    if (!/^https:\/\//.test(s.href)) errors.push(`source not https: ${s.href}`);
    if (!allowedHrefs.has(s.href)) errors.push(`source not in ALLOWED SOURCES: ${s.href}`);
  }
  const prose = [
    a.title,
    a.summary,
    ...(a.sections ?? []).flatMap((s) => [s.heading ?? '', ...(s.paragraphs ?? []), ...(s.list ?? [])]),
    ...(a.faqs ?? []).flatMap((f) => [f.question, f.answer]),
  ].join(' ');
  for (const [re, domain, label] of CLAIM_SOURCES) {
    if (re.test(prose) && !(a.sources ?? []).some((s) => s.href.includes(domain))) {
      errors.push(`prose makes ${label} but cites no ${domain} source`);
    }
  }
  const lower = prose.toLowerCase();
  for (const bad of FILLER) if (lower.includes(bad)) errors.push(`banned filler phrase: "${bad}"`);
  if (lower.includes('highland')) errors.push('never name the management company');
  if (/[^-]--[^-]/.test(prose)) errors.push('no double-hyphen "--" — use real dashes');
  if (!a.links?.length) errors.push('need at least one internal link');
  const allowedLinks = new Set(target.internalLinks);
  for (const l of a.links ?? []) {
    if (!PAGE_SEO[l.href]) errors.push(`link href is not a site route: ${l.href}`);
    else if (!allowedLinks.has(l.href)) errors.push(`link href not in ALLOWED INTERNAL LINKS: ${l.href}`);
  }
  const published = new Set(BLOG_ARTICLES.map((x: BlogArticle) => x.slug));
  if (!a.related?.length) errors.push('need at least one "related" published slug');
  for (const r of a.related ?? []) {
    if (!published.has(r)) errors.push(`related slug is not a published article: ${r}`);
    if (r === a.slug) errors.push('related must not include the article itself');
  }
  if (!a.faqs?.length || a.faqs.length < 2) errors.push('need at least 2 FAQs');
  return errors;
}

// ---------------------------------------------------------------------------
// Publish-readiness — simulate the published set AFTER the documented publish
// edits (flip draft off + add the inbound related link in the host article)
// and re-run the linking guards blog.test.ts enforces on published articles.
// Every published article needs >=1 inbound related link, and no existing
// article can already point at a previously unwritten slug — so publishing
// REQUIRES adding an inbound reference in an existing article. We pick that
// host here and document it as a mandatory publish edit.
// ---------------------------------------------------------------------------
export function pickInboundHost(a: BlogArticle): string {
  const published = BLOG_ARTICLES as BlogArticle[];
  const pillar = published.find((x) => x.slug === a.pillar);
  if (pillar && pillar.slug !== a.slug) return pillar.slug;
  const sibling = published.find((x) => x.pillar === a.pillar && x.slug !== a.slug);
  if (sibling) return sibling.slug;
  const any = published.find((x) => x.slug !== a.slug);
  if (!any) throw new Error('No published article exists to host the inbound related link.');
  return any.slug;
}

export function validateProspectivePublish(a: BlogArticle, hostSlug: string): void {
  const prospective: BlogArticle[] = [
    ...(BLOG_ARTICLES as BlogArticle[]).map((x) =>
      x.slug === hostSlug ? { ...x, related: [...x.related, a.slug] } : x,
    ),
    { ...a, draft: false },
  ];
  const slugs = new Set(prospective.map((x) => x.slug));
  const errors: string[] = [];
  const inbound = new Map<string, number>();
  for (const x of prospective) {
    for (const rel of x.related) {
      if (!slugs.has(rel)) errors.push(`${x.slug} relates to unpublished ${rel}`);
      inbound.set(rel, (inbound.get(rel) ?? 0) + 1);
    }
  }
  for (const x of prospective) {
    if ((inbound.get(x.slug) ?? 0) < 1) errors.push(`${x.slug} would be an orphan (no inbound related links)`);
  }
  if (a.role === 'cluster' && !slugs.has(a.pillar)) {
    errors.push(
      `cluster pillar "${a.pillar}" is not published yet — the pillar must be published first (or in the same change)`,
    );
  }
  if (errors.length) {
    throw new Error(
      `Draft is not publish-ready even with the documented publish edits:\n  - ${errors.join('\n  - ')}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Serialization — matches the authoring format blog-slugs.mjs parses
// (each literal starts `slug:` then `title:`; non-ASCII as \uXXXX escapes).
// ---------------------------------------------------------------------------
function escapeString(value: string, prose: boolean): string {
  let v = String(value);
  if (prose) {
    v = v.replace(/\s+--\s+/g, ' \u2014 ').replace(/--/g, '\u2014');
    v = v.replace(/'/g, '\u2019');
  }
  v = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  // eslint-disable-next-line no-control-regex
  v = v.replace(/[^\x20-\x7E]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return v;
}
const P = (s: string) => `'${escapeString(s, true)}'`; // prose literal
const R = (s: string) => `'${escapeString(s, false)}'`; // raw literal (slugs, hrefs)

export function serializeArticle(a: BlogArticle, target: PlanTarget, hostSlug: string): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('  // ---------------------------------------------------------------------');
  lines.push(`  // ${target.role.toUpperCase()} \u2014 ${escapeString(target.targetQuery, false)}`);
  lines.push('  // AI DRAFT \u2014 awaiting human review. To publish, ALL THREE edits are');
  lines.push('  // required (guard tests fail if any is missed):');
  lines.push('  //   1. remove `draft: true` below');
  lines.push(`  //   2. add '${escapeString(a.slug, false)}' to the related: list of the`);
  lines.push(`  //      '${escapeString(hostSlug, false)}' article above (inbound-link guard)`);
  lines.push(`  //   3. add the /blog/${escapeString(a.slug, false)} rewrite pair in artifact.toml`);
  lines.push('  // ---------------------------------------------------------------------');
  lines.push('  {');
  lines.push(`    slug: ${R(a.slug)},`);
  lines.push(`    title: ${P(a.title)},`);
  lines.push(`    metaTitle: ${P(a.metaTitle)},`);
  lines.push(`    targetQuery: ${R(a.targetQuery)},`);
  lines.push(`    role: ${R(a.role)},`);
  lines.push(`    pillar: ${R(a.pillar)},`);
  lines.push(`    authorId: ${R(a.authorId)},`);
  lines.push(`    summary:`);
  lines.push(`      ${P(a.summary)},`);
  lines.push('    sections: [');
  for (const s of a.sections) {
    lines.push('      {');
    if (s.heading) lines.push(`        heading: ${P(s.heading)},`);
    lines.push('        paragraphs: [');
    for (const p of s.paragraphs) lines.push(`          ${P(p)},`);
    lines.push('        ],');
    if (s.list?.length) {
      lines.push('        list: [');
      for (const li of s.list) lines.push(`          ${P(li)},`);
      lines.push('        ],');
    }
    lines.push('      },');
  }
  lines.push('    ],');
  lines.push('    faqs: [');
  for (const f of a.faqs) {
    lines.push('      {');
    lines.push(`        question: ${P(f.question)},`);
    lines.push('        answer:');
    lines.push(`          ${P(f.answer)},`);
    lines.push('      },');
  }
  lines.push('    ],');
  lines.push(`    related: [${a.related.map(R).join(', ')}],`);
  lines.push('    links: [');
  for (const l of a.links) lines.push(`      { label: ${P(l.label)}, href: ${R(l.href)} },`);
  lines.push('    ],');
  lines.push('    sources: [');
  for (const s of a.sources) {
    lines.push('      {');
    lines.push(`        label: ${P(s.label)},`);
    lines.push(`        href: ${R(s.href)},`);
    lines.push('      },');
  }
  lines.push('    ],');
  lines.push(`    ogCard: ${R(a.ogCard)},`);
  lines.push(`    published: ${R(a.published)},`);
  lines.push(`    updated: ${R(a.updated)},`);
  lines.push('    draft: true,');
  lines.push('  },');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Readable .txt rendering of the draft, attached to the review email so the
// leasing team can review (and mark up) offline. Edits come back to a
// developer who applies them to the code entry — the file itself is never
// publish authority.
// ---------------------------------------------------------------------------
export function renderDraftText(a: BlogArticle, hostSlug: string): string {
  const lines: string[] = [
    `${a.title}`,
    `${'='.repeat(Math.min(a.title.length, 78))}`,
    '',
    `Slug: /blog/${a.slug}   (DRAFT \u2014 not visible on the site)`,
    `Target search: ${a.targetQuery}`,
    `Byline: ${BLOG_AUTHORS[a.authorId].name}`,
    '',
    'SUMMARY',
    a.summary,
    '',
  ];
  for (const s of a.sections) {
    if (s.heading) lines.push(`## ${s.heading}`, '');
    for (const p of s.paragraphs) lines.push(p, '');
    for (const li of s.list ?? []) lines.push(`  \u2022 ${li}`);
    if (s.list?.length) lines.push('');
  }
  lines.push('FAQS', '');
  for (const f of a.faqs) lines.push(`Q: ${f.question}`, `A: ${f.answer}`, '');
  lines.push('LINKS');
  for (const l of a.links) lines.push(`  ${l.label} \u2192 ${l.href}`);
  lines.push('', 'SOURCES');
  for (const s of a.sources) lines.push(`  ${s.label} \u2192 ${s.href}`);
  lines.push(
    '',
    '--- HOW TO USE THIS FILE ---',
    'Mark up your edits directly in this file and email it back; a developer',
    'applies them to the matching entry in src/data/blogArticles.ts. This file',
    'is never publish authority. To publish, a developer must:',
    '  1. remove `draft: true` from the entry',
    `  2. add '${a.slug}' to the related: list of '${hostSlug}'`,
    `  3. add the /blog/${a.slug} rewrite pair in artifact.toml`,
  );
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const slugFlag = argv.indexOf('--slug');
  const explicitSlug = slugFlag >= 0 ? argv[slugFlag + 1] : undefined;

  const queue = unwrittenSlugs();
  const drafted = new Set(
    Array.from(readFileSync(ARTICLES_PATH, 'utf8').matchAll(/slug:\s*'([^']+)'/g), (m) => m[1]),
  );
  const slug = explicitSlug ?? queue.find((s: string) => !drafted.has(s));
  if (!slug) {
    console.log('Nothing to draft: every planned slug is already written or drafted.');
    return;
  }
  if (drafted.has(slug)) {
    throw new Error(`Slug "${slug}" already exists in blogArticles.ts (published or draft).`);
  }
  const target = resolvePlan(slug);
  const today = new Date().toISOString().slice(0, 10);
  console.log(`Drafting "${slug}" (${target.role}, byline: ${BLOG_AUTHORS[target.authorId].name})...`);

  const MAX_ATTEMPTS = 3;
  let article: BlogArticle | null = null;
  let feedback: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const parsed = await draftViaAI(target, feedback);
    if (parsed.errors.length) {
      feedback = parsed.errors;
      console.warn(`Attempt ${attempt}/${MAX_ATTEMPTS} failed:\n  - ${feedback.join('\n  - ')}`);
      continue;
    }
    const { candidate, errors } = coerceCandidate(parsed.raw, target, today);
    feedback = candidate ? validateDraft(candidate, target) : errors;
    if (candidate && !feedback.length) {
      article = candidate;
      break;
    }
    console.warn(`Attempt ${attempt}/${MAX_ATTEMPTS} failed validation:\n  - ${feedback.join('\n  - ')}`);
  }
  if (!article) {
    throw new Error(`Draft failed validation after ${MAX_ATTEMPTS} attempts. Last errors above.`);
  }

  // Verify the draft can actually be published with the documented edits
  // (inbound-link and pillar guards run only on the published set, so the
  // post-append test run below cannot catch these).
  const hostSlug = pickInboundHost(article);
  validateProspectivePublish(article, hostSlug);

  if (dryRun) {
    console.log(JSON.stringify(article, null, 2));
    console.log(`\nInbound related link at publish time goes in: ${hostSlug}`);
    console.log('--dry-run: nothing written, no email sent.');
    return;
  }

  // Append the draft before the closing `];` of ALL_BLOG_ARTICLES.
  const original = readFileSync(ARTICLES_PATH, 'utf8');
  const closing = original.lastIndexOf('\n];');
  if (closing < 0) throw new Error('Could not find the closing `];` in blogArticles.ts.');
  const updated =
    original.slice(0, closing) + '\n' + serializeArticle(article, target, hostSlug) + original.slice(closing);
  writeFileSync(ARTICLES_PATH, updated);
  console.log(`Draft appended to src/data/blogArticles.ts (draft: true).`);

  // Verify the plain-Node slug parser still agrees with the authoring format.
  const { loadBlogArticles } = await import('./lib/blog-slugs.mjs');
  const parsed = (await loadBlogArticles()) as { slug: string; draft: boolean }[];
  const entry = parsed.find((x) => x.slug === article!.slug);
  if (!entry || !entry.draft) {
    writeFileSync(ARTICLES_PATH, original);
    throw new Error('Appended draft did not round-trip through scripts/lib/blog-slugs.mjs — reverted.');
  }

  // Run the guard suites that scan blogArticles.ts; revert on failure.
  console.log('Running blog + fact-discipline guard suites against the draft...');
  const test = spawnSync(
    'pnpm',
    ['exec', 'vitest', 'run', 'src/data/blog.test.ts', 'src/data/copy-quality.test.ts', 'src/data/propertyFacts.test.ts'],
    { cwd: WEB_ROOT, stdio: 'inherit' },
  );
  if (test.status !== 0) {
    writeFileSync(ARTICLES_PATH, original);
    const rejected = join(tmpdir(), `rejected-blog-draft-${article.slug}.json`);
    writeFileSync(rejected, JSON.stringify(article, null, 2));
    throw new Error(`Guard suites failed — draft reverted. Rejected draft saved to ${rejected}.`);
  }
  console.log('Guard suites passed with the draft in place.');

  // Review-note email (informational only; never publish authority).
  if (process.env.SKIP_REVIEW_EMAIL === '1') {
    console.log('SKIP_REVIEW_EMAIL=1 — skipping the review-note email.');
  } else {
    const note = {
      slug: article.slug,
      title: article.title,
      targetQuery: article.targetQuery,
      inboundHostSlug: hostSlug,
      draftText: renderDraftText(article, hostSlug),
      authorName: BLOG_AUTHORS[article.authorId].name,
      summary: article.summary,
      wordCount: blogWordCount(
        [
          article.summary,
          ...article.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.list ?? [])]),
          ...article.faqs.flatMap((f) => f.answer),
        ].join(' '),
      ),
    };
    const noteFile = join(tmpdir(), `blog-draft-note-${article.slug}.json`);
    writeFileSync(noteFile, JSON.stringify(note, null, 2));
    const mail = spawnSync(
      'pnpm',
      ['--filter', '@workspace/api-server', 'run', 'send:blog-draft-review', noteFile],
      { cwd: REPO_ROOT, stdio: 'inherit' },
    );
    if (mail.status !== 0) {
      // The draft stays in place, but the review workflow is incomplete —
      // fail the command so automation cannot mistake this for a full run.
      console.error(
        'ERROR: the review-note email failed to send. The draft IS in place in ' +
          'src/data/blogArticles.ts; retry the notification with:\n' +
          `  pnpm --filter @workspace/api-server run send:blog-draft-review ${noteFile}`,
      );
      process.exit(1);
    }
  }

  console.log(
    `\nDone. "${article.title}" is drafted at slug ${article.slug} (draft: true — invisible on the site).\n` +
      'To publish after review, ALL THREE edits are required (guards enforce each):\n' +
      '  1. remove `draft: true` from the entry in src/data/blogArticles.ts\n' +
      `  2. add '${article.slug}' to the related: list of '${hostSlug}' (inbound-link guard)\n` +
      `  3. add the /blog/${article.slug} rewrite pair in artifact.toml\n` +
      'See docs/seo/CONTENT_CLUSTER_PLAN.md.',
  );
}

// Run only when executed directly (tsx scripts/generate-article.ts), not when
// imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
