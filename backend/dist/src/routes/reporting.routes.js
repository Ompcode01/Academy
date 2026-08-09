"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const reporting_controller_1 = require("../controllers/reporting.controller");
const router = (0, express_1.Router)();
// Protect all reporting endpoints with authentication and Admin/Super Admin role authorization
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.authorizeRoles)("ADMIN", "SUPER_ADMIN"));
router.get("/filter-options", reporting_controller_1.getFilterOptions);
router.get("/enrollments", reporting_controller_1.getEnrollmentReport);
router.get("/completions", reporting_controller_1.getCourseCompletionReport);
router.get("/learner-performance", reporting_controller_1.getLearnerPerformanceReport);
router.get("/assessments", reporting_controller_1.getAssessmentReport);
router.get("/engagement", reporting_controller_1.getEngagementReport);
router.get("/teacher-performance", reporting_controller_1.getTeacherPerformanceReport);
// Super Admin Only Reports
router.get("/department-performance", (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN"), reporting_controller_1.getDepartmentPerformanceReport);
router.get("/organization-overview", (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN"), reporting_controller_1.getOrganizationOverviewReport);
// Drilldowns & Exports
router.get("/drilldown/employee/:id", reporting_controller_1.getEmployeeDrilldown);
router.get("/export/:type", reporting_controller_1.exportReport);
exports.default = router;
