"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRolePermission = exports.getRolePermissionById = exports.getRolePermissions = exports.assignPermission = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const assignPermission = async (data) => {
    return prisma_1.default.rolePermission.create({
        data: {
            roleId: data.roleId,
            permissionId: data.permissionId,
        },
        include: {
            role: true,
            permission: true,
        },
    });
};
exports.assignPermission = assignPermission;
const getRolePermissions = async () => {
    return prisma_1.default.rolePermission.findMany({
        include: {
            role: true,
            permission: true,
        },
        orderBy: {
            id: "asc",
        },
    });
};
exports.getRolePermissions = getRolePermissions;
const getRolePermissionById = async (id) => {
    return prisma_1.default.rolePermission.findUnique({
        where: { id },
        include: {
            role: true,
            permission: true,
        },
    });
};
exports.getRolePermissionById = getRolePermissionById;
const deleteRolePermission = async (id) => {
    return prisma_1.default.rolePermission.delete({
        where: { id },
    });
};
exports.deleteRolePermission = deleteRolePermission;
