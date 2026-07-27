import { Request, Response } from "express";
import * as userAccountService from "../services/userAccount.service";
import { serialize } from "../utils/serializer";

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

    await userAccountService.deleteUserAccount(
      BigInt(String(req.params.id))
    );

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