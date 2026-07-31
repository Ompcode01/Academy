import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

import {

assignRole,
getUserRoles,
getUserRoleById,
deleteUserRole

} from "../controllers/userRole.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  assignRole
);

router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  getUserRoles
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  getUserRoleById
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  deleteUserRole
);

export default router;