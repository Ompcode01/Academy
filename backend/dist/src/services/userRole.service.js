"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserRole = exports.getUserRoleById = exports.getUserRoles = exports.assignRole = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const assignRole = async (data) => {
    return prisma_1.default.userRole.create({
        data: {
            employeeId: data.employeeId,
            roleId: data.roleId,
            assignedBy: data.assignedBy,
            assignedAt: new Date(),
            isActive: true,
        },
        include: {
            employee: true,
            role: true,
        },
    });
};
exports.assignRole = assignRole;
const getUserRoles = async () => {
    return prisma_1.default.userRole.findMany({
        include: {
            employee: true,
            role: true,
        },
        orderBy: {
            id: "asc",
        },
    });
};
exports.getUserRoles = getUserRoles;
const getUserRoleById = async (id) => {
    return prisma_1.default.userRole.findUnique({
        where: {
            id,
        },
        include: {
            employee: true,
            role: true,
        },
    });
};
exports.getUserRoleById = getUserRoleById;
const deleteUserRole = async (id) => {
    return prisma_1.default.userRole.delete({
        where: {
            id,
        },
    });
};
exports.deleteUserRole = deleteUserRole;
