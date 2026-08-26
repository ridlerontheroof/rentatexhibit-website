import { describe, expect, it, vi } from 'vitest';
import {
  fetchWithRetries,
  MAX_ATTEMPTS,
  TRANSPORT_ONLY_EXIT_CODE,
} from './check-legacy-redirects.mjs';

const response = (status = 301, location = '/available-units') => ({
  status,
  headers: new Headers(location ? { location } : {}),
});

describe('legacy redirect transport handling', () => {
  it('recovers from a transient fetch failure before the retry budget is exhausted', async () => {
    let attempts = 0;
    const fetchImpl = vi.fn(async () => {
      attempts++;
      if (attempts === 1) throw new Error('connection reset');
      return response();
    });

    const result = await fetchWithRetries('https://example.test/legacy', fetchImpl, {
      retryDelayMs: 0,
      log: { warn: vi.fn() },
    });

    expect(result.response.status).toBe(301);
    expect(result.attempts).toBe(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns a transport error after bounded retries are exhausted', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('temporary DNS failure');
    });

    const result = await fetchWithRetries('https://example.test/legacy', fetchImpl, {
      retryDelayMs: 0,
      log: { warn: vi.fn() },
    });

    expect(result.response).toBeUndefined();
    expect(result.error.message).toBe('temporary DNS failure');
    expect(result.attempts).toBe(MAX_ATTEMPTS);
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(TRANSPORT_ONLY_EXIT_CODE).toBe(2);
  });

  it('does not retry a definitive HTTP response', async () => {
    const fetchImpl = vi.fn(async () => response(200, ''));

    const result = await fetchWithRetries('https://example.test/legacy', fetchImpl, {
      retryDelayMs: 0,
      log: { warn: vi.fn() },
    });

    expect(result.response.status).toBe(200);
    expect(result.attempts).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});