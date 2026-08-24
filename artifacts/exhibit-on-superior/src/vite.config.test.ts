import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateWebEnv } from '../vite.config';

const ALL_REQUIRED_VARS: Record<string, string> = {
  VITE_GA4_MEASUREMENT_ID: 'G-EXAMPLE',
  VITE_UTM_STORAGE_KEY: 'utm_source',
  VITE_API_URL: 'https://api.example.com',
};

describe('validateWebEnv', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw or warn when all required vars are present', () => {
    expect(() =>
      validateWebEnv({ ...ALL_REQUIRED_VARS, REPLIT_DEPLOYMENT: '1' }),
    ).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('throws in a deployment build when a required var is missing', () => {
    const env = { ...ALL_REQUIRED_VARS, REPLIT_DEPLOYMENT: '1' };
    delete env.VITE_API_URL;

    expect(() => validateWebEnv(env)).toThrow(/VITE_API_URL/);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('warns without throwing in a non-production build when a required var is missing', () => {
    const env = { ...ALL_REQUIRED_VARS, REPLIT_DEPLOYMENT: '0' };
    delete env.VITE_API_URL;

    expect(() => validateWebEnv(env)).not.toThrow();
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('VITE_API_URL'),
    );
  });
});