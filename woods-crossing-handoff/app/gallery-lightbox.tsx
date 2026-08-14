"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryImage = {
  src: string;
  alt: string;
};

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];
  const isOpen = activeIndex !== null;

  const close = useCallback(() => setActiveIndex(null), []);
  const showNext = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? 0 : (current + 1) % images.length,
    );
  }, [images.length]);
  const showPrevious = useCallback(() => {
    setActiveIndex((current) =>
      current === null
        ? images.length - 1
        : (current - 1 + images.length) % images.length,
    );
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") showNext();
      if (event.key === "ArrowLeft") showPrevious();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [isOpen, close, showNext, showPrevious]);

  return (
    <>
      <section className="photo-grid" aria-label="Woods Crossing photos">
        {images.map((image, index) => (
          <figure key={image.src}>
            <button
              className="photo-thumb"
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Open photo ${index + 1}: ${image.alt}`}
            >
              <img src={image.src} alt={image.alt} width="800" height="600" loading="lazy" />
            </button>
            <figcaption>{image.alt}</figcaption>
          </figure>
        ))}
      </section>

      {activeImage ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery viewer"
          onClick={close}
        >
          <button
            ref={closeButtonRef}
            className="lightbox-close"
            type="button"
            onClick={close}
            aria-label="Close photo viewer"
          >
            <span aria-hidden="true">&#215;</span>
          </button>
          <button
            className="lightbox-nav lightbox-prev"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            aria-label="Previous photo"
          >
            <span aria-hidden="true">&#8249;</span>
          </button>
          <button
            className="lightbox-image-button"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label="Show next photo"
          >
            <img src={activeImage.src} alt={activeImage.alt} />
          </button>
          <button
            className="lightbox-nav lightbox-next"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label="Next photo"
          >
            <span aria-hidden="true">&#8250;</span>
          </button>
          <p className="lightbox-caption">
            {activeImage.alt} <span>{(activeIndex ?? 0) + 1} of {images.length}</span>
          </p>
        </div>
      ) : null}
    </>
  );
}
