"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBulkFile = exports.verifyUser = exports.bulkEnrollUsers = exports.adminEnrollUser = exports.selfEnrollCourse = exports.createContent = exports.deleteSection = exports.updateSection = exports.createSection = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourseById = exports.getCourses = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const response_1 = require("../../utils/response");
const course_service_1 = __importDefault(require("./course.service"));
const prismaSerializer_1 = require("../../utils/prismaSerializer");
const prisma_1 = __importDefault(require("../../config/prisma"));
// GET /api/courses
exports.getCourses = (0, asyncHandler_1.default)(async (req, res) => {
    const { search, categoryId, isPublished, status, departmentId, page, limit } = req.query;
    const userContext = {
        role: req.user?.role || "GUEST",
        employeeId: req.user?.employeeId ? BigInt(req.user.employeeId) : undefined,
        departmentId: req.user?.departmentId ? BigInt(req.user.departmentId) : undefined,
    };
    const filters = {
        search: search,
        categoryId: categoryId ? Number(categoryId) : undefined,
        status: status,
        departmentId: departmentId ? BigInt(departmentId) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
    };
    const result = await course_service_1.default.getAllCourses(filters, userContext);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), "Courses fetched successfully");
});
// GET /api/courses/:id
exports.getCourseById = (0, asyncHandler_1.default)(async (req, res) => {
    const id = BigInt(req.params.id);
    const course = await course_service_1.default.getCourseById(id);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(course), "Course fetched successfully");
});
// POST /api/courses
exports.createCourse = (0, asyncHandler_1.default)(async (req, res) => {
    const userRole = req.user?.role || "LEARNER";
    const userEmployeeId = BigInt(req.user?.employeeId);
    const userDepartmentId = req.user?.departmentId ? BigInt(req.user.departmentId) : null;
    let departmentId = null;
    // Rule: ADMIN (and TEACHER) department must be fixed to their assigned department
    if (userRole === "ADMIN" || userRole === "TEACHER") {
        departmentId = userDepartmentId;
    }
    else if (userRole === "SUPER_ADMIN") {
        // SUPER_ADMIN can pick a specific department OR select "ALL" / global (null)
        if (req.body.departmentId !== undefined &&
            req.body.departmentId !== null &&
            req.body.departmentId !== "global" &&
            req.body.departmentId !== "ALL" &&
            req.body.departmentId !== "") {
            departmentId = BigInt(req.body.departmentId);
        }
        else {
            departmentId = null;
        }
    }
    else {
        departmentId = userDepartmentId;
    }
    const data = {
        ...req.body,
        categoryId: BigInt(req.body.categoryId),
        creatorId: userEmployeeId,
        departmentId,
        enrollmentType: req.body.enrollmentType || "SELF",
        enrolledUserIds: req.body.enrolledUserIds || [],
        teacherIds: req.body.teacherIds || [],
    };
    const course = await course_service_1.default.createCourse(data);
    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma_1.default.auditLog.create({
        data: {
            actorName,
            action: "Course Published",
            detail: `Published '${course?.title || "Course"}'`,
            type: "course",
            ipAddress: req.ip || "Internal",
        },
    });
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(course), "Course created successfully", 201);
});
// PUT /api/courses/:id
exports.updateCourse = (0, asyncHandler_1.default)(async (req, res) => {
    const id = BigInt(req.params.id);
    const data = { ...req.body };
    if (data.categoryId)
        data.categoryId = BigInt(data.categoryId);
    if (data.departmentId)
        data.departmentId = BigInt(data.departmentId);
    const course = await course_service_1.default.updateCourse(id, data);
    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma_1.default.auditLog.create({
        data: {
            actorName,
            action: "Course Updated",
            detail: `Updated course '${course?.title || "Course"}'`,
            type: "course",
            ipAddress: req.ip || "Internal",
        },
    });
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(course), "Course updated successfully");
});
// DELETE /api/courses/:id
exports.deleteCourse = (0, asyncHandler_1.default)(async (req, res) => {
    const id = BigInt(req.params.id);
    const existingCourse = await course_service_1.default.getCourseById(id);
    await course_service_1.default.deleteCourse(id);
    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma_1.default.auditLog.create({
        data: {
            actorName,
            action: "Course Deleted",
            detail: `Deleted course '${existingCourse?.title || id}'`,
            type: "course",
            ipAddress: req.ip || "Internal",
        },
    });
    return (0, response_1.successResponse)(res, null, "Course deleted successfully");
});
// POST /api/courses/:id/sections
exports.createSection = (0, asyncHandler_1.default)(async (req, res) => {
    const courseId = BigInt(req.params.id);
    const section = await course_service_1.default.createSection({
        ...req.body,
        courseId,
    });
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(section), "Section created successfully", 201);
});
// PUT /api/courses/sections/:sectionId
exports.updateSection = (0, asyncHandler_1.default)(async (req, res) => {
    const sectionId = BigInt(req.params.sectionId);
    const section = await course_service_1.default.updateSection(sectionId, req.body);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(section), "Section updated successfully");
});
// DELETE /api/courses/sections/:sectionId
exports.deleteSection = (0, asyncHandler_1.default)(async (req, res) => {
    const sectionId = BigInt(req.params.sectionId);
    await course_service_1.default.deleteSection(sectionId);
    return (0, response_1.successResponse)(res, null, "Section deleted successfully");
});
// POST /api/courses/sections/:sectionId/contents
exports.createContent = (0, asyncHandler_1.default)(async (req, res) => {
    const sectionId = BigInt(req.params.sectionId);
    const content = await course_service_1.default.createContent({
        ...req.body,
        sectionId,
    });
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(content), "Content created successfully", 201);
});
// POST /api/courses/:id/enroll (Self Enrollment)
exports.selfEnrollCourse = (0, asyncHandler_1.default)(async (req, res) => {
    const courseId = BigInt(req.params.id);
    const userId = BigInt(req.user?.userId);
    const enrollment = await course_service_1.default.selfEnrollCourse(userId, courseId);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(enrollment), "Successfully enrolled in course");
});
// POST /api/courses/:id/admin-enroll (Single User Admin Enrollment)
exports.adminEnrollUser = (0, asyncHandler_1.default)(async (req, res) => {
    const courseId = BigInt(req.params.id);
    const { identifier } = req.body;
    if (!identifier) {
        return (0, response_1.errorResponse)(res, "Username or email is required", "BAD_REQUEST", 400);
    }
    const result = await course_service_1.default.adminEnrollUser(courseId, identifier);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), result.message);
});
// POST /api/courses/:id/bulk-enroll (Bulk Excel File Upload Enrollment)
exports.bulkEnrollUsers = (0, asyncHandler_1.default)(async (req, res) => {
    const courseId = BigInt(req.params.id);
    if (!req.file || !req.file.buffer) {
        return (0, response_1.errorResponse)(res, "Excel/CSV file is required for bulk enrolment", "BAD_REQUEST", 400);
    }
    const result = await course_service_1.default.bulkEnrollUsers(courseId, req.file.buffer);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), `Bulk enrolment complete. ${result.successCount} enrolled, ${result.failedCount} failed.`);
});
// POST /api/courses/verify-user (Pre-enrollment single user verification)
exports.verifyUser = (0, asyncHandler_1.default)(async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
        return (0, response_1.errorResponse)(res, "Username or email is required", "BAD_REQUEST", 400);
    }
    const result = await course_service_1.default.verifyUser(identifier);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), `User '${result.name}' verified successfully in database.`);
});
// POST /api/courses/verify-bulk-file (Pre-enrollment bulk Excel verification)
exports.verifyBulkFile = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return (0, response_1.errorResponse)(res, "Excel/CSV file is required for verification", "BAD_REQUEST", 400);
    }
    const result = await course_service_1.default.verifyBulkFile(req.file.buffer);
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(result), `Verification complete. ${result.successCount} valid employees found, ${result.failedCount} invalid.`);
});
