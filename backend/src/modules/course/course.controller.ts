import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { successResponse, errorResponse } from "../../utils/response";
import courseService from "./course.service";

// GET /api/courses
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const { search, categoryId, isPublished, page, limit } = req.query;
  const filters = {
    search: search as string | undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    isPublished:
      isPublished !== undefined ? isPublished === "true" : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  };
  const result = await courseService.getAllCourses(filters);
  return successResponse(res, result, "Courses fetched successfully");
});

// GET /api/courses/:id
export const getCourseById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = BigInt(req.params.id);
    const course = await courseService.getCourseById(id);
    return successResponse(res, course, "Course fetched successfully");
  }
);

// POST /api/courses
export const createCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const data = {
      ...req.body,
      categoryId: BigInt(req.body.categoryId),
    };
    const course = await courseService.createCourse(data);
    return successResponse(res, course, "Course created successfully", 201);
  }
);

// PUT /api/courses/:id
export const updateCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const id = BigInt(req.params.id);
    const data = { ...req.body };
    if (data.categoryId) data.categoryId = BigInt(data.categoryId);
    const course = await courseService.updateCourse(id, data);
    return successResponse(res, course, "Course updated successfully");
  }
);

// DELETE /api/courses/:id
export const deleteCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const id = BigInt(req.params.id);
    await courseService.deleteCourse(id);
    return successResponse(res, null, "Course deleted successfully");
  }
);

// POST /api/courses/:id/sections
export const createSection = asyncHandler(
  async (req: Request, res: Response) => {
    const courseId = BigInt(req.params.id);
    const section = await courseService.createSection({
      ...req.body,
      courseId,
    });
    return successResponse(res, section, "Section created successfully", 201);
  }
);

// PUT /api/courses/sections/:sectionId
export const updateSection = asyncHandler(
  async (req: Request, res: Response) => {
    const sectionId = BigInt(req.params.sectionId);
    const section = await courseService.updateSection(sectionId, req.body);
    return successResponse(res, section, "Section updated successfully");
  }
);

// DELETE /api/courses/sections/:sectionId
export const deleteSection = asyncHandler(
  async (req: Request, res: Response) => {
    const sectionId = BigInt(req.params.sectionId);
    await courseService.deleteSection(sectionId);
    return successResponse(res, null, "Section deleted successfully");
  }
);

// POST /api/courses/sections/:sectionId/contents
export const createContent = asyncHandler(
  async (req: Request, res: Response) => {
    const sectionId = BigInt(req.params.sectionId);
    const content = await courseService.createContent({
      ...req.body,
      sectionId,
    });
    return successResponse(res, content, "Content created successfully", 201);
  }
);