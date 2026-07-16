import { useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { Link } from 'wouter';
import { Menu, X, ChevronDown } from 'lucide-react';
import { AVAILABILITY_URL, APPLY_URL } from '../data/seo';
import { trackOutboundClick } from '../lib/analytics';

const navLink = 'text-sm uppercase tracking-wider hover:text-primary transition-colors';
const dropLink =
  'block px-4 py-2 text-sm uppercase tracking-wider hover:bg-muted transition-colors';

interface DropdownItem {
  href: string;
  label: string;
}

/** Keyboard- and screen-reader-accessible navigation dropdown. */
function NavDropdown({
  label,
  href,
  items,
  align = 'left',
}: {
  label: string;
  href: string;
  items: DropdownItem[];
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const menuId = `menu-${label.replace(/\s+/g, '-').toLowerCase()}`;

  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-1">
        <Link href={href} className={navLink}>
          {label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={`${label} submenu`}
          onClick={() => setOpen((v) => !v)}
          className="p-1 hover:text-primary transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div className={`absolute top-full pt-2 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <ul
            id={menuId}
            className="bg-white border border-border shadow-lg min-w-[200px] py-2"
          >
            {items.map((it) => (
              <li key={it.href}>
                <Link href={it.href} className={dropLink} onClick={() => setOpen(false)}>
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" aria-label="Exhibit On Superior home">
            <img
              src="/images/image-001-exhibit-on-superior-logo-color-a7pvg4.png"
              alt="Exhibit On Superior"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Primary">
            <Link href="/floor-plans" className={navLink}>
              Floor Plans
            </Link>

            <NavDropdown
              label="Photo Gallery"
              href="/photo-gallery"
              items={[{ href: '/virtual-tour', label: 'Virtual Tour' }]}
            />

            <NavDropdown
              label="Amenities"
              href="/amenities"
              items={[{ href: '/pet-friendly', label: 'Pet Friendly' }]}
            />

            <Link href="/neighborhood" className={navLink}>
              Neighborhood
            </Link>
            <Link href="/artist-in-residence" className={navLink}>
              Artist-in-Residence
            </Link>

            <NavDropdown
              label="Contact Us"
              href="/contact-us"
              align="right"
              items={[
                { href: '/map-directions', label: 'Map + Directions' },
                { href: '/residents', label: 'Residents' },
                { href: '/schedule-a-tour', label: 'Schedule a Tour' },
                { href: '/reviews', label: 'Reviews' },
              ]}
            />
          </nav>

          {/* CTA Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href={AVAILABILITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${navLink} font-semibold`}
              onClick={() => trackOutboundClick('availability', AVAILABILITY_URL, 'nav')}
            >
              Available Units
            </a>
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-outline text-sm"
              onClick={() => trackOutboundClick('apply', APPLY_URL, 'nav')}
            >
              Apply Now
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Primary"
            className="lg:hidden py-4 border-t border-border overflow-y-auto max-h-[calc(100vh-80px)]"
          >
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
                <a href={AVAILABILITY_URL} target="_blank" rel="noopener noreferrer" className="btn-gold-outline text-center" onClick={() => trackOutboundClick('availability', AVAILABILITY_URL, 'mobile_nav')}>
                  Available Units
                </a>
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn-gold-outline text-center" onClick={() => trackOutboundClick('apply', APPLY_URL, 'mobile_nav')}>
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
