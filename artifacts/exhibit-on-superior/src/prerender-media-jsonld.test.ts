import { describe, expect, it } from 'vitest';
import { render } from './entry-server';
import { galleryImages, photoGalleryJsonLd } from './data/gallery';
import {
  lifeAtExhibitVideo,
  matterportTours,
  virtualToursJsonLd,
  virtualTourVideoJsonLd,
} from './data/virtualTours';
import { SITE_URL } from './data/seo';

// Task: Google must see the SAME gallery images and virtual tours in the
// pre-built page and the live page.
//
// /photo-gallery's ImageGallery and /virtual-tour's tour ItemList are emitted
// twice: at build time via entry-server's EXTRA_JSONLD wiring, and client-side
// by <Seo extraJsonLd> in each page component. Both flow through the same
// shared modules (gallery.ts / virtualTours.ts). These tests render the routes
// through the SAME entry-server pipeline the prerenderer uses and assert the
// shipped JSON-LD deep-equals the shared modules, and that the schema mirrors
// visible page content.

/** Pull every <script type="application/ld+json"> payload out of a head string. */
function extractJsonLd(head: string): Record<string, unknown>[] {
  const scripts = [
    ...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
  return scripts.map((s) => JSON.parse(s) as Record<string, unknown>);
}

describe('prerendered /photo-gallery JSON-LD matches the shared gallery module', () => {
  it('ships an ImageGallery that deep-equals photoGalleryJsonLd()', async () => {
    const { head } = await render('/photo-gallery');
    const blocks = extractJsonLd(head);
    expect(blocks.length).toBeGreaterThanOrEqual(2);

    const galleries = blocks.filter((b) => b['@type'] === 'ImageGallery');
    expect(galleries).toHaveLength(1);
    expect(galleries[0]).toEqual(photoGalleryJsonLd());
  });

  it('mirrors the visible gallery grid: every image URL and caption comes from galleryImages', async () => {
    const { head, html } = await render('/photo-gallery');
    const gallery = extractJsonLd(head).find((b) => b['@type'] === 'ImageGallery')!;
    const images = gallery.image as { contentUrl: string; caption: string }[];

    expect(images).toHaveLength(galleryImages.length);
    for (let i = 0; i < images.length; i++) {
      // Real absolute URLs derived from the same src the grid renders.
      expect(images[i].contentUrl).toBe(`${SITE_URL}${galleryImages[i].src}`);
      // Captions derive from the alt text visible in the page markup.
      expect(images[i].caption).toBe(galleryImages[i].alt);
      // SmartImg may rewrite to resized variants (e.g. -800w.webp); match on
      // the extensionless basename that survives the rewrite.
      const stem = galleryImages[i].src.replace(/^\/images\//, '').replace(/\.[a-z]+$/, '');
      expect(html).toContain(stem);
    }
  });
});

describe('prerendered /virtual-tour JSON-LD matches the shared virtualTours module', () => {
  it('ships a tour ItemList that deep-equals virtualToursJsonLd()', async () => {
    const { head } = await render('/virtual-tour');
    const blocks = extractJsonLd(head);
    expect(blocks.length).toBeGreaterThanOrEqual(2);

    const lists = blocks.filter((b) => b['@type'] === 'ItemList');
    expect(lists).toHaveLength(1);
    expect(lists[0]).toEqual(virtualToursJsonLd());
  });

  it('names match the visible headings and URLs match the embedded iframes', async () => {
    const { head, html } = await render('/virtual-tour');
    const list = extractJsonLd(head).find((b) => b['@type'] === 'ItemList')!;
    const items = list.itemListElement as {
      position: number;
      item: { '@type': string; name: string; contentUrl: string };
    }[];

    expect(items).toHaveLength(matterportTours.length);
    items.forEach((li, i) => {
      expect(li.position).toBe(i + 1);
      expect(li.item['@type']).toBe('MediaObject');
      expect(li.item.name).toBe(matterportTours[i].name);
      expect(li.item.contentUrl).toBe(matterportTours[i].url);
      // Visible heading and iframe src in the prerendered body.
      expect(html).toContain(`>${matterportTours[i].name}</h2>`);
      expect(html).toContain(matterportTours[i].url.replace(/&/g, '&amp;'));
    });
  });

  it('ships a VideoObject that deep-equals virtualTourVideoJsonLd()', async () => {
    const { head } = await render('/virtual-tour');
    const videos = extractJsonLd(head).filter((b) => b['@type'] === 'VideoObject');
    expect(videos).toHaveLength(1);
    expect(videos[0]).toEqual(virtualTourVideoJsonLd());
  });

  it('VideoObject carries a truthful uploadDate and thumbnail (from cached Vimeo oEmbed) and mirrors the visible embed', async () => {
    const { head, html } = await render('/virtual-tour');
    const video = extractJsonLd(head).find((b) => b['@type'] === 'VideoObject')!;

    // Required-for-rich-results properties, sourced from Vimeo oEmbed.
    expect(video.uploadDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(video.thumbnailUrl).toMatch(/^https:\/\/i\.vimeocdn\.com\//);
    expect(video.duration).toMatch(/^PT(\d+M)?\d+S$/);

    // Schema mirrors the visible page: heading and iframe src come from the
    // same shared lifeAtExhibitVideo object.
    expect(video.name).toBe(lifeAtExhibitVideo.name);
    expect(video.embedUrl).toBe(lifeAtExhibitVideo.embedUrl);
    expect(html).toContain(`>${lifeAtExhibitVideo.name}</h2>`);
    expect(html).toContain(lifeAtExhibitVideo.embedUrl.replace(/&/g, '&amp;'));
  });
});

describe('ApartmentComplex entity carries the full recommended property set', () => {
  it('homepage @graph node has alternateName, mainEntityOfPage, logo, containedInPlace, isAccessibleForFree, potentialAction', async () => {
    const { head } = await render('/');
    const [base] = extractJsonLd(head);
    const graph = base['@graph'] as Record<string, unknown>[];
    const complex = graph.find((n) => n['@type'] === 'ApartmentComplex')!;

    expect(complex.alternateName).toBe('Exhibit on Superior Apartments');
    expect(complex.mainEntityOfPage).toBe(`${SITE_URL}/`);
    // Organization/ApartmentComplex logo must be a plain URL string —
    // Google's validator rejects the ImageObject form here.
    expect(complex.logo as string).toContain('/images/');
    expect(complex.isAccessibleForFree).toBe(true);

    // River North -> Chicago place chain.
    const place = complex.containedInPlace as {
      name: string;
      containedInPlace: { '@type': string; name: string };
    };
    expect(place.name).toBe('River North');
    expect(place.containedInPlace.name).toBe('Chicago');

    // ScheduleAction -> tour page, ViewAction -> availability.
    const actions = complex.potentialAction as { '@type': string; target: string }[];
    expect(actions.find((a) => a['@type'] === 'ScheduleAction')?.target).toBe(
      `${SITE_URL}/schedule-a-tour`,
    );
    expect(actions.find((a) => a['@type'] === 'ViewAction')?.target).toBe(
      `${SITE_URL}/available-units`,
    );
  });
});
