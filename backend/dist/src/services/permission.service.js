"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePermission = exports.updatePermission = exports.getPermissionById = exports.getPermissions = exports.createPermission = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createPermission = async (data) => {
    return prisma_1.default.permission.create({
        data: {
            permissionName: data.permissionName,
            permissionCode: data.permissionCode,
            moduleName: data.moduleName,
            description: data.description,
            isActive: true,
        },
    });
};
exports.createPermission = createPermission;
const getPermissions = async () => {
    return prisma_1.default.permission.findMany({
        orderBy: {
            id: "asc",
        },
    });
};
exports.getPermissions = getPermissions;
const getPermissionById = async (id) => {
    return prisma_1.default.permission.findUnique({
        where: {
            id,
        },
    });
};
exports.getPermissionById = getPermissionById;
const updatePermission = async (id, data) => {
    return prisma_1.default.permission.update({
        where: {
            id,
        },
        data,
    });
};
exports.updatePermission = updatePermission;
const deletePermission = async (id) => {
    return prisma_1.default.permission.delete({
        where: {
            id,
        },
    });
};
exports.deletePermission = deletePermission;
