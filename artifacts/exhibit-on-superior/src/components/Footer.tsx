import { Link } from 'wouter';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-footer text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Address */}
          <div>
            <img
              src="/images/exhibit-logo-white.svg"
              alt="Exhibit On Superior"
              width={336}
              height={85}
              className="h-10 w-auto mb-4"
            />
            <div className="flex items-start gap-2 text-sm mb-2">
              <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
              <div>
                165 W Superior St<br />
                Chicago, IL 60654
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <a href="https://www.facebook.com/exhibitonsuperior" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Facebook</a>
              <a href="https://www.instagram.com/exhibitonsuperior" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a>
              <a href="https://www.youtube.com/@ExhibitonSuperior" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">YouTube</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="uppercase tracking-wider font-semibold mb-4 text-sm">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/floor-plans" className="hover:text-primary transition-colors">
                  Floor Plans
                </Link>
              </li>
              <li>
                <Link href="/photo-gallery" className="hover:text-primary transition-colors">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/virtual-tour" className="hover:text-primary transition-colors">
                  Virtual Tour
                </Link>
              </li>
              <li>
                <Link href="/amenities" className="hover:text-primary transition-colors">
                  Amenities
                </Link>
              </li>
              <li>
                <Link href="/neighborhood" className="hover:text-primary transition-colors">
                  Neighborhood
                </Link>
              </li>
            </ul>
          </div>

          {/* Additional Links */}
          <div>
            <h3 className="uppercase tracking-wider font-semibold mb-4 text-sm">More Info</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pet-friendly" className="hover:text-primary transition-colors">
                  Pet Friendly
                </Link>
              </li>
              <li>
                <Link href="/artist-in-residence" className="hover:text-primary transition-colors">
                  Artist-in-Residence
                </Link>
              </li>
              <li>
                <Link href="/map-directions" className="hover:text-primary transition-colors">
                  Map & Directions
                </Link>
              </li>
              <li>
                <Link href="/residents" className="hover:text-primary transition-colors">
                  Residents
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-primary transition-colors">
                  Reviews
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
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  312-450-0635
                </a>
              </li>
              <li>
                <a 
                  href="mailto:exhibit@highlandptrs.com" 
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  exhibit@highlandptrs.com
                </a>
              </li>
              <li>
                <Link href="/contact-us" className="btn-gold-outline inline-block mt-4">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="mb-2 md:mb-0">
            Managed by <span className="text-primary">Highland Management LLC</span>
          </p>
          <div className="flex items-center gap-4 text-white/60">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link href="/accessibility-statement" className="hover:text-white transition-colors">Accessibility Statement</Link>
          </div>
          <p className="text-white/60">
            Copyright &copy; 2026 Highland Management LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
