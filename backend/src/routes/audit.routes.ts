import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { getAuditLogs } from "../modules/audit/audit.controller";

const router = Router();

// Restricted exclusively to SUPER_ADMIN
router.get("/", authenticate, authorizeRoles("SUPER_ADMIN"), getAuditLogs);

export default router;
