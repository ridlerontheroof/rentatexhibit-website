import { useState } from 'react';
import { Link } from 'wouter';
import { Menu, X, ChevronDown } from 'lucide-react';

const AVAILABILITY_URL = 'https://www.highlandptrs.com/chicago-availability?search=exhibit';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const navLink = 'text-sm uppercase tracking-wider hover:text-primary transition-colors';
  const dropLink = 'block px-4 py-2 text-sm uppercase tracking-wider hover:bg-muted transition-colors';

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img
              src="/images/image-001-exhibit-on-superior-logo-color-a7pvg4.png"
              alt="Exhibit On Superior"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/floor-plans" className={navLink}>Floor Plans</Link>

            {/* Photo Gallery dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu('gallery')}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link href="/photo-gallery" className={`${navLink} flex items-center gap-1`}>
                Photo Gallery
                <ChevronDown className="w-4 h-4" />
              </Link>
              {openMenu === 'gallery' && (
                <div className="absolute top-full left-0 pt-2">
                  <div className="bg-white border border-border shadow-lg min-w-[200px] py-2">
                    <Link href="/virtual-tour" className={dropLink}>Virtual Tour</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Amenities dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu('amenities')}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link href="/amenities" className={`${navLink} flex items-center gap-1`}>
                Amenities
                <ChevronDown className="w-4 h-4" />
              </Link>
              {openMenu === 'amenities' && (
                <div className="absolute top-full left-0 pt-2">
                  <div className="bg-white border border-border shadow-lg min-w-[200px] py-2">
                    <Link href="/pet-friendly" className={dropLink}>Pet Friendly</Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/neighborhood" className={navLink}>Neighborhood</Link>
            <Link href="/artist-in-residence" className={navLink}>Artist-in-Residence</Link>

            {/* Contact Us dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu('contact')}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link href="/contact-us" className={`${navLink} flex items-center gap-1`}>
                Contact Us
                <ChevronDown className="w-4 h-4" />
              </Link>
              {openMenu === 'contact' && (
                <div className="absolute top-full right-0 pt-2">
                  <div className="bg-white border border-border shadow-lg min-w-[220px] py-2">
                    <Link href="/map-directions" className={dropLink}>Map + Directions</Link>
                    <Link href="/residents" className={dropLink}>Residents</Link>
                    <Link href="/schedule-a-tour" className={dropLink}>Schedule a Tour</Link>
                    <Link href="/reviews" className={dropLink}>Reviews</Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* CTA Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <a href={AVAILABILITY_URL} target="_blank" rel="noopener noreferrer" className={`${navLink} font-semibold`}>
              Available Units
            </a>
            <a href={AVAILABILITY_URL} target="_blank" rel="noopener noreferrer" className="btn-gold-outline text-sm">
              Apply Now
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border overflow-y-auto max-h-[calc(100vh-80px)]">
            <div className="flex flex-col gap-4" onClick={() => setMobileMenuOpen(false)}>
              <Link href="/floor-plans" className="text-sm uppercase tracking-wider py-2">Floor Plans</Link>
              <Link href="/photo-gallery" className="text-sm uppercase tracking-wider py-2">Photo Gallery</Link>
              <Link href="/virtual-tour" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Virtual Tour</Link>
              <Link href="/amenities" className="text-sm uppercase tracking-wider py-2">Amenities</Link>
              <Link href="/pet-friendly" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Pet Friendly</Link>
              <Link href="/neighborhood" className="text-sm uppercase tracking-wider py-2">Neighborhood</Link>
              <Link href="/artist-in-residence" className="text-sm uppercase tracking-wider py-2">Artist-in-Residence</Link>
              <Link href="/contact-us" className="text-sm uppercase tracking-wider py-2">Contact Us</Link>
              <Link href="/map-directions" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Map + Directions</Link>
              <Link href="/residents" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Residents</Link>
              <Link href="/schedule-a-tour" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Schedule a Tour</Link>
              <Link href="/reviews" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Reviews</Link>

              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border">
                <a href={AVAILABILITY_URL} target="_blank" rel="noopener noreferrer" className="btn-gold-outline text-center">
                  Available Units
                </a>
                <a href={AVAILABILITY_URL} target="_blank" rel="noopener noreferrer" className="btn-gold-outline text-center">
                  Apply Now
                </a>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
