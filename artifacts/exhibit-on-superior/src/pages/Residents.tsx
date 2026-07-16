import { PageHero } from '../components/PageHero';
import { CreditCard, Megaphone, PartyPopper, Wrench } from 'lucide-react';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';

export function Residents() {
  return (
    <>
      <Seo path="/residents" />
      <div>
        <PageHero
          image="/images/image-086-work-spaces-with-blazing-fast-wifi-access-d3tr2q.jpg"
          alt="Residents | Exhibit On Superior in Chicago, Illinois"
          titleScript="Resident Life"
          title="Made Simple"
          subtitle="Residents"
        />

        <QuickAnswer path="/residents" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed mb-8">
              Need to pay rent, submit maintenance requests, or check community updates? You&rsquo;re in the right place. Log in to your portal and manage it all with ease.
            </p>
            <a href="https://highlandrealestatepartners.appfolio.com/connect/" target="_blank" rel="noopener noreferrer" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
              Resident Login
            </a>
          </div>
        </section>

        {/* What you can do in the portal */}
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl uppercase tracking-wider mb-10 text-center">Everything In One Place</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg uppercase tracking-wider mb-3">Pay Rent Online</h3>
                <p className="text-sm leading-relaxed">
                  Pay your rent securely online through the resident portal — no checks, stamps, or trips to the office required.
                </p>
              </div>
              <div className="bg-white p-8 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="text-lg uppercase tracking-wider mb-3">Request Maintenance</h3>
                <p className="text-sm leading-relaxed">
                  Submit maintenance requests from your phone or computer through the portal. For urgent issues, call us directly at 312-450-0635.
                </p>
              </div>
              <div className="bg-white p-8 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg uppercase tracking-wider mb-3">Community Updates</h3>
                <p className="text-sm leading-relaxed">
                  Stay current on building announcements, upcoming resident events, and community news shared through the portal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Make the most of the building */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-3 mb-6">
              <PartyPopper className="w-6 h-6 text-primary" />
              <h2 className="text-3xl uppercase tracking-wider text-center">Make The Most Of Living Here</h2>
            </div>
            <p className="text-lg leading-relaxed text-center mb-8">
              Your home extends well beyond your front door. Residents enjoy the full-floor amenity deck, 75&rsquo; lap pool, outdoor hot tub, fitness center with private training rooms, sauna and wet lounge, tech lounge, game area, private work and meeting rooms, and the private dining room and party suite.
            </p>
            <p className="text-lg leading-relaxed text-center mb-10">
              Keep an eye out for community programming, too — from live performances by our musician-in-residence to monthly sip-and-paint sessions with our visual artist through the <Link href="/artist-in-residence" className="text-primary underline">Artist-in-Residence program</Link>. Pet owners can find the dog spa, lounge, and gated outdoor dog walk covered on our <Link href="/pet-friendly" className="text-primary underline">Pet Friendly page</Link>.
            </p>
            <div className="text-center">
              <Link href="/amenities" className="btn-gold-outline inline-block">
                Explore All Amenities
              </Link>
            </div>
          </div>
        </section>

        {/* Office hours */}
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl uppercase tracking-wider mb-6">Office Hours</h2>
            <ul className="space-y-2 text-lg">
              <li>Monday – Friday: 9:00 AM – 6:00 PM</li>
              <li>Saturday: 10:00 AM – 5:00 PM</li>
              <li>Sunday: 12:00 PM – 5:00 PM</li>
            </ul>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline caps="Need Help?" dark className="mb-6" />
            <p className="text-lg leading-relaxed mb-8 text-white">
              Our team is available to assist with any questions or technical issues with the resident portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:312-450-0635" className="btn-gold-outline inline-block">
                312-450-0635
              </a>
              <a href="mailto:exhibit@highlandptrs.com" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                Email Support
              </a>
            </div>
          </div>
        </section>
      </div>
        <FaqSection path="/residents" />
    </>
  );
}
