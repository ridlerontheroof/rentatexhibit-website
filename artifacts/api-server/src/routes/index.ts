import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(reviewsRouter);

export default router;
