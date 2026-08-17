/**
 * Stale-chunk recovery: heal an open tab that straddles a publish.
 *
 * Every publish replaces the hashed bundles in /assets; a tab loaded before
 * the publish lazy-loads route chunks by their OLD hashed names when the
 * visitor navigates. Asset retention (scripts/retain-assets.mjs) keeps the
 * previous few builds' bundles alive, but a tab older than the retention
 * window — or any other chunk-load failure — used to leave a silently broken
 * page. Recovery: reload the page ONCE so the browser picks up the current
 * HTML and its current bundles.
 *
 * The one-time guard (sessionStorage, per-URL, time-boxed) prevents reload
 * loops when the failure is not deploy skew (e.g. the visitor is offline):
 * a second failure within the window is allowed to surface as an error.
 */

const GUARD_KEY = 'stale-chunk-reload';
const GUARD_WINDOW_MS = 60_000;

/**
 * Reload once to recover from a failed chunk load. Returns true when a reload
 * was initiated (callers should then swallow the error), false when the guard
 * says we already tried recently (callers should let the error propagate).
 */
export function recoverFromStaleChunk(): boolean {
  let storage: Storage;
  try {
    storage = window.sessionStorage;
    const raw = storage.getItem(GUARD_KEY);
    if (raw) {
      const { href, at } = JSON.parse(raw) as { href: string; at: number };
      if (href === window.location.href && Date.now() - at < GUARD_WINDOW_MS) {
        return false; // already reloaded for this URL just now — don't loop
      }
    }
    storage.setItem(GUARD_KEY, JSON.stringify({ href: window.location.href, at: Date.now() }));
  } catch {
    // Storage unavailable (private mode edge cases): reloading without a
    // guard risks a loop, so surface the error instead.
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * Wrap a dynamic-import loader so a chunk-load failure triggers the one-time
 * reload instead of a broken page. While the reload is in flight the returned
 * promise stays pending, so React keeps showing the Suspense fallback rather
 * than an error. If the guard blocks the reload, the original error
 * propagates as before.
 */
export function withStaleChunkRecovery<T>(load: () => Promise<T>): () => Promise<T> {
  return () =>
    load().catch((err: unknown) => {
      if (recoverFromStaleChunk()) return new Promise<T>(() => {}); // reloading
      throw err;
    });
}

/**
 * Global safety net: Vite dispatches `vite:preloadError` when a dynamic
 * import (or one of its preloaded deps) fails to fetch — the canonical
 * post-deploy chunk-load signal. Installed once at boot (main.tsx).
 */
export function installStaleChunkRecovery(): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (recoverFromStaleChunk()) event.preventDefault(); // suppress the throw — we're reloading
  });
}
