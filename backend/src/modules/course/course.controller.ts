import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import asyncHandler from "../../utils/asyncHandler";
import { successResponse, errorResponse } from "../../utils/response";
import courseService from "./course.service";
import { serializeBigInt } from "../../utils/prismaSerializer";

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
    const id = BigInt(req.params.id);
    const course = await courseService.getCourseById(id);
    return successResponse(res, serializeBigInt(course), "Course fetched successfully");
  }
);

// POST /api/courses
export const createCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userRole = req.user?.role || "LEARNER";
    const userEmployeeId = BigInt(req.user?.employeeId);
    const userDepartmentId = BigInt(req.user?.departmentId);

    // Auto-set creatorId from JWT
    const data = {
      ...req.body,
      categoryId: BigInt(req.body.categoryId),
      creatorId: userEmployeeId,
      // Teachers always get their own department; Admin/SuperAdmin can specify
      departmentId: userRole === "TEACHER"
        ? userDepartmentId
        : req.body.departmentId
          ? BigInt(req.body.departmentId)
          : userDepartmentId,
    };

    const course = await courseService.createCourse(data);
    return successResponse(res, serializeBigInt(course), "Course created successfully", 201);
  }
);

// PUT /api/courses/:id
export const updateCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = BigInt(req.params.id);
    const data = { ...req.body };
    if (data.categoryId) data.categoryId = BigInt(data.categoryId);
    if (data.departmentId) data.departmentId = BigInt(data.departmentId);
    const course = await courseService.updateCourse(id, data);
    return successResponse(res, serializeBigInt(course), "Course updated successfully");
  }
);

// DELETE /api/courses/:id
export const deleteCourse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = BigInt(req.params.id);
    await courseService.deleteCourse(id);
    return successResponse(res, null, "Course deleted successfully");
  }
);

// POST /api/courses/:id/sections
export const createSection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const courseId = BigInt(req.params.id);
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
    const sectionId = BigInt(req.params.sectionId);
    const section = await courseService.updateSection(sectionId, req.body);
    return successResponse(res, serializeBigInt(section), "Section updated successfully");
  }
);

// DELETE /api/courses/sections/:sectionId
export const deleteSection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sectionId = BigInt(req.params.sectionId);
    await courseService.deleteSection(sectionId);
    return successResponse(res, null, "Section deleted successfully");
  }
);

// POST /api/courses/sections/:sectionId/contents
export const createContent = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const sectionId = BigInt(req.params.sectionId);
    const content = await courseService.createContent({
      ...req.body,
      sectionId,
    });
    return successResponse(res, serializeBigInt(content), "Content created successfully", 201);
  }
);