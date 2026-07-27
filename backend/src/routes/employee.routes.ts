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
router.get("/", getEmployees);

router.get("/:id", getEmployeeById);

router.put("/:id", updateEmployee);

router.delete("/:id", deleteEmployee);

export default router;