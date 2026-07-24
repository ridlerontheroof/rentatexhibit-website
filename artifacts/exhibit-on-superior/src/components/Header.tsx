import { useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { Link } from 'wouter';
import { Menu, X, ChevronDown } from 'lucide-react';
import { SmartImg } from './SmartImg';

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
                {/^https?:\/\//i.test(it.href) ? (
                  <a
                    href={it.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={dropLink}
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </a>
                ) : (
                  <Link href={it.href} className={dropLink} onClick={() => setOpen(false)}>
                    {it.label}
                  </Link>
                )}
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
          <Link href="/" className="flex-shrink-0 pr-6" aria-label="Exhibit On Superior home">
            {/* SmartImg (not a plain <img>) matters here: a plain eager <img>
                makes React 19's SSR auto-emit a high-priority preload for the
                heavy original PNG on every prerendered page. Inside SmartImg's
                <picture>, the browser fetches only a small WebP/AVIF variant
                and no PNG preload is emitted. */}
            <SmartImg
              src="/images/image-001-exhibit-on-superior-logo-color-a7pvg4.png"
              alt="Exhibit On Superior"
              sizes="140px"
              loading="eager"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Primary">

            <NavDropdown
              label="Photo Gallery"
              href="/photo-gallery"
              items={[{ href: '/virtual-tour', label: 'Virtual Tour' }]}
            />

            <NavDropdown
              label="Amenities"
              href="/amenities"
              items={[
                { href: '/pet-friendly', label: 'Pet Friendly' },
                { href: '/apartment-guide', label: 'Apartment Guide' },
              ]}
            />

            <NavDropdown
              label="Neighborhood"
              href="/neighborhood"
              items={[{ href: '/parking-transportation', label: 'Parking + Transportation' }]}
            />

            <NavDropdown
              label="Contact Us"
              href="/contact-us"
              align="right"
              items={[
                { href: '/map-directions', label: 'Map + Directions' },
                { href: '/residents', label: 'Residents' },
                { href: '/available-units', label: 'Schedule a Tour' },
                { href: '/reviews', label: 'Reviews' },
                { href: '/faq', label: 'FAQ' },
                { href: '/fees', label: 'Fees & Leasing Costs' },
                { href: '/application-guide', label: 'Application Guide' },
              ]}
            />
          </nav>

          {/* CTA Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/available-units" className="btn-gold-outline text-sm">
              Available Units
            </Link>
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
              <Link href="/available-units" className="text-sm uppercase tracking-wider py-2">Available Units</Link>
              <Link href="/photo-gallery" className="text-sm uppercase tracking-wider py-2">Photo Gallery</Link>
              <Link href="/virtual-tour" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Virtual Tour</Link>
              <Link href="/amenities" className="text-sm uppercase tracking-wider py-2">Amenities</Link>
              <Link href="/pet-friendly" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Pet Friendly</Link>
              <Link href="/apartment-guide" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Apartment Guide</Link>
              <Link href="/neighborhood" className="text-sm uppercase tracking-wider py-2">Neighborhood</Link>
              <Link href="/parking-transportation" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Parking + Transportation</Link>
              <Link href="/contact-us" className="text-sm uppercase tracking-wider py-2">Contact Us</Link>
              <Link href="/map-directions" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Map + Directions</Link>
              <Link href="/residents" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Residents</Link>
              <Link href="/available-units" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Schedule a Tour</Link>
              <Link href="/reviews" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Reviews</Link>
              <Link href="/faq" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">FAQ</Link>
              <Link href="/fees" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Fees &amp; Leasing Costs</Link>
              <Link href="/application-guide" className="text-sm uppercase tracking-wider py-2 pl-4 opacity-80">Application Guide</Link>

              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border">
                <Link href="/available-units" className="btn-gold-outline text-center">
                  Available Units
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
