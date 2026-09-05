import { KnowledgeLinks } from '../components/KnowledgeLinks';
import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';

import {
  ADMIN_FEE,
  APPLICATION_FEE,
  FEE_SUMMARY,
  PARKING_FEE,
  PET_FEE_CATS,
  PET_FEE_ONE_DOG,
  PET_FEE_TWO_DOGS,
  STORAGE_FEE,
  UTILITY_BUNDLE,
  feesOfferCatalogJsonLd,
} from '../data/fees';

/**
 * Fees & Leasing Costs. Accuracy rule: every figure on this page comes from
 * live AppFolio listing data or the leasing-approved questionnaire
 * (docs/leasing-questionnaire/leasing-questionnaire.md); anything still
 * unconfirmed is explicitly deferred to the leasing team — no guesses. All
 * figures render from src/data/fees.ts (single source of truth for copy AND
 * the summary table).
 */
export function Fees() {
  return (
    <>
      <Seo path="/fees" extraJsonLd={[feesOfferCatalogJsonLd()]} />
      <div>
        <PageHero
          image="/images/image-004-012417-5732-pu4fo5.jpg"
          alt="Apartment sitting nook with colorful mosaic accent wall and floor-to-ceiling Chicago skyline views at Exhibit On Superior"
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

        {/* At-a-glance fee table — rows from src/data/fees.ts (FEE_SUMMARY) */}
        <section className="pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="overflow-x-auto border border-border bg-white p-6">
              <table className="w-full text-left text-sm">
                <caption className="mb-4 text-left text-lg uppercase tracking-wider text-foreground">
                  Fees &amp; Costs at Exhibit On Superior at a Glance
                </caption>
                <thead>
                  <tr className="border-b border-border uppercase tracking-wider">
                    <th scope="col" className="py-2 pr-4">Fee</th>
                    <th scope="col" className="py-2 pr-4">Amount</th>
                    <th scope="col" className="py-2 pr-4">Frequency</th>
                    <th scope="col" className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {FEE_SUMMARY.map((r) => (
                    <tr key={r.item} className="border-b border-border/50">
                      <th scope="row" className="py-2 pr-4 font-normal">{r.item}</th>
                      <td className="py-2 pr-4"><strong>{r.amount}</strong></td>
                      <td className="py-2 pr-4 text-muted-foreground">{r.frequency}</td>
                      <td className="py-2 text-muted-foreground">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-border p-8">
                <h2 className="text-xl uppercase tracking-wider mb-4">Application Fee</h2>
                <p className="leading-relaxed text-muted-foreground">
                  Each unit&rsquo;s listing shows its own application fee &mdash; currently{' '}
                  <strong className="text-foreground">{APPLICATION_FEE} per application</strong>. The exact fee is
                  displayed on the unit&rsquo;s secure online application before you pay anything.
                </p>
              </div>
              <div className="bg-white border border-border p-8">
                <h2 className="text-xl uppercase tracking-wider mb-4">Administration Fee &amp; Deposit</h2>
                <p className="leading-relaxed text-muted-foreground mb-4">
                  The non-refundable administration fee is{' '}
                  <strong className="text-foreground">{ADMIN_FEE} per apartment</strong>. It is fully
                  refunded if your application is denied, but retained if you choose to cancel.
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  Exhibit does <strong className="text-foreground">not</strong> currently collect a
                  security deposit.
                </p>
              </div>
              <div className="bg-white border border-border p-8 md:col-span-2">
                <h2 className="text-xl uppercase tracking-wider mb-4">Utilities &amp; Service Amenity Bundle</h2>
                <p className="leading-relaxed text-muted-foreground mb-4">
                  Each home carries a monthly Utility &amp; Service Amenity fee covering water,
                  sewer, trash, heat, air conditioning, and natural gas for cooking and the
                  clothes dryer:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">
                      Monthly Utility &amp; Service Amenity fee by floor plan
                    </caption>
                    <thead>
                      <tr className="border-b border-border uppercase tracking-wider">
                        <th scope="col" className="py-2 pr-4">Type</th>
                        <th scope="col" className="py-2 pr-4">Size</th>
                        <th scope="col" className="py-2">Monthly Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {UTILITY_BUNDLE.map((r) => (
                        <tr key={r.type} className="border-b border-border/50">
                          <td className="py-2 pr-4">{r.type}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{r.size}</td>
                          <td className="py-2">{r.fee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Electricity is billed to the resident directly by ComEd. Internet: Exhibit is
                  implementing bulk internet through a partnership with Zentro, with symmetrical
                  speeds up to 2 Gig.
                </p>
              </div>
              <div className="bg-white border border-border p-8">
                <h2 className="text-xl uppercase tracking-wider mb-4">Parking, Storage &amp; Specials</h2>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Garage parking: <strong>{PARKING_FEE}/month</strong> per unreserved space, subject to availability &mdash; see <Link href="/parking-transportation" className="text-primary underline">Parking &amp; Transportation</Link></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>On-site storage: <strong>{STORAGE_FEE}/month</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Move-in specials: no concessions offered at this time</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white border border-border p-8">
                <h2 className="text-xl uppercase tracking-wider mb-4">Pet Fees</h2>
                <p className="leading-relaxed text-muted-foreground">
                  One-time non-refundable pet fee: <strong className="text-foreground">{PET_FEE_ONE_DOG} for one
                  dog or {PET_FEE_TWO_DOGS} for two</strong> (two-dog maximum) and{' '}
                  <strong className="text-foreground">{PET_FEE_CATS} for cats</strong> (two-cat maximum). No
                  pet deposit and no monthly pet rent. Breed restrictions apply &mdash; details on
                  the <Link href="/pet-friendly" className="text-primary underline">Pet Policy</Link>{' '}
                  page. Reviewing qualification? See the{' '}
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

      <KnowledgeLinks
        slugs={[
          'what-fees-in-addition-to-rent',
          'total-move-in-cost',
          'is-there-a-security-deposit',
          'administration-fee',
          'utility-fee-by-floor-plan',
          'what-are-pet-fees',
        ]}
      />
    </>
  );
}
