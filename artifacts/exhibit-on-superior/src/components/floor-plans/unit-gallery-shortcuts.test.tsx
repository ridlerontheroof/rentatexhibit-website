// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';

/**
 * Keyboard-shortcut legend accuracy tests for the unit photo gallery,
 * mirroring plan-lightbox-shortcuts.test.tsx.
 *
 * The gallery shows the same desktop legend as the floor-plan lightbox
 * (toggled by the "?" button/key). If a future change adds, removes, or
 * remaps a shortcut in the key handler without updating the legend (or vice
 * versa), the visible legend silently drifts out of sync.
 */

import { UnitGalleryLightbox } from './UnitGalleryLightbox';
import type { AvailableUnit } from '../../hooks/use-availability';

const unit: AvailableUnit = {
  unit: '0610',
  bedrooms: 0,
  bathrooms: 1,
  sqft: 478,
  rent: 2271,
  availableOn: '2026-10-01',
  photoUrl: 'https://images.cdn.appfolio.com/db/leads_marketing_photos/a/original.jpg',
  listingUrl:
    'https://highlandrealestatepartners.appfolio.com/listings/detail/15ac6d84-747c-4aa6-9b02-ce2be59e4d69',
  videoUrl: null,
  photos: [
    'https://images.cdn.appfolio.com/db/leads_marketing_photos/a/original.jpg',
    'https://images.cdn.appfolio.com/db/leads_marketing_photos/b/original.jpg',
  ],
  details: [],
  marketingTitle: null,
  description: null,
};

const onClose = vi.fn();

function renderGallery() {
  return render(<UnitGalleryLightbox unit={unit} onClose={onClose} />);
}

function pressKey(key: string) {
  act(() => {
    fireEvent.keyDown(document.body, { key, bubbles: true });
  });
}

beforeEach(() => onClose.mockClear());
afterEach(() => cleanup());

describe('gallery shortcut legend contents', () => {
  it('opens via the "?" key and lists exactly the handled shortcuts', () => {
    renderGallery();
    expect(document.getElementById('gallery-shortcuts-legend')).toBeNull();

    pressKey('?');
    const legend = document.getElementById('gallery-shortcuts-legend');
    expect(legend, 'legend should appear after pressing ?').toBeTruthy();

    // The exact rows the legend advertises. If a shortcut is added, removed,
    // or remapped in the key handler, update BOTH the legend markup and this
    // list.
    const keys = Array.from(legend!.querySelectorAll('dt')).map((dt) => dt.textContent?.trim());
    expect(keys).toEqual(['+ / −', '0', '← →', 'Arrows', 'Esc', '?']);

    // "?" toggles the panel closed again — the legend's own last row.
    pressKey('?');
    expect(document.getElementById('gallery-shortcuts-legend')).toBeNull();
  });

  it('has a "?" toggle button wired to the same legend', () => {
    renderGallery();
    const btn = screen.getByRole('button', { name: /show keyboard shortcuts/i });
    expect(btn.getAttribute('aria-controls')).toBe('gallery-shortcuts-legend');
    fireEvent.click(btn);
    expect(document.getElementById('gallery-shortcuts-legend')).toBeTruthy();
    // Toggling via the button must not bubble a click into the backdrop's
    // close handler.
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('legend dismiss behavior mirrors the floor-plan lightbox', () => {
  it('Escape first closes the legend, second Escape closes the gallery', () => {
    renderGallery();
    pressKey('?');
    expect(document.getElementById('gallery-shortcuts-legend')).toBeTruthy();

    pressKey('Escape');
    expect(document.getElementById('gallery-shortcuts-legend')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    pressKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a click outside the legend dismisses it without closing the gallery', () => {
    renderGallery();
    pressKey('?');
    expect(document.getElementById('gallery-shortcuts-legend')).toBeTruthy();

    // Click on a non-interactive part of the dialog (the photo image).
    const img = document.querySelector('[role="dialog"] img')!;
    fireEvent.click(img);
    expect(document.getElementById('gallery-shortcuts-legend')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clicks inside the legend keep it open; its × button closes it', () => {
    renderGallery();
    pressKey('?');
    const legend = document.getElementById('gallery-shortcuts-legend')!;

    fireEvent.click(legend);
    expect(document.getElementById('gallery-shortcuts-legend')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /dismiss keyboard shortcuts/i }));
    expect(document.getElementById('gallery-shortcuts-legend')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});
