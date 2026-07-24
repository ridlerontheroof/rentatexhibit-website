// Virtual-tour data + structured data, shared by the VirtualTour page and the
// prerenderer (entry-server.tsx). The visible Matterport embeds and the
// JSON-LD are both built from `matterportTours`, so they can never drift.
//
// NOTE: The Vimeo "Life at Exhibit On Superior" video is deliberately NOT
// emitted as a VideoObject: Google requires uploadDate and thumbnailUrl, and
// neither can be sourced truthfully from our side of the embed. Add it only
// if/when those properties become available from the video's owner.

import { SITE_URL, canonicalFor } from './seo';

export interface MatterportTour {
  /** Visible <h3> heading on /virtual-tour — schema `name` must match it. */
  name: string;
  /** Public Matterport player URL (same URL the iframe embeds). */
  url: string;
}

export const matterportTours: MatterportTour[] = [
  { name: 'Exhibit 2104', url: 'https://my.matterport.com/show/?m=773kQcHxLnz' },
  { name: 'Exhibit 605', url: 'https://my.matterport.com/show/?m=kthJKtuPTJ4' },
  { name: 'Amenities at Exhibit On Superior', url: 'https://my.matterport.com/show/?m=CiWCwCJuZ9c' },
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
