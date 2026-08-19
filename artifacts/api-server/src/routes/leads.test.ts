/**
 * Route tests for POST /leads focused on the bot guard: detected bots get a
 * fake success (so they don't adapt) while nothing is stored, no email is
 * sent, and no AppFolio guest card is pushed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
vi.mock("../lib/guestCardAlert", () => ({
  reportGuestCardFailure: vi.fn(async () => {}),
}));

import { sendLeadNotification, sendProspectConfirmation } from "../lib/email";
import { reportGuestCardFailure } from "../lib/guestCardAlert";
import { createGuestCard, listableUidFromListingUrl } from "../lib/appfolio";
import { getAvailabilitySnapshot } from "./availability";
import leadsRouter from "./leads";

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

describe("POST /leads QA test-lead bypass", () => {
  const TEST_TOKEN = "qa-secret-token-for-tests";

  beforeEach(() => {
    process.env.TEST_LEAD_TOKEN = TEST_TOKEN;
  });

  afterEach(() => {
    delete process.env.TEST_LEAD_TOKEN;
  });

  it("fake-succeeds with a valid token in X-Test-Lead without storing, emailing, or pushing a guest card", async () => {
    const res = await request(makeApp())
      .post("/leads")
      .set("X-Test-Lead", TEST_TOKEN)
      .send(lead);
    expect(res.status).toBe(201);
    // Returns a correctly shaped response so the client form completes normally.
    expect(res.body).toMatchObject({
      id: 0,
      type: "contact",
      firstName: "",
    });
    // No real side-effects.
    expect(insertMock).not.toHaveBeenCalled();
    expect(vi.mocked(sendLeadNotification)).not.toHaveBeenCalled();
    expect(vi.mocked(sendProspectConfirmation)).not.toHaveBeenCalled();
    expect(vi.mocked(createGuestCard)).not.toHaveBeenCalled();
  });

  it("does NOT bypass when TEST_LEAD_TOKEN env var is unset (production default)", async () => {
    // Simulate production: no token configured — any header value must be ignored.
    delete process.env.TEST_LEAD_TOKEN;
    const row = {
      id: 99,
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
    // Even sending the token value itself must not bypass when env var is absent.
    const res = await request(makeApp())
      .post("/leads")
      .set("X-Test-Lead", TEST_TOKEN)
      .send({ ...lead, xh_note: "", elapsedMs: 9_000 });
    expect(res.status).toBe(201);
    expect(insertMock).toHaveBeenCalled();
  });

  it("does NOT bypass when X-Test-Lead carries the wrong token value", async () => {
    const row = {
      id: 98,
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
      .set("X-Test-Lead", "wrong-token")
      .send({ ...lead, xh_note: "", elapsedMs: 9_000 });
    expect(res.status).toBe(201);
    expect(insertMock).toHaveBeenCalled();
  });

  it("does NOT bypass when X-Test-Lead header is absent", async () => {
    const row = {
      id: 97,
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
      .send({ ...lead, xh_note: "", elapsedMs: 9_000 });
    expect(res.status).toBe(201);
    expect(insertMock).toHaveBeenCalled();
  });
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

  it("reports a guest-card push failure to the leasing alert with the lead's details", async () => {
    mockAcceptedTour(15);
    vi.mocked(createGuestCard).mockRejectedValueOnce(
      new Error("AppFolio guest card failed: status 422 body=<empty>"),
    );
    const res = await request(makeApp()).post("/leads").send(tourLead);
    expect(res.status).toBe(201);
    await flush();
    expect(vi.mocked(reportGuestCardFailure)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(reportGuestCardFailure)).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.objectContaining({
        leadId: 15,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: "3125550100",
        unit: "2801",
        source: null,
        errorMessage: "AppFolio guest card failed: status 422 body=<empty>",
      }),
    );
    // Visitor-facing behavior unchanged: lead saved + emails still sent.
    expect(vi.mocked(sendLeadNotification)).toHaveBeenCalled();
    expect(vi.mocked(sendProspectConfirmation)).toHaveBeenCalled();
  });

  it("does not report a guest-card alert when the push succeeds", async () => {
    mockAcceptedTour(16);
    const res = await request(makeApp()).post("/leads").send(tourLead);
    expect(res.status).toBe(201);
    await flush();
    expect(vi.mocked(createGuestCard)).toHaveBeenCalled();
    expect(vi.mocked(reportGuestCardFailure)).not.toHaveBeenCalled();
  });

  it("writes one attribution audit log line with raw and sanitized source", async () => {
    const info = vi.fn();
    await request(makeApp({ info }))
      .post("/leads")
      .send({ ...tourLead, source: "Website (GoogleAds_IL-Chicago_Luxury-Apartments)" });
    const call = info.mock.calls.find(
      (c) => c[1] === "Lead-source attribution (lead submission)",
    );
    expect(call?.[0].rawSource).toBe("<accepted>");
    expect(call?.[0].sourceLabel).toMatch(/^campaign sha256=[0-9a-f]{12} len=48$/);
    expect(JSON.stringify(call?.[0])).not.toContain("GoogleAds");
  });

  it("audit line stays contentless even for accepted name/phone-shaped labels", async () => {
    for (const wrapped of ["Website (JaneDoe)", "Website (3125550100)"]) {
      const info = vi.fn();
      await request(makeApp({ info }))
        .post("/leads")
        .send({ ...tourLead, source: wrapped });
      const call = info.mock.calls.find(
        (c) => c[1] === "Lead-source attribution (lead submission)",
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
      .post("/leads")
      .send({ ...tourLead, source: "<script>alert(1)</script>" });
    const calls = info.mock.calls.filter(
      (c) => c[1] === "Lead-source attribution (lead submission)",
    );
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatchObject({
      rawSource: "<rejected len=25 digits=1 hasAt=false hasSpace=false labelPrefixed=false>",
      sourceLabel: "default",
    });
    expect(JSON.stringify(calls[0][0])).not.toContain("alert(1)");
  });

  it("audit line never carries PII-shaped raw sources (emails, phones, names)", async () => {
    for (const pii of ["jane.doe@example.com", "312-555-0100", "John Smith"]) {
      const info = vi.fn();
      await request(makeApp({ info }))
        .post("/leads")
        .send({ ...tourLead, source: pii });
      const call = info.mock.calls.find(
        (c) => c[1] === "Lead-source attribution (lead submission)",
      );
      expect(call?.[0].rawSource).toMatch(/^<rejected /);
      expect(JSON.stringify(call?.[0])).not.toContain(pii);
    }
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

describe("POST /leads smsConsent column", () => {
  function mockSmsLead(id: number) {
    const row = {
      id,
      type: "contact",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "3125550100",
      message: null as string | null,
      preferredDate: null,
      createdAt: new Date(),
      notifiedAt: null,
      smsConsent: null as boolean | null,
    };
    insertMock.mockImplementation((_table: unknown) => ({
      values: vi.fn().mockImplementation((values: { smsConsent?: boolean | null; message?: string | null }) => ({
        returning: vi.fn().mockResolvedValue([{
          ...row,
          message: values.message ?? null,
          smsConsent: values.smsConsent ?? null,
        }]),
      })),
    }));
  }

  const smsLead = {
    type: "contact",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "3125550100",
    xh_note: "",
    elapsedMs: 9_000,
  };

  it("stores smsConsent=true in the dedicated column when consent is given", async () => {
    mockSmsLead(21);
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...smsLead, smsConsent: true });
    expect(res.status).toBe(201);
    // Dedicated column carries the boolean
    const valuesMock = insertMock.mock.results[0]?.value?.values;
    const inserted = valuesMock?.mock?.calls[0]?.[0] as { smsConsent?: boolean | null; message?: string | null };
    expect(inserted?.smsConsent).toBe(true);
    // Message field is clean (no consent suffix embedded)
    expect(inserted?.message ?? "").not.toContain("opt-in");
    // Response surfaces the field
    expect(res.body.smsConsent).toBe(true);
  });

  it("stores smsConsent=false in the dedicated column when consent is declined", async () => {
    mockSmsLead(22);
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...smsLead, smsConsent: false });
    expect(res.status).toBe(201);
    const valuesMock = insertMock.mock.results[0]?.value?.values;
    const inserted = valuesMock?.mock?.calls[0]?.[0] as { smsConsent?: boolean | null; message?: string | null };
    expect(inserted?.smsConsent).toBe(false);
    expect(inserted?.message ?? "").not.toContain("opt-in");
    expect(res.body.smsConsent).toBe(false);
  });

  it("stores smsConsent=null when the field is omitted", async () => {
    mockSmsLead(23);
    const res = await request(makeApp())
      .post("/leads")
      .send({ ...smsLead });
    expect(res.status).toBe(201);
    const valuesMock = insertMock.mock.results[0]?.value?.values;
    const inserted = valuesMock?.mock?.calls[0]?.[0] as { smsConsent?: boolean | null };
    expect(inserted?.smsConsent ?? null).toBeNull();
  });

  it("passes smsConsent through to the leasing notification email", async () => {
    mockSmsLead(24);
    await request(makeApp())
      .post("/leads")
      .send({ ...smsLead, smsConsent: true });
    expect(vi.mocked(sendLeadNotification)).toHaveBeenCalledWith(
      expect.objectContaining({ smsConsent: true }),
    );
  });
});
