import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
  getGuestGrants,
  createGuestGrant,
  revokeGuestGrant,
} from "../controllers/guestGrant.controller";

const router = Router();

router.use(authenticate);

// List grants (SA, Admin, Guest)
router.get("/", authorizeRoles("SUPER_ADMIN", "ADMIN", "GUEST"), getGuestGrants);

// Create grant (SA, Admin)
router.post("/", authorizeRoles("SUPER_ADMIN", "ADMIN"), createGuestGrant);

// Revoke grant (SA, Admin)
router.delete("/:id", authorizeRoles("SUPER_ADMIN", "ADMIN"), revokeGuestGrant);

export default router;
