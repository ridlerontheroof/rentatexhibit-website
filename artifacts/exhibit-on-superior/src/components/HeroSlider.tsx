import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { SmartImg } from './SmartImg';

export interface HeroSlide {
  src: string;
  alt: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  /** Overlay content (headings, CTAs) rendered above the images. */
  children?: ReactNode;
  /** Auto-advance interval in ms. Default 5000. */
  interval?: number;
  className?: string;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Accessible, auto-advancing image carousel used for the home page hero.
 * Mirrors the source rentatexhibit.com hero, which rotates through the same
 * set of community photos behind a fixed text overlay.
 */
export function HeroSlider({ slides, children, interval = 5000, className = '' }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const goTo = useCallback((i: number) => setCurrent(((i % count) + count) % count), [count]);

  const reducedMotion = useRef(false);
  useEffect(() => {
    reducedMotion.current = prefersReducedMotion();
  }, []);

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion.current) return;
    const id = window.setInterval(() => {
      setCurrent((c) => (c + 1) % count);
    }, interval);
    return () => window.clearInterval(id);
  }, [count, paused, interval]);

  return (
    <section
      className={`relative h-[600px] lg:h-[700px] overflow-hidden ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Exhibit On Superior community photo slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, i) => {
        const active = i === current;
        return (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              active ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={!active}
          >
            <SmartImg
              src={slide.src}
              alt={slide.alt}
              sizes="100vw"
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
            />
          </div>
        );
      })}

      {/* Darkening overlay for text legibility */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      {/* Overlay content (headings / CTAs) */}
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>

      {/* Live region announcing the current slide for assistive tech */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Slide ${current + 1} of ${count}: ${slides[current]?.alt ?? ''}`}
      </div>

      {count > 1 && (
        <>
          {/* Slide indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current ? 'true' : undefined}
                className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  i === current ? 'w-8 bg-primary' : 'w-2.5 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
