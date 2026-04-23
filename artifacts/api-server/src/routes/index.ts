import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeLeadRouter from "./analyze-lead";
import leadsRouter from "./leads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeLeadRouter);
router.use(leadsRouter);

export default router;
