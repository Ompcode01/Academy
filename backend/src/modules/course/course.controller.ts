import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

export const getCourses = asyncHandler(
  async (_req: Request, res: Response) => {
    return successResponse(
      res,
      [],
      "Course module initialized successfully"
    );
  }
);