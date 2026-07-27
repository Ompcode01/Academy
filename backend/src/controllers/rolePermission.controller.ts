import { Request, Response } from "express";
import * as rolePermissionService from "../services/rolePermission.service";
import { serialize } from "../utils/serializer";

export const assignPermission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rolePermission =
      await rolePermissionService.assignPermission({
        roleId: BigInt(req.body.roleId),
        permissionId: BigInt(req.body.permissionId),
      });

    res.status(201).json({
      success: true,
      message: "Permission assigned successfully",
      data: serialize(rolePermission),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRolePermissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data =
      await rolePermissionService.getRolePermissions();

    res.status(200).json({
      success: true,
      data: serialize(data),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRolePermissionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data =
      await rolePermissionService.getRolePermissionById(
        BigInt(String(req.params.id))
      );

    res.status(200).json({
      success: true,
      data: serialize(data),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteRolePermission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await rolePermissionService.deleteRolePermission(
      BigInt(String(req.params.id))
    );

    res.status(200).json({
      success: true,
      message: "Role Permission deleted successfully",
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};