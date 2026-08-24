import { Request, Response } from "express";
import * as userAccountService from "../services/userAccount.service";
import { serialize } from "../utils/serializer";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const createUserAccount = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const account =
      await userAccountService.createUserAccount({

        employeeId: BigInt(req.body.employeeId),
        username: req.body.username,
        password: req.body.password,

      });

    // Record Audit Log
    const authReq = req as AuthRequest;
    const actorName = authReq.user
      ? `${authReq.user.username} (${authReq.user.role || 'USER'})`
      : "System Admin";

    await prisma.auditLog.create({
      data: {
        actorName,
        action: "Account Created",
        detail: `Created user account '${account.username}'`,
        type: "user",
        ipAddress: req.ip || "Internal",
      },
    });

    res.status(201).json({

      success: true,
      message: "User Account Created Successfully",
      data: serialize(account),

    });

  } catch (error: any) {

    console.error(error);

    res.status(500).json({

      success: false,
      message: error.message,

    });

  }

};

export const getUserAccounts = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const accounts =
      await userAccountService.getUserAccounts();

    res.status(200).json({

      success: true,
      data: serialize(accounts),

    });

  } catch (error: any) {

    console.error(error);

    res.status(500).json({

      success: false,
      message: error.message,

    });

  }

};

export const getUserAccountById = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const account =
      await userAccountService.getUserAccountById(
        BigInt(String(req.params.id))
      );

    res.status(200).json({

      success: true,
      data: serialize(account),

    });

  } catch (error: any) {

    res.status(500).json({

      success: false,
      message: error.message,

    });

  }

};

export const deleteUserAccount = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const id = BigInt(String(req.params.id));
    const existingAccount = await userAccountService.getUserAccountById(id);

    if (existingAccount) {
      const userRoles = await prisma.userRole.findMany({
        where: { employeeId: existingAccount.employeeId, isActive: true },
        include: { role: true },
      });
      const isSuperAdmin = userRoles.some((ur) => ur.role.roleCode === "SUPER_ADMIN");
      if (isSuperAdmin) {
        res.status(403).json({
          success: false,
          message: "The SuperAdmin user account cannot be deleted.",
        });
        return;
      }
    }

    await userAccountService.deleteUserAccount(id);

    // Record Audit Log
    const authReq = req as AuthRequest;
    const actorName = authReq.user
      ? `${authReq.user.username} (${authReq.user.role || 'USER'})`
      : "System Admin";

    await prisma.auditLog.create({
      data: {
        actorName,
        action: "Account Deleted",
        detail: `Deleted user account '${existingAccount?.username || id}'`,
        type: "user",
        ipAddress: req.ip || "Internal",
      },
    });

    res.status(200).json({

      success: true,
      message: "User Account Deleted Successfully",

    });

  } catch (error: any) {

    res.status(500).json({

      success: false,
      message: error.message,

    });

  }

};