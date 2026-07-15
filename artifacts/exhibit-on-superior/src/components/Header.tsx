import { useState } from 'react';
import { Link } from 'wouter';
import { Menu, X, ChevronDown } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [floorPlansOpen, setFloorPlansOpen] = useState(false);

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img
              src="/images/assets/images/image-001-exhibit-on-superior-logo-color-a7pvg4.png"
              alt="Exhibit On Superior"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-sm uppercase tracking-wider hover:text-primary transition-colors">
              Home
            </Link>
            
            {/* Floor Plans Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setFloorPlansOpen(true)}
              onMouseLeave={() => setFloorPlansOpen(false)}
            >
              <button className="text-sm uppercase tracking-wider hover:text-primary transition-colors flex items-center gap-1">
                Floor Plans
                <ChevronDown className="w-4 h-4" />
              </button>
              {floorPlansOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-border shadow-lg min-w-[200px] py-2">
                  <Link 
                    href="/floor-plans" 
                    className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    All Floor Plans
                  </Link>
                  <Link 
                    href="/floor-plans#studio" 
                    className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    Studio
                  </Link>
                  <Link 
                    href="/floor-plans#one-bed" 
                    className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    One Bedroom
                  </Link>
                  <Link 
                    href="/floor-plans#two-bed" 
                    className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    Two Bedroom
                  </Link>
                </div>
              )}
            </div>

            <Link href="/photo-gallery" className="text-sm uppercase tracking-wider hover:text-primary transition-colors">
              Gallery
            </Link>
            <Link href="/virtual-tour" className="text-sm uppercase tracking-wider hover:text-primary transition-colors">
              Virtual Tour
            </Link>
            <Link href="/amenities" className="text-sm uppercase tracking-wider hover:text-primary transition-colors">
              Amenities
            </Link>
            <Link href="/neighborhood" className="text-sm uppercase tracking-wider hover:text-primary transition-colors">
              Neighborhood
            </Link>
            <Link href="/contact" className="text-sm uppercase tracking-wider hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          {/* CTA Button - Desktop */}
          <Link href="/schedule-a-tour" className="hidden lg:block btn-gold-outline">
            Schedule Tour
          </Link>

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
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-sm uppercase tracking-wider py-2">
                Home
              </Link>
              <Link href="/floor-plans" className="text-sm uppercase tracking-wider py-2">
                Floor Plans
              </Link>
              <Link href="/photo-gallery" className="text-sm uppercase tracking-wider py-2">
                Gallery
              </Link>
              <Link href="/virtual-tour" className="text-sm uppercase tracking-wider py-2">
                Virtual Tour
              </Link>
              <Link href="/amenities" className="text-sm uppercase tracking-wider py-2">
                Amenities
              </Link>
              <Link href="/neighborhood" className="text-sm uppercase tracking-wider py-2">
                Neighborhood
              </Link>
              <Link href="/contact" className="text-sm uppercase tracking-wider py-2">
                Contact
              </Link>
              <Link href="/schedule-a-tour" className="btn-gold-outline inline-block text-center mt-2">
                Schedule Tour
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
