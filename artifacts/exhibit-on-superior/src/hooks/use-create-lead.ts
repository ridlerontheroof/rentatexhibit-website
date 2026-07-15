import { useMutation, useQueryClient } from '@tanstack/react-query';

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message?: string;
  moveInDate?: string;
  bedrooms?: string;
  source?: string;
}

interface LeadResponse {
  id: string;
  success: boolean;
}

const createLead = async (data: LeadData): Promise<LeadResponse> => {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to submit form');
  }

  return response.json();
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};
