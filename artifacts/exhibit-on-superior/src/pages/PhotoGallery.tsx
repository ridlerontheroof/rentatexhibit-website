import { useCallback, useEffect, useState } from 'react';
import { PageHero } from '../components/PageHero';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Seo } from '../components/Seo';
import { SmartImg } from '../components/SmartImg';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { galleryImages, galleryCategories as categories, photoGalleryJsonLd } from '../data/gallery';
import { useModalHistory } from '../hooks/use-modal-history';
import { DOUBLE_TAP_SCALE, usePinchZoom } from '../hooks/use-pinch-zoom';
import { useReducedMotion } from '../hooks/use-reduced-motion';


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
  } = usePinchZoom({
    // Re-attach the native wheel listener when the lightbox (re)mounts —
    // the viewer element only exists while a photo is selected.
    active: selectedImage !== null,
    // Touch gestures never end in a click, so the click-capture dismiss
    // (dismissLegendOnOutsideClick) can't run — clear the shortcut legend
    // at gesture start / swipe, matching UnitGalleryLightbox.
    onGestureStart: () => setShowShortcuts(false),
    onSwipe: (dir) => {
      setShowShortcuts(false);
      if (dir === 1) showNext();
      else showPrev();
    },
  });

  // Reset zoom whenever the shown photo changes (or the lightbox closes).
  useEffect(() => {
    resetPinch();
    resetTap();
  }, [selectedImage, resetPinch, resetTap]);

  /** Arrow-key pan step while pinch-zoomed (px), matching UnitGalleryLightbox. */
  const KEY_PAN_STEP = 60;

  useEffect(() => {
    if (selectedImage === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // First Escape dismisses the shortcut legend if it is open,
        // matching UnitGalleryLightbox.
        if (showShortcuts) {
          e.preventDefault();
          setShowShortcuts(false);
          return;
        }
        closeLightbox();
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        keyboardZoom(1);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        keyboardZoom(-1);
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        resetPinch();
        return;
      }
      if (e.key.startsWith('Arrow')) {
        // While pinch-zoomed in, arrows pan the photo instead of navigating
        // (matches UnitGalleryLightbox), so keyboard users can inspect
        // details without losing their zoom.
        if (pinchZoomed) {
          e.preventDefault();
          const dx =
            e.key === 'ArrowLeft' ? KEY_PAN_STEP : e.key === 'ArrowRight' ? -KEY_PAN_STEP : 0;
          const dy =
            e.key === 'ArrowUp' ? KEY_PAN_STEP : e.key === 'ArrowDown' ? -KEY_PAN_STEP : 0;
          panBy(dx, dy);
          return;
        }
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    selectedImage !== null,
    showPrev,
    showNext,
    closeLightbox,
    keyboardZoom,
    resetPinch,
    pinchZoomed,
    panBy,
    showShortcuts,
  ]);

  /**
   * Clicking anywhere outside the open legend dismisses it, matching
   * UnitGalleryLightbox. Runs in the capture phase so the dismissing click
   * never reaches other handlers. Clicks inside the legend and on the "?"
   * toggle are excluded so their own handlers keep working; clicks on other
   * interactive controls dismiss the legend AND perform their action.
   */
  const dismissLegendOnOutsideClick = useCallback(
    (e: React.MouseEvent) => {
      if (!showShortcuts) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('#photo-gallery-shortcuts-legend') ||
        target?.closest('[aria-controls="photo-gallery-shortcuts-legend"]')
      ) {
        return;
      }
      if (target?.closest('button, a, [role="button"]')) {
        // Interactive control: dismiss the legend but let the click through.
        setShowShortcuts(false);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setShowShortcuts(false);
    },
    [showShortcuts],
  );

  return (
    <>
      <Seo path="/photo-gallery" extraJsonLd={[photoGalleryJsonLd()]} />
      <div>
        <PageHero
          image="/images/image-033-lounge-mfioa0.jpg"
          alt="Photo Gallery | Exhibit On Superior in Chicago, Illinois"
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
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClickCapture={dismissLegendOnOutsideClick}
          >
            <button
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
            {/* Zoom toggle — visible control mirroring UnitGalleryLightbox, for
                visitors who don't know the pinch/double-tap gestures (and
                assistive tech). */}
            <button
              type="button"
              onClick={() => {
                if (pinchZoomed) {
                  resetPinch();
                } else {
                  setPinch({
                    scale: DOUBLE_TAP_SCALE,
                    ...clampPan(0, 0, DOUBLE_TAP_SCALE, 0),
                  });
                }
              }}
              className="absolute bottom-4 left-4 z-10 flex min-h-11 items-center gap-2 bg-black/60! px-3 py-2 text-xs uppercase tracking-wider text-white transition-colors hover:bg-black/80!"
              aria-label={pinchZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {pinchZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              {pinchZoomed ? 'Fit' : 'Zoom'}
            </button>

            {/* Keyboard shortcuts hint (desktop / fine-pointer only) — mirrors UnitGalleryLightbox */}
            <button
              type="button"
              onClick={() => setShowShortcuts((s) => !s)}
              aria-expanded={showShortcuts}
              aria-controls="photo-gallery-shortcuts-legend"
              aria-label={showShortcuts ? 'Hide keyboard shortcuts' : 'Show keyboard shortcuts'}
              className="absolute bottom-4 left-[7.5rem] z-10 hidden min-h-11 min-w-11 items-center justify-center bg-black/60! px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/80! pointer-fine:lg:flex"
            >
              ?
            </button>
            {showShortcuts && (
              <div
                id="photo-gallery-shortcuts-legend"
                role="region"
                aria-label="Keyboard shortcuts"
                className="absolute bottom-16 left-4 z-10 hidden w-60 bg-black/80! p-4 text-white backdrop-blur-sm pointer-fine:lg:block"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
                    Keyboard shortcuts
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowShortcuts(false)}
                    aria-label="Dismiss keyboard shortcuts"
                    className="-mr-1 -mt-1 px-1 text-white/60 transition-colors hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <dl className="space-y-1.5 text-xs">
                  {[
                    ['+ / −', 'Zoom in / out'],
                    ['0', 'Reset zoom'],
                    ['← →', 'Next / previous photo'],
                    ['Arrows', 'Pan while zoomed'],
                    ['Esc', 'Close'],
                    ['?', 'Toggle this panel'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <dt className="whitespace-nowrap border border-white/25 px-1.5 py-0.5 font-mono text-[11px] text-white/90">
                        {key}
                      </dt>
                      <dd className="text-right text-white/70">{desc}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
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
                <Link href="/virtual-tour" className="text-primary hover:underline">
                  Virtual Tour
                </Link>{' '}
                page, or browse current homes with live pricing on the{' '}
                <Link href="/available-units" className="text-primary hover:underline">
                  Available Units
                </Link>{' '}
                page and{' '}
                <Link href="/schedule-a-tour" className="text-primary hover:underline">
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
