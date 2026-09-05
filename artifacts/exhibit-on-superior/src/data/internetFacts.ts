export const INTERNET_EFFECTIVE_DATE = '2026-09-15';
export const INTERNET_EFFECTIVE_DATE_DISPLAY = 'September 15, 2026';

export const INTERNET_NEW_LEASE_PRICING = [
  { floorPlan: 'Studio', monthlyPrice: 75 },
  { floorPlan: 'Junior Convertible', monthlyPrice: 75 },
  { floorPlan: 'Convertible', monthlyPrice: 75 },
  { floorPlan: '1 Bedroom / 1 Bath', monthlyPrice: 85 },
  { floorPlan: '2 Bedroom / 1 Bath', monthlyPrice: 95 },
  { floorPlan: '2 Bedroom / 2 Bath', monthlyPrice: 95 },
  { floorPlan: '2 Bedroom + Den', monthlyPrice: 95 },
  { floorPlan: '3 Bedroom / 3 Bath', monthlyPrice: 95 },
] as const;

export const INTERNET_EXISTING_LEASE = {
  standardMonthlyPrice: 75,
  priceMatchMinimumMonthlyPrice: 45,
  priceMatchPolicy:
    "The monthly charge may be reduced to the resident's documented existing service cost, with a $45/month minimum.",
} as const;

export const INTERNET_SERVICE = {
  provider: 'Zentro',
  speed: '2 Gig symmetrical download and upload',
  delivery:
    'Internet is delivered through a hot jack in the apartment, meaning the wired connection reaches the unit.',
  wifi:
    'Residents bring their own router for Wi-Fi (BYOR: bring your own router).',
} as const;

export const RESIDENT_INTERNET_FACTS = {
  effectiveDate: INTERNET_EFFECTIVE_DATE,
  effectiveDateDisplay: INTERNET_EFFECTIVE_DATE_DISPLAY,
  newLeasePricing: INTERNET_NEW_LEASE_PRICING,
  existingLease: INTERNET_EXISTING_LEASE,
  service: INTERNET_SERVICE,
} as const;

export function internetEffectiveNotice(): string {
  return `Effective ${INTERNET_EFFECTIVE_DATE_DISPLAY}.`;
}

export const formatInternetMonthlyPrice = (price: number): string => `$${price}/month`;