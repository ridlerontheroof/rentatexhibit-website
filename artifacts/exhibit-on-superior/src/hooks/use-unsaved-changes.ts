import { useEffect } from 'react';

const CONFIRM_MESSAGE =
  'You have unsaved changes in this form. If you leave now, your information will be lost. Continue?';

/**
 * Warns the user before they lose a half-filled form. Covers two cases:
 *  1. Browser unload (tab close / refresh / typing a new URL) via `beforeunload`.
 *  2. In-app SPA navigation (clicking header/footer links) via a capture-phase
 *     click interceptor that runs before wouter handles the link and blocks it
 *     if the user cancels the confirmation.
 */
export function useUnsavedChangesWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required for some browsers to trigger the native confirmation dialog.
      e.returnValue = '';
    };

    const onClickCapture = (e: MouseEvent) => {
      // Ignore modified clicks (open-in-new-tab, etc.) and non-primary buttons.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const anchor = (e.target as HTMLElement | null)?.closest('a');
      const href = anchor?.getAttribute('href');
      if (!anchor || !href) return;

      // Ignore new-tab links, downloads, external URLs, and non-navigational schemes.
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      if (
        /^(https?:)?\/\//i.test(href) ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#')
      ) {
        return;
      }

      // Internal SPA navigation: confirm before allowing wouter to navigate away.
      if (!window.confirm(CONFIRM_MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', onClickCapture, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, [enabled]);
}
