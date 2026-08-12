import { useState, type ReactNode } from 'react';
import { SmartImg } from './SmartImg';

interface EmbedFacadeProps {
  /**
   * Poster image shown before activation. Local paths (e.g. "/images/…")
   * render through SmartImg (optimized AVIF/WebP variants); absolute URLs
   * (e.g. a YouTube thumbnail) render as a plain lazy <img>.
   */
  poster: string;
  /** Alt text for the poster image. */
  posterAlt: string;
  /**
   * Accessible name for the launch button, e.g.
   * "Play video: Life at Exhibit On Superior".
   */
  buttonLabel: string;
  /** Short label shown on the launch pill, e.g. "Play video" / "Explore in 3D". */
  actionText: string;
  /** Renders the real embed (iframe) after the user clicks. */
  children: ReactNode;
  /**
   * The embed URL this facade defers, exposed as data-embed-url so
   * prerender tests can keep asserting the page mirrors its JSON-LD.
   */
  embedUrl?: string;
  /** Notifies the owner the embed just mounted (e.g. to wire postMessage APIs). */
  onActivate?: () => void;
  /**
   * Eager-load the poster (loading="eager", fetchPriority="low"). Use when
   * the facade sits above the fold — a lazy poster there delays what the
   * visitor actually sees first. Kept at low priority so it never competes
   * with the page's LCP hero (and never becomes the extracted LCP preload).
   */
  eagerPoster?: boolean;
}

/**
 * Click-to-load facade for heavy third-party embeds (Matterport, YouTube,
 * Vimeo). Renders an instant local poster with a real <button>; the iframe —
 * and all the third-party JS behind it — only mounts once the user activates
 * it (click or keyboard). No inline handlers, CSP-safe.
 */
export function EmbedFacade({
  poster,
  posterAlt,
  buttonLabel,
  actionText,
  children,
  embedUrl,
  onActivate,
  eagerPoster = false,
}: EmbedFacadeProps) {
  const [activated, setActivated] = useState(false);

  if (activated) return <>{children}</>;

  const isLocal = poster.startsWith('/');
  return (
    <button
      type="button"
      onClick={() => {
        setActivated(true);
        onActivate?.();
      }}
      aria-label={buttonLabel}
      data-embed-url={embedUrl}
      className="group relative block h-full w-full cursor-pointer overflow-hidden p-0 text-left"
    >
      {isLocal ? (
        <SmartImg
          src={poster}
          alt={posterAlt}
          sizes="(min-width: 1024px) 960px, 100vw"
          loading={eagerPoster ? 'eager' : 'lazy'}
          fetchPriority={eagerPoster ? 'low' : undefined}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <img
          src={poster}
          alt={posterAlt}
          loading={eagerPoster ? 'eager' : 'lazy'}
          width={1280}
          height={720}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Dim + launch pill, keyboard-visible via group focus styles */}
      <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20 group-focus-visible:bg-black/20" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex items-center gap-3 border border-white/60 bg-black/60 px-6 py-3 text-xs uppercase tracking-wider text-white backdrop-blur-sm transition-colors group-hover:border-primary group-hover:text-primary group-focus-visible:border-primary group-focus-visible:text-primary">
          {/* play glyph */}
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5l9 5.5-9 5.5z" />
          </svg>
          {actionText}
        </span>
      </span>
    </button>
  );
}
