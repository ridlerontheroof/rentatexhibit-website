import { Phone, Calendar, Mail } from 'lucide-react';
import { Link } from 'wouter';

export function SideRail() {
  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-2">
      <a
        href="tel:312-450-0635"
        className="bg-primary text-white p-3 hover:bg-primary/90 transition-colors shadow-lg"
        aria-label="Call us"
        title="Call: 312-450-0635"
      >
        <Phone className="w-5 h-5" />
      </a>
      <Link
        href="/schedule-a-tour"
        className="bg-secondary text-white p-3 hover:bg-secondary/90 transition-colors shadow-lg"
        aria-label="Schedule a tour"
        title="Schedule a Tour"
      >
        <Calendar className="w-5 h-5" />
      </Link>
      <Link
        href="/contact"
        className="bg-primary text-white p-3 hover:bg-primary/90 transition-colors shadow-lg"
        aria-label="Contact us"
        title="Contact Us"
      >
        <Mail className="w-5 h-5" />
      </Link>
    </div>
  );
}
