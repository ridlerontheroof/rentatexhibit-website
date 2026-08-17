/**
 * Forks validate-config.mjs against the committed property-config.json at
 * --phase prelaunch so that `pnpm test` catches a missing required env-var
 * declaration without having to remember to run check:prepublish first.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

const validateConfigMjs = path.join(
  repoRoot,
  '.agents/skills/property-site-onboarding/tools/validate-config.mjs',
);
const propertyConfigJson = path.join(here, '..', 'property-config.json');

describe('property-config.json', () => {
  it('passes validate-config.mjs --phase prelaunch (all kit-v1.1.0 required env-vars declared)', () => {
    const result = spawnSync(
      process.execPath,
      [validateConfigMjs, propertyConfigJson, '--phase', 'prelaunch'],
      { encoding: 'utf8' },
    );

    if (result.status !== 0) {
      // Surface the validator's own error messages so the failure is actionable.
      throw new Error(
        `validate-config.mjs exited ${result.status}:\n${result.stderr || result.stdout}`,
      );
    }

    expect(result.status).toBe(0);
  });
});
