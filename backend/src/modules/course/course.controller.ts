import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import asyncHandler from "../../utils/asyncHandler";
import { successResponse, errorResponse } from "../../utils/response";
import courseService from "./course.service";
import { serializeBigInt } from "../../utils/prismaSerializer";
import prisma from "../../config/prisma";

// GET /api/courses
export const getCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, categoryId, isPublished, status, departmentId, page, limit } = req.query;

  const userContext = {
    role: req.user?.role || "GUEST",
    employeeId: req.user?.employeeId ? BigInt(req.user.employeeId) : undefined,
    departmentId: req.user?.departmentId ? BigInt(req.user.departmentId) : undefined,
  };

  const filters = {
    search: search as string | undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    status: status as string | undefined,
    departmentId: departmentId ? BigInt(departmentId as string) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  };

  const result = await courseService.getAllCourses(filters, userContext);
  return successResponse(res, serializeBigInt(result), "Courses fetched successfully");
});

// GET /api/courses/:id
export const getCourseById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = BigInt(req.params.id as string);
    const course = await courseService.getCourseById(id);
    return successResponse(res, serializeBigInt(course), "Course fetched successfully");
  }
);

// POST /api/courses
export const createCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userRole = req.user?.role || "LEARNER";
    const userEmployeeId = BigInt(req.user?.employeeId as string);
    const userDepartmentId = req.user?.departmentId ? BigInt(req.user.departmentId as string) : null;

    let departmentId: bigint | null = null;

    // Rule: ADMIN (and TEACHER) department must be fixed to their assigned department
    if (userRole === "ADMIN" || userRole === "TEACHER") {
      departmentId = userDepartmentId;
    } else if (userRole === "SUPER_ADMIN") {
      // SUPER_ADMIN can pick a specific department OR select "ALL" / global (null)
      if (
        req.body.departmentId !== undefined &&
        req.body.departmentId !== null &&
        req.body.departmentId !== "global" &&
        req.body.departmentId !== "ALL" &&
        req.body.departmentId !== ""
      ) {
        departmentId = BigInt(req.body.departmentId);
      } else {
        departmentId = null;
      }
    } else {
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

    const course = await courseService.createCourse(data);

    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma.auditLog.create({
      data: {
        actorName,
        action: "Course Published",
        detail: `Published '${course.title}'`,
        type: "course",
        ipAddress: req.ip || "Internal",
      },
    });

    return successResponse(res, serializeBigInt(course), "Course created successfully", 201);
  }
);

// PUT /api/courses/:id
export const updateCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = BigInt(req.params.id as string);
    const data = { ...req.body };
    if (data.categoryId) data.categoryId = BigInt(data.categoryId);
    if (data.departmentId) data.departmentId = BigInt(data.departmentId);
    const course = await courseService.updateCourse(id, data);

    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma.auditLog.create({
      data: {
        actorName,
        action: "Course Updated",
        detail: `Updated course '${course.title}'`,
        type: "course",
        ipAddress: req.ip || "Internal",
      },
    });

    return successResponse(res, serializeBigInt(course), "Course updated successfully");
  }
);

// DELETE /api/courses/:id
export const deleteCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = BigInt(req.params.id as string);
    const existingCourse = await courseService.getCourseById(id);
    await courseService.deleteCourse(id);

    // Audit Log
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    await prisma.auditLog.create({
      data: {
        actorName,
        action: "Course Deleted",
        detail: `Deleted course '${existingCourse?.title || id}'`,
        type: "course",
        ipAddress: req.ip || "Internal",
      },
    });

    return successResponse(res, null, "Course deleted successfully");
  }
);

// POST /api/courses/:id/sections
export const createSection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const courseId = BigInt(req.params.id as string);
    const section = await courseService.createSection({
      ...req.body,
      courseId,
    });
    return successResponse(res, serializeBigInt(section), "Section created successfully", 201);
  }
);

// PUT /api/courses/sections/:sectionId
export const updateSection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sectionId = BigInt(req.params.sectionId as string);
    const section = await courseService.updateSection(sectionId, req.body);
    return successResponse(res, serializeBigInt(section), "Section updated successfully");
  }
);

// DELETE /api/courses/sections/:sectionId
export const deleteSection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sectionId = BigInt(req.params.sectionId as string);
    await courseService.deleteSection(sectionId);
    return successResponse(res, null, "Section deleted successfully");
  }
);

// POST /api/courses/sections/:sectionId/contents
export const createContent = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sectionId = BigInt(req.params.sectionId as string);
    const content = await courseService.createContent({
      ...req.body,
      sectionId,
    });
    return successResponse(res, serializeBigInt(content), "Content created successfully", 201);
  }
);

// POST /api/courses/:id/enroll (Self Enrollment)
export const selfEnrollCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const courseId = BigInt(req.params.id as string);
    const userId = BigInt(req.user?.userId as string);
    const enrollment = await courseService.selfEnrollCourse(userId, courseId);
    return successResponse(res, serializeBigInt(enrollment), "Successfully enrolled in course");
  }
);

// POST /api/courses/:id/admin-enroll (Single User Admin Enrollment)
export const adminEnrollUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const courseId = BigInt(req.params.id as string);
    const { identifier } = req.body;
    if (!identifier) {
      return errorResponse(res, "Username or email is required", "BAD_REQUEST", 400);
    }
    const result = await courseService.adminEnrollUser(courseId, identifier);
    return successResponse(res, serializeBigInt(result), result.message);
  }
);

// POST /api/courses/:id/bulk-enroll (Bulk Excel File Upload Enrollment)
export const bulkEnrollUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const courseId = BigInt(req.params.id as string);
    if (!req.file || !req.file.buffer) {
      return errorResponse(res, "Excel/CSV file is required for bulk enrolment", "BAD_REQUEST", 400);
    }
    const result = await courseService.bulkEnrollUsers(courseId, req.file.buffer);
    return successResponse(
      res,
      serializeBigInt(result),
      `Bulk enrolment complete. ${result.successCount} enrolled, ${result.failedCount} failed.`
    );
  }
);

// POST /api/courses/verify-user (Pre-enrollment single user verification)
export const verifyUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { identifier } = req.body;
    if (!identifier) {
      return errorResponse(res, "Username or email is required", "BAD_REQUEST", 400);
    }
    const result = await courseService.verifyUser(identifier);
    return successResponse(res, serializeBigInt(result), `User '${result.name}' verified successfully in database.`);
  }
);

// POST /api/courses/verify-bulk-file (Pre-enrollment bulk Excel verification)
export const verifyBulkFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file || !req.file.buffer) {
      return errorResponse(res, "Excel/CSV file is required for verification", "BAD_REQUEST", 400);
    }
    const result = await courseService.verifyBulkFile(req.file.buffer);
    return successResponse(
      res,
      serializeBigInt(result),
      `Verification complete. ${result.successCount} valid employees found, ${result.failedCount} invalid.`
    );
  }
);