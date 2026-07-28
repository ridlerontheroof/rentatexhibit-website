// Guards for the per-unit VideoObject JSON-LD (unitPageSeo.ts) and its
// committed YouTube metadata cache (youtube-metadata.json, refreshed via
// scripts/fetch-youtube-metadata.mjs).
import { describe, expect, it } from 'vitest';
import { unitPageJsonLd, unitVideoJsonLd } from './unitPageSeo';
import { youTubeVideoId } from '../lib/youtube';
import youtubeMetadata from './youtube-metadata.json';
import snapshot from './availabilitySnapshot.json';
import type { AvailableUnit } from '../hooks/use-availability';

const units = (Array.isArray(snapshot) ? snapshot : snapshot.units) as AvailableUnit[];
const videos: Record<string, { videoUrl: string; title: string; uploadDate: string; thumbnailUrl: string; durationSeconds: number }> =
  youtubeMetadata.videos;

describe('youtube-metadata.json cache', () => {
  it('keys every entry by the ID its own videoUrl parses to (in sync with src/lib/youtube.ts)', () => {
    for (const [id, meta] of Object.entries(videos)) {
      expect(youTubeVideoId(meta.videoUrl)).toBe(id);
    }
  });

  it('carries the fields Google requires, in the expected shapes', () => {
    expect(Object.keys(videos).length).toBeGreaterThan(0);
    for (const meta of Object.values(videos)) {
      expect(meta.title).toBeTruthy();
      // Full ISO-8601 timestamp WITH timezone offset: Search Console warns on
      // date-only uploadDate values ("missing a timezone").
      expect(meta.uploadDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
      expect(meta.thumbnailUrl).toMatch(/^https:\/\/i\.ytimg\.com\//);
      expect(meta.durationSeconds).toBeGreaterThan(0);
    }
  });

  it('covers every video URL in the committed availability snapshot', () => {
    for (const u of units) {
      if (!u.videoUrl) continue;
      const id = youTubeVideoId(u.videoUrl);
      expect(id, `unparseable videoUrl on unit ${u.unit}: ${u.videoUrl}`).toBeTruthy();
      expect(
        videos[id as string],
        `unit ${u.unit} video ${id} missing from youtube-metadata.json — run scripts/fetch-youtube-metadata.mjs`,
      ).toBeTruthy();
    }
  });
});

describe('unitVideoJsonLd', () => {
  const withVideo = units.find((u) => u.videoUrl);

  it('emits a complete VideoObject for a unit with a cached tour video', () => {
    expect(withVideo).toBeTruthy();
    const node = unitVideoJsonLd(withVideo as AvailableUnit) as Record<string, unknown>;
    expect(node).toBeTruthy();
    expect(node['@type']).toBe('VideoObject');
    for (const key of ['name', 'description', 'contentUrl', 'embedUrl', 'uploadDate', 'thumbnailUrl', 'duration']) {
      expect(node[key], key).toBeTruthy();
    }
    expect(node.embedUrl).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\//);
    expect(node.duration).toMatch(/^PT(\d+M)?\d+S$/);
  });

  it('is included in the unit page @graph', () => {
    const graph = (unitPageJsonLd(withVideo as AvailableUnit) as { '@graph': { '@type': string }[] })['@graph'];
    expect(graph.some((n) => n['@type'] === 'VideoObject')).toBe(true);
  });

  it('returns null (never throws) when the unit has no video or the cache misses', () => {
    const noVideo = units.find((u) => !u.videoUrl) ?? ({ ...withVideo, videoUrl: null } as AvailableUnit);
    expect(unitVideoJsonLd(noVideo)).toBeNull();
    expect(
      unitVideoJsonLd({ ...(withVideo as AvailableUnit), videoUrl: 'https://www.youtube.com/watch?v=notInCache01' }),
    ).toBeNull();
    const graph = (unitPageJsonLd({ ...(withVideo as AvailableUnit), videoUrl: null }) as { '@graph': { '@type': string }[] })['@graph'];
    expect(graph.some((n) => n['@type'] === 'VideoObject')).toBe(false);
  });
});
