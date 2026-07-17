import { useEffect, useRef, useState } from 'react';

/**
 * Styled Google map (Maps JavaScript API) with the building marked.
 *
 * Uses the cloud Map ID for styling; requires a browser API key with the
 * Maps JavaScript API enabled. If the key is missing or Google rejects it
 * (e.g. API not enabled / referrer blocked), we fall back to the keyless
 * place-query iframe embed so the page always shows a usable map.
 */
const MAP_ID = 'e2e0a78cbc8b4008e9766676';
const CENTER = { lat: 41.8953945, lng: -87.6335254 };
const PLACE_QUERY =
  'Exhibit%20On%20Superior%2C%20165%20W%20Superior%20St%2C%20Chicago%2C%20IL%2060654';

declare const __GOOGLE_MAPS_BROWSER_KEY__: string;

const API_KEY =
  typeof __GOOGLE_MAPS_BROWSER_KEY__ !== 'undefined'
    ? __GOOGLE_MAPS_BROWSER_KEY__
    : '';

declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
  }
}

let loaderPromise: Promise<void> | null = null;

function loadMapsApi(key: string): Promise<void> {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (!loaderPromise) {
    // Official Google Maps JS "inline bootstrap" — defines
    // google.maps.importLibrary immediately, then lazily fetches the API.
    // A plain <script src=...> with loading=async fires onload before the
    // bootstrap defines importLibrary, so we can't rely on script.onload.
    loaderPromise = new Promise<void>((resolve, reject) => {
      try {
        ((g: Record<string, string>) => {
          // eslint-disable-next-line prefer-const
          let h: Promise<void> | undefined,
            a: HTMLScriptElement,
            k: string;
          const p = 'The Google Maps JavaScript API',
            c = 'google',
            l = 'importLibrary',
            q = '__ib__',
            m = document,
            w = window as any;
          let b = w[c] || (w[c] = {});
          const d = b.maps || (b.maps = {}),
            r = new Set<string>(),
            e = new URLSearchParams();
          const u = () =>
            h ||
            (h = new Promise<void>(async (f, n) => {
              a = m.createElement('script');
              e.set('libraries', [...r].join(','));
              for (k in g)
                e.set(
                  k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()),
                  g[k],
                );
              e.set('callback', c + '.maps.' + q);
              a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
              d[q] = f;
              a.onerror = () => {
                h = undefined;
                n(Error(p + ' could not load.'));
              };
              a.nonce = (m.querySelector('script[nonce]') as any)?.nonce || '';
              m.head.append(a);
            }));
          d[l]
            ? console.warn(p + ' only loads once. Ignoring:', g)
            : (d[l] = (f: string, ...n: unknown[]) =>
                r.add(f) && u().then(() => d[l](f, ...n)));
        })({ key, v: 'weekly' });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
  return loaderPromise;
}

function FallbackEmbed() {
  return (
    <iframe
      src={`https://maps.google.com/maps?q=${PLACE_QUERY}&z=16&output=embed`}
      className="w-full h-full"
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title="Map of Exhibit On Superior"
    />
  );
}

export function PropertyMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!API_KEY);

  useEffect(() => {
    if (!API_KEY || !containerRef.current) return;

    let cancelled = false;

    // Google calls this global on key auth errors (invalid key, API not
    // enabled, referrer blocked). Swap to the keyless embed instead of
    // showing Google's greyed-out error map.
    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.warn('[PropertyMap] Google Maps auth failure — using fallback embed');
      prevAuthFailure?.();
      setFailed(true);
    };

    loadMapsApi(API_KEY)
      .then(async () => {
        if (cancelled || !containerRef.current) return;
        const { Map } = await window.google.maps.importLibrary('maps');
        const { AdvancedMarkerElement } =
          await window.google.maps.importLibrary('marker');
        if (cancelled || !containerRef.current) return;
        const map = new Map(containerRef.current, {
          center: CENTER,
          zoom: 16,
          mapId: MAP_ID,
        });
        new AdvancedMarkerElement({
          map,
          position: CENTER,
          title: 'Exhibit On Superior — 165 W Superior St, Chicago, IL 60654',
        });
      })
      .catch((err) => {
        console.warn('[PropertyMap] Maps JS failed to load — using fallback embed', err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      window.gm_authFailure = prevAuthFailure;
    };
  }, []);

  if (failed) return <FallbackEmbed />;

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      role="application"
      aria-label="Map of Exhibit On Superior"
    />
  );
}
