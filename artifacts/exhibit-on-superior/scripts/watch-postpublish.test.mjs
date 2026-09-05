import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  readLastProcessedBuild,
  shouldProcessBuild,
  writeLastProcessedBuild,
} from './watch-postpublish.mjs';

const temporaryDirectories = [];

async function stateFile() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'postpublish-watch-'));
  temporaryDirectories.push(directory);
  return path.join(directory, 'nested', 'last-successful-build-id');
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, {
    force: true,
    recursive: true,
  })));
});

describe('post-publish watcher state', () => {
  it('processes a live publish found on a late start when no build was recorded', async () => {
    const file = await stateFile();

    expect(await readLastProcessedBuild(file)).toBeNull();
    expect(shouldProcessBuild('build-late', await readLastProcessedBuild(file))).toBe(true);
  });

  it('processes a normal transition from the recorded build to a new live build', async () => {
    const file = await stateFile();
    await writeLastProcessedBuild('build-before', file);

    expect(shouldProcessBuild('build-after', await readLastProcessedBuild(file))).toBe(true);
  });

  it('does not process an already-successful build after restart', async () => {
    const file = await stateFile();
    await writeLastProcessedBuild('build-current', file);

    expect(await readFile(file, 'utf8')).toBe('build-current\n');
    expect(shouldProcessBuild('build-current', await readLastProcessedBuild(file))).toBe(false);
  });
});