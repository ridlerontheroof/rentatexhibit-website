// @vitest-environment jsdom
// Task 463 accessibility QA: the auto-advancing hero carousel must offer an
// explicit pause control (WCAG 2.2.2 Pause, Stop, Hide) — hover/focus pausing
// alone is not enough for users who cannot hover.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { HeroSlider } from './HeroSlider';

const slides = [
  { src: '/images/image-034-012417-5663-hxwee6.jpg', alt: 'Slide A' },
  { src: '/images/image-035-012417-5680-yegi2f.jpg', alt: 'Slide B' },
  { src: '/images/image-036-012417-5793-ebbynh.jpg', alt: 'Slide C' },
];

describe('HeroSlider pause control', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('exposes a pause button that stops auto-advance and toggles to play', () => {
    const { unmount } = render(<HeroSlider slides={slides} interval={1000} />);
    try {
      const live = document.querySelector('[aria-live="polite"]')!;
      expect(live.textContent).toContain('Slide 1 of 3');

      // Auto-advances by default.
      act(() => vi.advanceTimersByTime(1000));
      expect(live.textContent).toContain('Slide 2 of 3');

      // Explicit pause stops the rotation entirely (no hover involved).
      const pause = screen.getByLabelText('Pause slideshow');
      expect(pause.getAttribute('aria-pressed')).toBe('false');
      fireEvent.click(pause);
      act(() => vi.advanceTimersByTime(5000));
      expect(live.textContent).toContain('Slide 2 of 3');

      // Button flips to a play control and resumes on demand.
      const play = screen.getByLabelText('Play slideshow');
      expect(play.getAttribute('aria-pressed')).toBe('true');
      fireEvent.click(play);
      act(() => vi.advanceTimersByTime(1000));
      expect(live.textContent).toContain('Slide 3 of 3');
    } finally {
      unmount();
    }
  });
});
