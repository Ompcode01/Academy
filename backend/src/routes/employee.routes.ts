import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
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
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  getEmployees
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
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

export default router;