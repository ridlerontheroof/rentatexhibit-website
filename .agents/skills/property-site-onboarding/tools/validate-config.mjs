#!/usr/bin/env node
/**
 * validate-config.mjs — validates a property-config.json against
 * property-config.schema.json, with per-phase required-field enforcement.
 *
 * Usage:
 *   node validate-config.mjs <config.json> [--phase intake|discovery|design|build|prelaunch|golive]
 *
 * Dependency-free: implements the subset of JSON Schema this schema uses
 * (type, required, properties, additionalProperties, pattern, enum, items,
 * minItems, additionalProperties-as-schema).
 * Exit 0 = valid; exit 1 = errors printed one per line.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const configPath = args.find((a) => !a.startsWith('--'));
const phaseIdx = args.indexOf('--phase');
const phase = phaseIdx >= 0 ? args[phaseIdx + 1] : null;

if (!configPath) {
  console.error('usage: node validate-config.mjs <config.json> [--phase <phase>]');
  process.exit(2);
}

const schema = JSON.parse(readFileSync(join(here, '..', 'schema', 'property-config.schema.json'), 'utf8'));
let config;
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error(`FAIL cannot parse ${configPath}: ${e.message}`);
  process.exit(1);
}

const errors = [];

function typeOf(v) {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

function validate(node, value, path) {
  if (!node || typeof node !== 'object') return;
  if (node.type && typeOf(value) !== node.type) {
    errors.push(`${path}: expected ${node.type}, got ${typeOf(value)}`);
    return;
  }
  if (node.enum && !node.enum.includes(value)) {
    errors.push(`${path}: must be one of ${node.enum.join(', ')}`);
  }
  if (node.pattern && typeof value === 'string' && !new RegExp(node.pattern).test(value)) {
    errors.push(`${path}: "${value}" does not match ${node.pattern}`);
  }
  if (node.type === 'object' && value && typeof value === 'object') {
    for (const req of node.required ?? []) {
      if (!(req in value)) errors.push(`${path}: missing required field "${req}"`);
    }
    for (const [k, v] of Object.entries(value)) {
      if (node.properties && k in node.properties) {
        validate(node.properties[k], v, `${path}.${k}`);
      } else if (node.additionalProperties === false) {
        errors.push(`${path}: unknown field "${k}"`);
      } else if (node.additionalProperties && typeof node.additionalProperties === 'object') {
        validate(node.additionalProperties, v, `${path}.${k}`);
      }
    }
  }
  if (node.type === 'array' && Array.isArray(value)) {
    if (node.minItems != null && value.length < node.minItems) {
      errors.push(`${path}: needs at least ${node.minItems} item(s)`);
    }
    if (node.items) value.forEach((v, i) => validate(node.items, v, `${path}[${i}]`));
  }
}

validate(schema, config, '$');

// Per-phase required top-level sections
if (phase) {
  const phaseReq = schema['x-phase-required']?.[phase];
  if (!phaseReq) {
    errors.push(`$: unknown phase "${phase}" (valid: ${Object.keys(schema['x-phase-required'] ?? {}).join(', ')})`);
  } else {
    for (const section of phaseReq) {
      if (!(section in config)) errors.push(`$: phase "${phase}" requires section "${section}"`);
    }
  }
}

// kit-v1.1.0 build-phase env-var roster check.
// Every name here MUST appear in secrets.required — these are the vars that have
// no runtime fallback and would produce a cryptic failure if silently absent.
// Covers both Replit Secret values and plain required env-var names.
const BUILD_PHASES = new Set(['build', 'prelaunch', 'golive']);
if (phase && BUILD_PHASES.has(phase)) {
  const KIT_V1_1_0_REQUIRED = [
    'APPFOLIO_CLIENT_ID',       // AppFolio Reports API OAuth — secret
    'APPFOLIO_CLIENT_SECRET',   // AppFolio Reports API OAuth — secret
    'GMAIL_APP_PASSWORD',       // SMTP app password — secret
    'GMAIL_SMTP_USER',          // Sending address — no fallback, must be set
    'INDEXNOW_KEY',             // IndexNow key string — no fallback, must be set
    'VITE_UTM_STORAGE_KEY',     // sessionStorage key for UTM capture — required at build
    'VITE_GA4_MEASUREMENT_ID',  // GA4 Measurement ID — throws at build if missing
  ];
  const declaredRequired = new Set(config.secrets?.required ?? []);
  for (const name of KIT_V1_1_0_REQUIRED) {
    if (!declaredRequired.has(name)) {
      errors.push(
        `$.secrets.required: kit-v1.1.0 required env-var "${name}" must be listed in secrets.required` +
        ` (phase "${phase}" — add it so the operator knows it must be set before the build)`
      );
    }
  }
}

// Secret-value tripwire: nothing in the config may look like a secret VALUE.
const secretish = /(sk-[A-Za-z0-9]{16,}|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-|ghp_[A-Za-z0-9]{20,})/;
const flat = JSON.stringify(config);
if (secretish.test(flat)) {
  errors.push('$: config appears to contain a secret VALUE — configs carry env-var NAMES only');
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL ${e}`);
  console.error(`\n${errors.length} error(s) in ${configPath}${phase ? ` (phase: ${phase})` : ''}`);
  process.exit(1);
}
console.log(`OK ${configPath} is valid${phase ? ` for phase "${phase}"` : ''}`);
