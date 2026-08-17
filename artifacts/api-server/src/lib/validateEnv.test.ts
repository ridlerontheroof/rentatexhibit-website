import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateEnv } from "./validateEnv";

// ---------------------------------------------------------------------------
// Unit tests — validateEnv() called directly
// ---------------------------------------------------------------------------
// All three Exhibit-required vars with non-empty values.
const ALL_VARS: Record<string, string> = {
  APPFOLIO_CLIENT_ID: "client-id",
  APPFOLIO_CLIENT_SECRET: "client-secret",
  GMAIL_APP_PASSWORD: "gmail-app-pass",
};

describe("validateEnv — unit", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not throw or warn when all required vars are present", () => {
    expect(() => validateEnv(ALL_VARS, "production")).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("throws in production when a required var is missing", () => {
    const env = { ...ALL_VARS };
    delete env.APPFOLIO_CLIENT_ID;

    expect(() => validateEnv(env, "production")).toThrow(
      /APPFOLIO_CLIENT_ID/,
    );
  });

  it("includes ALL missing var names in one throw (not one at a time)", () => {
    const env = { ...ALL_VARS };
    delete env.APPFOLIO_CLIENT_SECRET;
    delete env.GMAIL_APP_PASSWORD;

    let message = "";
    try {
      validateEnv(env, "production");
    } catch (err) {
      message = (err as Error).message;
    }

    expect(message).toContain("APPFOLIO_CLIENT_SECRET");
    expect(message).toContain("GMAIL_APP_PASSWORD");
  });

  it("warns but does not throw in non-production when a required var is missing", () => {
    const env = { ...ALL_VARS };
    delete env.APPFOLIO_CLIENT_ID;

    expect(() => validateEnv(env, "development")).not.toThrow();
    expect(console.warn).toHaveBeenCalledOnce();

    const warnMsg = (console.warn as ReturnType<typeof vi.spyOn>).mock
      .calls[0][0] as string;
    expect(warnMsg).toContain("APPFOLIO_CLIENT_ID");
  });

  it("warns but does not throw when NODE_ENV is undefined (local dev)", () => {
    const env = { ...ALL_VARS };
    delete env.GMAIL_APP_PASSWORD;

    expect(() => validateEnv(env, undefined)).not.toThrow();
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it("treats an empty-string var as missing in production", () => {
    const env = { ...ALL_VARS, APPFOLIO_CLIENT_ID: "" };

    expect(() => validateEnv(env, "production")).toThrow(/APPFOLIO_CLIENT_ID/);
  });

  it("treats a whitespace-only var as missing in production", () => {
    const env = { ...ALL_VARS, GMAIL_APP_PASSWORD: "   " };

    expect(() => validateEnv(env, "production")).toThrow(/GMAIL_APP_PASSWORD/);
  });

  it("treats an empty-string var as missing in non-production (warns, no throw)", () => {
    const env = { ...ALL_VARS, APPFOLIO_CLIENT_SECRET: "" };

    expect(() => validateEnv(env, "development")).not.toThrow();

    const warnMsg = (console.warn as ReturnType<typeof vi.spyOn>).mock
      .calls[0][0] as string;
    expect(warnMsg).toContain("APPFOLIO_CLIENT_SECRET");
  });

  it("does not warn when all vars are present in non-production", () => {
    expect(() => validateEnv(ALL_VARS, "development")).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Startup integration — module-level auto-call
// ---------------------------------------------------------------------------
// The module runs `validateEnv()` unconditionally at import time. These tests
// verify that a fresh module evaluation under NODE_ENV=production with missing
// vars throws before any other code can proceed — the same behaviour a real
// production deploy would see.
// ---------------------------------------------------------------------------

describe("validateEnv — module-level auto-call (startup integration)", () => {
  // Snapshot and restore process.env around each test.
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = { ...process.env };
  });

  afterEach(() => {
    // Remove any keys added by the test, then restore the saved snapshot.
    for (const key of Object.keys(process.env)) {
      if (!(key in savedEnv)) delete process.env[key];
    }
    for (const [key, val] of Object.entries(savedEnv)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  });

  it("throws on import in production when required vars are absent", async () => {
    // Reset the module registry BEFORE manipulating process.env so the next
    // dynamic import re-executes the module-level validateEnv() call with the
    // mutated environment rather than returning the already-cached exports.
    vi.resetModules();

    delete process.env.APPFOLIO_CLIENT_ID;
    delete process.env.APPFOLIO_CLIENT_SECRET;
    delete process.env.GMAIL_APP_PASSWORD;
    process.env.NODE_ENV = "production";

    await expect(import("./validateEnv")).rejects.toThrow(
      /missing required environment variable/,
    );
  });

  it("does not throw on import in development when required vars are absent", async () => {
    vi.resetModules();

    delete process.env.APPFOLIO_CLIENT_ID;
    process.env.NODE_ENV = "development";

    // Warns but resolves — local dev should still start.
    await expect(import("./validateEnv")).resolves.toBeDefined();
  });
});
