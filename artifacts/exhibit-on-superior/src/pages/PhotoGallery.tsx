import { useCallback, useEffect, useState } from 'react';
import { PageHero } from '../components/PageHero';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Seo } from '../components/Seo';
import { SmartImg } from '../components/SmartImg';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';
import { galleryImages, galleryCategories as categories, photoGalleryJsonLd } from '../data/gallery';


// Lightbox order: every photo on the page, album by album (in tab order), so
// arrowing from any photo walks the rest of its album and then flows into the
// next one — the whole page is browsable without closing the lightbox.
export const lightboxImages = categories
  .slice(1)
  .flatMap(category => galleryImages.filter(img => img.category === category));

export function PhotoGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const filteredImages = filter === 'All' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === filter);

  const showPrev = useCallback(() => {
    setSelectedImage(i => (i === null ? i : (i - 1 + lightboxImages.length) % lightboxImages.length));
  }, []);
  const showNext = useCallback(() => {
    setSelectedImage(i => (i === null ? i : (i + 1) % lightboxImages.length));
  }, []);

  useEffect(() => {
    if (selectedImage === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
      else if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedImage !== null, showPrev, showNext]);

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
            <p className="text-lg leading-relaxed">
              Our modern apartments and curated community spaces set the standard for ideal urban living. Whether you’re an always on-the-go mover and shaker or more of a quiet homebody, you’ll find your new happy here at Exhibit On Superior.
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
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
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
            <SmartImg
              src={lightboxImages[selectedImage].src}
              alt={lightboxImages[selectedImage].alt}
              sizes="100vw"
              loading="eager"
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              <div className="uppercase tracking-[3px] text-xs text-white/70 mb-1">
                {lightboxImages[selectedImage].category}
              </div>
              <div className="text-sm">
                {selectedImage + 1} / {lightboxImages.length}
              </div>
            </div>
          </div>
        )}

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
