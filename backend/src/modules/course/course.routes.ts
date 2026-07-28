import { Router } from "express";
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

// Course CRUD
router.get("/", getCourses);
router.get("/:id", getCourseById);
router.post("/", createCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

// Section CRUD
router.post("/:id/sections", createSection);
router.put("/sections/:sectionId", updateSection);
router.delete("/sections/:sectionId", deleteSection);

// Content CRUD
router.post("/sections/:sectionId/contents", createContent);

export default router;