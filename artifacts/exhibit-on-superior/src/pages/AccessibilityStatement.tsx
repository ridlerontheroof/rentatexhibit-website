import { Seo } from '@/components/Seo';

export function AccessibilityStatement() {
  return (
    <>
      <Seo path="/accessibility-statement" />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl uppercase tracking-wider mb-2">Accessibility Statement</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: July 16, 2026</p>

        <div className="space-y-8 text-base leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <p>
              Exhibit On Superior and Highland Management LLC are committed to ensuring digital
              accessibility for people with disabilities. We are continually improving the user
              experience for everyone and applying the relevant accessibility standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">Our Commitment</h2>
            <p>
              We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
              These guidelines explain how to make web content more accessible to people with a
              wide range of disabilities, including visual, auditory, physical, speech, cognitive,
              and neurological disabilities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">Measures We Take</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Providing descriptive alternative text for meaningful images.</li>
              <li>Ensuring interactive elements are reachable and operable by keyboard.</li>
              <li>Using clear headings, labels, and sufficient color contrast.</li>
              <li>Announcing form validation and status messages to assistive technologies.</li>
              <li>Testing the site with keyboard navigation and screen readers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">Fair Housing</h2>
            <p>
              Exhibit On Superior is an equal housing opportunity community. We welcome all
              prospective residents and are happy to provide reasonable accommodations to make our
              housing and services accessible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">Feedback</h2>
            <p>
              We welcome your feedback on the accessibility of our website. If you encounter a
              barrier or need assistance with any part of the site, please contact us at{' '}
              <a href="mailto:exhibit@highlandptrs.com" className="text-primary hover:underline">
                exhibit@highlandptrs.com
              </a>{' '}
              or{' '}
              <a href="tel:312-450-0635" className="text-primary hover:underline">
                312-450-0635
              </a>
              . We aim to respond to accessibility feedback within five business days.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
