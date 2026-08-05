import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import prisma from "../config/prisma";

export const authorizeRoles =
  (...allowedRoles: string[]) =>
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Fast-path: Check role directly from JWT payload
      const tokenRole = req.user.role;
      if (tokenRole && allowedRoles.includes(tokenRole)) {
        return next();
      }

      // Fallback: Query database user_roles
      const empIdRaw = req.user.employeeId || req.user.userId || req.user.id;
      if (empIdRaw) {
        const employeeId = BigInt(empIdRaw);
        const userRoles = await prisma.userRole.findMany({
          where: { employeeId, isActive: true },
          include: { role: true },
        });

        const roleCodes = userRoles.map((r) => r.role.roleCode);
        const hasRole = allowedRoles.some((role) => roleCodes.includes(role));

        if (hasRole) {
          return next();
        }
      }

      res.status(403).json({
        success: false,
        message: "Access Denied: Required role missing",
      });
    } catch (error: any) {
      console.error("Authorization Middleware Error:", error);
      res.status(500).json({
        success: false,
        message: "Authorization Failed",
      });
    }
  };