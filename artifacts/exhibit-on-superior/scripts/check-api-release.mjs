#!/usr/bin/env node
// Post-publish API release smoke check.
//
// A multi-artifact publish can make the new web build live while an older API
// bundle keeps serving /api. This probe proves the live API's CSP classifier,
// logging/suppression branch, actionable alert branch, and process provenance
// rather than inferring API freshness from the web build-id.

import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXPECTED_CLASSIFIER_REVISION = 'csp-noise-v3';
export const EXPECTED_API_ENTRYPOINT = 'artifacts/api-server/dist/index.mjs';
const EXTENSION_SOURCE = /\b(?:chrome-extension|moz-extension|safari-web-extension):/i;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const apiArtifactToml = path.resolve(
  scriptDir,
  '../../api-server/.replit-artifact/artifact.toml',
);

export function assertNoBrowserExtensionSources(policy) {
  if (typeof policy !== 'string' || !policy.trim()) {
    throw new Error(
      'Live site did not return an enforced Content-Security-Policy header.',
    );
  }
  const match = policy.match(EXTENSION_SOURCE);
  if (match) {
    throw new Error(
      `Live enforced CSP allowlists the browser-extension scheme "${match[0]}". ` +
        'Extension resources must remain blocked; suppress only their report noise.',
    );
  }
}

export function assertTrackedRuntimeCommand(toml) {
  const required = [
    'args = ["pnpm", "--filter", "@workspace/api-server", "run", "build"]',
    'args = ["sh", "-c", "exec node --enable-source-maps artifacts/api-server/dist/index.mjs"]',
    `API_RUNTIME_EXPECTED_ENTRYPOINT = "${EXPECTED_API_ENTRYPOINT}"`,
    `API_CSP_CLASSIFIER_REVISION = "${EXPECTED_CLASSIFIER_REVISION}"`,
  ];
  const missing = required.filter((line) => !toml.includes(line));
  if (missing.length > 0) {
    throw new Error(
      'Tracked API production command/evidence is stale or incomplete:\n' +
        missing.map((line) => `  missing ${line}`).join('\n'),
    );
  }
}

export function assertRuntimeEvidence(runtime) {
  if (!runtime || typeof runtime !== 'object') {
    throw new Error('Live API did not return runtime process evidence.');
  }
  const normalizedEntrypoint = String(runtime.entrypoint ?? '').replaceAll('\\', '/');
  const normalizedArgs = Array.isArray(runtime.processArgs)
    ? runtime.processArgs.map((arg) => String(arg).replaceAll('\\', '/'))
    : [];
  const nodeName = path.basename(String(runtime.nodeExecutable ?? ''));

  if (!normalizedEntrypoint.endsWith(`/${EXPECTED_API_ENTRYPOINT}`)) {
    throw new Error(
      `Live API module evidence is stale: entrypoint was "${runtime.entrypoint ?? ''}", ` +
        `expected it to end with "/${EXPECTED_API_ENTRYPOINT}".`,
    );
  }
  if (!normalizedArgs.some((arg) => arg.endsWith(`/${EXPECTED_API_ENTRYPOINT}`))) {
    throw new Error(
      `Live API process evidence is stale: argv did not include "/${EXPECTED_API_ENTRYPOINT}".`,
    );
  }
  if (!/^node(?:js)?(?:\.exe)?$/i.test(nodeName)) {
    throw new Error(
      `Live API process evidence is stale: executable was "${runtime.nodeExecutable ?? ''}".`,
    );
  }
  if (runtime.configuredEntrypoint !== EXPECTED_API_ENTRYPOINT) {
    throw new Error(
      `Live API configured entrypoint was "${runtime.configuredEntrypoint ?? ''}", ` +
        `expected "${EXPECTED_API_ENTRYPOINT}".`,
    );
  }
  if (runtime.configuredClassifierRevision !== EXPECTED_CLASSIFIER_REVISION) {
    throw new Error(
      `Live API configured classifier revision was ` +
        `"${runtime.configuredClassifierRevision ?? ''}", expected ` +
        `"${EXPECTED_CLASSIFIER_REVISION}".`,
    );
  }
}

function header(res, name) {
  const value = res.headers.get(name);
  if (value === null || value === '') {
    throw new Error(`CSP probe response omitted required header ${name}.`);
  }
  return value;
}

function parseRuntimeHeader(res) {
  const encoded = header(res, 'x-csp-probe-runtime');
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new Error('CSP probe returned malformed runtime process evidence.');
  }
}

function probeBody(base, tag, kind) {
  const knownNoise = kind === 'known-noise';
  return {
    'csp-report': {
      'document-uri': `${base}/__postpublish-csp-probe/${tag}/${kind}`,
      'effective-directive': knownNoise ? 'script-src-elem' : 'connect-src',
      'violated-directive': knownNoise ? 'script-src-elem' : 'connect-src',
      'blocked-uri': knownNoise
        ? `safari-web-extension://com.exhibit.postpublish/${tag}.js`
        : `https://${tag}.postpublish-csp-probe.invalid/beacon`,
      disposition: 'enforce',
    },
  };
}

async function sendProbe(base, tag, kind, token) {
  const url = `${base}/api/csp-reports`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/csp-report',
      'user-agent': 'exhibit-postpublish-api-release-check',
      'cache-control': 'no-cache',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(probeBody(base, tag, kind)),
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status !== 204) {
    throw new Error(`${kind} CSP probe returned HTTP ${res.status}; expected 204.`);
  }
  return res;
}

function assertCommonEvidence(res, knownNoise) {
  const revision = header(res, 'x-csp-probe-classifier-revision');
  if (revision !== EXPECTED_CLASSIFIER_REVISION) {
    throw new Error(
      `Live API classifier revision was "${revision}", expected ` +
        `"${EXPECTED_CLASSIFIER_REVISION}".`,
    );
  }
  if (header(res, 'x-csp-probe-known-noise') !== String(knownNoise)) {
    throw new Error(
      `Live API returned the wrong known-noise classification (expected ${knownNoise}).`,
    );
  }
  if (header(res, 'x-csp-probe-logged') !== 'true') {
    throw new Error('Live API did not confirm the CSP violation warning log.');
  }
  const runtime = parseRuntimeHeader(res);
  assertRuntimeEvidence(runtime);
  return runtime;
}

function assertKnownNoiseEvidence(res) {
  assertCommonEvidence(res, true);
  if (header(res, 'x-csp-probe-suppression-logged') !== 'true') {
    throw new Error('Live API did not confirm the known-noise suppression log.');
  }
  if (header(res, 'x-csp-probe-alert-status') !== 'suppressed-known-noise') {
    throw new Error('Live API did not take the known-noise suppression branch.');
  }
  if (header(res, 'x-csp-probe-alert-sent') !== 'false') {
    throw new Error('Known-noise CSP probe unexpectedly sent an alert.');
  }
}

function assertActionableEvidence(res) {
  assertCommonEvidence(res, false);
  if (header(res, 'x-csp-probe-suppression-logged') !== 'false') {
    throw new Error('Actionable CSP control was incorrectly suppressed.');
  }
  const status = header(res, 'x-csp-probe-alert-status');
  if (status !== 'sent' || header(res, 'x-csp-probe-alert-sent') !== 'true') {
    throw new Error(
      `Live API did not confirm actionable alert delivery (status "${status}").`,
    );
  }
}

export async function runApiReleaseCheck(
  rawBase = process.env.POSTPUBLISH_BASE ?? 'https://www.rentatexhibit.com',
) {
  const base = rawBase.replace(/\/$/, '');
  const token = process.env.WATCHDOG_ALERT_TOKEN ?? '';
  if (!token) {
    throw new Error(
      'WATCHDOG_ALERT_TOKEN is required for the reserved post-publish CSP probe path.',
    );
  }
  const toml = readFileSync(apiArtifactToml, 'utf8');
  assertTrackedRuntimeCommand(toml);

  const page = await fetch(`${base}/?postpublish-csp=${Date.now()}`, {
    headers: {
      'user-agent': 'exhibit-postpublish-api-release-check',
      'cache-control': 'no-cache',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!page.ok) {
    throw new Error(`Live homepage returned HTTP ${page.status}.`);
  }
  assertNoBrowserExtensionSources(page.headers.get('content-security-policy'));

  const runTag = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}`;
  const knownNoiseTag = `${runTag}-known`;
  const actionableTag = `${runTag}-action`;
  const knownNoise = await sendProbe(base, knownNoiseTag, 'known-noise', token);
  assertKnownNoiseEvidence(knownNoise);

  const actionable = await sendProbe(base, actionableTag, 'actionable', token);
  assertActionableEvidence(actionable);

  console.log(
    [
      '',
      `PASS  Live API release probe ${runTag}`,
      `  HTTP             known-noise 204; actionable 204`,
      `  classifier       ${EXPECTED_CLASSIFIER_REVISION}`,
      `  known noise      classified + warning logged + suppression logged`,
      `  actionable       warning logged + alert sent`,
      `  runtime          ${EXPECTED_API_ENTRYPOINT}`,
      `  enforced CSP     no browser-extension origin allowlisted`,
      '',
    ].join('\n'),
  );
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const explicitBase = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  runApiReleaseCheck(explicitBase)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`\nFAIL  Post-publish API release check: ${err?.message ?? err}\n`);
      process.exit(1);
    });
}