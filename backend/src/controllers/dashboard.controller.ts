import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import asyncHandler from "../utils/asyncHandler";
import { successResponse } from "../utils/response";
import * as dashboardService from "../services/dashboard.service";

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userContext = {
    role: req.user?.role || "GUEST",
    employeeId: req.user?.employeeId || "",
    departmentId: req.user?.departmentId || "",
  };

  const stats = await dashboardService.getDashboardStats(userContext);
  return successResponse(res, stats, "Dashboard stats fetched successfully");
});
