import { z } from "zod";
export const HealthCheckResponse = z.object({ status: z.literal("ok") });
export const CreateLeadBody = z.object({
  type: z.enum(["contact", "tour", "apply"]),
  firstName: z.string().min(1), lastName: z.string().min(1),
  email: z.string().email(), phone: z.string().min(1),
  message: z.string().optional(), preferredDate: z.string().optional(),
  source: z.string().optional(), unit: z.string().optional()
});
export const CreateLeadResponse = z.object({
  id: z.number(), type: z.string(), firstName: z.string(), lastName: z.string(),
  email: z.string(), phone: z.string(), message: z.string().nullable(),
  preferredDate: z.string().nullable(), createdAt: z.string()
});