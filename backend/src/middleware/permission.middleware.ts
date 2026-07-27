import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "./auth.middleware";

export const authorizePermissions =
  (...permissions: string[]) =>
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

          role: {

            include: {

              rolePermissions: {

                include: {

                  permission: true,

                },

              },

            },

          },

        },

      });

      const userPermissions =
        userRoles.flatMap((role) =>
          role.role.rolePermissions.map(
            (rp) => rp.permission.permissionCode
          )
        );

      const hasPermission =
        permissions.every((permission) =>
          userPermissions.includes(permission)
        );

      if (!hasPermission) {

        res.status(403).json({

          success: false,
          message: "Permission Denied",

        });

        return;

      }

      next();

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,
        message: "Permission Check Failed",

      });

    }

  };