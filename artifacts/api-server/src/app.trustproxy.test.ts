import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";

/**
 * Regression tests for the trust-proxy hardening on the API server.
 *
 * The rate limiter on POST /api/leads keys off req.ip, so req.ip must resolve
 * to the genuine client address appended by the platform's (private-network)
 * proxy hops — never to an internal proxy address, and never to an
 * attacker-supplied X-Forwarded-For value.
 *
 * These tests exercise a minimal Express app configured with the exact same
 * trust-proxy setting as src/app.ts, driven over loopback (as in the real
 * deployment, where the last hop connects from 127.0.0.1).
 */

const TRUST_PROXY_SETTING = [
  "loopback",
  "linklocal",
  "uniquelocal",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
];

function buildProbeApp() {
  const app = express();
  app.set("trust proxy", TRUST_PROXY_SETTING);
  app.get("/probe", (req, res) => {
    res.json({ ip: req.ip, ips: req.ips });
  });
  return app;
}

describe("trust proxy resolution", () => {
  it("resolves req.ip to the rightmost public address in the chain", async () => {
    const res = await request(buildProbeApp())
      .get("/probe")
      // Chain observed behind Replit's proxy: real client, then two internal hops.
      .set("X-Forwarded-For", "203.0.113.7, 10.54.8.70, 127.0.0.1");
    expect(res.body.ip).toBe("203.0.113.7");
  });

  it("ignores attacker-prepended X-Forwarded-For values", async () => {
    const res = await request(buildProbeApp())
      .get("/probe")
      // Attacker sends "X-Forwarded-For: 1.2.3.4"; proxies append the real
      // client IP and internal hops. The spoofed value sits left of the real
      // client IP and must never be selected.
      .set("X-Forwarded-For", "1.2.3.4, 203.0.113.7, 10.54.8.70, 127.0.0.1");
    expect(res.body.ip).toBe("203.0.113.7");
  });

  it("does not collapse distinct clients into one bucket (unlike hop-count 1)", async () => {
    const app = buildProbeApp();
    const a = await request(app)
      .get("/probe")
      .set("X-Forwarded-For", "198.51.100.1, 10.54.8.70, 127.0.0.1");
    const b = await request(app)
      .get("/probe")
      .set("X-Forwarded-For", "198.51.100.2, 10.54.8.70, 127.0.0.1");
    expect(a.body.ip).toBe("198.51.100.1");
    expect(b.body.ip).toBe("198.51.100.2");
    expect(a.body.ip).not.toBe(b.body.ip);
  });

  it("falls back to the socket address when no forwarded header is present", async () => {
    const res = await request(buildProbeApp()).get("/probe");
    // Supertest connects over loopback.
    expect(["127.0.0.1", "::1", "::ffff:127.0.0.1"]).toContain(res.body.ip);
  });
});
