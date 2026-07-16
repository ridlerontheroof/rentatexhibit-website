import { SmartImg } from './SmartImg';
import { SplitHeadline } from './SplitHeadline';

interface PageHeroProps {
  image: string;
  alt: string;
  /** Handwritten script intro line of the headline. */
  titleScript?: string;
  /** All-caps main line of the headline. */
  title: string;
  subtitle?: string;
}

export function PageHero({ image, alt, titleScript, title, subtitle }: PageHeroProps) {
  return (
    <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
      {/* The page hero is the LCP element on every subpage — load it eagerly. */}
      <SmartImg
        src={image}
        alt={alt}
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <SplitHeadline
            as="h1"
            script={titleScript}
            caps={title}
            dark
            className="mb-4 [&_.headline-rule]:mx-auto"
          />
          {subtitle && (
            <p className="text-lg md:text-xl max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
