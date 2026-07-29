// Virtual-tour data + structured data, shared by the VirtualTour page and the
// prerenderer (entry-server.tsx). The visible Matterport embeds and the
// JSON-LD are both built from `matterportTours`, so they can never drift.
//
// The Vimeo "Life at Exhibit On Superior" video IS emitted as a VideoObject:
// Google requires a truthful uploadDate and thumbnailUrl, and both are now
// sourced from Vimeo's oEmbed API, cached into vimeo-oembed.json (refresh via
// scripts/fetch-vimeo-oembed.mjs) so builds stay deterministic.

import { SITE_URL, canonicalFor } from './seo';
import vimeoOembed from './vimeo-oembed.json';

export interface MatterportTour {
  /** Visible <h3> heading on /virtual-tour — schema `name` must match it. */
  name: string;
  /** Public Matterport player URL (same URL the iframe embeds). */
  url: string;
  /**
   * The space's `name` as reported by Matterport's public player-models API.
   * Defaults to `name` when omitted. The live guard test pins this so a
   * re-used/mis-shared space id (same URL, different apartment) is caught.
   */
  matterportName?: string;
  /**
   * Local optimized poster image for the click-to-load facade, fetched once
   * from Matterport's player-models API (scripts/optimize-images.mjs makes
   * the shipped variants).
   */
  poster: string;
}

/**
 * The "Life at Exhibit On Superior" Vimeo video, shared by the visible embed
 * on /virtual-tour and its VideoObject JSON-LD so they can never drift.
 * uploadDate/thumbnail come from the cached Vimeo oEmbed response.
 */
export const lifeAtExhibitVideo = {
  /** Visible <h3> heading on /virtual-tour — schema `name` must match it. */
  name: 'Life at Exhibit On Superior',
  /** Same player URL the iframe embeds. */
  embedUrl: `https://player.vimeo.com/video/${vimeoOembed.videoId}?rel=0`,
  contentUrl: vimeoOembed.videoUrl,
  uploadDate: vimeoOembed.uploadDate,
  thumbnailUrl: vimeoOembed.thumbnailUrl,
  durationSeconds: vimeoOembed.durationSeconds,
  /** Local optimized poster for the click-to-load facade (committed copy of the Vimeo thumbnail). */
  poster: '/images/vimeo-poster-life-at-exhibit.jpg',
} as const;

/** ISO-8601 duration (e.g. PT1M38S) from the oEmbed duration in seconds. */
function isoDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `PT${minutes > 0 ? `${minutes}M` : ''}${seconds}S`;
}

/**
 * VideoObject for the Vimeo video on /virtual-tour. uploadDate and
 * thumbnailUrl are sourced truthfully from Vimeo's oEmbed API (cached in
 * vimeo-oembed.json), which is what qualifies the video for rich results.
 *
 * uploadDate is a FULL ISO-8601 timestamp with a timezone offset: Vimeo's
 * oEmbed/simple-API upload_date is a wall-clock time documented as US Eastern
 * (America/New_York), so scripts/fetch-vimeo-oembed.mjs converts it to the
 * correct EST/EDT offset for that instant (e.g. 2024-06-25T11:51:21-04:00).
 * Search Console FAILS validation on date-only uploadDate values ("missing a
 * timezone"), so date-only is no longer acceptable here — guard tests enforce
 * the timezone-aware format for every emitted VideoObject.
 */
export function virtualTourVideoJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${SITE_URL}/virtual-tour#life-at-exhibit-video`,
    name: lifeAtExhibitVideo.name,
    description:
      'A video tour of life at Exhibit On Superior, luxury apartments in River North, Chicago — residences, amenities, and the surrounding neighborhood.',
    contentUrl: lifeAtExhibitVideo.contentUrl,
    embedUrl: lifeAtExhibitVideo.embedUrl,
    uploadDate: lifeAtExhibitVideo.uploadDate,
    thumbnailUrl: lifeAtExhibitVideo.thumbnailUrl,
    duration: isoDuration(lifeAtExhibitVideo.durationSeconds),
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
  };
}

export const matterportTours: MatterportTour[] = [
  {
    name: 'Exhibit 2104',
    url: 'https://my.matterport.com/show/?m=773kQcHxLnz',
    poster: '/images/matterport-poster-exhibit-2104.jpg',
  },
  {
    name: 'Exhibit 605',
    url: 'https://my.matterport.com/show/?m=kthJKtuPTJ4',
    poster: '/images/matterport-poster-exhibit-605.jpg',
  },
  {
    name: 'Amenities at Exhibit On Superior',
    url: 'https://my.matterport.com/show/?m=CiWCwCJuZ9c',
    // Matterport names this space just "Exhibit"; the heading is friendlier.
    matterportName: 'Exhibit',
    poster: '/images/matterport-poster-amenities.jpg',
  },
];

/**
 * JSON-LD for /virtual-tour: an ItemList of MediaObject nodes, one per
 * Matterport space. MediaObject validates cleanly in the schema.org validator
 * (VideoObject would demand uploadDate/thumbnail we cannot source truthfully),
 * and each node's name matches the visible section heading.
 */
export function virtualToursJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/virtual-tour#tours`,
    name: 'Virtual Tours of Exhibit On Superior',
    url: canonicalFor('/virtual-tour'),
    itemListElement: matterportTours.map((tour, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MediaObject',
        name: tour.name,
        description: `Interactive 3D Matterport virtual tour: ${tour.name}`,
        contentUrl: tour.url,
        encodingFormat: 'text/html',
        about: { '@id': `${SITE_URL}#apartmentcomplex` },
      },
    })),
  };
}
