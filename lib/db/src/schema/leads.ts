import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "contact" | "tour"
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message"),
  preferredDate: text("preferred_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Stamped once the leasing team has been successfully notified about this
  // lead. Stays null when the notification email failed to send, so un-notified
  // leads can be audited and manually followed up on.
  notifiedAt: timestamp("notified_at"),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
