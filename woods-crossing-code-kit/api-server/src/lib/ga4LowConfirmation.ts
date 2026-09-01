export interface Ga4LowResult {
  activeUsers: number | null;
  error?: string;
}

interface ConfirmationLogger {
  warn(fields: Record<string, unknown>, message: string): void;
}

export interface ConfirmGa4LowResultOptions<T extends Ga4LowResult> {
  initial: T;
  minActiveUsers: number;
  configFingerprint: string;
  query: () => Promise<T>;
  log: ConfirmationLogger;
}

/**
 * Confirm a potentially transient low GA4 reading before classification.
 * Returning the confirmation makes recovery healthy, repeated low definitive,
 * and a failed confirmation ambiguous to the caller's normal classifier.
 */
export async function confirmGa4LowResult<T extends Ga4LowResult>({
  initial,
  minActiveUsers,
  configFingerprint,
  query,
  log,
}: ConfirmGa4LowResultOptions<T>): Promise<T> {
  if (initial.activeUsers === null || initial.activeUsers > minActiveUsers) {
    return initial;
  }

  const confirmation = await query();
  log.warn(
    {
      initialActiveUsers: initial.activeUsers,
      confirmationActiveUsers: confirmation.activeUsers,
      confirmationError: confirmation.error,
      configFingerprint,
    },
    confirmation.activeUsers !== null && confirmation.activeUsers > minActiveUsers
      ? "GA4 visitor-data initial low reading recovered on confirmation"
      : confirmation.activeUsers === null
        ? "GA4 visitor-data low reading confirmation errored (ambiguous)"
        : "GA4 visitor-data low reading confirmed by a second query",
  );
  return confirmation;
}