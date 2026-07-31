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
    const targetIsAdmin = targetRoleCodes.includes("ADMIN") || targetRoleCodes.includes("SUPER_ADMIN");

    // Only SUPER_ADMIN can delete admin-level employees
    if (targetIsAdmin && callerRole !== "SUPER_ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only Super Admins can delete admin-level employees",
      });
      return;
    }

    await employeeService.deleteEmployee(targetId);

    res.json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};