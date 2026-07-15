import { PageHero } from '../components/PageHero';
import { Key, Wrench, CreditCard, FileText, Bell, Users } from 'lucide-react';

export function Residents() {
  return (
    <div>
      <PageHero
        image="/images/assets/images/image-086-work-spaces-with-blazing-fast-wifi-access-d3tr2q.jpg"
        alt="Residents | Exhibit On Superior in Chicago, Illinois"
        title="Resident Portal"
        subtitle="Everything You Need at Your Fingertips"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="eyebrow">For Current Residents</span>
          <h2 className="section-title mb-6">Welcome Home</h2>
          <p className="text-lg leading-relaxed">
            Manage your apartment, submit maintenance requests, pay rent, and stay connected with your community—all from our convenient online resident portal.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 text-center border border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Pay Rent Online</h3>
              <p className="text-sm mb-6">
                Set up automatic payments or pay manually through our secure portal. View payment history and download receipts anytime.
              </p>
              <button className="btn-gold-outline w-full">
                Pay Now
              </button>
            </div>

            <div className="bg-white p-8 text-center border border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Maintenance Requests</h3>
              <p className="text-sm mb-6">
                Submit and track maintenance requests 24/7. Upload photos and receive updates when work is completed.
              </p>
              <button className="btn-gold-outline w-full">
                Submit Request
              </button>
            </div>

            <div className="bg-white p-8 text-center border border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Package Notifications</h3>
              <p className="text-sm mb-6">
                Receive instant text or email alerts when packages arrive. Track delivery status and pickup history.
              </p>
              <button className="btn-gold-outline w-full">
                View Packages
              </button>
            </div>

            <div className="bg-white p-8 text-center border border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Lease Documents</h3>
              <p className="text-sm mb-6">
                Access your lease, renew online, and download important documents anytime from your resident account.
              </p>
              <button className="btn-gold-outline w-full">
                View Documents
              </button>
            </div>

            <div className="bg-white p-8 text-center border border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Community Updates</h3>
              <p className="text-sm mb-6">
                Stay informed about building news, upcoming events, amenity schedules, and important announcements.
              </p>
              <button className="btn-gold-outline w-full">
                View Updates
              </button>
            </div>

            <div className="bg-white p-8 text-center border border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl uppercase tracking-wider mb-3">Reserve Amenities</h3>
              <p className="text-sm mb-6">
                Book the resident lounge, co-working spaces, or other shared amenities for your events and gatherings.
              </p>
              <button className="btn-gold-outline w-full">
                Make Reservation
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl uppercase tracking-wider mb-8 text-center">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted p-6 border border-border">
              <h4 className="text-lg uppercase tracking-wider mb-3">Contact Management</h4>
              <p className="text-sm mb-4">
                Questions or concerns? Our on-site management team is here to help.
              </p>
              <p className="text-sm">
                <strong>Office Hours:</strong><br />
                Mon-Fri: 9 AM - 6 PM<br />
                Sat: 10 AM - 5 PM<br />
                Sun: 12 PM - 5 PM
              </p>
              <p className="text-sm mt-4">
                <strong>Emergency Maintenance:</strong> 312-450-0635
              </p>
            </div>

            <div className="bg-muted p-6 border border-border">
              <h4 className="text-lg uppercase tracking-wider mb-3">Move-In/Move-Out</h4>
              <p className="text-sm mb-4">
                Schedule elevator reservations and review building policies for moving day.
              </p>
              <button className="btn-gold-outline w-full">
                Schedule Move
              </button>
            </div>

            <div className="bg-muted p-6 border border-border">
              <h4 className="text-lg uppercase tracking-wider mb-3">Parking Management</h4>
              <p className="text-sm mb-4">
                Manage parking passes, visitor parking, and monthly parking accounts.
              </p>
              <button className="btn-gold-outline w-full">
                Manage Parking
              </button>
            </div>

            <div className="bg-muted p-6 border border-border">
              <h4 className="text-lg uppercase tracking-wider mb-3">Refer a Friend</h4>
              <p className="text-sm mb-4">
                Know someone looking for an apartment? Refer them and earn rewards when they lease.
              </p>
              <button className="btn-gold-outline w-full">
                Refer Now
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-dark-section">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="section-title text-white mb-6">Need Help?</h2>
          <p className="text-lg leading-relaxed mb-8">
            Our team is available to assist with any questions or technical issues with the resident portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:312-450-0635" className="btn-gold-outline inline-block">
              Call: 312-450-0635
            </a>
            <a href="mailto:exhibit@highlandptrs.com" className="btn-gold-outline inline-block">
              Email Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
