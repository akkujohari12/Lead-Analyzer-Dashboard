import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeLeadRouter from "./analyze-lead";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeLeadRouter);

export default router;
