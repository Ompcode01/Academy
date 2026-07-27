import { Request, Response } from "express";
import prisma from "../config/prisma";
import asyncHandler from "../utils/asyncHandler";
import { successResponse } from "../utils/response";

export const healthCheck = asyncHandler(
  async (_req: Request, res: Response) => {

    await prisma.$queryRaw`SELECT 1`;

    return successResponse(
      res,
      {
        server: "Running",
        database: "Connected",
      },
      "Application is healthy"
    );
  }
);