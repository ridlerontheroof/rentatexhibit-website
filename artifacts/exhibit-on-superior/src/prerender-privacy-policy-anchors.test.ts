import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The SimpleVoIP A2P registration URL points to #sms-terms, and the SMS
// Terms section links to the messaging privacy policy below it. Keep both
// anchors in the crawler-facing HTML so a privacy-policy edit cannot silently
// break either registered link.

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '..', 'dist', 'public');
const privacyPolicyHtml = path.join(publicDir, 'privacy-policy', 'index.html');
const hasCompleteBuild = await fs
  .access(path.join(publicDir, 'index.html.br'))
  .then(() => true)
  .catch(() => false);

describe.skipIf(!hasCompleteBuild)('prerendered privacy-policy anchors', () => {
  it('keeps the SMS Terms and messaging privacy policy anchors', async () => {
    const html = await fs.readFile(privacyPolicyHtml, 'utf8');

    expect(html).toContain('id="sms-terms"');
    expect(html).toContain('id="messaging-privacy-policy"');
  });
});