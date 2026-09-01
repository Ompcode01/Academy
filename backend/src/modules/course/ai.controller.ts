import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import asyncHandler from "../../utils/asyncHandler";
import { successResponse, errorResponse } from "../../utils/response";
import { aiCourseService } from "./ai.service";

// POST /api/courses/:id/chat
export const handleCourseChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { question, history } = req.body;

  if (!rawId || isNaN(Number(rawId))) {
    return errorResponse(res, "Invalid course ID", "BAD_REQUEST", 400);
  }

  if (!question || typeof question !== "string" || question.trim() === "") {
    return errorResponse(res, "Question is required", "BAD_REQUEST", 400);
  }

  const courseId = BigInt(rawId);
  const result = await aiCourseService.processCourseChat(courseId, question.trim(), history || []);

  return successResponse(res, result, "AI response generated successfully");
});
