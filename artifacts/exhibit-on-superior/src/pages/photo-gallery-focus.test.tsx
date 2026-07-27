// @vitest-environment jsdom
// Task 463 accessibility QA: the photo-gallery lightbox is a modal dialog —
// focus moves into it on open, Tab is trapped inside while it is open, and
// focus returns to the triggering grid thumbnail on close.
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { PhotoGallery } from './PhotoGallery';

describe('PhotoGallery lightbox focus management', () => {
  it('has dialog semantics, moves focus in on open, traps Tab, and restores focus on close', () => {
    const { unmount, container } = render(<PhotoGallery />);
    try {
      const gridButtons = container.querySelectorAll<HTMLButtonElement>('section button.relative');
      const trigger = gridButtons[2];
      trigger.focus();
      fireEvent.click(trigger);

      // Dialog semantics.
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog!.getAttribute('aria-modal')).toBe('true');
      expect(dialog!.getAttribute('aria-label')).toMatch(/^Photo viewer:/);

      // Focus moved into the dialog (onto the Close button).
      const close = screen.getByLabelText('Close');
      expect(document.activeElement).toBe(close);

      // Prev/next have accessible names.
      expect(screen.getByLabelText('Previous photo')).toBeTruthy();
      const next = screen.getByLabelText('Next photo');

      // Tab from the last focusable wraps to the first (trap forward).
      const focusables = dialog!.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const last = focusables[focusables.length - 1];
      last.focus();
      fireEvent.keyDown(window, { key: 'Tab' });
      expect(document.activeElement).toBe(focusables[0]);

      // Shift+Tab from the first wraps to the last (trap backward).
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(last);

      // Navigating photos must not yank focus around.
      next.focus();
      fireEvent.click(next);
      expect(document.activeElement).toBe(next);

      // Closing restores focus to the grid thumbnail that opened it.
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    } finally {
      unmount();
      cleanup();
    }
  });
});
