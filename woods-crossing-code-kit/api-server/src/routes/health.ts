import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getBakedSeedHealth } from "./availability";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  // Operational extra (not part of the generated schema): lets an uptime
  // monitor spot when the baked availability seed shipped with this instance
  // is past its max age — see availability.ts.
  res.json({ ...data, availabilitySeed: getBakedSeedHealth() });
});

export default router;
