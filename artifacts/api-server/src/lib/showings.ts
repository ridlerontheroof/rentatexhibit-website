/**
 * AppFolio showing-scheduler client.
 *
 * Replicates the behind-the-scenes requests of AppFolio's hosted
 * "Schedule a Showing" page (listings/showings/new) so the site can offer an
 * Exhibit-branded booking flow whose submissions land in AppFolio's showing
 * scheduler exactly as if the prospect used the hosted page:
 *
 *  1. POST /listings/api/guest_cards       — step-1 contact info; the response
 *     carries a guest_card_id plus an X-JWT header that authorizes booking.
 *  2. GET  /listings/api/listings/<uid>/availabilities — live time slots
 *     (anonymous; query params MUST be snake_case, camelCase gets a 422).
 *  3. POST /listings/api/showings          — books the appointment, sent with
 *     Authorization: Bearer <X-JWT>. AppFolio then fires its own
 *     confirmation/reminder messaging unchanged.
 *
 * Slot times arrive as property-local wall time ("YYYY/MM/DD HH:mm"); this
 * module converts them to instants using the property's timezone
 * (America/Chicago) so bookings are exact regardless of where the server or
 * visitor sits. Full flow notes: .local/tasks/task-363-notes.md.
 *
 * This mirrors the proven guest-card pattern in appfolio.ts: unofficial
 * hosted-form replication, so every failure is explicit and loud — callers
 * own the fallback (lead capture + hosted-page handoff).
 */

const APPFOLIO_DB = process.env.APPFOLIO_DATABASE ?? "highlandrealestatepartners";
const LISTINGS_BASE = `https://${APPFOLIO_DB}.appfolio.com/listings`;

/** Attribution shown to the leasing team; keep in sync with the guest-card push. */
export const SHOWING_SOURCE = "Website (Exhibit)";

/** Timezone the property's slot wall times are quoted in. */
export const PROPERTY_TIMEZONE = "America/Chicago";

/** Hosted AppFolio scheduling page for a listing — the visitor-facing fallback. */
export function hostedShowingsUrl(listableUid: string): string {
  return `${LISTINGS_BASE}/showings/new?listable_uid=${encodeURIComponent(listableUid)}&source=${encodeURIComponent(SHOWING_SOURCE)}`;
}

export interface ShowingSlot {
  /** Property-local wall time, "YYYY/MM/DD HH:mm" exactly as AppFolio sends it. */
  time: string;
  /** AppFolio agent (assigned_user_id) offering this slot. */
  agentId: number;
}

export interface ShowingDay {
  /** "YYYY/MM/DD" property-local date. */
  date: string;
  slots: ShowingSlot[];
}

export interface ShowingAvailabilities {
  /** Appointment length in minutes (prospect_scheduled_showing_duration). */
  durationMinutes: number;
  days: ShowingDay[];
  futureAvailabilitiesExist: boolean;
  /** "YYYY/MM/DD" when AppFolio suggests jumping ahead, else null. */
  firstAvailableDate: string | null;
}

const SLOT_TIME_RE = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/;

/**
 * Convert an AppFolio slot wall time ("YYYY/MM/DD HH:mm", property-local) to
 * a Date instant, honoring the property timezone's DST offset for that
 * moment. Throws on malformed input — a booking must never be made for a
 * guessed time.
 */
export function slotTimeToDate(slotTime: string, timeZone = PROPERTY_TIMEZONE): Date {
  const m = slotTime.match(SLOT_TIME_RE);
  if (!m) throw new Error(`Malformed showing slot time: ${JSON.stringify(slotTime)}`);
  const [, y, mo, d, h, mi] = m.map(Number) as unknown as number[];
  // First interpretation: treat the wall time as UTC, then correct by the
  // zone offset at that instant. One correction pass is exact except within
  // a DST transition hour; a second pass fixes that.
  let utc = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 2; i++) {
    const offsetMs = utc - wallTimeAsUtc(new Date(utc), timeZone);
    const corrected = Date.UTC(y, mo - 1, d, h, mi) + offsetMs;
    if (corrected === utc) break;
    utc = corrected;
  }
  return new Date(utc);
}

/** The zone-local wall-clock fields of `date`, re-encoded as a UTC timestamp. */
function wallTimeAsUtc(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
}

/** Today's date in the property timezone, formatted MM/DD/YYYY for AppFolio. */
export function propertyTodayMMDDYYYY(now = new Date(), timeZone = PROPERTY_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("month")}/${get("day")}/${get("year")}`;
}

type Json = Record<string, unknown>;

/** Normalize the snake_case availabilities response into ShowingAvailabilities. */
export function normalizeAvailabilities(data: Json): ShowingAvailabilities {
  const rawDays = Array.isArray(data.availabilities_by_date) ? data.availabilities_by_date : [];
  const days: ShowingDay[] = [];
  for (const raw of rawDays as Json[]) {
    if (typeof raw?.date !== "string") continue;
    const slots: ShowingSlot[] = [];
    for (const s of (Array.isArray(raw.timeslots) ? raw.timeslots : []) as Json[]) {
      if (typeof s?.time === "string" && SLOT_TIME_RE.test(s.time) && typeof s.agent_id === "number") {
        slots.push({ time: s.time, agentId: s.agent_id });
      }
    }
    days.push({ date: raw.date, slots });
  }
  const duration = typeof data.prospect_scheduled_showing_duration === "number"
    ? data.prospect_scheduled_showing_duration
    : null;
  if (duration === null || duration <= 0) {
    throw new Error("AppFolio availabilities response missing showing duration");
  }
  return {
    durationMinutes: duration,
    days,
    futureAvailabilitiesExist: data.future_availabilities_exist === true,
    firstAvailableDate:
      typeof data.first_available_date === "string" ? data.first_available_date : null,
  };
}

/**
 * Fetch live showing availabilities for a listing. `findFirstAvailableDate`
 * lets AppFolio suggest the first date with open slots; when it does and the
 * requested window is empty, we follow the suggestion once (same behavior as
 * the hosted page).
 */
export async function fetchShowingAvailabilities(
  listableUid: string,
  startDateMMDDYYYY: string,
  findFirstAvailableDate = true,
): Promise<ShowingAvailabilities> {
  const query = new URLSearchParams({
    start_date: startDateMMDDYYYY,
    find_first_available_date: String(findFirstAvailableDate),
  });
  const res = await fetch(
    `${LISTINGS_BASE}/api/listings/${encodeURIComponent(listableUid)}/availabilities?${query}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AppFolio availabilities failed: status ${res.status} ${detail.slice(0, 300)}`);
  }
  const first = normalizeAvailabilities((await res.json()) as Json);
  const hasSlots = first.days.some((d) => d.slots.length > 0);
  if (!hasSlots && findFirstAvailableDate && first.firstAvailableDate) {
    const [y, mo, d] = first.firstAvailableDate.split("/");
    return fetchShowingAvailabilities(listableUid, `${mo}/${d}/${y}`, false);
  }
  return first;
}

/**
 * AppFolio identity-verification gate. When a property manager enables IDV,
 * booking requires a Persona ID check we cannot proxy — callers must send the
 * visitor to the hosted page instead. Currently disabled for this database.
 */
export async function isIdentityVerificationEnabled(): Promise<boolean> {
  const res = await fetch(`${LISTINGS_BASE}/api/showings_identity_verifications/status`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`AppFolio IDV status failed: status ${res.status}`);
  const data = (await res.json()) as Json;
  return data.enabled === true;
}

export interface ShowingContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  listableUid: string;
}

export interface ShowingContactResult {
  guestCardId: string;
  /** Bearer token (X-JWT response header) that authorizes the booking POST. */
  jwt: string;
}

/**
 * Create the showing guest card (hosted page step 1). Identical endpoint and
 * source attribution to the existing lead guest-card push, but also captures
 * the guest_card_id and X-JWT the booking POST requires.
 */
export async function createShowingGuestCard(
  input: ShowingContactInput,
): Promise<ShowingContactResult> {
  const res = await fetch(`${LISTINGS_BASE}/api/guest_cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      firstName: input.firstName,
      lastName: input.lastName,
      emailAddress: input.email,
      phoneNumber: input.phone,
      listableUid: input.listableUid,
      source: SHOWING_SOURCE,
      skipCtaForNewInquiries: true,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AppFolio showing guest card failed: status ${res.status} ${detail.slice(0, 300)}`);
  }
  const data = (await res.json().catch(() => ({}))) as Json;
  const guestCardId = data.guest_card_id ?? data.guestCardId;
  const jwt = res.headers.get("X-JWT");
  if (typeof guestCardId !== "string" && typeof guestCardId !== "number") {
    throw new Error("AppFolio showing guest card response missing guest_card_id");
  }
  if (!jwt) {
    throw new Error("AppFolio showing guest card response missing X-JWT header");
  }
  return { guestCardId: String(guestCardId), jwt };
}

export interface BookShowingInput {
  listableUid: string;
  guestCardId: string;
  jwt: string;
  /** Slot wall time exactly as returned by availabilities ("YYYY/MM/DD HH:mm"). */
  slotTime: string;
  agentId: number;
  durationMinutes: number;
}

export interface BookedShowing {
  /** ISO instant the showing starts. */
  startAt: string;
  /** ISO instant the showing ends. */
  endAt: string;
  /** Full property address AppFolio confirms for the appointment. */
  fullAddress: string | null;
}

/**
 * Book the showing (hosted page step 2 confirm). Sends exactly what the
 * hosted client sends: snake_case body, Bearer JWT from the guest card,
 * showing_type "In Person" (the hosted page's non-virtual option).
 */
export async function bookShowing(input: BookShowingInput): Promise<BookedShowing> {
  const start = slotTimeToDate(input.slotTime);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const res = await fetch(`${LISTINGS_BASE}/api/showings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${input.jwt}`,
    },
    body: JSON.stringify({
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      assigned_user_id: input.agentId,
      listable_uid: input.listableUid,
      guest_card_id: input.guestCardId,
      from_email: false,
      showing_type: "In Person",
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AppFolio showing booking failed: status ${res.status} ${detail.slice(0, 300)}`);
  }
  const data = (await res.json().catch(() => ({}))) as Json;
  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    fullAddress:
      typeof data.full_address === "string"
        ? data.full_address
        : typeof data.fullAddress === "string"
          ? data.fullAddress
          : null,
  };
}
