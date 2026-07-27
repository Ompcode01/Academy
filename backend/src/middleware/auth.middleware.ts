import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "lms_super_secret_key_2026";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {

      res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });

      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {

      res.status(401).json({
        success: false,
        message: "Invalid Authorization Header",
      });

      return;
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {

    res.status(401).json({
      success: false,
      message: "Invalid or Expired Token",
    });

  }

};