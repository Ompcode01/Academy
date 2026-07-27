import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { authorizePermissions } from "../middleware/permission.middleware";
import {
  createDepartment,
  getDepartments,
} from "../controllers/department.controller";

const router = Router();

router.post(
    "/",
    authenticate,
    authorizeRoles("SUPER_ADMIN"),
    authorizePermissions("USER_CREATE"),
    createDepartment
);
router.get("/", authenticate, getDepartments);

export default router;