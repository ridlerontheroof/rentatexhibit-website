import { PageHero } from '../components/PageHero';
import { SmartImg } from '../components/SmartImg';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { CATEGORIES, planGroups } from '../data/floorPlans';
import { SQFT_MAX_DISPLAY } from '../data/propertyFacts';

/** Sourced from the owned floor-plan sheets (floorPlans.ts): sq ft range + plan count per category. */
function categorySummaries() {
  return CATEGORIES.map((c) => {
    const groups = planGroups.filter((g) => g.category === c.id);
    const min = Math.min(...groups.map((g) => g.sqftMin));
    const max = Math.max(...groups.map((g) => g.sqftMax));
    return { ...c, count: groups.length, min, max };
  });
}

const CATEGORY_BLURBS: Record<string, string> = {
  studio: 'Efficient open layouts with the same floor-to-ceiling windows and finishes as every home.',
  convertible:
    'Convertible and Jr. Convertible plans add a defined sleeping alcove without the footprint of a full one-bedroom.',
  '1br': 'One-bedroom homes across the podium, mid-rise, high-rise, and penthouse floors.',
  '2br': 'Two-bedroom plans in one- and two-bath layouts, including a 2 Bed + Den option.',
  '3br': `Three-bedroom, three-bath residences on the penthouse-level floors 30\u201334 \u2014 the largest homes in the building at up to ${SQFT_MAX_DISPLAY} sq ft.`,
};

export function ApartmentGuide() {
  const cats = categorySummaries();
  return (
    <>
      <Seo path="/apartment-guide" />
      <div>
        <PageHero
          image="/images/image-014-exhibit-living-room-n5xrna.jpg"
          alt="Apartment Guide | Exhibit On Superior in Chicago, Illinois"
          titleScript="Find Your Fit"
          title="The Exhibit Apartment Guide"
          subtitle="Apartment Guide"
        />

        <QuickAnswer path="/apartment-guide" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed mb-6">
              Every home at Exhibit On Superior starts with the same foundation: dramatic
              floor-to-ceiling windows, panoramic views of the Chicago skyline, driftwood plank
              floors throughout, and a modern kitchen with quartz countertops, tiled backsplash,
              and energy-saving stainless-steel appliances. From there, 27 floor-plan
              configurations &mdash; with floor- and line-specific variations &mdash; across floors
              2&ndash;34 let you pick the size, layout, and outlook that fits.
            </p>
            <p className="text-lg leading-relaxed">
              This guide walks through each residence type. When you&rsquo;re ready to compare
              specific plans &mdash; or see live pricing on what&rsquo;s available now &mdash; head
              to <Link href="/available-units" className="text-primary underline">Available Units</Link>.
            </p>
          </div>
        </section>

        {/* Residence types, sourced from the floor-plan dataset */}
        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <SplitHeadline script="Studio to Three Bedroom" caps="Every Residence Type" className="mb-10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cats.map((c) => (
                <div key={c.id} className="bg-white border border-border p-8">
                  <h3 className="text-xl uppercase tracking-wider mb-2">{c.label}</h3>
                  <p className="text-sm text-primary mb-4">
                    {c.count} floor plan{c.count === 1 ? '' : 's'} &middot;{' '}
                    {c.min === c.max ? `${c.min} sq ft` : `${c.min}\u2013${c.max} sq ft`}
                  </p>
                  <p className="leading-relaxed text-muted-foreground">{CATEGORY_BLURBS[c.id]}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/available-units" className="btn-gold-outline inline-block">
                Compare Floor Plans
              </Link>
            </div>
          </div>
        </section>

        {/* Finishes & features */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <SmartImg
                src="/images/image-016-012417-6396-e1vomm.jpg"
                alt="Apartment interior finishes at Exhibit On Superior in Chicago, Illinois"
                loading="eager"
                sizes="(min-width: 768px) 50vw, 100vw"
                className="w-full h-[500px] object-cover"
              />
              <div>
                <h2 className="text-2xl uppercase tracking-wider mb-6">Inside Every Home</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Floor-to-ceiling windows with skyline views &mdash; outlooks vary by floor and unit position</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Private balconies in nearly every home &mdash; only the 02 and 03 Convertible plans (units ending in 02 or 03 on floors 6&ndash;29) are without one</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>In-home washer/dryer in every residence</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Driftwood plank floors throughout &mdash; durable and pet-friendly</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Quartz countertops, tiled backsplash, undermount sinks</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Stainless-steel appliances with front-control gas range and oven, dishwasher, microwave, and garbage disposal</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Subway tile bath surround; double vanities in select units</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Closet organizers in select units</span></li>
                  <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span>Wired for 1GB internet</span></li>
                </ul>
                <p className="mt-6 text-sm text-muted-foreground">
                  On-site storage is available for $25 per month, more than 20% of homes are ADA
                  accessible, and apartments are offered unfurnished only. For details on a
                  specific residence, <Link href="/contact-us" className="text-primary underline">ask the leasing team</Link> before you apply.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Embrace Unbounded City Living" caps="At Exhibit On Superior" dark className="mb-6" />
            <Link href="/available-units" className="btn-gold-outline inline-block">
              View Available Units
            </Link>
          </div>
        </section>
      </div>
      <FaqSection path="/apartment-guide" />
    </>
  );
}
