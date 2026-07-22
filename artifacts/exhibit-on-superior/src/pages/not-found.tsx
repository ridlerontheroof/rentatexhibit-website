import { Link, useLocation } from 'wouter';
import { Seo } from '@/components/Seo';

export function NotFound() {
  const [location] = useLocation();

  return (
    <>
      <Seo
        path={location}
        noindex
        title="Page Not Found | Exhibit On Superior"
        description="The page you're looking for doesn't exist. Explore floor plans, amenities, and more at Exhibit On Superior in River North Chicago."
      />
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4">Error 404</p>
          <h1 className="text-4xl md:text-5xl uppercase tracking-wider mb-4">Page Not Found</h1>
          <p className="text-lg text-muted-foreground mb-8">
            The page you're looking for doesn't exist or may have moved.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/" className="btn-gold-outline inline-block">
              Return Home
            </Link>
            <Link href="/available-units" className="btn-gold-outline inline-block">
              View Available Units
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFound;
