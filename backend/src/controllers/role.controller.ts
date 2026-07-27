import { Request, Response } from "express";
import * as roleService from "../services/role.service";
import { serialize } from "../utils/serializer";

export const createRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const role = await roleService.createRole({
      roleName: req.body.roleName,
      roleCode: req.body.roleCode,
      description: req.body.description,
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: serialize(role),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRoles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const roles = await roleService.getRoles();

    res.status(200).json({
      success: true,
      data: serialize(roles),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRoleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const role = await roleService.getRoleById(
      BigInt(String(req.params.id))
    );

    res.status(200).json({
      success: true,
      data: serialize(role),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const role = await roleService.updateRole(
      BigInt(String(req.params.id)),
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: serialize(role),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await roleService.deleteRole(BigInt(String(req.params.id)));

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};