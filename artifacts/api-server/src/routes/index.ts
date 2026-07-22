import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import reviewsRouter from "./reviews";
import availabilityRouter from "./availability";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(reviewsRouter);
router.use(availabilityRouter);

export default router;
