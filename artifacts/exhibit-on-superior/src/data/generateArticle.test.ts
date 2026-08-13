/**
 * Unit guards for the AI article drafter (scripts/generate-article.ts):
 * malformed AI responses become retryable errors (never throws), the fact
 * pack is sourced from committed modules/PAGE_SEO only, drafts are validated
 * against the published-article rules, and serialized entries round-trip
 * through the plain-Node slug parser format.
 */
import { describe, expect, it } from 'vitest';
import {
  buildFactPack,
  coerceCandidate,
  parseModelContent,
  pickInboundHost,
  renderDraftText,
  resolvePlan,
  serializeArticle,
  validateDraft,
  validateProspectivePublish,
  type PlanTarget,
} from '../../scripts/generate-article';
import { BLOG_ARTICLES, type BlogArticle } from './blog';
import { unwrittenSlugs } from './blogClusterPlan';
import { FEE_SUMMARY } from './fees';
import { WALK_SCORES_CITATION } from './walkScores';
import { PAGE_SEO } from './seo';

const target: PlanTarget = resolvePlan(unwrittenSlugs()[0]);

function validCandidate(): BlogArticle {
  const para =
    'Our leasing team walks renters through this decision every week, and the trade-offs are concrete rather than abstract for anyone comparing buildings around here today.';
  return {
    slug: target.slug,
    title: 'A Valid Draft Title for Testing',
    metaTitle: 'A Valid Draft Title',
    targetQuery: target.targetQuery,
    role: target.role,
    pillar: target.pillar,
    authorId: target.authorId,
    summary: Array(5).fill('Renters weighing this choice get a concrete answer here with specifics.').join(' '),
    sections: [1, 2, 3, 4].map((i) => ({
      heading: `Section heading number ${i}`,
      paragraphs: [para, para, para, para],
    })),
    faqs: [
      { question: 'Is this a question?', answer: 'Yes, and this is a self-contained answer for renters.' },
      { question: 'Another question?', answer: 'Another self-contained answer with practical detail.' },
    ],
    related: [BLOG_ARTICLES[0].slug],
    links: [{ label: 'See the neighborhood guide', href: target.internalLinks[0] }],
    sources: [
      {
        label: 'Walk Score for 165 W Superior St',
        href: 'https://www.walkscore.com/score/165-w-superior-st-chicago-il-60654',
      },
    ],
    ogCard: 'neighborhood',
    published: '2026-08-13',
    updated: '2026-08-13',
    draft: true,
  };
}

describe('coerceCandidate (untrusted model JSON)', () => {
  it('turns malformed shapes into retryable errors instead of throwing', () => {
    for (const bad of [
      null,
      'a string',
      [],
      { title: 42 },
      { title: 'x', sections: 'not an array' },
      { title: 'x', sections: [{ paragraphs: 'nope' }] },
      { title: 'x', sections: [], faqs: [{ question: 1 }], links: {}, sources: [null] },
      { title: 'x', related: [1, 2] },
    ]) {
      const res = coerceCandidate(bad, target, '2026-08-13');
      expect(res.candidate).toBeUndefined();
      expect(res.errors.length).toBeGreaterThan(0);
    }
  });

  it('accepts a well-formed response and stamps script-owned fields', () => {
    const v = validCandidate();
    const res = coerceCandidate(
      {
        title: v.title,
        metaTitle: v.metaTitle,
        summary: v.summary,
        sections: v.sections,
        faqs: v.faqs,
        links: v.links,
        sources: v.sources,
        related: v.related,
      },
      target,
      '2026-08-13',
    );
    expect(res.errors).toEqual([]);
    expect(res.candidate?.slug).toBe(target.slug);
    expect(res.candidate?.draft).toBe(true);
    expect(res.candidate?.published).toBe('2026-08-13');
  });
});

describe('parseModelContent (untrusted model text)', () => {
  it('turns non-JSON and missing content into retryable errors, never throws', () => {
    for (const bad of [undefined, null, '', '   ', 'not json', '```json\n{}\n```', '{broken']) {
      const res = parseModelContent(bad);
      expect(res.raw).toBeUndefined();
      expect(res.errors.length).toBeGreaterThan(0);
    }
  });

  it('parses valid JSON', () => {
    const res = parseModelContent('{"title":"x"}');
    expect(res.errors).toEqual([]);
    expect(res.raw).toEqual({ title: 'x' });
  });
});

describe('fact pack sourcing (no hard-coded claims)', () => {
  const pack = buildFactPack(target);

  it('carries every committed fee-table row verbatim (amounts, conditions, caps)', () => {
    for (const row of FEE_SUMMARY) {
      expect(pack).toContain(`${row.item}: ${row.amount} (${row.frequency}) \u2014 ${row.notes}`);
    }
    expect(pack).toContain(WALK_SCORES_CITATION);
  });

  it('derives property, amenity, utility, and bike claims from committed PAGE_SEO copy', () => {
    const home = PAGE_SEO['/'];
    expect(pack).toContain(home.quickAnswer ?? home.description);
    const pages = Object.values(PAGE_SEO);
    const comEd = pages.flatMap((p) => p.faqs ?? []).find((f) => /ComEd/.test(f.a));
    const bike = pages.flatMap((p) => p.faqs ?? []).find((f) => /bike storage/i.test(f.a));
    expect(comEd && pack.includes(comEd.a)).toBe(true);
    expect(bike && pack.includes(bike.a)).toBe(true);
  });
});

describe('validateDraft (published-article rules)', () => {
  it('passes a publish-ready candidate', () => {
    expect(validateDraft(validCandidate(), target)).toEqual([]);
  });

  it('rejects empty titles, empty source labels, and disallowed sources', () => {
    const a = validCandidate();
    a.title = ' ';
    a.sources = [{ label: '', href: 'https://example.com/' }];
    const errors = validateDraft(a, target);
    expect(errors.join('\n')).toMatch(/title must be nonempty/);
    expect(errors.join('\n')).toMatch(/source labels must be nonempty/);
    expect(errors.join('\n')).toMatch(/not in ALLOWED SOURCES/);
  });
});

describe('publish-readiness simulation', () => {
  it('picks a published host and the simulated publish passes the linking guards', () => {
    const a = validCandidate();
    const host = pickInboundHost(a);
    expect(BLOG_ARTICLES.some((x) => x.slug === host)).toBe(true);
    expect(() => validateProspectivePublish(a, host)).not.toThrow();
  });

  it('fails when the draft would orphan or dangle', () => {
    const a = validCandidate();
    a.related = ['not-a-real-slug'];
    expect(() => validateProspectivePublish(a, pickInboundHost(a))).toThrow(/relates to unpublished/);
  });
});

describe('draft .txt attachment rendering', () => {
  it('contains the full article text and the three publish edits, and disclaims authority', () => {
    const a = validCandidate();
    const host = pickInboundHost(a);
    const txt = renderDraftText(a, host);
    expect(txt).toContain(a.title);
    expect(txt).toContain(a.summary);
    expect(txt).toContain(a.sections[0].paragraphs[0]);
    expect(txt).toContain(a.faqs[0].question);
    expect(txt).toContain('never publish authority');
    expect(txt).toContain('remove `draft: true`');
    expect(txt).toContain(`related: list of '${host}'`);
    expect(txt).toContain(`/blog/${a.slug} rewrite pair`);
  });
});

describe('serialization format', () => {
  it('starts entries with slug then title and escapes non-ASCII', () => {
    const a = validCandidate();
    a.title = 'Renter\u2019s Guide \u2014 Test';
    const out = serializeArticle(a, target, pickInboundHost(a));
    expect(out).toMatch(/\{\n    slug: '[^']+',\n    title: '/);
    expect(out).toContain('\\u2019');
    expect(out).toContain('\\u2014');
    expect(out).toContain('draft: true,');
    // eslint-disable-next-line no-control-regex
    expect(/[^\x00-\x7F]/.test(out.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n'))).toBe(false);
  });

  it('escapes newlines, tabs, CR, and control chars into valid TS literals that round-trip', () => {
    const a = validCandidate();
    a.title = 'Line one\nline two';
    a.metaTitle = 'Meta\twith tab';
    a.sections[0].paragraphs[0] = 'para with\ttab and\r\nnewline plus \x01 control';
    a.faqs[0].answer = 'answer\nsplit across lines';
    a.links[0].label = 'label\nwith newline';
    const out = serializeArticle(a, target, pickInboundHost(a));
    // No raw control characters may survive inside the emitted source
    // (structural \n between lines is the only allowed control char).
    // eslint-disable-next-line no-control-regex
    expect(/[\x00-\x09\x0b-\x1f\x7f]/.test(out)).toBe(false);
    expect(out).toContain('\\u000a');
    expect(out).toContain('\\u0009');
    // Evaluating the emitted literal proves it is syntactically valid and
    // that the values round-trip (imports/typechecks would accept it).
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const arr = new Function(`return [${out}\n]`)() as BlogArticle[];
    expect(arr).toHaveLength(1);
    expect(arr[0].slug).toBe(a.slug);
    expect(arr[0].title).toBe('Line one\nline two');
    expect(arr[0].sections[0].paragraphs[0]).toContain('\t');
    expect(arr[0].sections[0].paragraphs[0]).toContain('\r\n');
    expect(arr[0].faqs[0].answer).toBe('answer\nsplit across lines');
    expect(arr[0].draft).toBe(true);
  });
});
