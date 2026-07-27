import { Link } from 'wouter';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { CATEGORIES } from '../data/floorPlans';
import {
  FLOOR_PLAN_PAGES,
  floorPlanCardTitle,
  floorPlanHubItemListJsonLd,
  floorPlanPagePath,
  planFloorPhrase,
  type FloorPlanPage,
} from '../data/floorPlanPages';
import { planSqftLabel } from '../data/floorPlans';

/**
 * Floor-plan hub (/floor-plans): a complete crawlable directory of every
 * distinct plan layout, grouped by category, each linking to its own landing
 * page. Live pricing and inventory stay on /available-units — this hub (and
 * the pages under it) documents the layouts themselves, so it is always full
 * even when nothing is available.
 */
export function FloorPlansHub() {
  return (
    <>
      <Seo path="/floor-plans" extraJsonLd={[floorPlanHubItemListJsonLd()]} />
      <div>
        <section className="pt-28 pb-12 px-4 bg-dark-section text-center">
          <div className="container mx-auto max-w-3xl">
            <p className="eyebrow mb-3 text-primary">Floor Plans</p>
            <h1 className="text-3xl md:text-4xl uppercase tracking-wider text-white mb-4">
              Every Floor Plan Layout in the Tower
            </h1>
            <p className="text-white/80 leading-relaxed">
              All {FLOOR_PLAN_PAGES.length} distinct layouts at Exhibit On Superior &mdash;
              studios, convertibles, and one-, two-, and three-bedroom homes &mdash; each with its
              plan sheet, floor range, and current availability.
            </p>
          </div>
        </section>

        <QuickAnswer path="/floor-plans" />

        <section className="px-4 pb-16">
          <div className="container mx-auto max-w-5xl">
            {CATEGORIES.map((cat) => {
              const pages = FLOOR_PLAN_PAGES.filter((fp) => fp.plan.category === cat.id);
              if (pages.length === 0) return null;
              return (
                <div key={cat.id} className="mt-12">
                  <h2 className="mb-6 border-l-2 border-primary pl-3 text-xl uppercase tracking-wider text-foreground">
                    {cat.label}
                  </h2>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pages.map((fp) => (
                      <HubCard key={fp.slug} page={fp} />
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* Citation-friendly comparison table — generated from FLOOR_PLAN_PAGES */}
            <div className="mt-16 overflow-x-auto border border-border bg-white p-6">
              <table className="w-full text-left text-sm">
                <caption className="mb-4 text-left text-lg uppercase tracking-wider text-foreground">
                  Floor Plan Comparison at Exhibit On Superior
                </caption>
                <thead>
                  <tr className="border-b border-border uppercase tracking-wider">
                    <th scope="col" className="py-2 pr-4">Floor Plan</th>
                    <th scope="col" className="py-2 pr-4">Beds / Baths</th>
                    <th scope="col" className="py-2 pr-4">Sq Ft</th>
                    <th scope="col" className="py-2">Floors</th>
                  </tr>
                </thead>
                <tbody>
                  {FLOOR_PLAN_PAGES.map((fp) => {
                    const p = fp.plan;
                    return (
                      <tr key={fp.slug} className="border-b border-border/50">
                        <th scope="row" className="py-2 pr-4 font-normal">
                          {/* aria-label carries sq ft + floor range so links to
                              different variants of the same residence line stay
                              unique for assistive tech (check:link-names). */}
                          <Link
                            href={floorPlanPagePath(fp.slug)}
                            className="text-primary underline"
                            aria-label={`${p.typeLabel} \u2014 Unit ${String(p.unit).padStart(2, '0')}, ${planSqftLabel(p)} sq ft, ${planFloorPhrase(p)}`}
                          >
                            {p.typeLabel} &mdash; Unit {String(p.unit).padStart(2, '0')}
                          </Link>
                        </th>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {p.beds > 0 ? p.beds : p.typeLabel.includes('Convertible') ? 'Convertible' : 'Studio'} / {p.baths}
                        </td>
                        <td className="py-2 pr-4">{planSqftLabel(p)}</td>
                        <td className="py-2 text-muted-foreground">{p.floorLabel.replace(/-/g, '\u2013')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-16 border-t border-border pt-8 text-center">
              <p className="text-muted-foreground">
                Looking for what you can move into right now?
              </p>
              <Link
                href="/available-units"
                className="mt-4 inline-block bg-primary px-6 py-3 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              >
                See live availability &amp; pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function HubCard({ page }: { page: FloorPlanPage }) {
  const p = page.plan;
  return (
    <li>
      <Link
        href={floorPlanPagePath(page.slug)}
        className="group flex h-full flex-col border border-border bg-white transition-colors hover:border-primary"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <img
            src={p.images.thumb}
            alt={`${p.typeLabel} floor plan diagram, ${planSqftLabel(p)} sq ft`}
            loading="lazy"
            width={600}
            height={450}
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-0 top-3 bg-primary px-3 py-1 text-xs uppercase tracking-wider text-white">
            Unit {String(p.unit).padStart(2, '0')}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          {/* Title without the floor range — the floor range renders once,
              in the line below, so extraction/screen readers hear it once. */}
          <h3 className="text-base uppercase tracking-wider text-foreground">
            {floorPlanCardTitle(page)}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {planFloorPhrase(p).replace(/^f/, 'F')}
            {!page.balcony ? ' \u00b7 No balcony' : ''}
            {page.adaUnits.length > 0 ? ' \u00b7 ADA-designated apartments' : ''}
          </p>
        </div>
      </Link>
    </li>
  );
}
