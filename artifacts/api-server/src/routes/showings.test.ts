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

  it("rejects invalid submissions without touching AppFolio", async () => {
    const res = await request(makeApp())
      .post("/showings/contact")
      .send({ ...contact, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(vi.mocked(createShowingGuestCard)).not.toHaveBeenCalled();
    // Visitor typos are not evidence of an AppFolio break.
    expect(vi.mocked(recordLiveShowingFailure)).not.toHaveBeenCalled();
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
