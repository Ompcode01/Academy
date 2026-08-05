"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizePermissions = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const authorizePermissions = (...permissions) => async (req, res, next) => {
    try {
        const employeeId = BigInt(req.user.employeeId);
        const userRoles = await prisma_1.default.userRole.findMany({
            where: {
                employeeId,
                isActive: true,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
        const userPermissions = userRoles.flatMap((role) => role.role.rolePermissions.map((rp) => rp.permission.permissionCode));
        const hasPermission = permissions.every((permission) => userPermissions.includes(permission));
        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message: "Permission Denied",
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Permission Check Failed",
        });
    }
};
exports.authorizePermissions = authorizePermissions;
