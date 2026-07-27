"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartments = exports.createDepartment = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createDepartment = async ({ departmentCode, departmentName, }) => {
    return prisma_1.default.department.create({
        data: {
            departmentCode,
            departmentName,
            isActive: true,
        },
    });
};
exports.createDepartment = createDepartment;
const getDepartments = async () => {
    return prisma_1.default.department.findMany({
        orderBy: {
            id: "asc",
        },
    });
};
exports.getDepartments = getDepartments;
