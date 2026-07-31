import { Request, Response } from "express";
import * as userRoleService from "../services/userRole.service";
import { serialize } from "../utils/serializer";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const assignRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {

  try {

    const callerRole = req.user?.role;
    const targetRoleId = BigInt(req.body.roleId);

    // Look up the target role to check its roleCode
    const targetRole = await prisma.role.findUnique({
      where: { id: targetRoleId },
    });

    if (!targetRole) {
      res.status(404).json({
        success: false,
        message: "Target role not found",
      });
      return;
    }

    // Admins cannot assign SUPER_ADMIN role
    if (callerRole !== "SUPER_ADMIN" && targetRole.roleCode === "SUPER_ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only Super Admins can assign the Super Admin role",
      });
      return;
    }

    // Admins cannot assign ADMIN role either — only Super Admin can
    if (callerRole !== "SUPER_ADMIN" && targetRole.roleCode === "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only Super Admins can assign the Admin role",
      });
      return;
    }

    const userRole =
      await userRoleService.assignRole({

        employeeId: BigInt(req.body.employeeId),
        roleId: targetRoleId,
        assignedBy: BigInt(req.user.employeeId),

      });

    res.status(201).json({

      success: true,
      message: "Role Assigned Successfully",
      data: serialize(userRole),

    });

  } catch (error: any) {

    console.error(error);

    res.status(500).json({

      success: false,
      message: error.message,

    });

  }

};

export const getUserRoles = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const data =
      await userRoleService.getUserRoles();

    res.status(200).json({

      success: true,
      data: serialize(data),

    });

  } catch (error: any) {

    res.status(500).json({

      success: false,
      message: error.message,

    });

  }

};

export const getUserRoleById = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const data =
      await userRoleService.getUserRoleById(
        BigInt(String(req.params.id))
      );

    res.status(200).json({

      success: true,
      data: serialize(data),

    });

  } catch (error: any) {

    res.status(500).json({

      success: false,
      message: error.message,

    });

  }

};

export const deleteUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    await userRoleService.deleteUserRole(
      BigInt(String(req.params.id))
    );

    res.status(200).json({

      success: true,
      message: "User Role Deleted Successfully",

    });

  } catch (error: any) {

    res.status(500).json({

      success: false,
      message: error.message,

    });

  }

};