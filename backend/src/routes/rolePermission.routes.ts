import { Router } from "express";

import {
  assignPermission,
  getRolePermissions,
  getRolePermissionById,
  deleteRolePermission,
} from "../controllers/rolePermission.controller";

const router = Router();

router.post("/", assignPermission);

router.get("/", getRolePermissions);

router.get("/:id", getRolePermissionById);

router.delete("/:id", deleteRolePermission);

export default router;