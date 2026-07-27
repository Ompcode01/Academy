import { Router } from "express";

import {
  createPermission,
  getPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
} from "../controllers/permission.controller";

const router = Router();

router.post("/", createPermission);

router.get("/", getPermissions);

router.get("/:id", getPermissionById);

router.put("/:id", updatePermission);

router.delete("/:id", deletePermission);

export default router;