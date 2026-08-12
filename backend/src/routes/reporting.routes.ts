import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
  getFilterOptions,
  getEnrollmentReport,
  getCourseCompletionReport,
  getLearnerPerformanceReport,
  getAssessmentReport,
  getEngagementReport,
  getTeacherPerformanceReport,
  getDepartmentPerformanceReport,
  getOrganizationOverviewReport,
  getEmployeeDrilldown,
  exportReport,
  getLearnerProgressReport,
  getQuizAssessmentReport,
  getAssignmentSubmissionReport,
  evaluateAssignment,
} from "../controllers/reporting.controller";

const router = Router();

// Protect all reporting endpoints with authentication and Admin/Super Admin/Teacher role authorization
router.use(authenticate);
router.use(authorizeRoles("ADMIN", "SUPER_ADMIN", "TEACHER"));

router.get("/filter-options", getFilterOptions);
router.get("/enrollments", getEnrollmentReport);
router.get("/completions", getCourseCompletionReport);
router.get("/learner-performance", getLearnerPerformanceReport);
router.get("/assessments", getAssessmentReport);
router.get("/engagement", getEngagementReport);
router.get("/teacher-performance", getTeacherPerformanceReport);

// 3 Core Role-Based Reports & Evaluation
router.get("/learner-progress", getLearnerProgressReport);
router.get("/quiz-assessments", getQuizAssessmentReport);
router.get("/assignment-submissions", getAssignmentSubmissionReport);
router.post("/evaluate-assignment/:id", evaluateAssignment);

// Super Admin Only Reports
router.get("/department-performance", authorizeRoles("SUPER_ADMIN"), getDepartmentPerformanceReport);
router.get("/organization-overview", authorizeRoles("SUPER_ADMIN"), getOrganizationOverviewReport);

// Drilldowns & Exports
router.get("/drilldown/employee/:id", getEmployeeDrilldown);
router.get("/export/:type", exportReport);

export default router;
