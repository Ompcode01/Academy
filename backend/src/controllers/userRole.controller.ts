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

    // Record Audit Log for Role Assignment
    const actorName = req.user
      ? `${req.user.username} (${req.user.role || 'USER'})`
      : "System Admin";
    const employee = await prisma.employee.findUnique({
      where: { id: BigInt(req.body.employeeId) },
    });
    const targetEmployeeName = employee
      ? `${employee.firstName} ${employee.lastName}`
      : `Employee #${req.body.employeeId}`;

    await prisma.auditLog.create({
      data: {
        actorName,
        action: "Role Assignment",
        detail: `Assigned ${targetRole.roleCode} role to ${targetEmployeeName}`,
        type: "role",
        ipAddress: req.ip || "Internal",
      },
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

    const id = BigInt(String(req.params.id));
    const existingUserRole = await userRoleService.getUserRoleById(id);

    await userRoleService.deleteUserRole(id);

    // Record Audit Log
    const authReq = req as AuthRequest;
    const actorName = authReq.user
      ? `${authReq.user.username} (${authReq.user.role || 'USER'})`
      : "System Admin";

    const detail = existingUserRole
      ? `Removed role '${existingUserRole.role.roleCode}' from ${existingUserRole.employee.firstName} ${existingUserRole.employee.lastName}`
      : `Deleted user role assignment #${id}`;

    await prisma.auditLog.create({
      data: {
        actorName,
        action: "Role Assignment",
        detail,
        type: "role",
        ipAddress: req.ip || "Internal",
      },
    });

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