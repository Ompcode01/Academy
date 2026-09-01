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

      const allowedUpper = allowedRoles.map((r) => r.toUpperCase());

      // Fast-path: Check role directly from JWT payload
      const tokenRole = req.user.role ? req.user.role.toUpperCase() : "";
      if (
        tokenRole &&
        (allowedUpper.includes(tokenRole) ||
          (tokenRole === "INSTRUCTOR" && allowedUpper.includes("TEACHER")))
      ) {
        return next();
      }

      // Fallback: Query database user_roles
      const empIdRaw = req.user.employeeId || req.user.userId || req.user.id;
      if (empIdRaw) {
        let employeeId: bigint | null = null;
        try {
          const str = String(empIdRaw).trim();
          if (str && !isNaN(Number(str))) {
            employeeId = BigInt(str);
          }
        } catch (_) {}

        if (employeeId !== null) {
          const userRoles = await prisma.userRole.findMany({
            where: { employeeId, isActive: true },
            include: { role: true },
          });

          const roleCodesUpper = userRoles.map((r) => r.role.roleCode.toUpperCase());
          const hasRole = allowedUpper.some(
            (allowed) =>
              roleCodesUpper.includes(allowed) ||
              (allowed === "TEACHER" && roleCodesUpper.includes("INSTRUCTOR"))
          );

          if (hasRole) {
            return next();
          }
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