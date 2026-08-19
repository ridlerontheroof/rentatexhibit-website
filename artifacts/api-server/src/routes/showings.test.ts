/**
 * Route tests for the Exhibit showing scheduler: slots, contact (guest card),
 * and booking proxies with AppFolio fully mocked, proving explicit failure
 * codes on every path the page's fallback logic depends on.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

// DB mock for SMS consent audit write tests. Must be hoisted so the factory
// closure can reference the mock fns before any imports run.
const { showingsInsert, showingsValues } = vi.hoisted(() => {
  const showingsValues = vi.fn().mockResolvedValue(undefined);
  const showingsInsert = vi.fn().mockReturnValue({ values: showingsValues });
  return { showingsInsert, showingsValues };
});
vi.mock("@workspace/db", () => ({
  db: { insert: showingsInsert },
  leadsTable: {},
}));

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
// The dedicated tour unit resolves via the Unit Directory report (it has no
// public listing by design); mock only that resolver, keep the rest real.
vi.mock("../lib/appfolio", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/appfolio")>();
  return { ...actual, resolveTourUnitListableUid: vi.fn() };
});
// Live-traffic escalation is fire-and-forget from the routes; mock it so
// these tests only assert the wiring (what counts, what doesn't).
vi.mock("../lib/showingLiveFailureAlert", () => ({
  recordLiveShowingFailure: vi.fn(async () => {}),
  recordLiveShowingSuccess: vi.fn(async () => {}),
}));
// The windowed slots-outage escalation is fire-and-forget from the slots
// route; mock it so these tests only assert the wiring (real slot-fetch
// failures count, visitor-input 400s and unlisted-unit 404s don't).
vi.mock("../lib/showingSlotsFailureAlert", () => ({
  recordSlotsFetchFailure: vi.fn(async () => {}),
}));
// The drift alarm's log/email side effects have their own tests; here we
// assert only the route wiring (when it is consulted, what it changes).
// The site-sent general-tour confirmation is fire-and-forget from the book
// route; mock the sender to assert wiring only (TOUR path sends, unit
// bookings never do).
vi.mock("../lib/email", () => ({
  sendGeneralTourConfirmation: vi.fn(async () => {}),
}));
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
import { resolveTourUnitListableUid } from "../lib/appfolio";
import {
  recordLiveShowingFailure,
  recordLiveShowingSuccess,
} from "../lib/showingLiveFailureAlert";
import { detectNearTermSkip, detectSlotFormatDrift } from "../lib/showingFormatAlert";
import { recordSlotsFetchFailure } from "../lib/showingSlotsFailureAlert";
import { sendGeneralTourConfirmation } from "../lib/email";
import showingsRouter, { resetShowingHeartbeatForTests } from "./showings";
import { db } from "@workspace/db";

const LISTING_URL =
  "https://highlandrealestatepartners.appfolio.com/listings/detail/57dda21c-7fd6-446a-899a-c4776ceb4afa";
const UID = "57dda21c-7fd6-446a-899a-c4776ceb4afa";

function makeApp(log?: { info?: (...args: unknown[]) => void }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { log: object }).log = {
      info: log?.info ?? (() => {}),
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

const TOUR_UID = "96a20390-f2a3-4806-b877-a758094c2a2b";

beforeEach(() => {
  resetShowingHeartbeatForTests();
  vi.mocked(getAvailabilitySnapshot).mockResolvedValue(snapshot as never);
  vi.mocked(resolveTourUnitListableUid).mockResolvedValue(TOUR_UID);
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

  it("counts a real slot-fetch failure toward the windowed slots-outage escalation", async () => {
    vi.mocked(fetchShowingAvailabilities).mockRejectedValue(new Error("status 502"));
    await request(makeApp()).get("/showings/slots?unit=2801");
    expect(vi.mocked(recordSlotsFetchFailure)).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.any(Number),
      { unit: "2801", message: "status 502" },
    );
  });

  it("does not count unlisted-unit 404s or successes toward the slots-outage escalation", async () => {
    await request(makeApp()).get("/showings/slots?unit=9999"); // 404
    await request(makeApp()).get("/showings/slots?unit=2801"); // 200
    expect(vi.mocked(recordSlotsFetchFailure)).not.toHaveBeenCalled();
  });

  it("400s a missing unit", async () => {
    const res = await request(makeApp()).get("/showings/slots");
    expect(res.status).toBe(400);
    expect(vi.mocked(recordSlotsFetchFailure)).not.toHaveBeenCalled();
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

describe("the dedicated tour unit (reserved TOUR token)", () => {
  it("GET /showings/slots?unit=TOUR resolves via the Unit Directory, not the snapshot", async () => {
    const res = await request(makeApp()).get("/showings/slots?unit=TOUR");
    expect(res.status).toBe(200);
    expect(vi.mocked(fetchShowingAvailabilities)).toHaveBeenCalledWith(TOUR_UID, expect.any(String));
    expect(res.body.hostedUrl).toContain(`listable_uid=${TOUR_UID}`);
  });

  it("POST /showings/contact with TOUR books the guest card against the tour unit", async () => {
    const res = await request(makeApp())
      .post("/showings/contact")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: "3125550100",
        unit: "TOUR",
        smsConsent: false,
      });
    expect(res.status).toBe(201);
    expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalledWith(
      expect.objectContaining({ listableUid: TOUR_UID }),
    );
  });

  it("404s unit_not_listed when the tour unit cannot be resolved (misconfigured in AppFolio)", async () => {
    vi.mocked(resolveTourUnitListableUid).mockResolvedValue(null);
    const res = await request(makeApp()).get("/showings/slots?unit=TOUR");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("unit_not_listed");
  });
});

const contact = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "3125550100",
  unit: "2801",
  smsConsent: false,
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

  it.each([true, false])(
    "passes smsConsent=%s into the AppFolio guest-card request",
    async (smsConsent) => {
      const res = await request(makeApp())
        .post("/showings/contact")
        .send({ ...contact, smsConsent });
      expect(res.status).toBe(201);
      expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalledWith(
        expect.objectContaining({ smsConsent }),
      );
    },
  );

  it("rejects a non-boolean SMS consent value without touching AppFolio", async () => {
    const res = await request(makeApp())
      .post("/showings/contact")
      .send({ ...contact, smsConsent: "yes" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_submission");
    expect(vi.mocked(createShowingGuestCard)).not.toHaveBeenCalled();
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

  it("writes one attribution audit log line with raw and sanitized source", async () => {
    const info = vi.fn();
    await request(makeApp({ info }))
      .post("/showings/contact")
      .send({ ...contact, source: "Website (GoogleAds_IL-Chicago_Luxury-Apartments)" });
    const call = info.mock.calls.find(
      (c) => c[1] === "Lead-source attribution (showing contact)",
    );
    expect(call?.[0].unit).toBe("2801");
    expect(call?.[0].rawSource).toBe("<accepted>");
    expect(call?.[0].sourceLabel).toMatch(/^campaign sha256=[0-9a-f]{12} len=48$/);
    expect(JSON.stringify(call?.[0])).not.toContain("GoogleAds");
  });

  it("audit line stays contentless even for accepted name/phone-shaped labels", async () => {
    for (const wrapped of ["Website (JaneDoe)", "Website (3125550100)"]) {
      const info = vi.fn();
      await request(makeApp({ info }))
        .post("/showings/contact")
        .send({ ...contact, source: wrapped });
      const call = info.mock.calls.find(
        (c) => c[1] === "Lead-source attribution (showing contact)",
      );
      expect(call?.[0].rawSource).toBe("<accepted>");
      const serialized = JSON.stringify(call?.[0]);
      expect(serialized).not.toContain("JaneDoe");
      expect(serialized).not.toContain("3125550100");
    }
  });

  it("audit line shows the raw junk value alongside the defaulted label", async () => {
    const info = vi.fn();
    await request(makeApp({ info }))
      .post("/showings/contact")
      .send({ ...contact, source: "<script>alert(1)</script>" });
    const calls = info.mock.calls.filter(
      (c) => c[1] === "Lead-source attribution (showing contact)",
    );
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatchObject({
      rawSource: "<rejected len=25 digits=1 hasAt=false hasSpace=false labelPrefixed=false>",
      sourceLabel: "default",
    });
    expect(JSON.stringify(calls[0][0])).not.toContain("alert(1)");
  });

  it("audit line never carries PII-shaped raw sources (emails, phones, names)", async () => {
    for (const pii of ["call me at 312-555-0100", "jane.doe@example.com", "John Smith"]) {
      const info = vi.fn();
      await request(makeApp({ info }))
        .post("/showings/contact")
        .send({ ...contact, source: pii });
      const call = info.mock.calls.find(
        (c) => c[1] === "Lead-source attribution (showing contact)",
      );
      expect(call?.[0].rawSource).toMatch(/^<rejected /);
      expect(JSON.stringify(call?.[0])).not.toContain(pii);
    }
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

  describe("X-Test-Lead bypass", () => {
    beforeEach(() => {
      process.env.TEST_LEAD_TOKEN = "test-secret-123";
    });
    afterEach(() => {
      delete process.env.TEST_LEAD_TOKEN;
    });

    it("returns a correctly shaped 201 without touching AppFolio when the header matches the secret", async () => {
      const res = await request(makeApp())
        .post("/showings/contact")
        .set("x-test-lead", "test-secret-123")
        .send(contact);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ guestCardId: expect.any(String), hostedUrl: expect.any(String) });
      expect(vi.mocked(createShowingGuestCard)).not.toHaveBeenCalled();
      expect(vi.mocked(recordLiveShowingSuccess)).not.toHaveBeenCalled();
      expect(vi.mocked(recordLiveShowingFailure)).not.toHaveBeenCalled();
    });

    it("does not bypass when the header value is wrong", async () => {
      const res = await request(makeApp())
        .post("/showings/contact")
        .set("x-test-lead", "wrong-token")
        .send(contact);
      // Falls through to the real handler — guest card is created normally.
      expect(res.status).toBe(201);
      expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalled();
    });

    it("does not bypass when TEST_LEAD_TOKEN is unset (production default)", async () => {
      delete process.env.TEST_LEAD_TOKEN;
      const res = await request(makeApp())
        .post("/showings/contact")
        .set("x-test-lead", "any-value")
        .send(contact);
      expect(res.status).toBe(201);
      expect(vi.mocked(createShowingGuestCard)).toHaveBeenCalled();
    });
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

  describe("X-Test-Lead bypass", () => {
    beforeEach(() => {
      process.env.TEST_LEAD_TOKEN = "test-secret-123";
    });
    afterEach(() => {
      delete process.env.TEST_LEAD_TOKEN;
    });

    it("returns a correctly shaped 201 without touching AppFolio when the header matches the secret", async () => {
      const res = await request(makeApp())
        .post("/showings/book")
        .set("x-test-lead", "test-secret-123")
        .send(booking);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        startAt: expect.any(String),
        endAt: expect.any(String),
        fullAddress: expect.any(String),
      });
      expect(vi.mocked(bookShowing)).not.toHaveBeenCalled();
      expect(vi.mocked(fetchShowingAvailabilities)).not.toHaveBeenCalled();
      expect(vi.mocked(recordLiveShowingSuccess)).not.toHaveBeenCalled();
      expect(vi.mocked(recordLiveShowingFailure)).not.toHaveBeenCalled();
    });

    it("does not bypass when the header value is wrong", async () => {
      const res = await request(makeApp())
        .post("/showings/book")
        .set("x-test-lead", "wrong-token")
        .send(booking);
      expect(res.status).toBe(201);
      expect(vi.mocked(bookShowing)).toHaveBeenCalled();
    });

    it("does not bypass when TEST_LEAD_TOKEN is unset (production default)", async () => {
      delete process.env.TEST_LEAD_TOKEN;
      const res = await request(makeApp())
        .post("/showings/book")
        .set("x-test-lead", "any-value")
        .send(booking);
      expect(res.status).toBe(201);
      expect(vi.mocked(bookShowing)).toHaveBeenCalled();
    });
  });

  describe("general-tour site confirmation (GENERAL_TOUR_CONFIRMATION_EMAIL flag)", () => {
    afterEach(() => {
      delete process.env.GENERAL_TOUR_CONFIRMATION_EMAIL;
    });

    it("sends the Exhibit-branded confirmation when the flag is enabled", async () => {
      process.env.GENERAL_TOUR_CONFIRMATION_EMAIL = "1";
      const res = await request(makeApp())
        .post("/showings/book")
        .send({
          ...booking,
          unit: "TOUR",
          firstName: "Jamie",
          lastName: "Prospect",
          email: "jamie@example.com",
        });
      expect(res.status).toBe(201);
      expect(vi.mocked(sendGeneralTourConfirmation)).toHaveBeenCalledWith({
        firstName: "Jamie",
        lastName: "Prospect",
        email: "jamie@example.com",
        slotTime: booking.slotTime,
      });
    });

    it("does not send when the flag is absent (default off — avoids duplicate emails)", async () => {
      const res = await request(makeApp())
        .post("/showings/book")
        .send({
          ...booking,
          unit: "TOUR",
          firstName: "Jamie",
          lastName: "Prospect",
          email: "jamie@example.com",
        });
      expect(res.status).toBe(201);
      expect(vi.mocked(sendGeneralTourConfirmation)).not.toHaveBeenCalled();
    });

    it("never sends the site confirmation for unit-specific bookings even when flag is on", async () => {
      process.env.GENERAL_TOUR_CONFIRMATION_EMAIL = "1";
      const res = await request(makeApp())
        .post("/showings/book")
        .send({
          ...booking,
          firstName: "Jamie",
          lastName: "Prospect",
          email: "jamie@example.com",
        });
      expect(res.status).toBe(201);
      expect(vi.mocked(sendGeneralTourConfirmation)).not.toHaveBeenCalled();
    });

    it("skips the site confirmation when the TOUR booking carries no email", async () => {
      process.env.GENERAL_TOUR_CONFIRMATION_EMAIL = "1";
      const res = await request(makeApp()).post("/showings/book").send({ ...booking, unit: "TOUR" });
      expect(res.status).toBe(201);
      expect(vi.mocked(sendGeneralTourConfirmation)).not.toHaveBeenCalled();
    });

    it("does not send the site confirmation when the TOUR booking fails", async () => {
      process.env.GENERAL_TOUR_CONFIRMATION_EMAIL = "1";
      vi.mocked(bookShowing).mockRejectedValue(new Error("boom"));
      const res = await request(makeApp())
        .post("/showings/book")
        .send({
          ...booking,
          unit: "TOUR",
          email: "jamie@example.com",
          firstName: "J",
          lastName: "P",
        });
      expect(res.status).toBe(502);
      expect(vi.mocked(sendGeneralTourConfirmation)).not.toHaveBeenCalled();
    });
  });
});

describe("POST /showings/book — SMS consent audit record", () => {
  beforeEach(() => {
    vi.mocked(db.insert).mockClear();
    showingsValues.mockClear();
  });

  it("writes an audit row with notifiedAt pre-stamped when all contact fields and smsConsent are present", async () => {
    const res = await request(makeApp())
      .post("/showings/book")
      .send({
        ...booking,
        firstName: "Alex",
        lastName: "Chen",
        email: "alex@example.com",
        phone: "3125550100",
        smsConsent: true,
      });
    expect(res.status).toBe(201);
    expect(vi.mocked(db.insert)).toHaveBeenCalled();
    const inserted = showingsValues.mock.calls[0]?.[0] as {
      type: string;
      firstName: string;
      email: string;
      message: string;
      smsConsent: boolean | null;
      notifiedAt: unknown;
    };
    expect(inserted.type).toBe("tour");
    expect(inserted.firstName).toBe("Alex");
    expect(inserted.email).toBe("alex@example.com");
    // notifiedAt pre-stamped → retry sweeper's isNull(notifiedAt) permanently
    // excludes this audit-only row.
    expect(inserted.notifiedAt).toBeInstanceOf(Date);
    // Consent stored in dedicated column — message must be clean (no suffix).
    expect(inserted.smsConsent).toBe(true);
    expect(inserted.message).not.toContain("opt-in");
  });

  it("stores smsConsent=false in the dedicated column when consent is declined", async () => {
    await request(makeApp())
      .post("/showings/book")
      .send({
        ...booking,
        firstName: "Alex",
        lastName: "Chen",
        email: "alex@example.com",
        phone: "3125550100",
        smsConsent: false,
      });
    const inserted = showingsValues.mock.calls[0]?.[0] as { smsConsent: boolean | null; message: string };
    expect(inserted.smsConsent).toBe(false);
    expect(inserted.message).not.toContain("opt-in");
  });

  it("skips the audit write when smsConsent is absent from the book body", async () => {
    // Base booking has no smsConsent — the condition `smsConsent !== undefined`
    // is false, so no DB insert should happen.
    await request(makeApp()).post("/showings/book").send(booking);
    expect(vi.mocked(db.insert)).not.toHaveBeenCalled();
  });

  it("skips the audit write when contact fields are missing even if smsConsent is present", async () => {
    // smsConsent is present but the contact fields (firstName/lastName/email/phone)
    // are all absent — the guard requires all of them.
    await request(makeApp())
      .post("/showings/book")
      .send({ ...booking, smsConsent: true });
    expect(vi.mocked(db.insert)).not.toHaveBeenCalled();
  });

  it("still returns 201 when the audit DB write throws", async () => {
    // A DB failure must never roll back a confirmed booking.
    showingsValues.mockRejectedValueOnce(new Error("db down"));
    const res = await request(makeApp())
      .post("/showings/book")
      .send({
        ...booking,
        firstName: "Alex",
        lastName: "Chen",
        email: "alex@example.com",
        phone: "3125550100",
        smsConsent: true,
      });
    expect(res.status).toBe(201);
  });
});
