import { Router } from "express";
import availability from "./availability";
import health from "./health";
import leads from "./leads";
import showings from "./showings";

const router = Router();
router.use(availability);
router.use(health);
router.use(leads);
router.use(showings);
export default router;