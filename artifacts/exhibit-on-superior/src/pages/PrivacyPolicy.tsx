import { Seo } from '@/components/Seo';

export function PrivacyPolicy() {
  return (
    <>
      <Seo path="/privacy-policy" />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl uppercase tracking-wider mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: July 16, 2026</p>

        <div className="space-y-8 text-base leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <p>
              Exhibit On Superior is a residential apartment community managed by Highland
              Management LLC ("we," "us," or "our"). This Privacy Policy explains how we collect,
              use, and protect the information you provide when you use our website.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">Information We Collect</h2>
            <p>
              When you submit a contact form, schedule a tour, or otherwise reach out to us, we
              may collect your name, email address, phone number, move-in preferences, and any
              message you choose to share. We also collect standard technical information such as
              your browser type and pages visited to help us improve the site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To respond to your inquiries and schedule apartment tours.</li>
              <li>To share information about availability, pricing, and leasing.</li>
              <li>To improve our website and understand how visitors use it.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">How We Share Information</h2>
            <p>
              We do not sell your personal information. We may share the information you provide
              with our property management team and trusted service providers (such as our leasing and
              application platforms) solely to respond to your request and manage the leasing
              process. Applications are processed through our third-party partner, AppFolio, which
              maintains its own privacy practices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">Cookies &amp; Analytics</h2>
            <p>
              Our website may use cookies and similar technologies to remember your preferences
              and measure site performance. You can control cookies through your browser settings;
              disabling them may affect some site features.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">Data Retention &amp; Security</h2>
            <p>
              We retain contact information only as long as needed to respond to your inquiry or as
              required by law, and we use reasonable safeguards to protect it. No method of
              transmission over the internet is completely secure, so we cannot guarantee absolute
              security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">Your Choices</h2>
            <p>
              You may request access to, correction of, or deletion of the personal information you
              have provided by contacting us using the details below. You can also opt out of
              future marketing messages at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl uppercase tracking-wider">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at{' '}
              <a href="mailto:exhibit@highlandptrs.com" className="text-primary hover:underline">
                exhibit@highlandptrs.com
              </a>{' '}
              or{' '}
              <a href="tel:312-450-0635" className="text-primary hover:underline">
                312-450-0635
              </a>
              , or write to us at 165 W Superior St, Chicago, IL 60654.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
