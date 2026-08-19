import { Seo } from '@/components/Seo';

export function PrivacyPolicy() {
  return (
    <>
      <Seo path="/privacy-policy" />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl uppercase tracking-wider mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: August 18, 2026</p>

        <div className="space-y-8 text-base leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <p>
              Exhibit On Superior is a residential apartment community managed by its property
              management company ("we," "us," or "our"). This Privacy Policy explains how we collect,
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
              <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline underline-offset-4 hover:text-primary/80">
                exhibit@highlandptrs.com
              </a>{' '}
              or{' '}
              <a href="tel:312-450-0635" className="text-primary underline underline-offset-4 hover:text-primary/80">
                312-450-0635
              </a>
              , or write to us at 165 W Superior St, Chicago, IL 60654.
            </p>
          </section>

          {/* ─── SMS TERMS & CONDITIONS ─────────────────────────────────── */}
          <section id="sms-terms" className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-xl uppercase tracking-wider">SMS Terms &amp; Conditions</h2>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">1. Program Description</h3>
              <p>
                By opting in to receive SMS messages from Exhibit On Superior ("we," "us," "our"),
                you agree to receive text messages related to our services, including but not
                limited to appointment reminders, service updates, notifications, and customer
                support communications.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">2. Message Frequency</h3>
              <p>
                Message frequency may vary depending on your interaction with our services. You
                may receive recurring messages.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">3. Message &amp; Data Rates</h3>
              <p>
                Message and data rates may apply depending on your mobile carrier and plan.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">4. Opt-In Consent</h3>
              <p>
                By providing your mobile number and opting in, you consent to receive SMS messages
                from Exhibit On Superior. Consent is not a condition of purchase.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">5. Opt-Out Instructions</h3>
              <p>
                You can opt out at any time by replying STOP to any message. After you opt out,
                you will no longer receive SMS messages from us.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">6. Help Instructions / Customer Support</h3>
              <p>
                For assistance, reply HELP to any message or contact us directly at{' '}
                <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  exhibit@highlandptrs.com
                </a>{' '}
                or{' '}
                <a href="tel:312-450-0635" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  312-450-0635
                </a>
                .
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">7. Privacy Policy</h3>
              <p>
                Your privacy is important to us. Please review our{' '}
                <a href="#messaging-privacy-policy" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  Messaging Privacy Policy
                </a>{' '}
                below for information on how we collect, use, and protect your data in connection
                with the Messaging Service.
              </p>
            </section>
          </section>

          {/* ─── MESSAGING PRIVACY POLICY ───────────────────────────────── */}
          <section id="messaging-privacy-policy" className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-xl uppercase tracking-wider">Messaging Privacy Policy</h2>
            <p>
              This Messaging Privacy Policy explains how <strong>Exhibit On Superior</strong>{' '}
              collects and uses information about you in relation to its text message program (the
              "Messaging Service"). We use SimpleVoIP to provide the Messaging Service to you. For
              the purposes of the Messaging Service, SimpleVoIP acts as our service provider and
              data processor of your information.
            </p>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">Collection of Information</h3>
              <p>
                We collect various information on our behalf from and about you, including
                information you directly provide when you use the Messaging Service. For example,
                we collect the phone number you provided when signing up for the Messaging Service.
                When you send messages via the Messaging Service, we will also collect your
                messaging history and any information included in those messages.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">Use of Information</h3>
              <p>
                We use your information to deliver, analyze, maintain and support the Messaging
                Service. We may also use your information to enhance the Messaging Service features
                and customize and personalize your experiences on the Messaging Service.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">Sharing of Information</h3>
              <p>
                We may share, transfer, or disclose your information, if you consent to us doing
                so, as well as in the following circumstances:
              </p>
              <p>
                <strong>Service Providers.</strong> We may share your information with third parties
                to help us provide the Messaging Service to you.
              </p>
              <p>
                <strong>Legal Requirement and Protection of SimpleVoIP and Others.</strong> We may
                disclose your information as we believe such disclosure is necessary or appropriate
                to: (i) comply with applicable law and legal processes; (ii) respond to requests
                from public and government authorities, including public and government authorities
                outside your country of residence; (iii) enforce a contract with us; (iv) protect
                our rights, privacy, safety, or property, and/or that of our affiliates, you or
                others; and (v) allow us to pursue available remedies or limit the damages that we
                may sustain.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">Protection of Information</h3>
              <p>
                We take a variety of physical, technical, administrative, and organizational
                security measures based on the sensitivity of the information we collect to protect
                your information against accidental or unlawful destruction or accidental loss,
                alteration, unauthorized disclosure or access. Unfortunately, no online activity
                can be guaranteed to be 100% secure. While we strive to protect your information
                against unauthorized use or disclosure, we cannot ensure or warrant the security of
                any information you provide. We do not accept liability for unintentional
                disclosure.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">Do Not Share Statement</h3>
              <p>
                Mobile information will not be shared, sold, rented, or disclosed to third parties,
                except as required by law or necessary to provide the requested services.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">Retention of Information</h3>
              <p>
                We retain your information for as long as you participate in the Messaging Service
                or as needed to comply with applicable legal obligations. We will also retain and
                use your information as necessary to resolve disputes, protect us and our customers,
                and enforce our agreements.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">Choices and Controls</h3>
              <p>
                Consent to receive automated text messages is not a condition of any purchase.
                Message and data rates may apply. Message frequency may vary. Reply STOP to
                unsubscribe. Reply HELP for help. You can opt-out of receiving further commercial
                text messages via the Messaging Service by responding to any of our text messages
                with any of the following replies: STOP, or OPTOUT. For additional opt-out
                information, please review our{' '}
                <a href="#sms-terms" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  SMS Terms &amp; Conditions
                </a>
                .
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">Customer Care</h3>
              <p>
                If you are experiencing any problems with the Messaging Service, please email{' '}
                <a href="mailto:exhibit@highlandptrs.com" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  exhibit@highlandptrs.com
                </a>
                .
              </p>
              <p>
                By signing up to receive text messages from us, you also agree to our main Privacy
                Policy above.
              </p>
            </section>
          </section>
        </div>
      </div>
    </>
  );
}
