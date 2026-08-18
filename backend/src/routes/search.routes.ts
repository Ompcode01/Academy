import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { globalSearch } from "../controllers/search.controller";

const router = Router();

// GET /api/search?q=...&category=...
router.get("/", authenticate, globalSearch);

export default router;
