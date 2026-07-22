// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import {
  UnitGalleryLightbox,
  applyUrlForListing,
  contactUrlForListing,
} from './UnitGalleryLightbox';
import type { AvailableUnit } from '../../hooks/use-availability';

const LISTING = 'https://highlandrealestatepartners.appfolio.com/listings/detail/15ac6d84-747c-4aa6-9b02-ce2be59e4d69';

const unit: AvailableUnit = {
  unit: '0610',
  bedrooms: 0,
  bathrooms: 1,
  sqft: 478,
  rent: 2271,
  availableOn: '2026-10-01',
  photoUrl: 'https://images.cdn.appfolio.com/db/leads_marketing_photos/a/original.jpg',
  listingUrl: LISTING,
  videoUrl: null,
  photos: [
    'https://images.cdn.appfolio.com/db/leads_marketing_photos/a/original.jpg',
    'https://images.cdn.appfolio.com/db/leads_marketing_photos/b/original.jpg',
  ],
};

describe('listing URL derivation', () => {
  it('derives the same Apply Now and Contact Us targets as the AppFolio listing page', () => {
    expect(applyUrlForListing(LISTING)).toBe(
      'https://highlandrealestatepartners.appfolio.com/listings/rental_applications/new?listable_uid=15ac6d84-747c-4aa6-9b02-ce2be59e4d69&source=Website',
    );
    expect(contactUrlForListing(LISTING)).toBe(`${LISTING}/contact_us_form`);
  });

  it('returns null for non-listing URLs', () => {
    expect(applyUrlForListing('https://evil.example.com/listings/detail/x')).toBeNull();
    expect(contactUrlForListing('https://example.com/other')).toBeNull();
  });
});

describe('UnitGalleryLightbox', () => {
  it('moves focus into the dialog on open and restores it on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const onClose = vi.fn();
    const { getByLabelText, unmount } = render(<UnitGalleryLightbox unit={unit} onClose={onClose} />);
    expect(document.activeElement).toBe(getByLabelText('Close photo gallery'));

    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
    cleanup();
  });

  it('navigates photos with arrow keys and closes on Escape', () => {
    const onClose = vi.fn();
    const { getByAltText, unmount } = render(<UnitGalleryLightbox unit={unit} onClose={onClose} />);
    expect(getByAltText('Apartment 0610, photo 1 of 2')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(getByAltText('Apartment 0610, photo 2 of 2')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    unmount();
    cleanup();
  });

  it('traps Tab focus within the dialog', () => {
    const onClose = vi.fn();
    const { container, unmount } = render(<UnitGalleryLightbox unit={unit} onClose={onClose} />);
    const focusables = container.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    const last = focusables[focusables.length - 1];
    last.focus();

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(focusables[0]);

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    unmount();
    cleanup();
  });
});
