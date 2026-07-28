import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createSection,
  updateSection,
  deleteSection,
  createContent,
} from "./course.controller";

const router = Router();

// Course CRUD — all routes require authentication
// GET is accessible to all authenticated users (scoping happens in the service layer)
router.get("/", authenticate, getCourses);
router.get("/:id", authenticate, getCourseById);

// Create/Update/Delete restricted to TEACHER, ADMIN, SUPER_ADMIN
router.post("/", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), createCourse);
router.put("/:id", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), updateCourse);
router.delete("/:id", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), deleteCourse);

// Section CRUD — restricted to course creators
router.post("/:id/sections", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), createSection);
router.put("/sections/:sectionId", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), updateSection);
router.delete("/sections/:sectionId", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), deleteSection);

// Content CRUD
router.post("/sections/:sectionId/contents", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), createContent);

export default router;