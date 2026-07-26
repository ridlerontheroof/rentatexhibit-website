// Client for the api-server showing-scheduler proxies (/api/showings/*),
// which replicate AppFolio's hosted "Schedule a Showing" flow server-side.
// Every AppFolio call and unit → listing resolution stays on the server; the
// browser only ever talks to our own API. Errors carry the server's
// machine-readable code so the page can drive the designed fallback
// (standard lead capture + hosted-page handoff).
import { useMutation, useQuery } from '@tanstack/react-query';

export interface ShowingSlot {
  /** Property-local wall time, "YYYY/MM/DD HH:mm". */
  time: string;
  agentId: number;
}

export interface ShowingDay {
  /** "YYYY/MM/DD" property-local date. */
  date: string;
  slots: ShowingSlot[];
}

export interface ShowingSlotsResponse {
  unit: string;
  hostedUrl: string;
  durationMinutes: number;
  days: ShowingDay[];
  futureAvailabilitiesExist: boolean;
  firstAvailableDate: string | null;
}

export interface ShowingContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  unit: string;
}

export interface ShowingContactResponse {
  guestCardId: string;
  /** Booking token, when AppFolio issues one (it stopped doing so 2026-07). */
  jwt: string | null;
  hostedUrl: string;
}

export interface ShowingBookPayload {
  unit: string;
  guestCardId: string;
  jwt: string | null;
  slotTime: string;
  agentId: number;
}

export interface BookedShowing {
  startAt: string;
  endAt: string;
  fullAddress: string | null;
}

/** API error carrying the server's machine-readable code + optional hosted URL. */
export class ShowingApiError extends Error {
  code: string;
  hostedUrl?: string;
  constructor(code: string, hostedUrl?: string) {
    super(`Showing API error: ${code}`);
    this.code = code;
    this.hostedUrl = hostedUrl;
  }
}

async function parseError(response: Response): Promise<ShowingApiError> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    hostedUrl?: string;
  };
  return new ShowingApiError(body.error ?? `http_${response.status}`, body.hostedUrl);
}

const api = (path: string) => `${import.meta.env.BASE_URL}api/showings/${path}`;

async function fetchShowingSlots(unit: string): Promise<ShowingSlotsResponse> {
  const response = await fetch(`${api('slots')}?unit=${encodeURIComponent(unit)}`);
  if (!response.ok) throw await parseError(response);
  return response.json();
}

export function useShowingSlots(unit: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['showing-slots', unit],
    queryFn: () => fetchShowingSlots(unit as string),
    enabled: enabled && !!unit,
    staleTime: 60_000,
    retry: 1,
  });
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
}

export const useShowingContact = () =>
  useMutation<ShowingContactResponse, ShowingApiError, ShowingContactPayload>({
    mutationFn: (payload) => postJson(api('contact'), payload),
  });

export const useBookShowing = () =>
  useMutation<BookedShowing, ShowingApiError, ShowingBookPayload>({
    mutationFn: (payload) => postJson(api('book'), payload),
  });

/** "2026/07/28" → "Tuesday, July 28" (no timezone math — already wall time). */
export function formatSlotDate(date: string): string {
  const [y, m, d] = date.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** "2026/07/28 13:15" → "1:15 PM" (no timezone math — already wall time). */
export function formatSlotTime(time: string): string {
  const hm = time.slice(11);
  const [h, m] = hm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
