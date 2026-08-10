"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const course_controller_1 = require("./course.controller");
const progress_controller_1 = require("./progress.controller");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const uploadScorm = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB size limit
});
const router = (0, express_1.Router)();
// SCORM Package Upload Route (100MB limit)
router.post("/upload-scorm", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), uploadScorm.single("file"), course_controller_1.uploadScormPackage);
// Pre-enrollment Verification Routes (usable during wizard creation)
router.post("/verify-user", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), course_controller_1.verifyUser);
router.post("/verify-bulk-file", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), upload.single("file"), course_controller_1.verifyBulkFile);
// Progress & Learner Execution
router.get("/my-enrollments", auth_middleware_1.authenticate, progress_controller_1.getMyEnrollments);
router.get("/admin/learner-matrix", auth_middleware_1.authenticate, progress_controller_1.getAdminLearnerProgressMatrix);
router.get("/teacher/submissions", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), progress_controller_1.getTeacherSubmissions);
router.post("/admin/grade-submission/:submissionId", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), progress_controller_1.gradeAssessmentSubmission);
router.get("/:id/my-progress", auth_middleware_1.authenticate, progress_controller_1.getLearnerProgress);
router.post("/:id/progress", auth_middleware_1.authenticate, progress_controller_1.updateLessonProgress);
router.post("/:id/quiz/submit", auth_middleware_1.authenticate, progress_controller_1.recordQuizSubmission);
router.post("/:id/assignment/submit", auth_middleware_1.authenticate, progress_controller_1.recordAssignmentSubmission);
// Enrolment Routes
router.post("/:id/enroll", auth_middleware_1.authenticate, course_controller_1.selfEnrollCourse);
router.post("/:id/admin-enroll", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), course_controller_1.adminEnrollUser);
router.post("/:id/bulk-enroll", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), upload.single("file"), course_controller_1.bulkEnrollUsers);
// Course CRUD — all routes require authentication
// GET is accessible to all authenticated users (scoping happens in the service layer)
router.get("/", auth_middleware_1.authenticate, course_controller_1.getCourses);
router.get("/:id", auth_middleware_1.authenticate, course_controller_1.getCourseById);
// Create/Update/Delete restricted to TEACHER, ADMIN, SUPER_ADMIN
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), course_controller_1.createCourse);
router.put("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), course_controller_1.updateCourse);
router.delete("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), course_controller_1.deleteCourse);
// Section CRUD — restricted to course creators
router.post("/:id/sections", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), course_controller_1.createSection);
router.put("/sections/:sectionId", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), course_controller_1.updateSection);
router.delete("/sections/:sectionId", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), course_controller_1.deleteSection);
// Content CRUD
router.post("/sections/:sectionId/contents", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), course_controller_1.createContent);
exports.default = router;
