import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHero } from '../components/PageHero';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { LightboxShortcutControls } from '../components/LightboxShortcutControls';
import { Seo } from '../components/Seo';
import { SmartImg } from '../components/SmartImg';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { galleryImages, galleryCategories as categories, photoGalleryJsonLd } from '../data/gallery';
import { useModalHistory } from '../hooks/use-modal-history';
import { DOUBLE_TAP_SCALE, usePinchZoom } from '../hooks/use-pinch-zoom';
import { clearLegendOnTouchGestures } from '../hooks/clear-legend-on-touch-gestures';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { tabbableIn, useLightboxShortcutKeys } from '../hooks/use-lightbox-shortcut-keys';
import { useDismissLegendOnOutsideClick } from '../hooks/use-dismiss-legend-on-outside-click';


// Lightbox order: every photo on the page, album by album (in tab order), so
// arrowing from any photo walks the rest of its album and then flows into the
// next one — the whole page is browsable without closing the lightbox.
export const lightboxImages = categories
  .slice(1)
  .flatMap(category => galleryImages.filter(img => img.category === category));

export function PhotoGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('All');
  // Back-button contract: opening the lightbox pushes a history entry so the
  // phone's Back button closes it; manual closes consume that entry. All
  // close paths (X, Escape) must go through closeLightbox.
  const closeLightbox = useModalHistory(selectedImage !== null, () => setSelectedImage(null));
  const reducedMotion = useReducedMotion();

  // Desktop-only keyboard shortcut legend (toggled by the "?" button or key),
  // mirroring UnitGalleryLightbox / PlanLightbox.
  const [showShortcuts, setShowShortcuts] = useState(false);

  const filteredImages = filter === 'All' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === filter);

  const showPrev = useCallback(() => {
    setSelectedImage(i => (i === null ? i : (i - 1 + lightboxImages.length) % lightboxImages.length));
  }, []);
  const showNext = useCallback(() => {
    setSelectedImage(i => (i === null ? i : (i + 1) % lightboxImages.length));
  }, []);

  // ---------------------------------------------------------------------
  // Pinch-to-zoom / pan / double-tap / wheel / keyboard zoom gestures —
  // shared with the floor-plan and unit-photo lightboxes via usePinchZoom.
  // Swipe changes photos only while fully zoomed out.
  // ---------------------------------------------------------------------
  const {
    pinch,
    setPinch,
    pinchZoomed,
    viewerRef,
    imgRef,
    resetPinch,
    resetTap,
    clampPan,
    keyboardZoom,
    panBy,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    mouseDragging,
    isGesturing,
  } = usePinchZoom(
    // Touch gestures never end in a click, so the click-capture dismiss
    // (dismissLegendOnOutsideClick) can't run — the shared wrapper clears the
    // shortcut legend at gesture start / on swipe, matching UnitGalleryLightbox.
    clearLegendOnTouchGestures(setShowShortcuts, {
      // Re-attach the native wheel listener when the lightbox (re)mounts —
      // the viewer element only exists while a photo is selected.
      active: selectedImage !== null,
      onSwipe: (dir) => {
        if (dir === 1) showNext();
        else showPrev();
      },
    }),
  );

  // Reset zoom whenever the shown photo changes (or the lightbox closes).
  useEffect(() => {
    resetPinch();
    resetTap();
  }, [selectedImage, resetPinch, resetTap]);

  // Shared keyboard shortcuts (?, +/−, 0, arrow pan/navigate, Escape
  // dismisses the legend first) — identical to PlanLightbox and
  // UnitGalleryLightbox by construction.
  useLightboxShortcutKeys({
    active: selectedImage !== null,
    showShortcuts,
    setShowShortcuts,
    keyboardZoom,
    panBy,
    onResetZoom: resetPinch,
    // While pinch-zoomed in, arrows pan the photo instead of navigating, so
    // keyboard users can inspect details without losing their zoom.
    isArrowPanning: () => pinchZoomed,
    onNavigate: (dir) => (dir === 1 ? showNext() : showPrev()),
    onEscape: closeLightbox,
    // Tab focus trap — keyboard focus cycles within the lightbox while it is
    // open (mirrors UnitGalleryLightbox by construction).
    onOtherKey: (e) => {
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = tabbableIn(dialogRef.current);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    },
  });

  // Focus management: move focus into the lightbox on open and restore focus
  // to the grid thumbnail (opener) on close. Keyed on open/closed — not the
  // selected photo — so navigating photos doesn't yank focus around.
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lightboxOpen = selectedImage !== null;
  useEffect(() => {
    if (!lightboxOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [lightboxOpen]);

  // Clicking outside the open legend dismisses it — shared capture-phase
  // handler (see use-dismiss-legend-on-outside-click.ts for the rules),
  // identical to PlanLightbox and UnitGalleryLightbox by construction.
  const dismissLegendOnOutsideClick = useDismissLegendOnOutsideClick(
    'photo-gallery-shortcuts-legend',
    showShortcuts,
    setShowShortcuts,
  );

  return (
    <>
      <Seo path="/photo-gallery" extraJsonLd={[photoGalleryJsonLd()]} />
      <div>
        <PageHero
          image="/images/image-033-lounge-mfioa0.jpg"
          alt="Resident lounge with floor-to-ceiling windows and city views at Exhibit On Superior"
          titleScript="The Art"
          title="Of City Living"
          subtitle="Photo Gallery"
        />

        <QuickAnswer path="/photo-gallery" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed mb-6">
              Discover your next home at Exhibit On Superior and put yourself in the picture. After all, if life is art, you might as well make it a masterpiece.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Our modern apartments and curated community spaces set the standard for ideal urban living. Whether you’re an always on-the-go mover and shaker or more of a quiet homebody, you’ll find your new happy here at Exhibit On Superior.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Browse photos of our apartment interiors — open-concept layouts, modern kitchens, and
              floor-to-ceiling windows with skyline views — alongside community amenities like the
              fitness center and resident lounge, plus the River North streets right outside our
              door at 165 W Superior St. Use the filters below to jump to apartment, community, view,
              building, or lobby photos, and click any photo to view it full-screen.
            </p>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="py-8 px-4 border-b border-border">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-4 justify-center">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  aria-pressed={filter === category}
                  className={`uppercase tracking-wider text-sm px-6 py-2 transition-colors ${
                    filter === category
                      ? 'bg-primary text-white'
                      : 'border border-border hover:border-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(lightboxImages.findIndex(img => img.src === image.src))}
                  className="relative aspect-square overflow-hidden group cursor-pointer"
                >
                  <SmartImg
                    src={image.src}
                    alt={image.alt}
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    // First grid row can peek above the fold below the hero on
                    // tall screens — never lazy-load above-the-fold images.
                    // (SmartImg renders a <picture>, so eager here is safe
                    // from React 19's fixed-href auto-preload.)
                    loading={index < 4 ? 'eager' : 'lazy'}
                    // Eager-but-low: keeps the peeking first row from lazy
                    // popping in, while letting the hero (the LCP image) win
                    // the Slow-4G bandwidth race.
                    fetchPriority={index < 4 ? 'low' : undefined}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Lightbox */}
        {selectedImage !== null && (
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Photo viewer: ${lightboxImages[selectedImage].alt}`}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClickCapture={dismissLegendOnOutsideClick}
          >
            <button
              ref={closeButtonRef}
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-8 h-8" strokeWidth={1.5} />
            </button>
            <button
              onClick={showPrev}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-colors hover:border-primary hover:bg-primary hover:text-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
            </button>
            <button
              onClick={showNext}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-colors hover:border-primary hover:bg-primary hover:text-white"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
            </button>
            <div
              ref={viewerRef}
              className="flex h-full w-full items-center justify-center overflow-hidden"
              style={{ touchAction: pinchZoomed ? 'none' : 'pan-y' }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
            >
              <SmartImg
                ref={imgRef}
                src={lightboxImages[selectedImage].src}
                alt={lightboxImages[selectedImage].alt}
                sizes="100vw"
                loading="eager"
                draggable={false}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `translate(${pinch.tx}px, ${pinch.ty}px) scale(${pinch.scale})`,
                  transformOrigin: 'center center',
                  transition:
                    reducedMotion || isGesturing() || mouseDragging
                      ? 'none'
                      : 'transform 200ms ease',
                  cursor: pinchZoomed ? (mouseDragging ? 'grabbing' : 'grab') : undefined,
                }}
              />
            </div>
            {/* Shared zoom / "?" cluster + shortcut legend (mirrors PlanLightbox
                and UnitGalleryLightbox by construction). */}
            <LightboxShortcutControls
              legendId="photo-gallery-shortcuts-legend"
              showShortcuts={showShortcuts}
              onToggleShortcuts={() => setShowShortcuts((s) => !s)}
              onDismissShortcuts={() => setShowShortcuts(false)}
              zoomedIn={pinchZoomed}
              onZoomToggle={() => {
                if (pinchZoomed) {
                  resetPinch();
                } else {
                  setPinch({
                    scale: DOUBLE_TAP_SCALE,
                    ...clampPan(0, 0, DOUBLE_TAP_SCALE, 0),
                  });
                }
              }}
            />
            <div className="absolute bottom-4 left-0 right-0 text-center text-white pointer-events-none">
              <div className="uppercase tracking-[3px] text-xs text-white/70 mb-1">
                {lightboxImages[selectedImage].category}
              </div>
              <div className="text-sm">
                {selectedImage + 1} / {lightboxImages.length}
              </div>
            </div>
          </div>
        )}

        {/* What the photos show */}
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl uppercase tracking-wider mb-6 text-center">What You&apos;ll See In These Photos</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              <p>
                These photos show Exhibit On Superior&apos;s apartment interiors, amenity spaces,
                skyline views, and shared community areas at 165 W Superior St in River North.
                Inside the homes, look for open-concept layouts, modern kitchens, and floor-to-ceiling
                windows; across the amenity floor, you&apos;ll find the pool, fitness center, and resident
                lounges. Use the filters above to jump to the category you want, and click any image
                to view it full-screen.
              </p>
              <p>
                When you&apos;re ready to go beyond photos, take an interactive walkthrough on the{' '}
                <Link href="/virtual-tour" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  Virtual Tour
                </Link>{' '}
                page, or browse current homes with live pricing on the{' '}
                <Link href="/available-units" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  Available Units
                </Link>{' '}
                page and{' '}
                <Link href="/schedule-a-tour" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  schedule a tour
                </Link>{' '}
                to see it all in person.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Embrace Unbounded City Living" caps="At Exhibit On Superior" dark className="mb-6" />
            <Link href="/contact-us" className="btn-gold-outline inline-block">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
        <FaqSection path="/photo-gallery" />
    </>
  );
}
