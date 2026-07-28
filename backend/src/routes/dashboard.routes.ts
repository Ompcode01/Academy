import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getStats } from "../controllers/dashboard.controller";

const router = Router();

router.get("/stats", authenticate, getStats);

export default router;
