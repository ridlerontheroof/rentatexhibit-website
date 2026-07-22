import { describe, expect, it } from 'vitest';
import { youTubeEmbedUrl, youTubeVideoId } from './youtube';

describe('youTubeVideoId', () => {
  it('parses common YouTube URL forms', () => {
    expect(youTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youTubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=abc')).toBe('dQw4w9WgXcQ');
    expect(youTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('rejects non-YouTube and malformed URLs', () => {
    expect(youTubeVideoId('https://vimeo.com/12345')).toBeNull();
    expect(youTubeVideoId('https://evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(youTubeVideoId('not a url')).toBeNull();
    expect(youTubeVideoId('javascript:alert(1)')).toBeNull();
    expect(youTubeVideoId('https://www.youtube.com/watch?v=<script>')).toBeNull();
  });
});

describe('youTubeEmbedUrl', () => {
  it('builds a privacy-enhanced embed URL', () => {
    expect(youTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0',
    );
    expect(youTubeEmbedUrl('https://vimeo.com/12345')).toBeNull();
  });
});
