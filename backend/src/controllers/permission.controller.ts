import { Request, Response } from "express";
import * as permissionService from "../services/permission.service";
import { serialize } from "../utils/serializer";

export const createPermission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const permission =
      await permissionService.createPermission({
        permissionName: req.body.permissionName,
        permissionCode: req.body.permissionCode,
        moduleName: req.body.moduleName,
        description: req.body.description,
      });

    res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: serialize(permission),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPermissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const permissions =
      await permissionService.getPermissions();

    res.status(200).json({
      success: true,
      data: serialize(permissions),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPermissionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const permission =
      await permissionService.getPermissionById(
        BigInt(String(req.params.id))
      );

    res.status(200).json({
      success: true,
      data: serialize(permission),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePermission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const permission =
      await permissionService.updatePermission(
        BigInt(String(req.params.id)),
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: serialize(permission),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePermission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await permissionService.deletePermission(
      BigInt(String(req.params.id))
    );

    res.status(200).json({
      success: true,
      message: "Permission deleted successfully",
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};