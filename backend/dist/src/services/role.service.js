"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.getRoleById = exports.getRoles = exports.createRole = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createRole = async (data) => {
    return prisma_1.default.role.create({
        data: {
            roleName: data.roleName,
            roleCode: data.roleCode,
            description: data.description,
            isActive: true,
        },
    });
};
exports.createRole = createRole;
const getRoles = async () => {
    return prisma_1.default.role.findMany({
        orderBy: {
            id: "asc",
        },
    });
};
exports.getRoles = getRoles;
const getRoleById = async (id) => {
    return prisma_1.default.role.findUnique({
        where: {
            id,
        },
    });
};
exports.getRoleById = getRoleById;
const updateRole = async (id, data) => {
    return prisma_1.default.role.update({
        where: {
            id,
        },
        data,
    });
};
exports.updateRole = updateRole;
const deleteRole = async (id) => {
    return prisma_1.default.role.delete({
        where: {
            id,
        },
    });
};
exports.deleteRole = deleteRole;
