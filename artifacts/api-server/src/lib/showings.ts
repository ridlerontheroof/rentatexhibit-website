/**
 * AppFolio showing-scheduler client.
 *
 * Replicates the behind-the-scenes requests of AppFolio's hosted
 * "Schedule a Showing" page (listings/showings/new) so the site can offer an
 * Exhibit-branded booking flow whose submissions land in AppFolio's showing
 * scheduler exactly as if the prospect used the hosted page:
 *
 *  1. POST /listings/api/guest_cards       — step-1 contact info (snake_case
 *     body — camelCase gets a bare 400); the response carries a guest_card_id.
 *  2. GET  /listings/api/listings/<uid>/availabilities — live time slots
 *     (anonymous; query params MUST be snake_case, camelCase gets a 422).
 *  3. POST /listings/api/showings          — books the appointment, authorized
 *     by guest_card_id alone (AppFolio stopped issuing X-JWT tokens 2026-07;
 *     a Bearer header is attached only if one ever reappears). AppFolio then
 *     fires its own confirmation/reminder messaging unchanged.
 *
 * Slot times historically arrived as property-local wall time
 * ("YYYY/MM/DD HH:mm"); since 2026-07 AppFolio sends ISO-8601 with offset
 * ("2026-07-30T10:30:00-05:00") and dash dates ("2026-07-30"). This module
 * accepts BOTH formats and normalizes them to the legacy canonical shape
 * (slash dates + property-local wall times) so every downstream consumer —
 * the routes' slot revalidation, the web client's grouping/labels, and the
 * booking POST (which has always sent ISO instants) — is format-agnostic.
 * Conversion uses the property's timezone (America/Chicago) so bookings are
 * exact regardless of where the server or visitor sits.
 *
 * If AppFolio's format drifts AGAIN, normalizeAvailabilities counts raw vs
 * accepted timeslots so callers can detect the "every slot silently dropped"
 * failure mode (see showingFormatAlert.ts) instead of showing an empty
 * calendar for weeks.
 *
 * This mirrors the proven guest-card pattern in appfolio.ts: unofficial
 * hosted-form replication, so every failure is explicit and loud — callers
 * own the fallback (lead capture + hosted-page handoff).
 */

const APPFOLIO_DB = process.env.APPFOLIO_DATABASE ?? "highlandrealestatepartners";
const LISTINGS_BASE = `https://${APPFOLIO_DB}.appfolio.com/listings`;

import { DEFAULT_LEAD_SOURCE } from "./leadSource";

/** Attribution shown to the leasing team; keep in sync with the guest-card push. */
export const SHOWING_SOURCE = DEFAULT_LEAD_SOURCE;

/** Timezone the property's slot wall times are quoted in. */
export const PROPERTY_TIMEZONE = "America/Chicago";

/** Hosted AppFolio scheduling page for a listing — the visitor-facing fallback. */
export function hostedShowingsUrl(listableUid: string, source: string = SHOWING_SOURCE): string {
  // The hosted fallback keeps the visit's campaign attribution when one was
  // captured; callers pass a pre-sanitized source or omit it for the default.
  return `${LISTINGS_BASE}/showings/new?listable_uid=${encodeURIComponent(listableUid)}&source=${encodeURIComponent(source)}`;
}

export interface ShowingSlot {
  /** Canonical property-local wall time, "YYYY/MM/DD HH:mm" (normalized from either AppFolio format). */
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
  /** "YYYY/MM/DD" when AppFolio suggests jumping ahead, else null (normalized from either format). */
  firstAvailableDate: string | null;
  /** Raw timeslot entries AppFolio sent, before format validation. */
  rawTimeslotCount: number;
  /** Timeslots that parsed into a bookable canonical slot. */
  acceptedSlotCount: number;
}

/**
 * The "every slot silently dropped" failure mode: AppFolio sent timeslots but
 * none parsed — its format drifted again. Callers must treat this loudly
 * (error log, slots_degraded heartbeat, alert email), never as "no openings".
 */
export function allSlotsDropped(a: Pick<ShowingAvailabilities, "rawTimeslotCount" | "acceptedSlotCount">): boolean {
  return a.rawTimeslotCount > 0 && a.acceptedSlotCount === 0;
}

const SLOT_TIME_RE = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/;
/** ISO-8601 with explicit offset (or Z), as AppFolio sends since 2026-07. */
const ISO_SLOT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const DATE_RE = /^(\d{4})[/-](\d{2})[/-](\d{2})$/;

/** Normalize a "YYYY/MM/DD" or "YYYY-MM-DD" date to canonical "YYYY/MM/DD", else null. */
export function normalizeDateKey(date: unknown): string | null {
  if (typeof date !== "string") return null;
  const m = date.match(DATE_RE);
  return m ? `${m[1]}/${m[2]}/${m[3]}` : null;
}

/**
 * Convert an ISO-with-offset slot time to the canonical property-local wall
 * time ("YYYY/MM/DD HH:mm"). The offset makes the instant exact; Intl maps it
 * into the property timezone, so a slot renders and books identically whether
 * AppFolio quoted it in CDT, CST, or UTC.
 */
export function isoSlotToWallTime(iso: string, timeZone = PROPERTY_TIMEZONE): string {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) {
    throw new Error(`Malformed ISO showing slot time: ${JSON.stringify(iso)}`);
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = String(Number(get("hour")) % 24).padStart(2, "0");
  return `${get("year")}/${get("month")}/${get("day")} ${hour}:${get("minute")}`;
}

/** Parse a slot time in EITHER AppFolio format to canonical wall time, or null. */
function toCanonicalSlotTime(time: unknown): string | null {
  if (typeof time !== "string") return null;
  if (SLOT_TIME_RE.test(time)) return time;
  if (ISO_SLOT_RE.test(time)) {
    try {
      return isoSlotToWallTime(time);
    } catch {
      return null;
    }
  }
  return null;
}

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
  let rawTimeslotCount = 0;
  let acceptedSlotCount = 0;
  for (const raw of rawDays as Json[]) {
    const date = normalizeDateKey(raw?.date);
    if (!date) continue;
    const slots: ShowingSlot[] = [];
    for (const s of (Array.isArray(raw.timeslots) ? raw.timeslots : []) as Json[]) {
      rawTimeslotCount += 1;
      const time = toCanonicalSlotTime(s?.time);
      if (time && typeof s?.agent_id === "number") {
        slots.push({ time, agentId: s.agent_id });
        acceptedSlotCount += 1;
      }
    }
    days.push({ date, slots });
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
    firstAvailableDate: normalizeDateKey(data.first_available_date),
    rawTimeslotCount,
    acceptedSlotCount,
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
    throw await appfolioResponseError("AppFolio availabilities failed", res);
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
  /**
   * Pre-sanitized visit source label (see lib/leadSource.ts). Defaults to
   * SHOWING_SOURCE — routes must sanitize before passing anything else.
   */
  source?: string;
}

export interface ShowingContactResult {
  guestCardId: string;
  /**
   * Bearer token from the X-JWT response header, when AppFolio issues one.
   * As of 2026-07-26 the endpoint no longer returns it — bookings authorize
   * via guest_card_id alone — but keep forwarding it if it ever reappears.
   */
  jwt: string | null;
}

/**
 * Build a diagnosable error for a failed AppFolio response: status, content
 * type, request id, and a body snippet (even when empty — say so), so the
 * next contract drift is identifiable from production logs alone.
 */
export async function appfolioResponseError(label: string, res: Response): Promise<Error> {
  const detail = await res.text().catch(() => "");
  return new Error(
    `${label}: status ${res.status}` +
      ` content-type=${res.headers.get("content-type") ?? "none"}` +
      ` x-request-id=${res.headers.get("x-request-id") ?? "none"}` +
      ` body=${detail ? JSON.stringify(detail.slice(0, 300)) : "<empty>"}`,
  );
}

/**
 * Create the showing guest card (hosted page step 1). Identical endpoint and
 * source attribution to the existing lead guest-card push, but also captures
 * the guest_card_id the booking POST requires.
 *
 * NOTE: the endpoint requires a snake_case body — AppFolio's hosted client
 * snake_cases every request; camelCase now gets a bare 400 (empty body).
 */
export async function createShowingGuestCard(
  input: ShowingContactInput,
): Promise<ShowingContactResult> {
  const res = await fetch(`${LISTINGS_BASE}/api/guest_cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({
      first_name: input.firstName,
      last_name: input.lastName,
      email_address: input.email,
      phone_number: input.phone,
      listable_uid: input.listableUid,
      source: input.source ?? SHOWING_SOURCE,
      skip_cta_for_new_inquiries: true,
    }),
  });
  if (!res.ok) {
    throw await appfolioResponseError("AppFolio showing guest card failed", res);
  }
  const data = (await res.json().catch(() => ({}))) as Json;
  const guestCardId = data.guest_card_id ?? data.guestCardId;
  const jwt = res.headers.get("X-JWT");
  if (typeof guestCardId !== "string" && typeof guestCardId !== "number") {
    throw new Error("AppFolio showing guest card response missing guest_card_id");
  }
  return { guestCardId: String(guestCardId), jwt };
}

export interface BookShowingInput {
  listableUid: string;
  guestCardId: string;
  /** Optional bearer token — sent only when the guest card issued one. */
  jwt?: string | null;
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
 * hosted client sends: snake_case body, showing_type "In Person" (the hosted
 * page's non-virtual option). A Bearer JWT is attached only when the guest
 * card issued one (AppFolio stopped returning X-JWT on 2026-07-26; bookings
 * authorize via guest_card_id alone).
 */
export async function bookShowing(input: BookShowingInput): Promise<BookedShowing> {
  const start = slotTimeToDate(input.slotTime);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const res = await fetch(`${LISTINGS_BASE}/api/showings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(input.jwt ? { Authorization: `Bearer ${input.jwt}` } : {}),
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
    throw await appfolioResponseError("AppFolio showing booking failed", res);
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
