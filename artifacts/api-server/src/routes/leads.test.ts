/**
 * Route tests for POST /leads focused on the bot guard: detected bots get a
 * fake success (so they don't adapt) while nothing is stored, no email is
 * sent, and no AppFolio guest card is pushed.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const insertMock = vi.fn();
vi.mock("@workspace/db", () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
    update: vi.fn(),
  },
  leadsTable: {},
}));
vi.mock("../lib/email", () => ({
  sendLeadNotification: vi.fn(async () => true),
  sendProspectConfirmation: vi.fn(async () => true),
}));
vi.mock("../lib/appfolio", () => ({
  createGuestCard: vi.fn(async () => ({})),
  listableUidFromListingUrl: vi.fn(() => null),
}));
vi.mock("./availability", () => ({
  getAvailabilitySnapshot: vi.fn(async () => null),
}));

import { sendLeadNotification, sendProspectConfirmation } from "../lib/email";
import { createGuestCard, listableUidFromListingUrl } from "../lib/appfolio";
import { getAvailabilitySnapshot } from "./availability";
import leadsRouter from "./leads";

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
  app.use(leadsRouter);
  return app;
}

const lead = {
  type: "contact",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "3125550100",
  message: "I'd like to know more about the two-bedrooms.",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /leads bot guard", () => {
  it("fake-succeeds a honeypot submission without storing or emailing", async () => {
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...lead, xh_note: "Acme Corp", elapsedMs: 12_000 });
    expect(res.status).toBe(201);
    expect(insertMock).not.toHaveBeenCalled();
    expect(vi.mocked(sendLeadNotification)).not.toHaveBeenCalled();
    expect(vi.mocked(sendProspectConfirmation)).not.toHaveBeenCalled();
    expect(vi.mocked(createGuestCard)).not.toHaveBeenCalled();
  });

  it("fake-succeeds an implausibly fast submission without storing or emailing", async () => {
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...lead, xh_note: "", elapsedMs: 150 });
    expect(res.status).toBe(201);
    expect(insertMock).not.toHaveBeenCalled();
    expect(vi.mocked(sendLeadNotification)).not.toHaveBeenCalled();
  });

  it("accepts a human-paced submission and strips guard fields before validation", async () => {
    const row = {
      id: 1,
      type: "contact",
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      preferredDate: null,
      createdAt: new Date(),
      notifiedAt: null,
    };
    insertMock.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([row]) }),
    });
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...lead, xh_note: "", company: "Autofilled Org", elapsedMs: 9_000 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(insertMock).toHaveBeenCalled();
  });

  it("accepts a pure-autofill submission (legacy company filled, no elapsedMs)", async () => {
    // Regression guard for the 2026-07-27 incident: Safari autofilled the old
    // "Company" honeypot from a real visitor's contact card and the visitor
    // never typed, so no elapsedMs was measurable. Must be accepted.
    const row = {
      id: 2,
      type: "contact",
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      preferredDate: null,
      createdAt: new Date(),
      notifiedAt: null,
    };
    insertMock.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([row]) }),
    });
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...lead, xh_note: "", company: "Lovelace Analytics" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(2);
    expect(insertMock).toHaveBeenCalled();
  });
});

describe("POST /leads visit-source attribution", () => {
  const LISTING_URL =
    "https://highlandrealestatepartners.appfolio.com/listings/detail/57dda21c-7fd6-446a-899a-c4776ceb4afa";

  const tourLead = {
    type: "tour",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "3125550100",
    unit: "2801",
    xh_note: "",
    elapsedMs: 9_000,
  };

  function mockAcceptedTour(id: number) {
    const row = {
      id,
      type: "tour",
      firstName: tourLead.firstName,
      lastName: tourLead.lastName,
      email: tourLead.email,
      phone: tourLead.phone,
      message: null,
      preferredDate: null,
      createdAt: new Date(),
      notifiedAt: null,
    };
    insertMock.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([row]) }),
    });
    vi.mocked(getAvailabilitySnapshot).mockResolvedValue({
      units: [{ unit: "2801", listingUrl: LISTING_URL }],
      updatedAt: new Date().toISOString(),
    } as never);
    vi.mocked(listableUidFromListingUrl).mockReturnValue(
      "57dda21c-7fd6-446a-899a-c4776ceb4afa",
    );
  }

  /** The fire-and-forget guest-card push resolves on the microtask queue. */
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it("tags the guest card with the default source when no campaign is present", async () => {
    mockAcceptedTour(10);
    const res = await request(makeApp()).post("/leads").send(tourLead);
    expect(res.status).toBe(201);
    await flush();
    expect(vi.mocked(createGuestCard)).toHaveBeenCalledWith(
      expect.objectContaining({ source: "Website (Exhibit)" }),
    );
    // Default-source leads keep the notification email unchanged.
    expect(vi.mocked(sendLeadNotification)).toHaveBeenCalledWith(
      expect.objectContaining({ source: null }),
    );
  });

  it("passes a UTM-captured source through to the guest card and email", async () => {
    mockAcceptedTour(11);
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...tourLead, source: "Website (GoogleAds-SpringPromo)" });
    expect(res.status).toBe(201);
    await flush();
    expect(vi.mocked(createGuestCard)).toHaveBeenCalledWith(
      expect.objectContaining({ source: "Website (GoogleAds-SpringPromo)" }),
    );
    expect(vi.mocked(sendLeadNotification)).toHaveBeenCalledWith(
      expect.objectContaining({ source: "Website (GoogleAds-SpringPromo)" }),
    );
  });

  it("pushes a guest card for an application-start (apply) lead with a listed unit", async () => {
    mockAcceptedTour(13);
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...tourLead, type: "apply" });
    expect(res.status).toBe(201);
    await flush();
    // Abandoned applicants still exist as AppFolio leads attached to the unit.
    expect(vi.mocked(createGuestCard)).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Jane",
        listableUid: "57dda21c-7fd6-446a-899a-c4776ceb4afa",
        source: "Website (Exhibit)",
      }),
    );
    expect(vi.mocked(sendLeadNotification)).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tour", unit: "2801" }),
    );
  });

  it("accepts an apply lead without a unit and skips the guest card", async () => {
    mockAcceptedTour(14);
    const { unit: _unit, ...noUnit } = tourLead;
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...noUnit, type: "apply" });
    expect(res.status).toBe(201);
    await flush();
    expect(vi.mocked(createGuestCard)).not.toHaveBeenCalled();
    expect(vi.mocked(sendProspectConfirmation)).toHaveBeenCalled();
  });

  it("sanitizes a junk source back to the default", async () => {
    mockAcceptedTour(12);
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...tourLead, source: "<script>alert(1)</script>" });
    expect(res.status).toBe(201);
    await flush();
    expect(vi.mocked(createGuestCard)).toHaveBeenCalledWith(
      expect.objectContaining({ source: "Website (Exhibit)" }),
    );
    expect(vi.mocked(sendLeadNotification)).toHaveBeenCalledWith(
      expect.objectContaining({ source: null }),
    );
  });
});
