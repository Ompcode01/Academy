import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/role.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  createRole
);

router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  getRoles
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  getRoleById
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  updateRole
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  deleteRole
);

export default router;