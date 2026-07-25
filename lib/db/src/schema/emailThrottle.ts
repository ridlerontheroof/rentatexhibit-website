import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Shared counters backing the outbound confirmation-email throttle.
 *
 * The throttle used to live purely in process memory, which meant every
 * autoscale replica enforced its own independent cap — N replicas multiplied
 * the effective daily limit by N. Keeping the counters in PostgreSQL (already
 * provisioned for leads) makes the cap cluster-wide.
 *
 * Each row is one counting bucket for one UTC day, e.g.:
 *   - `global:2026-07-25`
 *   - `rcpt:someone@example.com:2026-07-25`
 * Rows are incremented atomically with `INSERT … ON CONFLICT DO UPDATE` and
 * expire naturally; `expiresAt` lets stale rows be swept opportunistically.
 */
export const emailThrottleCountersTable = pgTable("email_throttle_counters", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
});

export type EmailThrottleCounter =
  typeof emailThrottleCountersTable.$inferSelect;
