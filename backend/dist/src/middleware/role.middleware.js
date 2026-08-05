"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const authorizeRoles = (...allowedRoles) => async (req, res, next) => {
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
            const userRoles = await prisma_1.default.userRole.findMany({
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
    }
    catch (error) {
        console.error("Authorization Middleware Error:", error);
        res.status(500).json({
            success: false,
            message: "Authorization Failed",
        });
    }
};
exports.authorizeRoles = authorizeRoles;
