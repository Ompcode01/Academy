"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserRole = exports.getUserRoleById = exports.getUserRoles = exports.assignRole = void 0;
const userRoleService = __importStar(require("../services/userRole.service"));
const serializer_1 = require("../utils/serializer");
const prisma_1 = __importDefault(require("../config/prisma"));
const assignRole = async (req, res) => {
    try {
        const callerRole = req.user?.role;
        const targetRoleId = BigInt(req.body.roleId);
        // Look up the target role to check its roleCode
        const targetRole = await prisma_1.default.role.findUnique({
            where: { id: targetRoleId },
        });
        if (!targetRole) {
            res.status(404).json({
                success: false,
                message: "Target role not found",
            });
            return;
        }
        // Admins cannot assign SUPER_ADMIN role
        if (callerRole !== "SUPER_ADMIN" && targetRole.roleCode === "SUPER_ADMIN") {
            res.status(403).json({
                success: false,
                message: "Only Super Admins can assign the Super Admin role",
            });
            return;
        }
        // Admins cannot assign ADMIN role either — only Super Admin can
        if (callerRole !== "SUPER_ADMIN" && targetRole.roleCode === "ADMIN") {
            res.status(403).json({
                success: false,
                message: "Only Super Admins can assign the Admin role",
            });
            return;
        }
        const userRole = await userRoleService.assignRole({
            employeeId: BigInt(req.body.employeeId),
            roleId: targetRoleId,
            assignedBy: BigInt(req.user.employeeId),
        });
        // Record Audit Log for Role Assignment
        const actorName = req.user
            ? `${req.user.username} (${req.user.role || 'USER'})`
            : "System Admin";
        const employee = await prisma_1.default.employee.findUnique({
            where: { id: BigInt(req.body.employeeId) },
        });
        const targetEmployeeName = employee
            ? `${employee.firstName} ${employee.lastName}`
            : `Employee #${req.body.employeeId}`;
        await prisma_1.default.auditLog.create({
            data: {
                actorName,
                action: "Role Assignment",
                detail: `Assigned ${targetRole.roleCode} role to ${targetEmployeeName}`,
                type: "role",
                ipAddress: req.ip || "Internal",
            },
        });
        res.status(201).json({
            success: true,
            message: "Role Assigned Successfully",
            data: (0, serializer_1.serialize)(userRole),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.assignRole = assignRole;
const getUserRoles = async (req, res) => {
    try {
        const data = await userRoleService.getUserRoles();
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(data),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getUserRoles = getUserRoles;
const getUserRoleById = async (req, res) => {
    try {
        const data = await userRoleService.getUserRoleById(BigInt(String(req.params.id)));
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(data),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getUserRoleById = getUserRoleById;
const deleteUserRole = async (req, res) => {
    try {
        const id = BigInt(String(req.params.id));
        const existingUserRole = await userRoleService.getUserRoleById(id);
        await userRoleService.deleteUserRole(id);
        // Record Audit Log
        const authReq = req;
        const actorName = authReq.user
            ? `${authReq.user.username} (${authReq.user.role || 'USER'})`
            : "System Admin";
        const detail = existingUserRole
            ? `Removed role '${existingUserRole.role.roleCode}' from ${existingUserRole.employee.firstName} ${existingUserRole.employee.lastName}`
            : `Deleted user role assignment #${id}`;
        await prisma_1.default.auditLog.create({
            data: {
                actorName,
                action: "Role Assignment",
                detail,
                type: "role",
                ipAddress: req.ip || "Internal",
            },
        });
        res.status(200).json({
            success: true,
            message: "User Role Deleted Successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.deleteUserRole = deleteUserRole;
