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
import { createGuestCard } from "../lib/appfolio";
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
