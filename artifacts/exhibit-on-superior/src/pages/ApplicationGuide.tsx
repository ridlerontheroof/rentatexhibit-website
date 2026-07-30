import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { KnowledgeLinks } from '../components/KnowledgeLinks';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { CREDIT_SCORE_MIN, CREDIT_SCORE_COSIGNER_MIN } from '../data/propertyFacts';

const STEPS = [
  {
    title: 'Find your home',
    body: 'Browse live availability, pricing, photos, and move-in dates on the Available Units page — every listing syncs automatically from our leasing system.',
  },
  {
    title: 'Tour it — in person or online',
    body: 'Schedule a tour directly from the residence you\u2019re interested in on the Available Units page \u2014 every listing has its own Schedule a Tour button \u2014 or preview homes remotely with the video and Matterport tours on the Virtual Tour page.',
  },
  {
    title: 'Apply online',
    body: 'Use the Apply Now button on the residence you want — each unit links directly to its own secure online application through the AppFolio leasing system. The application fee is shown on the unit’s listing before you pay.',
  },
  {
    title: 'Verification & approval',
    body: 'The leasing team reviews your application and walks you through screening, timing, and lease signing. Pet owners acknowledge the Dog Rider and pet policy before approval.',
  },
];

export function ApplicationGuide() {
  return (
    <>
      <Seo path="/application-guide" />
      <div>
        <PageHero
          image="/images/image-003-gettyimages-1216663469-cc9uxz.jpg"
          alt="Application and Qualification Guide | Exhibit On Superior in Chicago, Illinois"
          titleScript="Make It Official"
          title="Application & Qualification Guide"
          subtitle="Application Guide"
        />

        <QuickAnswer path="/application-guide" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <SplitHeadline script="Four Simple Steps" caps="From Tour to Keys" className="mb-10" />
            <ol className="space-y-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-6 border border-border p-6 bg-white">
                  <span aria-hidden="true" className="text-3xl text-primary font-light">{i + 1}</span>
                  <div>
                    <h2 className="text-lg uppercase tracking-wider mb-2">{s.title}</h2>
                    <p className="leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="text-center mt-10">
              <Link href="/available-units" className="btn-gold-outline inline-block">
                View Available Units
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white border border-border p-8">
              <h2 className="text-xl uppercase tracking-wider mb-4">Qualification & Screening</h2>
              <ul className="space-y-3 mb-4">
                <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Credit score</strong> &mdash; minimum {CREDIT_SCORE_MIN} without a co-signer, or {CREDIT_SCORE_COSIGNER_MIN}+ with a qualified co-signer</span></li>
                <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Co-signers</strong> &mdash; qualified co-signers are accepted</span></li>
                <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Approval timeline</strong> &mdash; typically 1&ndash;3 business days</span></li>
                <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Lease terms</strong> &mdash; 12+ month terms available; short-term leases based on availability (see a leasing consultant)</span></li>
                <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Renters insurance</strong> &mdash; minimum liability-to-landlord (LLI) coverage of $300,000</span></li>
                <li className="flex items-start gap-3"><span className="text-primary mt-1">•</span><span><strong>Occupancy</strong> &mdash; Exhibit complies with Chicago Building Code occupancy requirements</span></li>
              </ul>
              <p className="leading-relaxed text-muted-foreground">
                Have a state or federal government-issued photo ID ready when you apply. Questions
                before you pay an application fee? Contact the leasing team at{' '}
                <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline">exhibit@highlandptrs.com</a>{' '}
                or <a href="tel:312-450-0635" className="text-primary underline">312-450-0635</a>.
                Reviewing costs first? See{' '}
                <Link href="/fees" className="text-primary underline">Fees &amp; Leasing Costs</Link>{' '}
                and the <Link href="/pet-friendly" className="text-primary underline">Pet Policy</Link>.
              </p>
            </div>
            <p className="mt-8 text-sm text-muted-foreground text-center max-w-3xl mx-auto">
              Exhibit On Superior complies with the federal Fair Housing
              Act and applicable state and local fair-housing laws. We do not discriminate on the
              basis of race, color, religion, national origin, sex, familial status, or disability.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Ready When You Are" caps="Start Your Application" dark className="mb-6" />
            <Link href="/available-units" className="btn-gold-outline inline-block">
              Available Units
            </Link>
          </div>
        </section>
      </div>
      <FaqSection path="/application-guide" />

      <KnowledgeLinks
        slugs={[
          'how-do-i-apply',
          'credit-score-required',
          'documents-needed',
          'lease-terms',
          'co-signers-accepted',
          'approval-time',
        ]}
      />
    </>
  );
}
