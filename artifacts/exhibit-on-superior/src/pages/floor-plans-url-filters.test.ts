// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { readFiltersFromUrl, writeFiltersToUrl } from './FloorPlans';
import { SQFT_MIN, SQFT_MAX } from '../data/floorPlans';

function setUrl(search: string) {
  window.history.replaceState(null, '', `/available-units${search}`);
}

describe('floor-plan filter URL round-trip', () => {
  it('reads defaults from a bare URL', () => {
    setUrl('');
    const f = readFiltersFromUrl();
    expect(f.categories.size).toBe(0);
    expect(f.bands.size).toBe(0);
    expect(f.sqft).toEqual([SQFT_MIN, SQFT_MAX]);
    expect(f.ada).toBe(false);
  });

  it('reads beds, floors, sqft and ada from the query string', () => {
    setUrl('?beds=2br,3br&floors=high,penthouse&sqft=800-1200&ada=1');
    const f = readFiltersFromUrl();
    expect([...f.categories].sort()).toEqual(['2br', '3br']);
    expect([...f.bands].sort()).toEqual(['high', 'penthouse']);
    expect(f.sqft).toEqual([800, 1200]);
    expect(f.ada).toBe(true);
  });

  it('ignores unknown values and malformed sqft', () => {
    setUrl('?beds=4br,studio&floors=basement&sqft=big-small');
    const f = readFiltersFromUrl();
    expect([...f.categories]).toEqual(['studio']);
    expect(f.bands.size).toBe(0);
    expect(f.sqft).toEqual([SQFT_MIN, SQFT_MAX]);
  });

  it('clamps out-of-range sqft to the plan bounds', () => {
    setUrl('?sqft=1-999999');
    expect(readFiltersFromUrl().sqft).toEqual([SQFT_MIN, SQFT_MAX]);
  });

  it('writes active filters and round-trips back to the same state', () => {
    setUrl('');
    writeFiltersToUrl({
      categories: new Set(['2br']),
      bands: new Set(['high']),
      sqft: [700, 1100],
      ada: true,
    });
    const search = window.location.search;
    expect(search).toContain('beds=2br');
    expect(search).toContain('floors=high');
    expect(search).toContain('sqft=700-1100');
    expect(search).toContain('ada=1');
    const f = readFiltersFromUrl();
    expect([...f.categories]).toEqual(['2br']);
    expect([...f.bands]).toEqual(['high']);
    expect(f.sqft).toEqual([700, 1100]);
    expect(f.ada).toBe(true);
  });

  it('clearing filters cleans the URL but preserves unrelated params', () => {
    setUrl('?beds=1br&floors=mid&sqft=600-900&ada=1&plan=some-plan');
    writeFiltersToUrl({
      categories: new Set(),
      bands: new Set(),
      sqft: [SQFT_MIN, SQFT_MAX],
      ada: false,
    });
    expect(window.location.search).toBe('?plan=some-plan');
  });
});
