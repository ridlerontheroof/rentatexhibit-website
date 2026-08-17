import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import reviewsRouter from "./reviews";
import availabilityRouter from "./availability";
import showingsRouter from "./showings";
import cspReportsRouter from "./cspReports";
import watchdogRosterRouter from "./watchdogRoster";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(reviewsRouter);
router.use(availabilityRouter);
router.use(showingsRouter);
router.use(cspReportsRouter);
router.use(watchdogRosterRouter);

export default router;
