/**
 * Unit tests for the cspReportAlert helper functions.
 *
 * The route-level tests (cspReports.test.ts) exercise the full pipeline.
 * These tests guard the classification logic in isolation so regressions
 * in noise-suppression are caught before they affect alert delivery.
 */
import { describe, expect, it } from "vitest";
import {
  blockedUriSignature,
  isKnownNoise,
  violationSignature,
} from "./cspReportAlert";
import type { CspViolation } from "./cspReportAlert";

function violation(
  partial: Partial<CspViolation> & Pick<CspViolation, "effectiveDirective" | "blockedUri">,
): CspViolation {
  return {
    documentUri: "https://www.rentatexhibit.com/schedule-showing",
    sourceFile: null,
    scriptSample: null,
    disposition: "enforce",
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// blockedUriSignature
// ---------------------------------------------------------------------------
describe("blockedUriSignature", () => {
  it("reduces a URL to its origin", () => {
    expect(blockedUriSignature("https://google.com/pagead/form-data/12345")).toBe(
      "https://google.com",
    );
  });

  it("strips query strings from the origin", () => {
    expect(blockedUriSignature("https://evil.example.com/beacon?k=v&k2=v2")).toBe(
      "https://evil.example.com",
    );
  });

  it("treats inline and eval keywords as-is", () => {
    expect(blockedUriSignature("inline")).toBe("inline");
    expect(blockedUriSignature("eval")).toBe("eval");
  });

  it("returns 'empty' for an empty string", () => {
    expect(blockedUriSignature("")).toBe("empty");
  });

  it("returns the stringified 'null' origin for opaque-origin URLs", () => {
    // new URL("not-a-url:garbage").origin === "null" (the string) — not a
    // thrown exception; the implementation passes that string through.
    expect(blockedUriSignature("not-a-url:garbage")).toBe("null");
  });
});

// ---------------------------------------------------------------------------
// violationSignature
// ---------------------------------------------------------------------------
describe("violationSignature", () => {
  it("combines directive and blocked origin into a pipe-separated key", () => {
    const v = violation({
      effectiveDirective: "connect-src",
      blockedUri: "https://google.com/pagead/form-data/12345",
    });
    expect(violationSignature(v)).toBe("connect-src|https://google.com");
  });

  it("lowercases the directive", () => {
    const v = violation({
      effectiveDirective: "Script-Src-Elem",
      blockedUri: "inline",
    });
    expect(violationSignature(v)).toBe("script-src-elem|inline");
  });
});

// ---------------------------------------------------------------------------
// isKnownNoise
// ---------------------------------------------------------------------------
describe("isKnownNoise", () => {
  // --- eval ---
  it("suppresses eval violations (browser-extension noise)", () => {
    expect(
      isKnownNoise(violation({ effectiveDirective: "script-src", blockedUri: "eval" })),
    ).toBe(true);
  });

  it("suppresses eval regardless of directive casing", () => {
    expect(
      isKnownNoise(violation({ effectiveDirective: "Script-Src-Elem", blockedUri: "eval" })),
    ).toBe(true);
  });

  it("does not suppress 'eval' in non-script directives (should not arise, but must not crash)", () => {
    // isKnownNoise checks blockedUri === 'eval' first, without regard to
    // directive — this is intentional; eval from any directive is extension noise.
    expect(
      isKnownNoise(violation({ effectiveDirective: "connect-src", blockedUri: "eval" })),
    ).toBe(true);
  });

  // --- inline injected by eval'd code ---
  it("suppresses inline blocked with 'sandbox eval code' source (extension/webview noise)", () => {
    expect(
      isKnownNoise(
        violation({
          effectiveDirective: "script-src-elem",
          blockedUri: "inline",
          sourceFile: "sandbox eval code",
        }),
      ),
    ).toBe(true);
  });

  it("suppresses inline blocked with plain 'eval code' source", () => {
    expect(
      isKnownNoise(
        violation({
          effectiveDirective: "script-src-elem",
          blockedUri: "inline",
          sourceFile: "eval code",
        }),
      ),
    ).toBe(true);
  });

  it("still alerts on inline without an eval-code source (possible missing GTM hash)", () => {
    expect(
      isKnownNoise(
        violation({ effectiveDirective: "script-src-elem", blockedUri: "inline" }),
      ),
    ).toBe(false);
    expect(
      isKnownNoise(
        violation({
          effectiveDirective: "script-src-elem",
          blockedUri: "inline",
          sourceFile: "https://www.googletagmanager.com/gtm.js",
        }),
      ),
    ).toBe(false);
  });

  // --- country-domain ga-audiences ---
  it("suppresses country-domain google.ie (connect-src)", () => {
    expect(
      isKnownNoise(
        violation({ effectiveDirective: "connect-src", blockedUri: "https://www.google.ie" }),
      ),
    ).toBe(true);
  });

  it("suppresses country-domain google.com.ph (connect-src)", () => {
    expect(
      isKnownNoise(
        violation({ effectiveDirective: "connect-src", blockedUri: "https://www.google.com.ph" }),
      ),
    ).toBe(true);
  });

  it("suppresses bare country-domain google.co.uk (connect-src)", () => {
    expect(
      isKnownNoise(
        violation({ effectiveDirective: "connect-src", blockedUri: "https://google.co.uk" }),
      ),
    ).toBe(true);
  });

  // --- NOT noise: google.com (bare apex) ---
  it("does NOT suppress https://google.com/pagead/form-data/... — it is actionable, not noise", () => {
    // Before the CSP fix (adding https://google.com to connect-src) this
    // violation generated daily alert emails. After the fix, browsers no
    // longer block the request so no violation report arrives at all.
    // The suppression logic must NOT paper over it; the CSP header is the
    // only correct fix.
    expect(
      isKnownNoise(
        violation({
          effectiveDirective: "connect-src",
          blockedUri: "https://google.com/pagead/form-data/12345",
        }),
      ),
    ).toBe(false);
  });

  it("does NOT suppress https://www.google.com (www prefix, .com TLD)", () => {
    expect(
      isKnownNoise(
        violation({
          effectiveDirective: "connect-src",
          blockedUri: "https://www.google.com/pagead/set_partitioned_cookie",
        }),
      ),
    ).toBe(false);
  });

  it("does NOT suppress https://google-analytics.com (different domain)", () => {
    expect(
      isKnownNoise(
        violation({ effectiveDirective: "connect-src", blockedUri: "https://google-analytics.com" }),
      ),
    ).toBe(false);
  });

  // --- not a connect-src violation ---
  it("does NOT suppress a country-domain violation outside connect-src", () => {
    // Country-domain suppression is intentionally scoped to connect-src only.
    expect(
      isKnownNoise(
        violation({ effectiveDirective: "frame-src", blockedUri: "https://www.google.ie" }),
      ),
    ).toBe(false);
  });

  // --- other violations ---
  it("does NOT suppress an arbitrary unknown violation", () => {
    expect(
      isKnownNoise(
        violation({ effectiveDirective: "script-src-elem", blockedUri: "https://evil.example.com/x.js" }),
      ),
    ).toBe(false);
  });
});
