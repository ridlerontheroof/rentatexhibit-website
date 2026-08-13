// Keyword & cluster plan — the blog's editorial roadmap (playbook: topic
// clusters, "keywords that pay" over vanity volume).
//
// Each pillar anchors 5 cluster articles. Priority is buyer intent first:
// 1 = closest to a leasing decision, 5 = top-of-funnel awareness. The future
// generate:article pipeline picks the highest-priority `planned` slug, drafts
// against the brief (facts only from committed fact modules), and writes a
// `draft: true` article for human review — it never publishes.
//
// Slug hygiene: cluster topics deliberately avoid the transactional queries
// already owned by landing pages (/luxury-apartments-river-north,
// /apartments-near-the-loop, etc.) — blog articles target informational
// queries and link DOWN to those landing pages, never compete with them.
import type { BlogAuthorId } from './blogAuthors';
import { BLOG_ARTICLES } from './blog';

export interface ClusterArticlePlan {
  slug: string;
  workingTitle: string;
  targetQuery: string;
  intent: 'decision-support' | 'comparison' | 'informational';
  /** 1 (highest buyer intent) … 5. Drives generation order within a pillar. */
  priority: number;
  authorId: BlogAuthorId;
  /** Content brief for the (human or AI-drafting) author. */
  brief: string;
  /** Internal pages the article must link to with descriptive anchors. */
  internalLinks: string[];
}

export interface PillarPlan {
  /** Pillar article slug (also the cluster key on BlogArticle.pillar). */
  pillarSlug: string;
  pillarTitle: string;
  theme: string;
  clusters: ClusterArticlePlan[];
}

export const CLUSTER_PLAN: PillarPlan[] = [
  {
    pillarSlug: 'living-in-river-north-chicago',
    pillarTitle: 'Living in River North, Chicago: A Renter\u2019s Guide',
    theme:
      'River North living \u2014 the neighborhood pillar. Owns "living in river north" and umbrellas every neighborhood-fit question a prospective renter asks before touring.',
    clusters: [
      {
        slug: 'is-river-north-a-good-place-to-live',
        workingTitle: 'Is River North a Good Place to Live? A Property Manager\u2019s Honest Take',
        targetQuery: 'is river north a good place to live',
        intent: 'decision-support',
        priority: 1,
        authorId: 'rebbekah-hallberg',
        brief:
          'Honest pro/con from the property manager. Lead with a direct yes-for-whom answer. Use Walk Score module numbers, floor-choice guidance (floors 2\u201334), and no-deposit move-in economics. Must not overclaim quiet or affordability.',
        internalLinks: ['/available-units', '/floor-plans', '/schedule-a-tour'],
      },
      {
        slug: 'moving-to-river-north-chicago-checklist',
        workingTitle: 'Moving to River North, Chicago: A Renter\u2019s Checklist',
        targetQuery: 'moving to river north chicago',
        intent: 'decision-support',
        priority: 2,
        authorId: 'leasing-team',
        brief:
          'Step-by-step timeline: tour, apply (fees, credit thresholds, 1\u20133 day decision), budget move-in costs, ComEd + renters insurance, move-in logistics. Every dollar figure from committed fee facts.',
        internalLinks: ['/available-units', '/fees', '/schedule-a-tour'],
      },
      {
        slug: 'river-north-vs-streeterville-renters',
        workingTitle: 'River North vs. Streeterville: Which Should Renters Choose?',
        targetQuery: 'river north vs streeterville',
        intent: 'comparison',
        priority: 3,
        authorId: 'rebbekah-hallberg',
        brief:
          'Comparison for renters deciding between the two adjacent neighborhoods: transit access, walkability, building stock, lakefront vs. gallery district character. Only cite scores/transit facts from committed modules; keep Streeterville claims general and sourced.',
        internalLinks: ['/neighborhood', '/available-units'],
      },
      {
        slug: 'river-north-commute-guide',
        workingTitle: 'The River North Commute Guide: L Lines, Buses, and Airports',
        targetQuery: 'river north commute to the loop',
        intent: 'informational',
        priority: 4,
        authorId: 'leasing-team',
        brief:
          'Expand the commute table (data/commute.ts) into prose: per-destination door-to-door guidance from 165 W Superior St, car-free strategies, biking (Bike Score). All times from the committed commute module.',
        internalLinks: ['/map-directions', '/parking-transportation', '/neighborhood'],
      },
      {
        slug: 'river-north-with-a-dog',
        workingTitle: 'Living in River North with a Dog: A Practical Guide',
        targetQuery: 'river north dog friendly apartments',
        intent: 'informational',
        priority: 5,
        authorId: 'rebbekah-hallberg',
        brief:
          'Dog-owner life in the neighborhood + high-rise pet logistics. Pet fee structure from committed facts; link to the pet-friendly landing page as the transactional target. No specific dog-park claims without a source.',
        internalLinks: ['/pet-friendly', '/schedule-a-tour'],
      },
    ],
  },
  {
    pillarSlug: 'how-to-rent-an-apartment-in-chicago',
    pillarTitle: 'How to Rent an Apartment in Chicago: The Complete Guide',
    theme:
      'Chicago renting how-tos \u2014 the process pillar. Owns application/leasing-process queries where the leasing team\u2019s daily expertise is the differentiator.',
    clusters: [
      {
        slug: 'chicago-apartment-application-documents',
        workingTitle: 'What You Need to Apply for a Chicago Apartment',
        targetQuery: 'documents needed to rent an apartment chicago',
        intent: 'decision-support',
        priority: 1,
        authorId: 'leasing-team',
        brief:
          'Document checklist (ID, credit, co-signer path, insurance) with Exhibit\u2019s thresholds as the worked example. All requirements from committed facts; defer unconfirmed generalities to "varies by building".',
        internalLinks: ['/fees', '/available-units', '/schedule-a-tour'],
      },
      {
        slug: 'chicago-move-in-costs-explained',
        workingTitle: 'Move-In Costs in Chicago: What Renters Actually Pay',
        targetQuery: 'apartment move in costs chicago',
        intent: 'decision-support',
        priority: 2,
        authorId: 'leasing-team',
        brief:
          'Deposit vs. fee models, what "no security deposit" means, itemized worked example from Exhibit\u2019s committed fee schedule.',
        internalLinks: ['/fees', '/available-units'],
      },
      {
        slug: 'first-apartment-chicago-guide',
        workingTitle: 'Renting Your First Chicago Apartment: A No-Surprises Guide',
        targetQuery: 'first apartment chicago tips',
        intent: 'informational',
        priority: 3,
        authorId: 'leasing-team',
        brief:
          'First-renter walkthrough: how tours work, what leases cover, co-signer path for thinner credit files, renters insurance basics.',
        internalLinks: ['/schedule-a-tour', '/fees'],
      },
      {
        slug: 'chicago-renters-insurance-basics',
        workingTitle: 'Renters Insurance in Chicago: What Buildings Require and Why',
        targetQuery: 'renters insurance requirements chicago apartment',
        intent: 'informational',
        priority: 4,
        authorId: 'leasing-team',
        brief:
          'Explain liability-to-landlord coverage using Exhibit\u2019s $300,000 requirement as the example. External insurance claims need cited sources.',
        internalLinks: ['/fees', '/contact-us'],
      },
      {
        slug: 'when-to-start-apartment-hunting-chicago',
        workingTitle: 'When to Start Apartment Hunting in Chicago',
        targetQuery: 'how far in advance to look for apartments chicago',
        intent: 'informational',
        priority: 5,
        authorId: 'leasing-team',
        brief:
          'Timeline guidance anchored on real approval turnaround (1\u20133 business days) and availability rhythms. No seasonal-pricing claims without a source.',
        internalLinks: ['/available-units', '/schedule-a-tour'],
      },
    ],
  },
  {
    pillarSlug: 'high-rise-apartment-living-chicago',
    pillarTitle: 'High-Rise Apartment Living in Chicago: What to Know Before You Sign',
    theme:
      'High-rise living \u2014 the building-expertise pillar. Owns floor-choice, layout, and amenity queries where a 34-story tower\u2019s team has real authority.',
    clusters: [
      {
        slug: 'best-floor-high-rise-apartment',
        workingTitle: 'Which Floor Is Best in a High-Rise? A Property Manager\u2019s Guide',
        targetQuery: 'best floor to live on in a high rise',
        intent: 'decision-support',
        priority: 1,
        authorId: 'rebbekah-hallberg',
        brief:
          'Floor-band trade-offs (views, sound, elevator time, pricing direction) using Exhibit\u2019s floors 2\u201334 as the worked example. No per-floor price claims \u2014 point to live availability.',
        internalLinks: ['/available-units', '/floor-plans'],
      },
      {
        slug: 'convertible-vs-studio-apartment',
        workingTitle: 'Convertible vs. Studio Apartments: Which Layout Fits You?',
        targetQuery: 'what is a convertible apartment',
        intent: 'comparison',
        priority: 2,
        authorId: 'leasing-team',
        brief:
          'Define convertibles vs. studios with Exhibit floor-plan facts (sq ft ranges from the committed floor-plan catalog); link to both landing pages as transactional targets.',
        internalLinks: ['/studio-apartments-river-north', '/convertible-apartments-river-north'],
      },
      {
        slug: 'floor-to-ceiling-windows-living',
        workingTitle: 'Living with Floor-to-Ceiling Windows: Light, Heat, and Privacy',
        targetQuery: 'floor to ceiling windows apartment pros cons',
        intent: 'informational',
        priority: 3,
        authorId: 'rebbekah-hallberg',
        brief:
          'Practical guidance from managing a glass tower: light by exposure, shades, furniture placement. No energy-cost claims without a source.',
        internalLinks: ['/photo-gallery', '/virtual-tour'],
      },
      {
        slug: 'high-rise-amenities-worth-it',
        workingTitle: 'Which High-Rise Amenities Are Actually Worth Paying For?',
        targetQuery: 'apartment amenities worth paying for',
        intent: 'informational',
        priority: 4,
        authorId: 'rebbekah-hallberg',
        brief:
          'Usage-based take on amenity value (pool, sauna, co-working, storage) drawn from Exhibit\u2019s committed amenity facts; frame as questions to ask on any tour.',
        internalLinks: ['/amenities', '/schedule-a-tour'],
      },
      {
        slug: 'pets-in-high-rise-apartments',
        workingTitle: 'Raising a Pet in a High-Rise: What Actually Works',
        targetQuery: 'having a dog in a high rise apartment',
        intent: 'informational',
        priority: 5,
        authorId: 'leasing-team',
        brief:
          'Elevator etiquette, relief logistics, fee structures (Exhibit\u2019s committed pet facts); link to the pet-friendly landing page.',
        internalLinks: ['/pet-friendly', '/amenities'],
      },
    ],
  },
];

/** Every planned slug, for uniqueness checks and generation-order tooling. */
export const PLANNED_SLUGS: string[] = CLUSTER_PLAN.flatMap((p) => [
  p.pillarSlug,
  ...p.clusters.map((c) => c.slug),
]);

/** Planned slugs not yet published — the generation queue, in priority order. */
export function unwrittenSlugs(): string[] {
  const written = new Set(BLOG_ARTICLES.map((a) => a.slug));
  return CLUSTER_PLAN.flatMap((p) =>
    [
      { slug: p.pillarSlug, priority: 0 },
      ...p.clusters.map((c) => ({ slug: c.slug, priority: c.priority })),
    ]
      .filter((e) => !written.has(e.slug))
      .sort((a, b) => a.priority - b.priority)
      .map((e) => e.slug),
  );
}
