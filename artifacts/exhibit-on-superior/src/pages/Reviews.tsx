import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { Star, Quote } from 'lucide-react';
import { SplitHeadline } from '../components/SplitHeadline';
import { useGoogleReviews } from '../hooks/use-google-reviews';
import { buildReviewsPageModel, reviewsJsonLd } from '../data/reviews';

const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps/place/Exhibit+on+Superior/@41.8953899,-87.6361029,1557m/data=!3m2!1e3!4b1!4m6!3m5!1s0x880fd34b54f928af:0xdb1555e020a513c9!8m2!3d41.8953859!4d-87.633528!16s%2Fg%2F11z14j3shz?entry=ttu&g_ep=EgoyMDI2MDcxMy4wIKXMDSoASAFQAw%3D%3D';

export function Reviews() {
  // Live quotes from the Google Business Profile (via the API server) are
  // appended after the original curated quotes; the merge logic lives in
  // data/reviews.ts so the visible content and the Review/AggregateRating
  // JSON-LD always derive from the exact same model and can never diverge.
  const { data: live } = useGoogleReviews();

  const model = buildReviewsPageModel(live);
  const { rating, reviewCount, reviews } = model;

  return (
    <>
      <Seo path="/reviews" extraJsonLd={[reviewsJsonLd(model)]} />
      <div>
        <PageHero
          image="/images/image-088-20170808-0868-1-odeo9b.jpg"
          alt="Reviews | Exhibit On Superior in Chicago, Illinois"
          titleScript="Exhibit On Superior"
          title="Reviews"
          subtitle="Reviews"
        />

        <QuickAnswer path="/reviews" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed mb-6">
              Reviews mean a lot to us at Exhibit On Superior and are the best way to let others know if our team has provided a great experience.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              The ratings below come straight from our Google Business Profile, so what you see here
              is what residents and visitors have actually posted — feedback about our River North
              apartments, the leasing and touring experience, building amenities, and day-to-day
              life at 165 W Superior St. If you&apos;ve lived at or toured Exhibit On Superior, we&apos;d love
              to hear from you too.
            </p>
          </div>
        </section>

        {/* Reviews Grid */}
        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-6xl">
            <SplitHeadline script="What Residents Say" caps="Resident Reviews" className="mb-6" />

            {/* Aggregate rating pulled from the community's Google Business Profile */}
            <div className="mb-12 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${i < Math.round(rating) ? 'fill-primary text-primary' : 'fill-primary/25 text-primary/25'}`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{rating.toFixed(1)}</span> average rating from{' '}
                <span className="font-semibold text-foreground">{reviewCount}</span> Google reviews
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {reviews.map((review) => (
                <figure
                  key={review.quote}
                  className="flex h-full flex-col border border-border bg-background p-8 text-left"
                >
                  <Quote className="mb-4 h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
                  <div className="mb-4 flex items-center gap-1" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'fill-primary/25 text-primary/25'}`}
                      />
                    ))}
                  </div>
                  <blockquote className="mb-6 flex-1 leading-relaxed text-foreground">
                    {review.quote}
                  </blockquote>
                  <figcaption className="text-sm font-semibold uppercase tracking-[1px] text-muted-foreground">
                    {review.author}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="mb-6 text-lg text-muted-foreground">Read what more of our residents are saying about us.</p>
              <a
                href={GOOGLE_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block"
              >
                Read Google Reviews
              </a>
            </div>
          </div>
        </section>

        {/* Where reviews come from */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl uppercase tracking-wider mb-6 text-center">Where These Reviews Come From</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              <p>
                The ratings and quotes above come straight from our Google Business Profile, so what
                you read here is what residents and visitors have actually posted — feedback about our
                River North apartments, the leasing and touring experience, building amenities, and
                day-to-day life at 165 W Superior St. Because the aggregate rating and the quotes are
                drawn from the same source, the star rating you see always reflects real reviews.
              </p>
              <p>
                Deciding whether Exhibit On Superior is right for you? Preview homes and amenities with
                the video and Matterport tours on the{' '}
                <Link href="/virtual-tour" className="text-primary hover:underline">
                  Virtual Tour
                </Link>{' '}
                page, browse current homes with live pricing on the{' '}
                <Link href="/available-units" className="text-primary hover:underline">
                  Available Units
                </Link>{' '}
                page, then{' '}
                <Link href="/schedule-a-tour" className="text-primary hover:underline">
                  schedule a tour
                </Link>{' '}
                to see it in person.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Embrace Unbounded City Living" caps="At Exhibit On Superior" dark className="mb-6" />
            <Link href="/contact-us" className="btn-gold-outline inline-block">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
        <FaqSection path="/reviews" />
    </>
  );
}
