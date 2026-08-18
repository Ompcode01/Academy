import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import prisma from "../../config/prisma";
import asyncHandler from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { serializeBigInt } from "../../utils/prismaSerializer";

const router = Router();

// GET /api/categories — accessible to all authenticated users
router.get(
  "/",
  authenticate,
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    return successResponse(res, serializeBigInt(categories), "Categories fetched successfully");
  })
);

// POST /api/categories — restricted to TEACHER, ADMIN, SUPER_ADMIN
router.post(
  "/",
  authenticate,
  authorizeRoles("TEACHER", "ADMIN", "SUPER_ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const category = await prisma.category.create({
      data: { name, description },
    });
    return successResponse(
      res,
      serializeBigInt(category),
      "Category created successfully",
      201
    );
  })
);

export default router;
