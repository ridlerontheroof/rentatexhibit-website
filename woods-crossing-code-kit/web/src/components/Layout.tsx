import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { config } from "../data/generated";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { initAnalytics, trackPageView, trackOutboundClick } from "../lib/analytics";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location);
  }, [location]);

  const navLinks = [
    { href: "/floor-plans", label: "Floor Plans" },
    { href: "/amenities", label: "Amenities" },
    { href: "/neighborhood", label: "Neighborhood" },
    { href: "/gallery", label: "Gallery" },
    { href: "/faqs", label: "FAQs" },
    { href: "/contact", label: "Contact" },
  ];

  const brandColors = config.brand?.tokens?.colors || {};
  const brandFonts = config.brand?.tokens?.fonts || {};

  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary selection:text-primary-foreground">
      <style suppressHydrationWarning>
        {`
          :root {
            ${brandFonts.sans ? `--font-sans: ${brandFonts.sans};` : ''}
            ${brandFonts.serif ? `--font-serif: ${brandFonts.serif};` : ''}
            ${brandColors.background ? `--background: ${brandColors.background};` : ''}
            ${brandColors.foreground ? `--foreground: ${brandColors.foreground};` : ''}
            ${brandColors.primary ? `--primary: ${brandColors.primary};` : ''}
            ${brandColors.primaryForeground ? `--primary-foreground: ${brandColors.primaryForeground};` : ''}
            ${brandColors.secondary ? `--secondary: ${brandColors.secondary};` : ''}
            ${brandColors.secondaryForeground ? `--secondary-foreground: ${brandColors.secondaryForeground};` : ''}
            ${brandColors.accent ? `--accent: ${brandColors.accent};` : ''}
            ${brandColors.accentForeground ? `--accent-foreground: ${brandColors.accentForeground};` : ''}
            ${brandColors.muted ? `--muted: ${brandColors.muted};` : ''}
            ${brandColors.mutedForeground ? `--muted-foreground: ${brandColors.mutedForeground};` : ''}
          }
          .desktop-nav { display: none; }
          .mobile-toggle { display: flex; }
          .mobile-menu-overlay { display: block; }
          @media (min-width: 768px) {
            .desktop-nav { display: flex; }
            .mobile-toggle { display: none; }
            .mobile-menu-overlay { display: none !important; }
          }
        `}
      </style>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/" className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            {config.property.name}
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-nav gap-6 text-sm font-medium items-center">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`transition-colors hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5 ${location.startsWith(link.href) && link.href !== '/' ? "text-primary" : "text-muted-foreground"}`}
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="desktop-nav items-center">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-sm text-sm font-medium transition-colors bg-primary text-primary-foreground h-9 px-4 hover:bg-primary/90 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Schedule a Tour
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-toggle p-2 -mr-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div id="mobile-nav-menu" className="mobile-menu-overlay fixed inset-x-0 top-16 bottom-0 z-30 bg-background border-b overflow-y-auto">
          <nav className="flex flex-col p-6 space-y-6 text-lg font-medium">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-foreground block w-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-6 border-t mt-2">
              <Link href="/contact" className="inline-flex w-full items-center justify-center rounded-sm text-sm font-medium transition-colors bg-primary text-primary-foreground h-11 px-4 hover:bg-primary/90 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" onClick={() => setMobileMenuOpen(false)}>
                Schedule a Tour
              </Link>
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1 w-full relative z-10 flex flex-col">
        {children}
      </main>

      <footer className="border-t bg-secondary/30 mt-auto">
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-primary block mb-4">
                {config.property.name}
              </Link>
              <address className="not-italic text-sm text-muted-foreground space-y-1">
                <p>{config.nap.streetAddress}</p>
                <p>{config.nap.locality}, {config.nap.region} {config.nap.postalCode}</p>
                <p className="pt-2">
                  <a 
                    href={`tel:${config.nap.phone.replace(/[^0-9]/g, "")}`} 
                    className="hover:text-primary transition-colors"
                    onClick={() => trackOutboundClick('tour', `tel:${config.nap.phone.replace(/[^0-9]/g, "")}`, 'phone')}
                  >
                    {config.nap.phone}
                  </a>
                </p>
              </address>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/knowledge" className="hover:text-primary transition-colors">Knowledge Center</Link></li>
                <li><Link href="/neighborhood-guides" className="hover:text-primary transition-colors">Neighborhood Guides</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Journal</Link></li>
                <li><Link href="/faqs" className="hover:text-primary transition-colors">FAQs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><span className="block py-1">Equal Housing Opportunity</span></li>
                <li><span className="block py-1">Accessibility Statement</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} {config.property.name}. All rights reserved.</p>
            <p className="mt-2 md:mt-0 flex items-center gap-2">
              <span className="sr-only">Equal Housing Opportunity</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10L12 3l9 7"/><path d="M4 10v11h16V10"/><path d="M12 21V10"/></svg>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}