import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  INTERNET_EXISTING_LEASE,
  INTERNET_NEW_LEASE_PRICING,
  RESIDENT_INTERNET_FACTS,
  formatInternetMonthlyPrice,
  internetEffectiveNotice,
} from './internetFacts';

describe('resident internet facts', () => {
  it('keeps all approved new-lease tiers distinct from existing-lease policy', () => {
    expect(INTERNET_NEW_LEASE_PRICING).toEqual([
      { floorPlan: 'Studio', monthlyPrice: 75 },
      { floorPlan: 'Junior Convertible', monthlyPrice: 75 },
      { floorPlan: 'Convertible', monthlyPrice: 75 },
      { floorPlan: '1 Bedroom / 1 Bath', monthlyPrice: 85 },
      { floorPlan: '2 Bedroom / 1 Bath', monthlyPrice: 95 },
      { floorPlan: '2 Bedroom / 2 Bath', monthlyPrice: 95 },
      { floorPlan: '2 Bedroom + Den', monthlyPrice: 95 },
      { floorPlan: '3 Bedroom / 3 Bath', monthlyPrice: 95 },
    ]);
    expect(INTERNET_EXISTING_LEASE.standardMonthlyPrice).toBe(75);
    expect(INTERNET_EXISTING_LEASE.priceMatchMinimumMonthlyPrice).toBe(45);
    expect(RESIDENT_INTERNET_FACTS.service.speed).toBe('2 Gig symmetrical download and upload');
  });

  it('states the approved effective date without gating active prospect copy', () => {
    expect(internetEffectiveNotice()).toBe('Effective September 15, 2026.');
    expect(formatInternetMonthlyPrice(45)).toBe('$45/month');
  });

  it('keeps every generated editable format aligned with the canonical source', () => {
    const root = join(__dirname, '..', '..');
    const listingDir = join(root, 'docs', 'directory-listings');
    const phoneDir = join(root, 'docs', 'leasing-questionnaire');
    const generated = [
      readFileSync(join(listingDir, 'fact-sheet.txt'), 'utf8'),
      readFileSync(join(listingDir, 'fact-sheet.html'), 'utf8'),
      readFileSync(join(phoneDir, 'leasing-questionnaire.md'), 'utf8'),
      readFileSync(join(phoneDir, 'leasing-questionnaire.html'), 'utf8'),
    ];
    const required = [
      RESIDENT_INTERNET_FACTS.effectiveDateDisplay,
      RESIDENT_INTERNET_FACTS.service.speed,
      'hot jack',
      'bring your own router',
      formatInternetMonthlyPrice(INTERNET_EXISTING_LEASE.standardMonthlyPrice),
      formatInternetMonthlyPrice(INTERNET_EXISTING_LEASE.priceMatchMinimumMonthlyPrice),
      ...INTERNET_NEW_LEASE_PRICING.flatMap((tier) => [
        tier.floorPlan,
        formatInternetMonthlyPrice(tier.monthlyPrice),
      ]),
    ];
    for (const output of generated) {
      for (const value of required) expect(output).toContain(value);
    }

    const rawFacts = readFileSync(join(listingDir, 'facts.json'), 'utf8');
    const facts = JSON.parse(rawFacts);
    expect(facts.residentInternet).toEqual(RESIDENT_INTERNET_FACTS);
    const { factsHash, generated: _generated, ...coreFacts } = facts;
    expect(createHash('sha256').update(JSON.stringify(coreFacts)).digest('hex')).toBe(factsHash);
    expect(readFileSync(join(listingDir, 'fact-sheet.pdf.hash'), 'utf8').trim()).toBe(factsHash);
  });
});