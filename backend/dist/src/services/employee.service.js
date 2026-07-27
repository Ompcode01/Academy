"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.getEmployeeById = exports.getEmployees = exports.createEmployee = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createEmployee = async (data) => {
    return prisma_1.default.employee.create({
        data: {
            ...data,
            employmentStatus: "ACTIVE",
        },
        include: {
            department: true,
        },
    });
};
exports.createEmployee = createEmployee;
const getEmployees = async () => {
    return prisma_1.default.employee.findMany({
        include: {
            department: true,
            manager: true,
        },
        orderBy: {
            id: "asc",
        },
    });
};
exports.getEmployees = getEmployees;
const getEmployeeById = async (id) => {
    return prisma_1.default.employee.findUnique({
        where: { id },
        include: {
            department: true,
            manager: true,
        },
    });
};
exports.getEmployeeById = getEmployeeById;
const updateEmployee = async (id, data) => {
    return prisma_1.default.employee.update({
        where: { id },
        data,
    });
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (id) => {
    return prisma_1.default.employee.delete({
        where: { id },
    });
};
exports.deleteEmployee = deleteEmployee;
