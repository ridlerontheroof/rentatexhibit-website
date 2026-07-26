// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { PhotoGallery, lightboxImages } from './PhotoGallery';

describe('PhotoGallery lightbox', () => {
  it('orders every photo on the page album-by-album with no duplicates', () => {
    expect(lightboxImages).toHaveLength(41);
    expect(new Set(lightboxImages.map(i => i.src)).size).toBe(41);
    // Albums are contiguous blocks (arrowing flows through one album, then the next).
    const seen: string[] = [];
    for (const img of lightboxImages) {
      if (seen[seen.length - 1] !== img.category) seen.push(img.category);
    }
    expect(seen).toEqual(['Apartment Gallery', 'Community Gallery', 'Views', 'Building', 'Lobby']);
  });

  // 41 render passes push past vitest's default 5s timeout when the whole
  // suite runs in parallel, so give this walk-through extra headroom.
  it('arrows through all photos from the first one, wrapping across albums, without closing', { timeout: 20_000 }, () => {
    const { unmount, container } = render(<PhotoGallery />);
    try {
      // Open the first grid photo (Lobby — last album in lightbox order).
      const gridButtons = container.querySelectorAll('section button.relative');
      fireEvent.click(gridButtons[0]);
      expect(screen.getByText(`${lightboxImages.length} / ${lightboxImages.length}`)).toBeTruthy();

      const next = screen.getByLabelText('Next photo');
      // Advancing wraps to 1 / 42 and can walk the entire page.
      fireEvent.click(next);
      expect(screen.getByText(`1 / ${lightboxImages.length}`)).toBeTruthy();
      for (let i = 0; i < lightboxImages.length - 1; i++) fireEvent.click(next);
      expect(screen.getByText(`${lightboxImages.length} / ${lightboxImages.length}`)).toBeTruthy();

      // Keyboard navigation works too.
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(screen.getByText(`1 / ${lightboxImages.length}`)).toBeTruthy();
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(screen.getByText(`${lightboxImages.length} / ${lightboxImages.length}`)).toBeTruthy();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByLabelText('Next photo')).toBeNull();
    } finally {
      unmount();
      cleanup();
    }
  });
});
