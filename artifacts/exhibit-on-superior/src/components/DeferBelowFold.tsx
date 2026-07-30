import { startTransition, useEffect, useState, type ReactNode } from 'react';

/**
 * Renders children immediately during SSR/prerender (crawlers and the
 * static HTML always get the full page), but on the client defers them out
 * of the initial render into a React transition. Transitions are
 * time-sliced (~5 ms chunks), so heavy below-the-fold sections (e.g. the
 * 27-card floor-plan grid) stop contributing >50 ms long tasks to mobile
 * Total Blocking Time during hydration.
 *
 * Only wrap content that starts below the fold on every viewport — the
 * deferred render lands a frame or two after first paint, which is
 * invisible below the fold but would flash above it.
 */
export function DeferBelowFold({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(import.meta.env.SSR);
  useEffect(() => {
    startTransition(() => setReady(true));
  }, []);
  return ready ? <>{children}</> : null;
}
