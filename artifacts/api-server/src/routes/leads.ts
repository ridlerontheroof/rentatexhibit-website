import { Router, type IRouter } from "express";
import { CreateLeadBody, CreateLeadResponse } from "@workspace/api-zod";
import { db, leadsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/leads", async (req, res) => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid submission" });
    return;
  }

  const input = parsed.data;
  const [row] = await db
    .insert(leadsTable)
    .values({
      type: input.type,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      message: input.message ?? null,
      preferredDate: input.preferredDate ?? null,
    })
    .returning();

  const data = CreateLeadResponse.parse({
    id: row.id,
    type: row.type,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    message: row.message,
    preferredDate: row.preferredDate,
    createdAt: row.createdAt.toISOString(),
  });

  res.status(201).json(data);
});

export default router;
