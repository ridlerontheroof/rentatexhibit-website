import { Link } from 'wouter';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-footer text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo & Address */}
          <div>
            <img
              src="/images/exhibit-logo-white.svg"
              alt="Exhibit On Superior"
              width={336}
              height={85}
              loading="lazy"
              className="h-10 w-auto mb-4"
            />
            <div className="flex items-start gap-2 text-sm mb-2">
              <MapPin className="w-4 h-4 mt-1 flex-shrink-0" aria-hidden="true" />
              <div>
                165 W Superior St<br />
                Chicago, IL 60654
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <a href="https://www.facebook.com/exhibitonsuperior" target="_blank" rel="noopener noreferrer" className="hover:text-primary-on-dark transition-colors">Facebook</a>
              <a href="https://www.instagram.com/exhibitonsuperior" target="_blank" rel="noopener noreferrer" className="hover:text-primary-on-dark transition-colors">Instagram</a>
              <a href="https://www.youtube.com/@ExhibitonSuperior" target="_blank" rel="noopener noreferrer" className="hover:text-primary-on-dark transition-colors">YouTube</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="uppercase tracking-wider font-semibold mb-4 text-sm">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/available-units" className="hover:text-primary-on-dark transition-colors">
                  Available Units
                </Link>
              </li>
              <li>
                <Link href="/floor-plans" className="hover:text-primary-on-dark transition-colors">
                  Floor Plans
                </Link>
              </li>
              <li>
                <Link href="/photo-gallery" className="hover:text-primary-on-dark transition-colors">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/virtual-tour" className="hover:text-primary-on-dark transition-colors">
                  Virtual Tour
                </Link>
              </li>
              <li>
                <Link href="/amenities" className="hover:text-primary-on-dark transition-colors">
                  Amenities
                </Link>
              </li>
              <li>
                <Link href="/neighborhood" className="hover:text-primary-on-dark transition-colors">
                  Neighborhood
                </Link>
              </li>
              <li>
                <Link href="/apartment-guide" className="hover:text-primary-on-dark transition-colors">
                  Apartment Guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary-on-dark transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/knowledge" className="hover:text-primary-on-dark transition-colors">
                  Knowledge Center
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary-on-dark transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Search-intent landing pages (see data/landingPages.ts) */}
          <div>
            <h3 className="uppercase tracking-wider font-semibold mb-4 text-sm">Find Apartments</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/luxury-apartments-river-north" className="hover:text-primary-on-dark transition-colors">
                  Luxury River North Apartments
                </Link>
              </li>
              <li>
                <Link href="/studio-apartments-river-north" className="hover:text-primary-on-dark transition-colors">
                  Studio Apartments
                </Link>
              </li>
              <li>
                <Link href="/convertible-apartments-river-north" className="hover:text-primary-on-dark transition-colors">
                  Convertible Apartments
                </Link>
              </li>
              <li>
                <Link href="/one-bedroom-apartments-river-north" className="hover:text-primary-on-dark transition-colors">
                  1 Bedroom Apartments
                </Link>
              </li>
              <li>
                <Link href="/two-bedroom-apartments-river-north" className="hover:text-primary-on-dark transition-colors">
                  2 Bedroom Apartments
                </Link>
              </li>
              <li>
                <Link href="/three-bedroom-apartments-river-north" className="hover:text-primary-on-dark transition-colors">
                  3 Bedroom Apartments
                </Link>
              </li>
              <li>
                <Link href="/apartments-near-northwestern-memorial" className="hover:text-primary-on-dark transition-colors">
                  Near Northwestern Memorial
                </Link>
              </li>
              <li>
                <Link href="/apartments-near-merchandise-mart" className="hover:text-primary-on-dark transition-colors">
                  Near the Merchandise Mart
                </Link>
              </li>
              <li>
                <Link href="/apartments-near-the-loop" className="hover:text-primary-on-dark transition-colors">
                  Near the Loop
                </Link>
              </li>
            </ul>
          </div>

          {/* Additional Links */}
          <div>
            <h3 className="uppercase tracking-wider font-semibold mb-4 text-sm">More Info</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary-on-dark transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/pet-friendly" className="hover:text-primary-on-dark transition-colors">
                  Pet Friendly
                </Link>
              </li>
              <li>
                <Link href="/map-directions" className="hover:text-primary-on-dark transition-colors">
                  Map & Directions
                </Link>
              </li>
              <li>
                <Link href="/residents" className="hover:text-primary-on-dark transition-colors">
                  Residents
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-primary-on-dark transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/fees" className="hover:text-primary-on-dark transition-colors">
                  Fees &amp; Leasing Costs
                </Link>
              </li>
              <li>
                <Link href="/parking-transportation" className="hover:text-primary-on-dark transition-colors">
                  Parking &amp; Transportation
                </Link>
              </li>
              <li>
                <Link href="/application-guide" className="hover:text-primary-on-dark transition-colors">
                  Application Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="uppercase tracking-wider font-semibold mb-4 text-sm">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="tel:312-450-0635" 
                  className="flex items-center gap-2 hover:text-primary-on-dark transition-colors"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  312-450-0635
                </a>
              </li>
              <li>
                <a 
                  href="mailto:exhibit@highlandptrs.com" 
                  className="flex items-center gap-2 hover:text-primary-on-dark transition-colors"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  exhibit@highlandptrs.com
                </a>
              </li>
              <li>
                <Link href="/contact-us" className="btn-gold-outline inline-block mt-4">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/schedule-a-tour" aria-label="Schedule a tour of Exhibit On Superior" className="hover:text-primary-on-dark transition-colors">
                  Schedule a Tour
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="mb-2 md:mb-0">
            <span className="text-primary-on-dark">Exhibit On Superior</span>
          </p>
          <div className="flex items-center gap-4 text-white/60">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link href="/accessibility-statement" className="hover:text-white transition-colors">Accessibility Statement</Link>
          </div>
          <p className="text-white/60">
            Copyright &copy; 2026 Exhibit On Superior
          </p>
        </div>
      </div>
    </footer>
  );
}
