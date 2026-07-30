/**
 * Route tests for the Exhibit showing scheduler: slots, contact (guest card),
 * and booking proxies with AppFolio fully mocked, proving explicit failure
 * codes on every path the page's fallback logic depends on.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../lib/showings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/showings")>();
  return {
    ...actual,
    fetchShowingAvailabilities: vi.fn(),
    createShowingGuestCard: vi.fn(),
    bookShowing: vi.fn(),
    isIdentityVerificationEnabled: vi.fn(),
  };
});
vi.mock("./availability", () => ({
  getAvailabilitySnapshot: vi.fn(),
}));
// Live-traffic escalation is fire-and-forget from the routes; mock it so
// these tests only assert the wiring (what counts, what doesn't).
vi.mock("../lib/showingLiveFailureAlert", () => ({
  recordLiveShowingFailure: vi.fn(async () => {}),
  recordLiveShowingSuccess: vi.fn(async () => {}),
}));
// The drift alarm's log/email side effects have their own tests; here we
// assert only the route wiring (when it is consulted, what it changes).
vi.mock("../lib/showingFormatAlert", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/showingFormatAlert")>();
  return {
    ...actual,
    detectSlotFormatDrift: vi.fn(actual.detectSlotFormatDrift),
    detectNearTermSkip: vi.fn(actual.detectNearTermSkip),
  };
});

import {
  bookShowing,
  createShowingGuestCard,
  fetchShowingAvailabilities,
  isIdentityVerificationEnabled,
} from "../lib/showings";
import { getAvailabilitySnapshot } from "./availability";
import {
  recordLiveShowingFailure,
  recordLiveShowingSuccess,
} from "../lib/showingLiveFailureAlert";
import { detectNearTermSkip, detectSlotFormatDrift } from "../lib/showingFormatAlert";
import showingsRouter, { resetShowingHeartbeatForTests } from "./showings";

const LISTING_URL =
  "https://highlandrealestatepartners.appfolio.com/listings/detail/57dda21c-7fd6-446a-899a-c4776ceb4afa";
const UID = "57dda21c-7fd6-446a-899a-c4776ceb4afa";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { log: object }).log = {
      info: () => {},
      warn: () => {},
      error: () => {},
    };
    next();
  });
  app.use(showingsRouter);
  return app;
}

const snapshot = {
  units: [{ unit: "2801", listingUrl: LISTING_URL }],
  updatedAt: new Date().toISOString(),
};

const availabilities = {
  durationMinutes: 15,
  days: [
    {
      date: "2026/07/28",
      slots: [{ time: "2026/07/28 13:15", agentId: 443 }],
    },
  ],
  futureAvailabilitiesExist: true,
  firstAvailableDate: null,
  rawTimeslotCount: 1,
  acceptedSlotCount: 1,
  nearTermRecovery: null,
};

beforeEach(() => {
  resetShowingHeartbeatForTests();
  vi.mocked(getAvailabilitySnapshot).mockResolvedValue(snapshot as never);
  vi.mocked(fetchShowingAvailabilities).mockResolvedValue(availabilities);
  vi.mocked(isIdentityVerificationEnabled).mockResolvedValue(false);
  vi.mocked(createShowingGuestCard).mockResolvedValue({ guestCardId: "77", jwt: "tok" });
  vi.mocked(bookShowing).mockResolvedValue({
    startAt: "2026-07-28T18:15:00.000Z",
    endAt: "2026-07-28T18:30:00.000Z",
    fullAddress: "165 W Superior St, Apt. 2801",
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /showings/slots", () => {
  it("returns live slots plus the hosted fallback URL", async () => {
    const res = await request(makeApp()).get("/showings/slots?unit=2801");
    expect(res.status).toBe(200);
    expect(res.body.unit).toBe("2801");
    expect(res.body.durationMinutes).toBe(15);
    expect(res.body.days[0].slots[0]).toEqual({ time: "2026/07/28 13:15", agentId: 443 });
    expect(res.body.hostedUrl).toContain(`listable_uid=${UID}`);
    expect(vi.mocked(fetchShowingAvailabilities)).toHaveBeenCalledWith(UID, expect.any(String));
  });

  it("404s for a unit with no posted listing", async () => {
    const res = await request(makeApp()).get("/showings/slots?unit=9999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("unit_not_listed");
  });

  it("502s with an explicit code when AppFolio fails", async () => {
    vi.mocked(fetchShowingAvailabilities).mockRejectedValue(new Error("boom"));
    const res = await request(makeApp()).get("/showings/slots?unit=2801");
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("slots_unavailable");
  });

  it("400s a missing unit", async () => {
    const res = await request(makeApp()).get("/showings/slots");
    expect(res.status).toBe(400);
  });

  it("keeps the parser-internal slot counters out of the public response", async () => {
    const res = await request(makeApp()).get("/showings/slots?unit=2801");
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("rawTimeslotCount");
    expect(res.body).not.toHaveProperty("acceptedSlotCount");
  });

  it("flags the all-dropped condition through the drift alarm but still responds 200", async () => {
    vi.mocked(fetchShowingAvailabilities).mockResolvedValue({
      ...availabilities,
      days: [{ date: "2026/07/28", slots: [] }],
      rawTimeslotCount: 42,
      acceptedSlotCount: 0,
    });
    const res = await request(makeApp()).get("/showings/slots?unit=2801");
    // The page's designed lead-capture fallback needs the 200 + empty days.
    expect(res.status).toBe(200);
    expect(res.body.days).toEqual([{ date: "2026/07/28", slots: [] }]);
    expect(vi.mocked(detectSlotFormatDrift)).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.objectContaining({ rawTimeslotCount: 42, acceptedSlotCount: 0 }),
      { unit: "2801" },
    );
    expect(vi.mocked(detectSlotFormatDrift)).toHaveReturnedWith(true);
  });

  it("serves recovered near-term days, flags them via the skip alarm, and strips the internal field", async () => {
    // Regression wiring for the 2026-07-29 incident: the lib recovered days
    // AppFolio's first_available_date would have skipped. The route must
    // serve them, consult the alarm, and never leak the internal flag.
    vi.mocked(fetchShowingAvailabilities).mockResolvedValue({
      ...availabilities,
      days: [
        { date: "2026/07/30", slots: [{ time: "2026/07/30 10:30", agentId: 444 }] },
        { date: "2026/07/31", slots: [{ time: "2026/07/31 09:30", agentId: 444 }] },
      ],
      firstAvailableDate: "2026/08/01",
      nearTermRecovery: {
        mode: "recheck",
        firstAvailableDate: "2026/08/01",
        recoveredDates: ["2026/07/30", "2026/07/31"],
      },
    });
    const res = await request(makeApp()).get("/showings/slots?unit=2801");
    expect(res.status).toBe(200);
    expect(res.body.days[0].date).toBe("2026/07/30");
    expect(res.body).not.toHaveProperty("nearTermRecovery");
    expect(vi.mocked(detectNearTermSkip)).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.objectContaining({ nearTermRecovery: expect.objectContaining({ mode: "recheck" }) }),
      { unit: "2801" },
    );
    expect(vi.mocked(detectNearTermSkip)).toHaveReturnedWith(true);
  });
});

const contact = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "3125550100",
  unit: "2801",
};

describe("POST /showings/contact", () => {
  it("creates the guest card and returns booking credentials", async () => {
    const res = await request(makeApp()).post("/showings/contact").send(contact);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ guestCardId: "77", jwt: "tok" });
    expect(res.body.hostedUrl).toContain(`listable_uid=${UID}`);
    expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalledWith(
      expect.objectContaining({ listableUid: UID, email: "jane@example.com" }),
    );
    expect(vi.mocked(recordLiveShowingSuccess)).toHaveBeenCalled();
    expect(vi.mocked(recordLiveShowingFailure)).not.toHaveBeenCalled();
  });

  it("defaults the guest-card source when the visit has no campaign tags", async () => {
    await request(makeApp()).post("/showings/contact").send(contact);
    expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalledWith(
      expect.objectContaining({ source: "Website (Exhibit)" }),
    );
  });

  it("passes a UTM-captured visit source through to the guest card", async () => {
    await request(makeApp())
      .post("/showings/contact")
      .send({ ...contact, source: "Website (GoogleAds-SpringPromo)" });
    expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalledWith(
      expect.objectContaining({ source: "Website (GoogleAds-SpringPromo)" }),
    );
  });

  it("sanitizes a junk source back to the default before AppFolio sees it", async () => {
    const res = await request(makeApp())
      .post("/showings/contact")
      .send({ ...contact, source: "<script>alert(1)</script>" });
    expect(res.status).toBe(201);
    expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalledWith(
      expect.objectContaining({ source: "Website (Exhibit)" }),
    );
  });

  it("rejects invalid submissions without touching AppFolio", async () => {
    const res = await request(makeApp())
      .post("/showings/contact")
      .send({ ...contact, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(vi.mocked(createShowingGuestCard)).not.toHaveBeenCalled();
    // Visitor typos are not evidence of an AppFolio break.
    expect(vi.mocked(recordLiveShowingFailure)).not.toHaveBeenCalled();
  });

  it("rejects a honeypot submission without touching AppFolio", async () => {
    const res = await request(makeApp())
      .post("/showings/contact")
      .send({ ...contact, xh_note: "Acme Corp" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_submission");
    expect(vi.mocked(createShowingGuestCard)).not.toHaveBeenCalled();
    expect(vi.mocked(recordLiveShowingFailure)).not.toHaveBeenCalled();
  });

  it("rejects an implausibly fast submission, accepts a human-paced one", async () => {
    const fast = await request(makeApp())
      .post("/showings/contact")
      .send({ ...contact, xh_note: "", elapsedMs: 200 });
    expect(fast.status).toBe(400);
    expect(vi.mocked(createShowingGuestCard)).not.toHaveBeenCalled();

    const human = await request(makeApp())
      .post("/showings/contact")
      .send({ ...contact, xh_note: "", elapsedMs: 9000 });
    expect(human.status).toBe(201);
    // Guard fields are stripped before validation/forwarding.
    expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalledWith(
      expect.not.objectContaining({ xh_note: expect.anything() }),
    );
  });

  it("accepts a pure-autofill submission (legacy company filled, no elapsedMs)", async () => {
    // Regression guard for the 2026-07-27 incident: Safari autofilled the old
    // "Company" honeypot from a real visitor's contact card; the visitor never
    // typed, so no elapsedMs was sent. Must create the guest card normally.
    const res = await request(makeApp())
      .post("/showings/contact")
      .send({ ...contact, xh_note: "", company: "Lovelace Analytics" });
    expect(res.status).toBe(201);
    expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalledWith(
      expect.not.objectContaining({ company: expect.anything() }),
    );
  });

  it("409s with the hosted URL when identity verification is enabled", async () => {
    vi.mocked(isIdentityVerificationEnabled).mockResolvedValue(true);
    const res = await request(makeApp()).post("/showings/contact").send(contact);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("idv_required");
    expect(res.body.hostedUrl).toContain("/listings/showings/new");
    expect(vi.mocked(createShowingGuestCard)).not.toHaveBeenCalled();
  });

  it("still creates the guest card when the IDV status probe itself fails", async () => {
    vi.mocked(isIdentityVerificationEnabled).mockRejectedValue(new Error("probe down"));
    const res = await request(makeApp()).post("/showings/contact").send(contact);
    expect(res.status).toBe(201);
  });

  it("502s with an explicit code when the guest card fails", async () => {
    vi.mocked(createShowingGuestCard).mockRejectedValue(new Error("boom"));
    const res = await request(makeApp()).post("/showings/contact").send(contact);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("contact_failed");
    expect(vi.mocked(recordLiveShowingFailure)).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      { step: "guest card", message: "boom" },
    );
  });
});

const booking = {
  unit: "2801",
  guestCardId: "77",
  jwt: "tok",
  slotTime: "2026/07/28 13:15",
  agentId: 443,
};

describe("POST /showings/book", () => {
  it("re-validates the slot then books with the current duration", async () => {
    const res = await request(makeApp()).post("/showings/book").send(booking);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      startAt: "2026-07-28T18:15:00.000Z",
      endAt: "2026-07-28T18:30:00.000Z",
      fullAddress: "165 W Superior St, Apt. 2801",
    });
    // Slot-date revalidation fetch pinned to the slot's own date.
    expect(vi.mocked(fetchShowingAvailabilities)).toHaveBeenCalledWith(UID, "07/28/2026", false);
    expect(vi.mocked(bookShowing)).toHaveBeenCalledWith(
      expect.objectContaining({ listableUid: UID, durationMinutes: 15, slotTime: booking.slotTime }),
    );
  });

  it("409s slot_taken when the slot vanished, with the hosted URL", async () => {
    vi.mocked(fetchShowingAvailabilities).mockResolvedValue({
      ...availabilities,
      days: [{ date: "2026/07/28", slots: [] }],
    });
    const res = await request(makeApp()).post("/showings/book").send(booking);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("slot_taken");
    expect(vi.mocked(bookShowing)).not.toHaveBeenCalled();
    // A slot-taken race is normal visitor traffic, not endpoint drift.
    expect(vi.mocked(recordLiveShowingFailure)).not.toHaveBeenCalled();
  });

  it("502s with an explicit code when the booking fails", async () => {
    vi.mocked(bookShowing).mockRejectedValue(new Error("boom"));
    const res = await request(makeApp()).post("/showings/book").send(booking);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("booking_failed");
    expect(vi.mocked(recordLiveShowingFailure)).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      { step: "booking", message: "boom" },
    );
  });

  it("resets the live-failure streak on a successful booking", async () => {
    const res = await request(makeApp()).post("/showings/book").send(booking);
    expect(res.status).toBe(201);
    expect(vi.mocked(recordLiveShowingSuccess)).toHaveBeenCalled();
    expect(vi.mocked(recordLiveShowingFailure)).not.toHaveBeenCalled();
  });

  it("400s malformed slot times", async () => {
    const res = await request(makeApp())
      .post("/showings/book")
      .send({ ...booking, slotTime: "2026-07-28T13:15" });
    expect(res.status).toBe(400);
  });
});
