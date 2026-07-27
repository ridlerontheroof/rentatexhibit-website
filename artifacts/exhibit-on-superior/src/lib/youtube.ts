/**
 * YouTube URL helpers for unit video tours.
 *
 * AppFolio stores a plain YouTube link in each unit's marketing info; the
 * detail page embeds it with the privacy-enhanced player.
 */

/** Extract the YouTube video ID from watch/short/embed/share URL forms. */
export function youTubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const host = parsed.hostname.replace(/^www\.|^m\./, '');
  const isValid = (id: string | null | undefined): id is string =>
    !!id && /^[A-Za-z0-9_-]{6,20}$/.test(id);

  if (host === 'youtu.be') {
    const id = parsed.pathname.split('/')[1];
    return isValid(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = parsed.searchParams.get('v');
    if (isValid(v)) return v;
    const m = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
    return m && isValid(m[1]) ? m[1] : null;
  }
  return null;
}

/** Privacy-enhanced embed URL for a unit video, or null if not a YouTube link. */
export function youTubeEmbedUrl(url: string): string | null {
  const id = youTubeVideoId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}

/**
 * Poster thumbnail for the click-to-load facade. Unit videos change with the
 * AppFolio feed, so these can't be committed locally like the Matterport
 * posters — YouTube's static thumbnail CDN is a single tiny image request
 * (no third-party JS), which is what the facade exists to avoid.
 */
export function youTubeThumbnailUrl(url: string): string | null {
  const id = youTubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
