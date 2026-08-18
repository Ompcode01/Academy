import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import searchService from "../services/search.service";

export const globalSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queryStr = (req.query.q as string) || "";
    const category = (req.query.category as string) || "all";
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const userContext = req.user
      ? {
          role: req.user.role || "GUEST",
          employeeId: req.user.employeeId ? BigInt(req.user.employeeId) : undefined,
          departmentId: req.user.departmentId ? BigInt(req.user.departmentId) : undefined,
        }
      : undefined;

    const results = await searchService.globalSearch(
      {
        q: queryStr,
        category,
        limit,
      },
      userContext
    );

    res.status(200).json({
      success: true,
      data: results,
      userRole: userContext?.role || "GUEST",
      allowedCategories: results.allowedCategories,
    });
  } catch (error: any) {
    console.error("Global search controller error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while executing global search",
    });
  }
};
