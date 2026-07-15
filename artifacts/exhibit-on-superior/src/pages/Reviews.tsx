import { PageHero } from '../components/PageHero';
import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';

export function Reviews() {
  return (
    <>
      <Helmet>
        <title>Reviews | Exhibit On Superior Chicago Apartments</title>
        <meta name="description" content="Read review-oriented content for Exhibit On Superior and connect the rebuilt page to Highland's preferred review source or Google Business Profile." />
      </Helmet>
      <div>
        <PageHero
          image="/images/image-088-20170808-0868-1-odeo9b.jpg"
          alt="Reviews | Exhibit On Superior in Chicago, Illinois"
          title="Exhibit On Superior Reviews"
          subtitle="Reviews"
        />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed mb-6">
              Reviews mean a lot to us Exhibit On Superior and are the best way to let others know if our team has provided a great experience.
            </p>
          </div>
        </section>

        {/* Reviews Grid */}
        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto max-w-6xl text-center">
            {/* Embedded Reviews via Google Business Profile Link or Widget would go here */}
            <p className="text-lg text-muted-foreground mb-8">Read what our residents are saying about us.</p>
            <a href="https://www.google.com/maps?cid=15240815771270963454" target="_blank" rel="noopener noreferrer" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
              Read Google Reviews
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="section-title text-white mb-6">Embrace Unbounded City Living At Exhibit On Superior</h2>
            <Link href="/contact-us" className="btn-gold-outline inline-block">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
