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
  /**
   * Compact halves the hero height so pages whose real content lives directly
   * below (e.g. Available Units cards) keep it above the fold on short
   * laptop viewports. Default stays the full-height treatment.
   */
  compact?: boolean;
}

export function PageHero({ image, alt, titleScript, title, subtitle, compact = false }: PageHeroProps) {
  return (
    <div
      className={`relative overflow-hidden ${
        compact ? 'h-[240px] lg:h-[210px]' : 'h-[400px] lg:h-[500px]'
      }`}
    >
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
            className={`${compact ? 'mb-2' : 'mb-4'} [&_.headline-rule]:mx-auto`}
          />
          {subtitle && (
            <p
              className={
                compact
                  ? 'text-base md:text-lg max-w-2xl mx-auto'
                  : 'text-lg md:text-xl max-w-2xl mx-auto'
              }
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
