// Unit coverage for the aria-describedby resolution in
// scripts/check-link-names.mjs: every referenced id must exist and carry
// text — ONE broken id in a multi-id reference is a failure, because that
// hint/error message is silently dropped for screen-reader users even when
// the other references resolve.
//
// The script is exercised end-to-end against tiny fixture pages via the
// CHECK_LINK_NAMES_DIST override.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const artifactRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(artifactRoot, 'scripts', 'check-link-names.mjs');

const tmpDirs: string[] = [];
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

function runOnPage(body: string): { code: number; output: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'linknames-'));
  tmpDirs.push(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html><body>${body}</body></html>`);
  try {
    const out = execFileSync('node', [script], {
      env: { ...process.env, CHECK_LINK_NAMES_DIST: dir },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, output: out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

// A labelled field so only the describedby scenario under test varies.
const field = (describedby: string) =>
  `<label for="email">Email</label>` +
  `<input type="email" id="email" aria-describedby="${describedby}"/>`;

describe('check-link-names aria-describedby guard', () => {
  it('passes when every referenced id exists with text', () => {
    const r = runOnPage(
      field('email-hint email-error') +
        `<p id="email-hint">We only use this to confirm your tour.</p>` +
        `<p id="email-error">Enter a valid email address.</p>`,
    );
    expect(r.output).toContain('OK');
    expect(r.code).toBe(0);
  });

  it('fails when the only referenced id is missing', () => {
    const r = runOnPage(field('email-error'));
    expect(r.code).toBe(1);
    expect(r.output).toContain('broken aria-describedby');
    expect(r.output).toContain('email-error');
  });

  it('fails when ONE id of a multi-id reference is missing, even if another resolves', () => {
    const r = runOnPage(
      field('email-hint email-error') + `<p id="email-hint">We only use this to confirm.</p>`,
    );
    expect(r.code).toBe(1);
    // Only the missing id is reported as broken (the snippet still echoes
    // the full attribute, so match the broken-id list exactly).
    expect(r.output).toMatch(/broken id\(s\): email-error\s/);
  });

  it('fails when a referenced element exists but is empty', () => {
    const r = runOnPage(
      field('email-hint email-error') +
        `<p id="email-hint">Hint text.</p>` +
        `<p id="email-error"></p>`,
    );
    expect(r.code).toBe(1);
    expect(r.output).toContain('broken id(s): email-error');
  });

  it('ignores aria-describedby on aria-hidden elements', () => {
    const r = runOnPage(
      `<label for="x">X</label>` +
        `<input id="x" aria-hidden="true" aria-describedby="missing-id"/>`,
    );
    expect(r.code).toBe(0);
  });
});
