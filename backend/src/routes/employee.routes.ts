import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  restoreEmployee,
} from "../controllers/employee.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  createEmployee
);

router.get(
  "/",
  authenticate,
  getEmployees
);

router.get(
  "/:id",
  authenticate,
  getEmployeeById
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  updateEmployee
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteEmployee
);

router.post(
  "/:id/restore",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  restoreEmployee
);

export default router;