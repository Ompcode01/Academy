import { Request, Response } from "express";
import * as employeeService from "../services/employee.service";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/prisma";

const serialize = (obj: any) =>
  JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await employeeService.createEmployee({
      employeeCode: req.body.employeeCode,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      officialEmail: req.body.officialEmail,
      phoneNumber: req.body.phoneNumber,
      designation: req.body.designation,
      departmentId: BigInt(req.body.departmentId),
      managerId: req.body.managerId
        ? BigInt(req.body.managerId)
        : undefined,
      joiningDate: new Date(req.body.joiningDate),
      profileImage: req.body.profileImage,
    });

    res.status(201).json({
      success: true,
      data: serialize(employee),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to create employee",
    });
  }
};

export const getEmployees = async (
  req: Request,
  res: Response
) => {
  try {
    const employees = await employeeService.getEmployees();

    res.json({
      success: true,
      data: serialize(employees),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getEmployeeById = async (
  req: Request,
  res: Response
) => {
  try {
    const employee =
      await employeeService.getEmployeeById(
        BigInt(String(req.params.id))
      );

    res.json({
      success: true,
      data: serialize(employee),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const updateEmployee = async (
  req: Request,
  res: Response
) => {
  try {
    const employee =
      await employeeService.updateEmployee(
        BigInt(String(req.params.id)),
        req.body
      );

    res.json({
      success: true,
      data: serialize(employee),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const deleteEmployee = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const callerRole = req.user?.role;
    const targetId = BigInt(String(req.params.id));

    // Check if the target employee holds an ADMIN or SUPER_ADMIN role
    const targetRoles = await prisma.userRole.findMany({
      where: { employeeId: targetId, isActive: true },
      include: { role: true },
    });

    const targetRoleCodes = targetRoles.map((r) => r.role.roleCode);
    const targetIsSuperAdmin = targetRoleCodes.includes("SUPER_ADMIN");

    // Super Admin protection: Super Admin accounts cannot be deleted by anyone
    if (targetIsSuperAdmin) {
      res.status(403).json({
        success: false,
        message: "The SuperAdmin account cannot be deleted.",
      });
      return;
    }

    const targetIsAdmin = targetRoleCodes.includes("ADMIN");

    // Only SUPER_ADMIN can delete admin-level employees
    if (targetIsAdmin && callerRole !== "SUPER_ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only Super Admins can delete admin-level employees",
      });
      return;
    }

    const targetEmployee = await prisma.employee.findUnique({ where: { id: targetId } });
    await employeeService.deleteEmployee(targetId);

    // Audit Log for Soft Delete
    const actorName = req.user
      ? `${req.user.username} (${req.user.role || 'USER'})`
      : "System Admin";
    const targetName = targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : `Employee #${targetId}`;

    await prisma.auditLog.create({
      data: {
        actorName,
        action: "User Soft Deleted",
        detail: `Soft-deleted user '${targetName}' (${targetEmployee?.employeeCode || targetId})`,
        type: "user",
        ipAddress: req.ip || "Internal",
      },
    });

    res.json({
      success: true,
      message: "Employee deleted successfully (Soft Deleted)",
    });
  } catch (error: any) {
    console.error("Error in deleteEmployee:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const restoreEmployee = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const callerRole = req.user?.role;
    const targetId = BigInt(String(req.params.id));

    if (callerRole !== "SUPER_ADMIN" && callerRole !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Forbidden: Only Admins can restore deleted users.",
      });
      return;
    }

    const targetEmployee = await prisma.employee.findUnique({ where: { id: targetId } });
    await employeeService.restoreEmployee(targetId);

    // Audit Log for Restore
    const actorName = req.user
      ? `${req.user.username} (${req.user.role || 'USER'})`
      : "System Admin";
    const targetName = targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : `Employee #${targetId}`;

    await prisma.auditLog.create({
      data: {
        actorName,
        action: "User Restored",
        detail: `Restored soft-deleted user '${targetName}' (${targetEmployee?.employeeCode || targetId})`,
        type: "user",
        ipAddress: req.ip || "Internal",
      },
    });

    res.json({
      success: true,
      message: "Employee restored successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};