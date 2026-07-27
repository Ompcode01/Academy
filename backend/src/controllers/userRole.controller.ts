import { Request, Response } from "express";
import * as userRoleService from "../services/userRole.service";
import { serialize } from "../utils/serializer";

export const assignRole = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const userRole =
      await userRoleService.assignRole({

        employeeId: BigInt(req.body.employeeId),
        roleId: BigInt(req.body.roleId),
        assignedBy: BigInt(req.body.assignedBy),

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