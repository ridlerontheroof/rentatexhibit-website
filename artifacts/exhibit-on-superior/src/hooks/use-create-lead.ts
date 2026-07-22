import { useMutation } from '@tanstack/react-query';

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
    body: JSON.stringify(data),
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
