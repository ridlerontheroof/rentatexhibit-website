import { useMutation } from '@tanstack/react-query';
import { getVisitSource } from '../lib/visitSource';

export interface CreateLeadPayload {
  type: 'contact' | 'tour';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message?: string;
  preferredDate?: string;
  /** Apartment number (e.g. "0807") when the tour is for a specific unit. */
  unit?: string;
  /** Honeypot field — always empty for real visitors (see BotGuard). */
  xh_note?: string;
  /** Milliseconds between first typing and submit; omitted when the visitor never typed (see BotGuard). */
  elapsedMs?: number;
}

export interface LeadResponse {
  id: number;
  type: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string | null;
  preferredDate: string | null;
  createdAt: string;
}

const createLead = async (data: CreateLeadPayload): Promise<LeadResponse> => {
  const response = await fetch(`${import.meta.env.BASE_URL}api/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Visit-scoped campaign attribution rides along automatically; the
    // server sanitizes it and falls back to the default source when absent.
    body: JSON.stringify({ source: getVisitSource() ?? undefined, ...data }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit form');
  }

  return response.json();
};

export const useCreateLead = () =>
  useMutation({
    mutationFn: createLead,
  });
