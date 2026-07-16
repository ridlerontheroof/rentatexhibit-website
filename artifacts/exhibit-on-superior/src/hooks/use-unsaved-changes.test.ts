// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUnsavedChangesWarning } from './use-unsaved-changes';

// Track the active render so we can always unmount it and detach the hook's
// global listeners between tests (vitest globals aren't enabled here, so
// testing-library's auto-cleanup does not run on its own).
let active: ReturnType<typeof renderHook<void, { enabled: boolean }>> | null = null;

function renderGuard(enabled: boolean) {
  active = renderHook(({ enabled }) => useUnsavedChangesWarning(enabled), {
    initialProps: { enabled },
  });
  return active;
}

// A document-level listener that swallows the anchor navigation default action
// so jsdom doesn't emit "Not implemented: navigation" noise. It runs in the
// bubble phase, after the hook's capture-phase interceptor has already decided.
const swallowNavigation = (e: Event) => e.preventDefault();

beforeEach(() => {
  document.addEventListener('click', swallowNavigation, false);
});

afterEach(() => {
  active?.unmount();
  active = null;
  document.removeEventListener('click', swallowNavigation, false);
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function makeAnchor(attrs: Record<string, string>): HTMLAnchorElement {
  const a = document.createElement('a');
  for (const [key, value] of Object.entries(attrs)) {
    a.setAttribute(key, value);
  }
  a.textContent = 'link';
  document.body.appendChild(a);
  return a;
}

/**
 * Dispatch a click on `anchor` and report whether the hook's interceptor acted
 * on it. The interceptor calls `stopPropagation()` only when it decides to
 * block navigation, so that spy is the precise signal for "was intercepted".
 */
function clickAnchor(anchor: HTMLAnchorElement, init: MouseEventInit = {}) {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
  const stopPropagation = vi.spyOn(event, 'stopPropagation');
  anchor.dispatchEvent(event);
  return { event, stopPropagation };
}

function dispatchBeforeUnload(): Event {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe('useUnsavedChangesWarning', () => {
  describe('beforeunload guard', () => {
    it('warns before browser unload when the flag is true', () => {
      renderGuard(true);
      expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
    });

    it('does not warn when the flag is false', () => {
      renderGuard(false);
      expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });

    it('clears the guard after the flag flips to false (submit/reset)', () => {
      const view = renderGuard(true);
      expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

      // Simulate a successful submit/reset toggling the flag off.
      view.rerender({ enabled: false });
      expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });

    it('removes the listener entirely on unmount', () => {
      const view = renderGuard(true);
      view.unmount();
      active = null;
      expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });
  });

  describe('in-app click interceptor', () => {
    it('blocks navigation when the user cancels the confirmation', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderGuard(true);

      const anchor = makeAnchor({ href: '/floor-plans' });
      const { event, stopPropagation } = clickAnchor(anchor);

      expect(confirmSpy).toHaveBeenCalledOnce();
      expect(event.defaultPrevented).toBe(true);
      expect(stopPropagation).toHaveBeenCalled();
    });

    it('allows navigation when the user accepts the confirmation', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderGuard(true);

      const anchor = makeAnchor({ href: '/floor-plans' });
      const { stopPropagation } = clickAnchor(anchor);

      expect(confirmSpy).toHaveBeenCalledOnce();
      // The interceptor let the event through; it did not stop propagation.
      expect(stopPropagation).not.toHaveBeenCalled();
    });

    it('does not intercept internal links when the guard is disabled', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderGuard(false);

      const anchor = makeAnchor({ href: '/floor-plans' });
      const { stopPropagation } = clickAnchor(anchor);

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('links that must never be intercepted', () => {
    const cases: Array<{
      name: string;
      attrs: Record<string, string>;
      init?: MouseEventInit;
    }> = [
      { name: 'external http(s) URL', attrs: { href: 'https://example.com' } },
      { name: 'protocol-relative external URL', attrs: { href: '//example.com' } },
      { name: 'mailto link', attrs: { href: 'mailto:hello@example.com' } },
      { name: 'tel link', attrs: { href: 'tel:312-450-0635' } },
      { name: 'in-page hash anchor', attrs: { href: '#section' } },
      { name: 'new-tab link', attrs: { href: '/floor-plans', target: '_blank' } },
      { name: 'download link', attrs: { href: '/brochure.pdf', download: '' } },
    ];

    for (const { name, attrs, init } of cases) {
      it(`never intercepts a ${name}`, () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        renderGuard(true);

        const anchor = makeAnchor(attrs);
        const { stopPropagation } = clickAnchor(anchor, init);

        expect(confirmSpy).not.toHaveBeenCalled();
        expect(stopPropagation).not.toHaveBeenCalled();
      });
    }

    it('never intercepts modified clicks (open-in-new-tab, etc.)', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderGuard(true);

      const anchor = makeAnchor({ href: '/floor-plans' });
      for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
        clickAnchor(anchor, { [modifier]: true });
      }
      // Middle-click (non-primary button).
      clickAnchor(anchor, { button: 1 });

      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });
});
