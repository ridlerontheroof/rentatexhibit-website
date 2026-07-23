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
        // Branded pin: custom SVG at 2x the default marker size, brand gold
        // (--primary #b39a5f) with the Exhibit lowercase "e" glyph.
        const pin = document.createElement('div');
        pin.innerHTML = `
          <svg width="54" height="76" viewBox="0 0 27 38" xmlns="http://www.w3.org/2000/svg" style="display:block">
            <path d="M13.5 0C6.04 0 0 6.04 0 13.5c0 9.86 12 23.32 12.51 23.89a1.33 1.33 0 0 0 1.98 0C15 36.82 27 23.36 27 13.5 27 6.04 20.96 0 13.5 0Z" fill="#b39a5f" stroke="#8f7a48" stroke-width="1"/>
            <circle cx="13.5" cy="13.5" r="9.5" fill="#fff"/>
            <text x="13.5" y="14.2" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, 'Times New Roman', serif" font-size="14" fill="#b39a5f">e</text>
          </svg>`;
        new AdvancedMarkerElement({
          map,
          position: CENTER,
          content: pin,
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
