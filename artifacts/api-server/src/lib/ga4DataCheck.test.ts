import { generateKeyPairSync } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendGa4DataCheckAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Simulate the shared `email_throttle_counters` table (same contract as the
// gtmCheck tests): daily-claim inserts return a row only when new; DO UPDATE
// counters increment; DELETE clears. Stores survive
// __resetGa4DataCheckForTests(), mimicking a restart (memory lost, DB kept).
const sharedKeys = new Set<string>();
const sharedCounters = new Map<string, number>();
let dbDown = false;
vi.mock("@workspace/db", () => ({
  db: {
    execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
      if (dbDown) throw new Error("db unreachable");
      const text = JSON.stringify(query);
      const key = text.match(/ga4datacheck:[^"\\]+/)?.[0];
      if (typeof key !== "string") return { rows: [] };
      if (text.includes("DELETE")) {
        sharedCounters.delete(key);
        return { rows: [] };
      }
      if (text.includes("DO UPDATE")) {
        const next = (sharedCounters.get(key) ?? 0) + 1;
        sharedCounters.set(key, next);
        return { rows: [{ count: next }] };
      }
      if (sharedKeys.has(key)) return { rows: [] };
      sharedKeys.add(key);
      return { rows: [{ count: 1 }] };
    }),
  },
}));

import {
  buildJwtAssertion,
  checkGa4DataOnce,
  readGa4Config,
  __resetGa4DataCheckForTests,
  type Ga4Config,
  type Ga4QueryResult,
} from "./ga4DataCheck";
import { sendGa4DataCheckAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendAlert = vi.mocked(sendGa4DataCheckAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);
const log = logger as never;

const DAY1 = Date.parse("2026-08-11T10:00:00Z");
const DAY1_LATER = Date.parse("2026-08-11T22:00:00Z");
const DAY2 = Date.parse("2026-08-12T10:00:00Z");

const SA_JSON = JSON.stringify({
  client_email: "watchdog@project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
});
const ENV_OK: NodeJS.ProcessEnv = {
  GA4_SERVICE_ACCOUNT_JSON: SA_JSON,
  GA4_PROPERTY_ID: "123456789",
};

const users =
  (n: number) =>
  (): Promise<Ga4QueryResult> =>
    Promise.resolve({ activeUsers: n });
const errored = (): Promise<Ga4QueryResult> =>
  Promise.resolve({ activeUsers: null, error: "token exchange failed" });

beforeEach(() => {
  vi.clearAllMocks();
  __resetGa4DataCheckForTests();
  sharedKeys.clear();
  sharedCounters.clear();
  dbDown = false;
  mailerConfiguredMock.mockReturnValue(true);
});

describe("readGa4Config", () => {
  it("returns null when the secret or property ID is absent", () => {
    expect(readGa4Config({})).toBeNull();
    expect(readGa4Config({ GA4_PROPERTY_ID: "123" })).toBeNull();
    expect(readGa4Config({ GA4_SERVICE_ACCOUNT_JSON: SA_JSON })).toBeNull();
  });

  it("parses valid credentials with the default floor", () => {
    const config = readGa4Config(ENV_OK);
    expect(config).toMatchObject({
      propertyId: "123456789",
      clientEmail: "watchdog@project.iam.gserviceaccount.com",
      minActiveUsers: 1,
    });
  });

  it("honors GA4_MIN_ACTIVE_USERS", () => {
    const config = readGa4Config({ ...ENV_OK, GA4_MIN_ACTIVE_USERS: "5" });
    expect(config?.minActiveUsers).toBe(5);
  });

  it("throws on a measurement ID instead of a numeric property ID", () => {
    expect(() =>
      readGa4Config({ ...ENV_OK, GA4_PROPERTY_ID: "G-1S66YHBN91" }),
    ).toThrow(/numeric GA4 property ID/);
  });

  it("throws on malformed JSON or a key missing fields", () => {
    expect(() =>
      readGa4Config({ ...ENV_OK, GA4_SERVICE_ACCOUNT_JSON: "not json" }),
    ).toThrow(/not valid JSON/);
    expect(() =>
      readGa4Config({ ...ENV_OK, GA4_SERVICE_ACCOUNT_JSON: "{}" }),
    ).toThrow(/client_email/);
  });
});

describe("buildJwtAssertion", () => {
  it("builds a three-part RS256 JWT with the analytics scope", () => {
    // A real RSA key so createSign succeeds.
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
    const jwt = buildJwtAssertion("sa@x.iam.gserviceaccount.com", pem, 1_700_000_000);
    const parts = jwt.split(".");
    expect(parts).toHaveLength(3);
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    expect(claims.iss).toBe("sa@x.iam.gserviceaccount.com");
    expect(claims.scope).toContain("analytics.readonly");
    expect(claims.exp - claims.iat).toBe(3600);
  });
});

describe("checkGa4DataOnce", () => {
  it("does nothing alert-worthy when visitors are recorded", async () => {
    await checkGa4DataOnce(log, DAY1, users(42), ENV_OK);
    expect(sendAlert).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ activeUsers: 42 }),
      expect.stringContaining("passed"),
    );
  });

  it("alerts once per day on zero visitors, resuming the next day", async () => {
    await checkGa4DataOnce(log, DAY1, users(0), ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0][0].summary).toMatch(/only 0 active user/);

    await checkGa4DataOnce(log, DAY1_LATER, users(0), ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(1); // deduped same UTC day

    await checkGa4DataOnce(log, DAY2, users(0), ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(2);
  });

  it("treats counts at the floor as failures and above it as healthy", async () => {
    await checkGa4DataOnce(log, DAY1, users(1), ENV_OK); // floor = 1 → alert
    expect(sendAlert).toHaveBeenCalledTimes(1);
    __resetGa4DataCheckForTests();
    sharedKeys.clear();
    await checkGa4DataOnce(log, DAY2, users(2), ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("logs but does not alert without credentials (unsupported), warning once", async () => {
    await checkGa4DataOnce(log, DAY1, users(0), {});
    await checkGa4DataOnce(log, DAY1_LATER, users(0), {});
    expect(sendAlert).not.toHaveBeenCalled();
    const noCredWarnings = vi
      .mocked(logger.error)
      .mock.calls.filter(([, msg]) => String(msg).includes("NO credentials"));
    expect(noCredWarnings).toHaveLength(1);
  });

  it("does not alert on a single errored run, but escalates after 4", async () => {
    for (let i = 0; i < 3; i++) {
      await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
      expect(sendAlert).not.toHaveBeenCalled();
    }
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0][0].summary).toMatch(/blind/);
  });

  it("treats malformed credentials as errored (escalating), not unsupported", async () => {
    const badEnv = { ...ENV_OK, GA4_PROPERTY_ID: "G-1S66YHBN91" };
    for (let i = 0; i < 4; i++) {
      await checkGa4DataOnce(log, DAY1, users(42), badEnv);
    }
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(sendAlert.mock.calls[0][0].summary).toMatch(/numeric GA4 property ID/);
  });

  it("persists the errored-run counter across a restart", async () => {
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    __resetGa4DataCheckForTests(); // restart: memory lost, DB kept
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("a healthy run clears the errored streak", async () => {
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    await checkGa4DataOnce(log, DAY1, users(42), ENV_OK);
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    await checkGa4DataOnce(log, DAY1, errored, ENV_OK);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("falls back to in-memory dedupe when the database is down", async () => {
    dbDown = true;
    await checkGa4DataOnce(log, DAY1, users(0), ENV_OK);
    await checkGa4DataOnce(log, DAY1_LATER, users(0), ENV_OK);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("skips sending when the mailer is not configured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await checkGa4DataOnce(log, DAY1, users(0), ENV_OK);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("never throws when the alert send fails", async () => {
    sendAlert.mockRejectedValueOnce(new Error("smtp down"));
    await expect(
      checkGa4DataOnce(log, DAY1, users(0), ENV_OK),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      expect.stringContaining("Failed to send GA4-data failure alert"),
    );
  });
});
