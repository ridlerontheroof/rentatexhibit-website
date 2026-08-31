import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { Pool } from "pg";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message"),
  preferredDate: text("preferred_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
});

type PgClient = { query: (...args: any[]) => any };
let configured: ReturnType<typeof drizzle> | null = null;
function database() {
  if (configured) return configured;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required for database-backed operations");
  configured = drizzle(new Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000 }));
  return configured;
}
/** Test-only injection point accepting pg-mem's pg-compatible Pool. */
export function configureDatabaseForTests(pool: PgClient): void {
  configured = drizzle(pool as any);
}
export const db: ReturnType<typeof drizzle> = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, property) {
    const value = (database() as any)[property];
    return typeof value === "function" ? value.bind(database()) : value;
  },
});