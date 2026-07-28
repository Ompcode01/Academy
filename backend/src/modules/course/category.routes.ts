import { Router, Request, Response } from "express";
import prisma from "../../config/prisma";
import asyncHandler from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

const router = Router();

// GET /api/categories
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return successResponse(res, categories, "Categories fetched successfully");
  })
);

// POST /api/categories
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const category = await prisma.category.create({
      data: { name, description },
    });
    return successResponse(
      res,
      category,
      "Category created successfully",
      201
    );
  })
);

export default router;
