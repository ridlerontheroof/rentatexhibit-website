/**
 * Route tests for POST /csp-reports: browser CSP violation reports are
 * acknowledged with 204, logged, and turned into deduped operational
 * alert emails (once per violation signature per day, with a hard daily
 * email cap and a per-minute processing cap).
 *
 * The shared-claim database is mocked as unreachable so the dedupe
 * exercises dailyClaim's deterministic in-memory fallback.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async () => {
      throw new Error("db unavailable in test");
    }),
  },
}));
vi.mock("../lib/mailer", () => ({
  mailerConfigured: vi.fn(() => true),
}));
vi.mock("../lib/email", () => ({
  sendCspViolationAlert: vi.fn(async () => {}),
}));

import { sendCspViolationAlert } from "../lib/email";
import { mailerConfigured } from "../lib/mailer";
import {
  CSP_ALERT_EMAIL_DAILY_MAX,
  resetCspReportAlertState,
} from "../lib/cspReportAlert";
import cspReportsRouter, {
  MAX_REPORTS_PER_MINUTE,
  MAX_REPORTS_PER_REQUEST,
  resetCspReportWindow,
} from "./cspReports";

const warn = vi.fn();
const error = vi.fn();

function makeApp() {
  const app = express();
  app.use((req, _res, next) => {
    (req as unknown as { log: object }).log = {
      info: () => {},
      warn,
      error,
    };
    next();
  });
  app.use(cspReportsRouter);
  return app;
}

const legacyReport = {
  "csp-report": {
    "document-uri": "https://www.rentatexhibit.com/floor-plans",
    "effective-directive": "script-src-elem",
    "violated-directive": "script-src-elem",
    "blocked-uri": "inline",
    "script-sample": "var evil = 1;",
    disposition: "enforce",
  },
};

const reportingApiBatch = [
  { type: "deprecation", body: { id: "whatever" } },
  {
    type: "csp-violation",
    body: {
      documentURL: "https://www.rentatexhibit.com/",
      effectiveDirective: "connect-src",
      blockedURL: "https://evil.example.com/beacon?x=1",
      disposition: "enforce",
    },
  },
];

async function settle() {
  // recordCspViolation is fire-and-forget from the route handler.
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(mailerConfigured).mockReturnValue(true);
  vi.mocked(sendCspViolationAlert).mockResolvedValue(undefined);
  delete process.env.CSP_REPORT_PROCESSING_TIMEOUT_MS;
  resetCspReportAlertState();
  resetCspReportWindow();
});

describe("POST /csp-reports", () => {
  it("accepts a legacy application/csp-report body, logs it, and emails once", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/csp-report")
      .send(JSON.stringify(legacyReport));
    expect(res.status).toBe(204);
    await settle();

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveDirective: "script-src-elem",
        blockedUri: "inline",
        scriptSample: "var evil = 1;",
      }),
      "Visitor browser reported a CSP violation",
    );
    expect(sendCspViolationAlert).toHaveBeenCalledTimes(1);
    expect(sendCspViolationAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveDirective: "script-src-elem",
        blockedUri: "inline",
        documentUri: "https://www.rentatexhibit.com/floor-plans",
      }),
    );
  });

  it("logs but does not email an incomplete legacy report with no blocked resource", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/csp-report")
      .send(
        JSON.stringify({
          "csp-report": {
            "document-uri": "https://www.rentatexhibit.com/",
            "violated-directive":
              "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com",
          },
        }),
      );
    expect(res.status).toBe(204);
    await settle();

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveDirective: "script-src",
        blockedUri: "",
        documentUri: "https://www.rentatexhibit.com/",
      }),
      "Visitor browser reported a CSP violation",
    );
    expect(sendCspViolationAlert).not.toHaveBeenCalled();
  });

  it("dedupes repeat reports of the same signature to a single email", async () => {
    const app = makeApp();
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/csp-reports")
        .set("Content-Type", "application/csp-report")
        .send(JSON.stringify(legacyReport));
    }
    await settle();
    expect(sendCspViolationAlert).toHaveBeenCalledTimes(1);
  });

  it("accepts a Reporting API batch, ignoring non-CSP report types", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/reports+json")
      .send(JSON.stringify(reportingApiBatch));
    expect(res.status).toBe(204);
    await settle();

    expect(sendCspViolationAlert).toHaveBeenCalledTimes(1);
    expect(sendCspViolationAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveDirective: "connect-src",
        blockedUri: "https://evil.example.com/beacon?x=1",
      }),
    );
  });

  it("logs but does not email the Chrome-extension apis.google.com report", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/csp-report")
      .send(
        JSON.stringify({
          "csp-report": {
            "document-uri": "https://www.rentatexhibit.com/",
            "effective-directive": "script-src-elem",
            "blocked-uri": "https://apis.google.com/js/client.js",
            "source-file": "chrome-extension",
            disposition: "enforce",
          },
        }),
      );
    expect(res.status).toBe(204);
    await settle();

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveDirective: "script-src-elem",
        blockedUri: "https://apis.google.com/js/client.js",
        sourceFile: "chrome-extension",
      }),
      "Visitor browser reported a CSP violation",
    );
    expect(sendCspViolationAlert).not.toHaveBeenCalled();
  });

  it("emails the same blocked Google script when it has no extension source", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/csp-report")
      .send(
        JSON.stringify({
          "csp-report": {
            "document-uri": "https://www.rentatexhibit.com/",
            "effective-directive": "script-src-elem",
            "blocked-uri": "https://apis.google.com/js/client.js",
            disposition: "enforce",
          },
        }),
      );
    expect(res.status).toBe(204);
    await settle();

    expect(sendCspViolationAlert).toHaveBeenCalledTimes(1);
    expect(sendCspViolationAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveDirective: "script-src-elem",
        blockedUri: "https://apis.google.com/js/client.js",
        sourceFile: null,
      }),
    );
  });

  it("treats different query strings on the same blocked origin as one signature", async () => {
    const app = makeApp();
    for (const url of [
      "https://evil.example.com/beacon?x=1",
      "https://evil.example.com/beacon?x=2",
      "https://evil.example.com/other",
    ]) {
      await request(app)
        .post("/csp-reports")
        .set("Content-Type", "application/reports+json")
        .send(
          JSON.stringify([
            {
              type: "csp-violation",
              body: {
                documentURL: "https://www.rentatexhibit.com/",
                effectiveDirective: "connect-src",
                blockedURL: url,
              },
            },
          ]),
        );
    }
    await settle();
    expect(sendCspViolationAlert).toHaveBeenCalledTimes(1);
  });

  it("acknowledges junk bodies without logging violations or emailing", async () => {
    const app = makeApp();
    for (const body of ["not json at all", JSON.stringify({ hello: 1 }), ""]) {
      const res = await request(app)
        .post("/csp-reports")
        .set("Content-Type", "application/csp-report")
        .send(body);
      expect(res.status).toBe(204);
    }
    await settle();
    expect(sendCspViolationAlert).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalledWith(
      expect.anything(),
      "Visitor browser reported a CSP violation",
    );
  });

  it("caps alert emails per day even when signatures keep rotating", async () => {
    const app = makeApp();
    const total = CSP_ALERT_EMAIL_DAILY_MAX + 4;
    for (let i = 0; i < total; i++) {
      await request(app)
        .post("/csp-reports")
        .set("Content-Type", "application/reports+json")
        .send(
          JSON.stringify([
            {
              type: "csp-violation",
              body: {
                documentURL: "https://www.rentatexhibit.com/",
                effectiveDirective: "script-src-elem",
                blockedURL: `https://evil-${i}.example.com/x.js`,
              },
            },
          ]),
        );
      await settle();
    }
    expect(sendCspViolationAlert).toHaveBeenCalledTimes(CSP_ALERT_EMAIL_DAILY_MAX);
  });

  it("holds the daily email cap when one batch carries more distinct violations than the cap", async () => {
    // Regression: violations in a batch are processed concurrently; the
    // email slot must be reserved synchronously or they all pass the cap
    // check together.
    expect(MAX_REPORTS_PER_REQUEST).toBeGreaterThan(CSP_ALERT_EMAIL_DAILY_MAX);
    const app = makeApp();
    const batch = Array.from({ length: MAX_REPORTS_PER_REQUEST }, (_, i) => ({
      type: "csp-violation",
      body: {
        documentURL: "https://www.rentatexhibit.com/",
        effectiveDirective: "script-src-elem",
        blockedURL: `https://burst-${i}.example.com/x.js`,
      },
    }));
    await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/reports+json")
      .send(JSON.stringify(batch));
    await settle();
    expect(sendCspViolationAlert).toHaveBeenCalledTimes(CSP_ALERT_EMAIL_DAILY_MAX);
  });

  it("holds the daily email cap across concurrent requests with distinct signatures", async () => {
    // Slow the mailer down so every in-flight send overlaps; the cap must
    // still hold because slots are reserved before any await.
    vi.mocked(sendCspViolationAlert).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 20)),
    );
    const app = makeApp();
    const posts = Array.from({ length: CSP_ALERT_EMAIL_DAILY_MAX + 5 }, (_, i) =>
      request(app)
        .post("/csp-reports")
        .set("Content-Type", "application/reports+json")
        .send(
          JSON.stringify([
            {
              type: "csp-violation",
              body: {
                documentURL: "https://www.rentatexhibit.com/",
                effectiveDirective: "connect-src",
                blockedURL: `https://parallel-${i}.example.com/beacon`,
              },
            },
          ]),
        ),
    );
    await Promise.all(posts);
    await settle();
    expect(sendCspViolationAlert).toHaveBeenCalledTimes(CSP_ALERT_EMAIL_DAILY_MAX);
  });

  it("does not let deduped repeat signatures consume the daily email budget", async () => {
    const app = makeApp();
    // Burn dedupe losses: the same signature over and over.
    for (let i = 0; i < CSP_ALERT_EMAIL_DAILY_MAX + 2; i++) {
      await request(app)
        .post("/csp-reports")
        .set("Content-Type", "application/csp-report")
        .send(JSON.stringify(legacyReport));
    }
    // Fresh signatures must still be able to alert up to the cap.
    for (let i = 0; i < CSP_ALERT_EMAIL_DAILY_MAX; i++) {
      await request(app)
        .post("/csp-reports")
        .set("Content-Type", "application/reports+json")
        .send(
          JSON.stringify([
            {
              type: "csp-violation",
              body: {
                documentURL: "https://www.rentatexhibit.com/",
                effectiveDirective: "frame-src",
                blockedURL: `https://fresh-${i}.example.com/`,
              },
            },
          ]),
        );
    }
    await settle();
    // 1 for the repeated signature + (cap - 1) fresh ones.
    expect(sendCspViolationAlert).toHaveBeenCalledTimes(CSP_ALERT_EMAIL_DAILY_MAX);
  });

  it("processes at most MAX_REPORTS_PER_REQUEST reports from one batch", async () => {
    const app = makeApp();
    const batch = Array.from({ length: MAX_REPORTS_PER_REQUEST + 5 }, (_, i) => ({
      type: "csp-violation",
      body: {
        documentURL: "https://www.rentatexhibit.com/",
        effectiveDirective: "img-src",
        blockedURL: `https://cdn-${i}.example.com/a.png`,
      },
    }));
    await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/reports+json")
      .send(JSON.stringify(batch));
    await settle();

    const violationLogs = warn.mock.calls.filter(
      (c) => c[1] === "Visitor browser reported a CSP violation",
    );
    expect(violationLogs).toHaveLength(MAX_REPORTS_PER_REQUEST);
  });

  it("drops reports past the per-minute cap and logs the suppression once", async () => {
    const app = makeApp();
    const requests = Math.ceil((MAX_REPORTS_PER_MINUTE + 20) / MAX_REPORTS_PER_REQUEST);
    for (let r = 0; r < requests; r++) {
      const batch = Array.from({ length: MAX_REPORTS_PER_REQUEST }, (_, i) => ({
        type: "csp-violation",
        body: {
          documentURL: "https://www.rentatexhibit.com/",
          effectiveDirective: "font-src",
          blockedURL: `https://font-${r}-${i}.example.com/f.woff2`,
        },
      }));
      await request(app)
        .post("/csp-reports")
        .set("Content-Type", "application/reports+json")
        .send(JSON.stringify(batch));
    }
    await settle();

    const violationLogs = warn.mock.calls.filter(
      (c) => c[1] === "Visitor browser reported a CSP violation",
    );
    expect(violationLogs).toHaveLength(MAX_REPORTS_PER_MINUTE);
    const suppressionLogs = warn.mock.calls.filter(
      (c) =>
        c[1] ===
        "CSP report volume exceeded the per-minute cap; dropping further reports this minute",
    );
    expect(suppressionLogs).toHaveLength(1);
  });

  it("completes alert delivery before acknowledging the request", async () => {
    // Lifecycle contract for the autoscale runtime: work detached from the
    // request can be starved after the response, so the email send must have
    // finished (or terminally failed) by the time the 204 arrives — no
    // settle/tick is allowed between response and assertion here.
    const app = makeApp();
    const res = await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/csp-report")
      .send(JSON.stringify(legacyReport));
    expect(res.status).toBe(204);
    expect(sendCspViolationAlert).toHaveBeenCalledTimes(1);
  });

  it("still acknowledges within the processing timeout when the mailer hangs, logging the failure", async () => {
    process.env.CSP_REPORT_PROCESSING_TIMEOUT_MS = "50";
    vi.mocked(sendCspViolationAlert).mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    const app = makeApp();
    const started = Date.now();
    const res = await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/csp-report")
      .send(JSON.stringify(legacyReport));
    expect(res.status).toBe(204);
    expect(Date.now() - started).toBeLessThan(2_000);
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ reports: 1, timeoutMs: 50 }),
      "CSP report alert processing exceeded its timeout; the alert email may not have been delivered",
    );
  });

  it("skips emailing entirely when the mailer is unconfigured", async () => {
    vi.mocked(mailerConfigured).mockReturnValue(false);
    const app = makeApp();
    await request(app)
      .post("/csp-reports")
      .set("Content-Type", "application/csp-report")
      .send(JSON.stringify(legacyReport));
    await settle();
    expect(sendCspViolationAlert).not.toHaveBeenCalled();
  });
});
