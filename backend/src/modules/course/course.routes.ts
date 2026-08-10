import { Router } from "express";
import multer from "multer";
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
  selfEnrollCourse,
  adminEnrollUser,
  bulkEnrollUsers,
  verifyUser,
  verifyBulkFile,
  uploadScormPackage,
  uploadDocumentFile,
} from "./course.controller";

import {
  getLearnerProgress,
  getMyEnrollments,
  updateLessonProgress,
  recordQuizSubmission,
  recordAssignmentSubmission,
  getAdminLearnerProgressMatrix,
  getTeacherSubmissions,
  gradeAssessmentSubmission,
} from "./progress.controller";

const upload = multer({ storage: multer.memoryStorage() });
const uploadScorm = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB size limit
});

const router = Router();

// SCORM Package Upload Route (100MB limit)
router.post(
  "/upload-scorm",
  authenticate,
  authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"),
  uploadScorm.single("file"),
  uploadScormPackage
);

// Document File Upload Route (PDF, PPT, DOC)
router.post(
  "/upload-document",
  authenticate,
  authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"),
  upload.single("file"),
  uploadDocumentFile
);

// Pre-enrollment Verification Routes (usable during wizard creation)
router.post("/verify-user", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), verifyUser);
router.post("/verify-bulk-file", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), upload.single("file"), verifyBulkFile);

// Progress & Learner Execution
router.get("/my-enrollments", authenticate, getMyEnrollments);
router.get("/admin/learner-matrix", authenticate, getAdminLearnerProgressMatrix);
router.get("/teacher/submissions", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), getTeacherSubmissions);
router.post("/admin/grade-submission/:submissionId", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), gradeAssessmentSubmission);

router.get("/:id/my-progress", authenticate, getLearnerProgress);
router.post("/:id/progress", authenticate, updateLessonProgress);
router.post("/:id/quiz/submit", authenticate, recordQuizSubmission);
router.post("/:id/assignment/submit", authenticate, recordAssignmentSubmission);

// Enrolment Routes
router.post("/:id/enroll", authenticate, selfEnrollCourse);
router.post("/:id/admin-enroll", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), adminEnrollUser);
router.post("/:id/bulk-enroll", authenticate, authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"), upload.single("file"), bulkEnrollUsers);

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