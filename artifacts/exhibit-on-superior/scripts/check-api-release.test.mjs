import { describe, expect, it } from 'vitest';
import {
  EXPECTED_API_ENTRYPOINT,
  EXPECTED_CLASSIFIER_REVISION,
  assertNoBrowserExtensionSources,
  assertRuntimeEvidence,
  assertTrackedRuntimeCommand,
} from './check-api-release.mjs';

const validRuntime = {
  entrypoint: `/home/runner/workspace/${EXPECTED_API_ENTRYPOINT}`,
  nodeExecutable: '/nix/store/nodejs/bin/node',
  processArgs: [`/home/runner/workspace/${EXPECTED_API_ENTRYPOINT}`],
  configuredEntrypoint: EXPECTED_API_ENTRYPOINT,
  configuredClassifierRevision: EXPECTED_CLASSIFIER_REVISION,
};

describe('post-publish API release guard', () => {
  it.each([
    'chrome-extension://abc',
    'moz-extension://abc',
    'safari-web-extension://abc',
  ])('rejects an enforced CSP allowlisting %s', (source) => {
    expect(() =>
      assertNoBrowserExtensionSources(`default-src 'self'; script-src 'self' ${source}`),
    ).toThrow(/browser-extension scheme/);
  });

  it('accepts the tracked runtime command and rejects stale config', () => {
    const valid = [
      'args = ["pnpm", "--filter", "@workspace/api-server", "run", "build"]',
      'args = ["sh", "-c", "exec node --enable-source-maps artifacts/api-server/dist/index.mjs"]',
      `API_RUNTIME_EXPECTED_ENTRYPOINT = "${EXPECTED_API_ENTRYPOINT}"`,
      `API_CSP_CLASSIFIER_REVISION = "${EXPECTED_CLASSIFIER_REVISION}"`,
    ].join('\n');
    expect(() => assertTrackedRuntimeCommand(valid)).not.toThrow();
    expect(() =>
      assertTrackedRuntimeCommand(valid.replace('exec node', 'node')),
    ).toThrow(/command\/evidence is stale/);
  });

  it('accepts current live process evidence and rejects a stale entrypoint', () => {
    expect(() => assertRuntimeEvidence(validRuntime)).not.toThrow();
    expect(() =>
      assertRuntimeEvidence({
        ...validRuntime,
        entrypoint: '/home/runner/workspace/artifacts/api-server/src/index.ts',
      }),
    ).toThrow(/module evidence is stale/);
  });
});