// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { PhotoGallery } from './PhotoGallery';

// Guards the Back-button contract on the /photo-gallery lightbox — the same
// contract the /available-units floor-plan lightbox has (see
// floor-plans-close-history.test.ts):
//
// - Opening a photo pushes a history entry so Back closes the pop-up.
// - Closing with the X (or Escape) consumes that pushed entry via
//   history.back(), so one further Back press leaves the page.
// - A popstate-driven close (the Back button itself) must NOT call
//   history.back() again, or Back would double-navigate.
// - Navigating between photos inside the lightbox never touches history.
//
// jsdom + createElement (no JSX in .test.ts) + manual cleanup follow
// `.agents/memory/vitest-dom-hook-tests.md`.

let backSpy: ReturnType<typeof vi.spyOn>;
let pushSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {
    // Simulate the browser: back() pops the pushed entry and fires popstate.
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  pushSpy = vi.spyOn(window.history, 'pushState');
});

afterEach(() => {
  backSpy.mockRestore();
  pushSpy.mockRestore();
  cleanup();
  document.body.innerHTML = '';
});

function openFirstPhoto(container: HTMLElement) {
  const gridButtons = container.querySelectorAll('section button.relative');
  act(() => {
    fireEvent.click(gridButtons[0]);
  });
}

function lightboxOpen(): boolean {
  return document.querySelector('button[aria-label="Close"]') !== null;
}

function closeWithX() {
  const closeBtn = document.querySelector<HTMLButtonElement>('button[aria-label="Close"]');
  if (!closeBtn) throw new Error('Lightbox close button not found');
  act(() => {
    fireEvent.click(closeBtn);
  });
}

describe('PhotoGallery lightbox close vs. history', () => {
  it('opening pushes a history entry; closing with the X consumes it via history.back()', () => {
    const { container } = render(createElement(PhotoGallery));

    openFirstPhoto(container);
    expect(lightboxOpen()).toBe(true);
    expect(pushSpy).toHaveBeenCalledTimes(1);

    closeWithX();
    expect(lightboxOpen()).toBe(false);
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('a Back-button (popstate) close does not call history.back() again', () => {
    const { container } = render(createElement(PhotoGallery));

    openFirstPhoto(container);
    expect(lightboxOpen()).toBe(true);

    // Simulate the visitor pressing Back while the pop-up is open.
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(lightboxOpen()).toBe(false);
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('an Escape close also consumes the pushed entry', () => {
    const { container } = render(createElement(PhotoGallery));

    openFirstPhoto(container);
    expect(lightboxOpen()).toBe(true);

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(lightboxOpen()).toBe(false);
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('navigating between photos inside the lightbox never touches history', () => {
    const { container } = render(createElement(PhotoGallery));

    openFirstPhoto(container);
    expect(pushSpy).toHaveBeenCalledTimes(1);

    const next = document.querySelector<HTMLButtonElement>('button[aria-label="Next photo"]');
    if (!next) throw new Error('Next button not found');
    act(() => {
      fireEvent.click(next);
      fireEvent.click(next);
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
    });

    // Still exactly one pushed entry (the open), no pile-up.
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(backSpy).not.toHaveBeenCalled();
    expect(lightboxOpen()).toBe(true);

    closeWithX();
    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});
