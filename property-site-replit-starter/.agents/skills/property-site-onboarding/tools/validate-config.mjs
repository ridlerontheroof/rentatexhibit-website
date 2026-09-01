#!/usr/bin/env node
/**
 * validate-config.mjs — validates a property-config.json against
 * property-config.schema.json, with per-phase required-field enforcement.
 *
 * Usage:
 *   node validate-config.mjs <config.json> [--phase intake|discovery|design|build|prelaunch|golive]
 *
 * Dependency-free: implements the subset of JSON Schema this schema uses
 * (type, required, properties, additionalProperties, pattern, enum, const,
 * items, minItems, minLength, and conditional allOf branches).
 * Exit 0 = valid; exit 1 = errors printed one per line.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

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
const environmentSchema = JSON.parse(readFileSync(join(here, '..', 'schema', 'environment-manifest.schema.json'), 'utf8'));
const contentSchema = JSON.parse(readFileSync(join(here, '..', 'schema', 'property-content.schema.json'), 'utf8'));
const kitV2Roster = {APPFOLIO_CLIENT_ID:['api-server','account-secret-link'],APPFOLIO_CLIENT_SECRET:['api-server','account-secret-link'],DATABASE_URL:['api-server','property-secret'],GMAIL_APP_PASSWORD:['api-server','property-secret'],GMAIL_SMTP_USER:['api-server','non-secret'],LEASING_INBOX_EMAIL:['api-server','non-secret'],SEED_ALERT_EMAIL:['api-server','non-secret'],INDEXNOW_KEY:['api-server','property-secret'],SESSION_SECRET:['api-server','property-secret'],VITE_API_URL:['web','non-secret'],VITE_GA4_MEASUREMENT_ID:['web','non-secret'],VITE_UTM_STORAGE_KEY:['web','non-secret']};
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
  if ('const' in node && value !== node.const) {
    errors.push(`${path}: must equal ${JSON.stringify(node.const)}`);
  }
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
  if (node.minLength != null && typeof value === 'string' && value.length < node.minLength) {
    errors.push(`${path}: needs at least ${node.minLength} character(s)`);
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
  for (const branch of node.allOf ?? []) {
    const conditionMatches = !branch.if || schemaMatches(branch.if, value);
    if (conditionMatches && branch.then) validate(branch.then, value, path);
    if (conditionMatches && branch.not && schemaMatches(branch.not, value)) {
      errors.push(`${path}: must not match prohibited schema`);
    }
  }
}

validate(schema, config, '$');

function schemaMatches(node, value) {
  if (!node || typeof node !== 'object') return true;
  if ('const' in node && value !== node.const) return false;
  if (node.type && typeOf(value) !== node.type) return false;
  if (node.enum && !node.enum.includes(value)) return false;
  if (node.pattern && (typeof value !== 'string' || !new RegExp(node.pattern).test(value))) return false;
  if (node.type === 'object' && value && typeof value === 'object') {
    for (const req of node.required ?? []) if (!(req in value)) return false;
    for (const [key, child] of Object.entries(node.properties ?? {})) {
      if (key in value && !schemaMatches(child, value[key])) return false;
    }
  }
  return true;
}

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

// kit-v2.0.0 build-phase env-var roster check.
// Every name here MUST appear in secrets.required — these are the vars that have
// no runtime fallback and would produce a cryptic failure if silently absent.
// Covers both Replit Secret values and plain required env-var names.
const BUILD_PHASES = new Set(['build', 'prelaunch', 'golive']);
if (phase && BUILD_PHASES.has(phase)) {
  const KIT_REQUIRED = [
    'APPFOLIO_CLIENT_ID',       // AppFolio Reports API OAuth — secret
    'APPFOLIO_CLIENT_SECRET',   // AppFolio Reports API OAuth — secret
    'GMAIL_APP_PASSWORD',       // SMTP app password — secret
    'GMAIL_SMTP_USER',          // Sending address — no fallback, must be set
    'INDEXNOW_KEY',             // IndexNow key string — no fallback, must be set
    'VITE_UTM_STORAGE_KEY',     // sessionStorage key for UTM capture — required at build
    'VITE_GA4_MEASUREMENT_ID',  // GA4 Measurement ID — throws at build if missing
  ];
  const declaredRequired = new Set(config.secrets?.required ?? []);
  for (const name of KIT_REQUIRED) {
    if (!declaredRequired.has(name)) {
      errors.push(
        `$.secrets.required: kit-v2.0.0 required env-var "${name}" must be listed in secrets.required` +
        ` (phase "${phase}" — add it so the operator knows it must be set before the build)`
      );
    }
  }

  const manifestRef = config.environmentManifestPath;
  if (!manifestRef || typeof manifestRef !== 'string') {
    errors.push('$.environmentManifestPath: build/prelaunch/golive requires a path to the environment manifest');
  } else {
    const manifestPath = resolve(dirname(resolve(configPath)), manifestRef);
    let environmentManifest;
    try {
      environmentManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      errors.push(`$.environmentManifestPath: cannot read ${manifestRef} resolved as ${manifestPath}: ${e.message}`);
    }
    if (environmentManifest) {
      validate(environmentSchema, environmentManifest, '$.environmentManifest');
      if (environmentManifest.propertySlug !== config.property?.slug) {
        errors.push(`$.environmentManifest.propertySlug: "${environmentManifest.propertySlug}" must match $.property.slug "${config.property?.slug}"`);
      }
      if (environmentManifest.kitVersion !== config.kitVersion) {
        errors.push(`$.environmentManifest.kitVersion: "${environmentManifest.kitVersion}" must match $.kitVersion "${config.kitVersion}"`);
      }
      validateNoSecretValues(environmentManifest, '$.environmentManifest');
      const declaredManifestNames = new Set(
        (environmentManifest.entries ?? []).filter((entry) => entry.required).map((entry) => entry.name)
      );
      for (const name of declaredRequired) {
        if (!declaredManifestNames.has(name)) {
          errors.push(`$.environmentManifest.entries: required config env-var "${name}" needs a required manifest entry`);
        }
      }

      if (phase === 'prelaunch' || phase === 'golive') {
        if (environmentManifest.reviewStatus !== 'APPROVED') {
          errors.push('$.environmentManifest.reviewStatus: must be APPROVED for prelaunch/golive');
        }
        for (const [index, entry] of (environmentManifest.entries ?? []).entries()) {
          if (!entry.required) continue;
          const expectedStatus = entry.classification === 'account-secret-link' ? 'LINKED' : 'CONFIGURED';
          if (entry.approval !== 'APPROVED') {
            errors.push(`$.environmentManifest.entries[${index}].approval: required entry must be APPROVED for prelaunch/golive`);
          }
          if (entry.status !== expectedStatus) {
            errors.push(`$.environmentManifest.entries[${index}].status: required ${entry.classification} must be ${expectedStatus} for prelaunch/golive`);
          }
        }
        if (config.kitVersion?.startsWith('kit-v2')) for (const [name, [artifact, classification]] of Object.entries(kitV2Roster)) {
          const matches = (environmentManifest.entries ?? []).filter((entry) => entry.name === name);
          if (matches.length !== 1) { errors.push(`$.environmentManifest.entries: requires exactly one ${name}`); continue; }
          const entry = matches[0], terminal = classification === 'account-secret-link' ? 'LINKED' : 'CONFIGURED';
          if (entry.artifact !== artifact || entry.environment !== 'production' || entry.classification !== classification || entry.required !== true) errors.push(`$.environmentManifest.entries.${name}: wrong artifact/environment/classification`);
          if (entry.approval !== 'APPROVED' || entry.status !== terminal || !entry.approvedBy || !entry.approvedAt) errors.push(`$.environmentManifest.entries.${name}: not terminal`);
          if (classification === 'account-secret-link' && (entry.accountSecretName !== name || entry.scopeVerified !== true)) errors.push(`$.environmentManifest.entries.${name}: account secret scope invalid`);
        }
      }
    }
  }
}

// Secret-value tripwire: nothing in the config may look like a secret VALUE.
function validateNoSecretValues(value, path) {
  const prohibitedValueFields = new Set([
    'value', 'secretvalue', 'secret_value', 'credentialvalue', 'tokenvalue',
    'password', 'privatekey', 'private_key', 'apikey', 'api_key'
  ]);
  const secretish = /(?:sk-[A-Za-z0-9]{16,}|AKIA[A-Z0-9]{16}|AIza[0-9A-Za-z_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-|ghp_[A-Za-z0-9]{20,}|ya29\.[0-9A-Za-z._-]+)/;
  if (typeof value === 'string' && secretish.test(value)) {
    errors.push(`${path}: appears to contain a secret VALUE — manifests/configs carry names and metadata only`);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoSecretValues(item, `${path}[${index}]`));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (prohibitedValueFields.has(key.toLowerCase())) {
        errors.push(`${path}.${key}: secret-value fields are forbidden; record only the env-var name and status`);
      }
      validateNoSecretValues(child, `${path}.${key}`);
    }
  }
}
validateNoSecretValues(config, '$');

if (['build', 'prelaunch', 'golive'].includes(phase)) {
  if (!config.contentManifestPath || typeof config.contentManifestPath !== 'string') {
    errors.push('$.contentManifestPath: build/prelaunch/golive requires a path to the content manifest');
  } else {
    const contentPath = resolve(dirname(resolve(configPath)), config.contentManifestPath);
    try {
      const content = JSON.parse(readFileSync(contentPath, 'utf8'));
      validate(contentSchema, content, '$.contentManifest');
      const requiredContent = ['home','amenities','neighborhood','gallery','floorPlans','faqs','knowledge','blog','neighborhoodGuides','legacyRedirects'];
      if (content.propertySlug !== config.property?.slug) errors.push('$.contentManifest.propertySlug: must match config property.slug');
      for (const key of requiredContent) if (!(key in content)) errors.push(`$.contentManifest.${key}: required`);
      const slugs = [...(content.knowledge || []), ...(content.blog || []), ...(content.neighborhoodGuides || [])].map((article) => article.slug);
      if (new Set(slugs).size !== slugs.length) errors.push('$.contentManifest: article slugs must be globally unique');
      const redirects = content.legacyRedirects || [], sources = redirects.map((redirect) => redirect.from);
      if (new Set(sources).size !== sources.length) errors.push('$.contentManifest: legacy redirect sources must be unique');
      for (const redirect of redirects) if (redirect.from === redirect.to || redirects.some((other) => other.from === redirect.to)) errors.push('$.contentManifest: redirect loop/collision');
      for (const [name, items] of Object.entries({ amenities: content.amenities || [], neighborhood: content.neighborhood || [] })) for (const item of items) if (!item.title || !item.description) errors.push(`$.contentManifest.${name}: items require title/description`);
      for (const image of content.gallery || []) if (!image.src || !image.alt || !Number.isInteger(image.width) || image.width < 1 || !Number.isInteger(image.height) || image.height < 1 || !image.category) errors.push('$.contentManifest.gallery: items require src/alt/positive dimensions/category');
      const planSlugs = (content.floorPlans || []).map((plan) => plan.slug);
      if (new Set(planSlugs).size !== planSlugs.length) errors.push('$.contentManifest.floorPlans: duplicate slug');
      for (const plan of content.floorPlans || []) if (!plan.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plan.slug || '') || !plan.name || plan.beds < 0 || !(plan.baths > 0) || !(plan.sqft > 0)) errors.push('$.contentManifest.floorPlans: invalid item');
      for (const faq of content.faqs || []) if (!faq.question || !faq.answer) errors.push('$.contentManifest.faqs: items require question/answer');
      for (const article of [...(content.knowledge || []), ...(content.blog || []), ...(content.neighborhoodGuides || [])]) if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug || '') || !article.title || !article.excerpt || typeof article.content !== 'string' || article.content.length < 20) errors.push('$.contentManifest: invalid article');
      if (['prelaunch','golive'].includes(phase)) {
        if (content.status !== 'APPROVED' || !content.reviewedBy || !content.reviewedAt || content.provenance?.rightsConfirmed !== true) errors.push('$.contentManifest: prelaunch/golive requires APPROVED review and confirmed rights');
        if (!content.home?.heading || !content.home?.description || !content.gallery?.length || !content.floorPlans?.length) errors.push('$.contentManifest: approved property content cannot be empty');
        if (/(woods crossing|full content here|lorem ipsum|todo|placeholder)/i.test(JSON.stringify(content))) errors.push('$.contentManifest: placeholder or unsupported content is forbidden');
      }
    } catch (error) {
      errors.push(`$.contentManifestPath: cannot read ${config.contentManifestPath}: ${error.message}`);
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL ${e}`);
  console.error(`\n${errors.length} error(s) in ${configPath}${phase ? ` (phase: ${phase})` : ''}`);
  process.exit(1);
}
console.log(`OK ${configPath} is valid${phase ? ` for phase "${phase}"` : ''}`);
