"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAccount = exports.getUserAccountById = exports.getUserAccounts = exports.createUserAccount = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const createUserAccount = async (data) => {
    const passwordHash = await bcrypt_1.default.hash(data.password, 10);
    return prisma_1.default.userAccount.create({
        data: {
            employeeId: data.employeeId,
            username: data.username,
            passwordHash,
            failedLoginAttempts: 0,
            accountLocked: false,
            isActive: true,
        },
        include: {
            employee: true,
        },
    });
};
exports.createUserAccount = createUserAccount;
const getUserAccounts = async () => {
    return prisma_1.default.userAccount.findMany({
        include: {
            employee: true,
        },
        orderBy: {
            id: "asc",
        },
    });
};
exports.getUserAccounts = getUserAccounts;
const getUserAccountById = async (id) => {
    return prisma_1.default.userAccount.findUnique({
        where: {
            id,
        },
        include: {
            employee: true,
        },
    });
};
exports.getUserAccountById = getUserAccountById;
const deleteUserAccount = async (id) => {
    return prisma_1.default.userAccount.delete({
        where: {
            id,
        },
    });
};
exports.deleteUserAccount = deleteUserAccount;
