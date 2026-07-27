import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { serialize } from "../utils/serializer";

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const result = await authService.login({

      username: req.body.username,
      password: req.body.password,

    });

    res.status(200).json({

      success: true,
      message: "Login Successful",
      data: serialize(result),

    });

  } catch (error: any) {

    console.error(error);

    res.status(401).json({

      success: false,
      message: error.message,

    });

  }

};