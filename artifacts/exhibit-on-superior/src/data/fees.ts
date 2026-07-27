// Fee & leasing-cost source of truth for Exhibit On Superior.
//
// Every figure here comes from live AppFolio listing data or the
// leasing-approved questionnaire (docs/leasing-questionnaire/
// leasing-questionnaire.md). Renter-facing surfaces (the Fees page copy AND
// its citation-friendly fact table) must render from these exports so the
// numbers can never diverge; the fee-floorplan-consistency tests parse this
// module's source directly.

export interface UtilityBundleRow {
  type: string;
  size: string;
  fee: string;
}

/** Monthly Utility & Service Amenity fee by floor-plan type. */
export const UTILITY_BUNDLE: UtilityBundleRow[] = [
  { type: 'Studio', size: '448\u2013484 sq ft', fee: '$95' },
  { type: 'Jr. Convertible', size: '450\u2013478 sq ft', fee: '$95' },
  { type: 'Convertible', size: '554 sq ft', fee: '$105' },
  { type: '1 Bedroom', size: '619\u2013768 sq ft', fee: '$115' },
  { type: '2 Bedroom / 1 Bath', size: '767\u2013821 sq ft', fee: '$125' },
  { type: '2 Bedroom / 2 Bath', size: '899\u20131,135 sq ft', fee: '$150' },
  { type: '2 Bedroom + Den', size: '983 sq ft', fee: '$165' },
  { type: '3 Bedroom / 3 Bath', size: '1,455\u20131,528 sq ft', fee: '$195' },
];

/** "$95–$195" — the full monthly range across the utility-fee tiers. */
export const UTILITY_FEE_RANGE = `${UTILITY_BUNDLE[0].fee}\u2013${
  UTILITY_BUNDLE[UTILITY_BUNDLE.length - 1].fee
}`;

// Individual fee figures (dollar amounts as displayed).
export const APPLICATION_FEE = '$60';
export const ADMIN_FEE = '$500';
export const SECURITY_DEPOSIT = '$0';
export const PARKING_FEE = '$335';
export const STORAGE_FEE = '$25';
export const PET_FEE_ONE_DOG = '$650';
export const PET_FEE_TWO_DOGS = '$750';
export const PET_FEE_CATS = '$325';

export interface FeeSummaryRow {
  item: string;
  amount: string;
  frequency: string;
  notes: string;
}

/**
 * The at-a-glance fees & costs table rendered on /fees. Amounts reference the
 * constants above — never hand-typed twice.
 */
export const FEE_SUMMARY: FeeSummaryRow[] = [
  {
    item: 'Application fee',
    amount: `${APPLICATION_FEE} per applicant`,
    frequency: 'One-time',
    notes: 'Shown on each unit\u2019s secure online application before you pay',
  },
  {
    item: 'Administration fee',
    amount: `${ADMIN_FEE} per apartment`,
    frequency: 'One-time',
    notes: 'Non-refundable; refunded only if the application is denied',
  },
  {
    item: 'Security deposit',
    amount: SECURITY_DEPOSIT,
    frequency: '\u2014',
    notes: 'Exhibit does not currently collect a security deposit',
  },
  {
    item: 'Utility & Service Amenity fee',
    amount: `${UTILITY_FEE_RANGE} by floor plan`,
    frequency: 'Monthly',
    notes: 'Water, sewer, trash, heat, A/C, and cooking/dryer gas \u2014 see tiers below',
  },
  {
    item: 'Garage parking',
    amount: `${PARKING_FEE} per space`,
    frequency: 'Monthly',
    notes: 'Unreserved, subject to availability',
  },
  {
    item: 'On-site storage',
    amount: STORAGE_FEE,
    frequency: 'Monthly',
    notes: 'Storage locker rental',
  },
  {
    item: 'Pet fee \u2014 dogs',
    amount: `${PET_FEE_ONE_DOG} for one, ${PET_FEE_TWO_DOGS} for two`,
    frequency: 'One-time',
    notes: 'Two-dog maximum; no pet deposit or monthly pet rent',
  },
  {
    item: 'Pet fee \u2014 cats',
    amount: PET_FEE_CATS,
    frequency: 'One-time',
    notes: 'Two-cat maximum; no pet deposit or monthly pet rent',
  },
];
