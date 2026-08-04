import { useMemo, type ReactNode } from 'react';
import { Link } from 'wouter';
import { Seo } from '../components/Seo';
import { PageHero } from '../components/PageHero';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { KnowledgeLinks } from '../components/KnowledgeLinks';
import { SplitHeadline } from '../components/SplitHeadline';
import { useAvailability } from '../hooks/use-availability';
import { formatAvailable, formatRent } from '../components/floor-plans/AvailableUnits';
import { landingPage, unitMatchesCategories, type LandingPageDef } from '../data/landingPages';
import { COMMUTE_ROWS } from '../data/commute';
import { WALK_SCORES_CITATION } from '../data/walkScores';

/**
 * Shared template for the search-intent landing pages ("luxury apartments
 * River North", bedroom-type and "apartments near X" queries). All copy and
 * facts come from data/landingPages.ts; live availability is filtered to the
 * page's plan categories and paints from the baked snapshot during prerender
 * (same pipeline as the floor-plan landing pages).
 */
function SeoLanding({ def, hero }: { def: LandingPageDef; hero: ReactNode }) {
  const { data } = useAvailability();

  const matching = useMemo(
    () => (data?.units ?? []).filter((u) => unitMatchesCategories(u.unit, def.categories)),
    [data, def.categories],
  );

  const commuteRows = def.commuteDestinations
    ? COMMUTE_ROWS.filter((r) => def.commuteDestinations!.includes(r.destination))
    : [];

  return (
    <div>
      <Seo path={def.path} />
      {hero}

      <QuickAnswer path={def.path} />

      {/* Answer-first intro — the facts a searcher came for, in the first screen. */}
      <section className="px-4 pb-4">
        <div className="container mx-auto max-w-3xl space-y-4">
          {def.intro.map((p) => (
            <p key={p.slice(0, 40)} className="leading-relaxed text-foreground">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* Live availability for this page's residence types. */}
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-3xl">
          <SplitHeadline caps={def.availabilityHeading} className="mb-6" />
          {matching.length > 0 ? (
            <ul className="divide-y divide-border border border-border bg-white">
              {matching.map((u) => (
                <li key={u.unit}>
                  <Link
                    href={`/available-units/${u.unit}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      Apartment {u.unit}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatAvailable(u.availableOn)}
                    </span>
                    {formatRent(u.rent) && (
                      <span className="text-base font-semibold text-primary">
                        {formatRent(u.rent)}
                      </span>
                    )}
                    <span className="text-xs uppercase tracking-wider text-primary">
                      View listing &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-border bg-white px-6 py-8 text-center">
              <p className="mx-auto max-w-xl leading-relaxed text-foreground">{def.emptyNote}</p>
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/schedule-a-tour" className="btn-gold-outline text-sm">
              Schedule a Tour
            </Link>
            <Link
              href="/available-units"
              className="btn-gold-outline bg-primary text-sm text-white border-primary hover:bg-primary/90"
            >
              See All Available Units
            </Link>
          </div>
        </div>
      </section>

      {/* Substance: verified amenity / neighborhood / service facts. */}
      <section className="cv-below-fold bg-muted/40 px-4 py-14">
        <div className="container mx-auto max-w-3xl">
          <SplitHeadline caps="Why Exhibit On Superior" className="mb-8" />
          <div className="space-y-8">
            {def.highlights.map((h) => (
              <div key={h.title}>
                <h3 className="text-lg font-semibold uppercase tracking-wider text-foreground">
                  {h.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{h.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
            {WALK_SCORES_CITATION}
          </p>
        </div>
      </section>

      {/* Verified commute facts (near-X pages). */}
      {commuteRows.length > 0 && (
        <section className="cv-below-fold px-4 py-14">
          <div className="container mx-auto max-w-3xl">
            <SplitHeadline caps="Getting There From 165 W Superior" className="mb-6" />
            <div className="divide-y divide-border border-y border-border">
              {commuteRows.map((r) => (
                <div key={r.destination} className="grid gap-1 py-4 md:grid-cols-[1fr_auto] md:gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{r.destination}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{r.transit}</p>
                  </div>
                  <p className="text-sm text-foreground md:self-center">{r.time}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <KnowledgeLinks slugs={def.knowledgeSlugs} />

      <FaqSection path={def.path} />

      {/* Cross-links keep the landing-page cluster and core pages one hop apart. */}
      <section className="cv-below-fold px-4 pb-16">
        <div className="container mx-auto max-w-3xl">
          <p className="eyebrow mb-3 text-center">Keep Exploring</p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {def.related.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm uppercase tracking-wider text-primary transition-opacity hover:opacity-80"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function pageFor(path: string) {
  const def = landingPage(path);
  if (!def) throw new Error(`No landing-page definition for ${path}`);
  return def;
}

// One named export per route — routes.tsx imports these (all share this chunk).
// Each PageHero call site passes the literal image path the guard requires.
export const LuxuryRiverNorth = () => {
  const def = pageFor('/luxury-apartments-river-north');
  return (
    <SeoLanding
      def={def}
      hero={
        <PageHero
          image="/images/image-013-20170808-0861-n4esrp.jpg"
          alt={def.heroAlt}
          titleScript={def.heroScript}
          title={def.heroTitle}
          subtitle={def.heroSubtitle}
        />
      }
    />
  );
};
export const StudioRiverNorth = () => {
  const def = pageFor('/studio-apartments-river-north');
  return (
    <SeoLanding
      def={def}
      hero={
        <PageHero
          image="/images/image-014-exhibit-living-room-n5xrna.jpg"
          alt={def.heroAlt}
          titleScript={def.heroScript}
          title={def.heroTitle}
          subtitle={def.heroSubtitle}
        />
      }
    />
  );
};
export const ConvertibleRiverNorth = () => {
  const def = pageFor('/convertible-apartments-river-north');
  return (
    <SeoLanding
      def={def}
      hero={
        <PageHero
          image="/images/image-017-012417-6521-i8yuom.jpg"
          alt={def.heroAlt}
          titleScript={def.heroScript}
          title={def.heroTitle}
          subtitle={def.heroSubtitle}
        />
      }
    />
  );
};
export const OneBedroomRiverNorth = () => {
  const def = pageFor('/one-bedroom-apartments-river-north');
  return (
    <SeoLanding
      def={def}
      hero={
        <PageHero
          image="/images/image-018-lounge-with-fireplace-and-big-screen-tv-ymvrom.jpg"
          alt={def.heroAlt}
          titleScript={def.heroScript}
          title={def.heroTitle}
          subtitle={def.heroSubtitle}
        />
      }
    />
  );
};
export const TwoBedroomRiverNorth = () => {
  const def = pageFor('/two-bedroom-apartments-river-north');
  return (
    <SeoLanding
      def={def}
      hero={
        <PageHero
          image="/images/image-021-20170808-0852-sw1ncm.jpg"
          alt={def.heroAlt}
          titleScript={def.heroScript}
          title={def.heroTitle}
          subtitle={def.heroSubtitle}
        />
      }
    />
  );
};
export const NearNorthwesternMemorial = () => {
  const def = pageFor('/apartments-near-northwestern-memorial');
  return (
    <SeoLanding
      def={def}
      hero={
        <PageHero
          image="/images/image-081-20170926-1450-wmbiod.jpg"
          alt={def.heroAlt}
          titleScript={def.heroScript}
          title={def.heroTitle}
          subtitle={def.heroSubtitle}
        />
      }
    />
  );
};
export const NearMerchandiseMart = () => {
  const def = pageFor('/apartments-near-merchandise-mart');
  return (
    <SeoLanding
      def={def}
      hero={
        <PageHero
          image="/images/image-084-20170601-0076-p0s5be.jpg"
          alt={def.heroAlt}
          titleScript={def.heroScript}
          title={def.heroTitle}
          subtitle={def.heroSubtitle}
        />
      }
    />
  );
};
export const NearTheLoop = () => {
  const def = pageFor('/apartments-near-the-loop');
  return (
    <SeoLanding
      def={def}
      hero={
        <PageHero
          image="/images/image-085-30-south-kis7bz.jpg"
          alt={def.heroAlt}
          titleScript={def.heroScript}
          title={def.heroTitle}
          subtitle={def.heroSubtitle}
        />
      }
    />
  );
};
