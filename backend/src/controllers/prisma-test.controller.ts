import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import prisma from "../config/prisma";
import { successResponse } from "../utils/response";
import { serializeBigInt } from "../utils/prismaSerializer";

export const testPrismaConnection = asyncHandler(
  async (req: Request, res: Response) => {
    const departments = await prisma.department.findMany();

    return successResponse(
      res,
      serializeBigInt(departments),
      "Prisma connected successfully"
    );
  }
);