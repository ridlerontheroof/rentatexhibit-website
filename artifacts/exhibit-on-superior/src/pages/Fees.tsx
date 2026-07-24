import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';

/**
 * Fees & Leasing Costs. Accuracy rule: every figure on this page comes from
 * live AppFolio listing data (application fee, utilities included); anything
 * not verifiable is explicitly deferred to the leasing team — no guesses.
 */
export function Fees() {
  return (
    <>
      <Seo path="/fees" />
      <div>
        <PageHero
          image="/images/image-004-012417-5732-pu4fo5.jpg"
          alt="Fees and Leasing Costs | Exhibit On Superior in Chicago, Illinois"
          titleScript="Know Before You Apply"
          title="Fees & Leasing Costs"
          subtitle="Fees & Leasing Costs"
        />

        <QuickAnswer path="/fees" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed">
              Nobody likes surprises on a lease. Here is what we can verify from current listings
              &mdash; and exactly who to ask about everything else. Rent itself varies by floor
              plan, floor, and move-in date; live pricing for every available residence is always
              on the <Link href="/available-units" className="text-primary underline">Available Units</Link> page,
              synced from our leasing system.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-border p-8">
                <h2 className="text-xl uppercase tracking-wider mb-4">Application Fee</h2>
                <p className="leading-relaxed text-muted-foreground">
                  Each unit&rsquo;s listing shows its own application fee &mdash; recent listings
                  ranged from <strong className="text-foreground">$60 to $75 per application</strong>.
                  The exact fee is displayed on the unit&rsquo;s secure online application before
                  you pay anything.
                </p>
              </div>
              <div className="bg-white border border-border p-8">
                <h2 className="text-xl uppercase tracking-wider mb-4">Utilities Included</h2>
                <p className="leading-relaxed text-muted-foreground mb-4">
                  Current listings include the following utilities with rent:
                </p>
                <ul className="space-y-2">
                  {['Water', 'Sewer', 'Trash', 'Gas'].map((u) => (
                    <li key={u} className="flex items-start gap-3">
                      <span className="text-primary mt-1">•</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">
                  Confirm electricity, internet, and any other utility arrangements with the
                  leasing team.
                </p>
              </div>
              <div className="bg-white border border-border p-8 md:col-span-2">
                <h2 className="text-xl uppercase tracking-wider mb-4">Everything Else &mdash; Ask Us Directly</h2>
                <p className="leading-relaxed text-muted-foreground">
                  Administrative or move-in fees, security deposits, pet fees, parking rates, and
                  current move-in specials are not published on this site because they can change.
                  For accurate, up-to-date amounts, contact the leasing team at{' '}
                  <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline">exhibit@highlandptrs.com</a>{' '}
                  or <a href="tel:312-450-0635" className="text-primary underline">312-450-0635</a>{' '}
                  before you apply. See also{' '}
                  <Link href="/pet-friendly" className="text-primary underline">Pet Policy</Link>,{' '}
                  <Link href="/parking-transportation" className="text-primary underline">Parking &amp; Transportation</Link>, and the{' '}
                  <Link href="/application-guide" className="text-primary underline">Application Guide</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Questions About Costs?" caps="Talk to the Leasing Team" dark className="mb-6" />
            <Link href="/contact-us" className="btn-gold-outline inline-block">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
      <FaqSection path="/fees" />
    </>
  );
}
