import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import prisma from "../config/prisma";

export const authorizeRoles =
  (...allowedRoles: string[]) =>
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {

    try {

      const employeeId = BigInt(req.user.employeeId);

      const userRoles = await prisma.userRole.findMany({

        where: {

          employeeId,
          isActive: true,

        },

        include: {

          role: true,

        },

      });

      const roleCodes = userRoles.map(
        (r) => r.role.roleCode
      );

      const hasRole = allowedRoles.some(
        (role) => roleCodes.includes(role)
      );

      if (!hasRole) {

        res.status(403).json({

          success: false,
          message: "Access Denied",

        });

        return;
      }

      next();

    } catch (error) {

      res.status(500).json({

        success: false,
        message: "Authorization Failed",

      });

    }

  };