"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const login = async (data) => {
    const account = await prisma_1.default.userAccount.findUnique({
        where: {
            username: data.username,
        },
        include: {
            employee: {
                include: {
                    department: true,
                },
            },
        },
    });
    if (!account) {
        throw new Error("Invalid username or password");
    }
    if (!account.isActive) {
        throw new Error("Account is inactive");
    }
    const passwordMatched = await (0, password_1.comparePassword)(data.password, account.passwordHash);
    if (!passwordMatched) {
        throw new Error("Invalid username or password");
    }
    await prisma_1.default.userAccount.update({
        where: {
            id: account.id,
        },
        data: {
            lastLogin: new Date(),
            failedLoginAttempts: 0,
        },
    });
    const roles = await prisma_1.default.userRole.findMany({
        where: {
            employeeId: account.employeeId,
            isActive: true,
        },
        include: {
            role: true,
        },
    });
    const primaryRole = roles[0]?.role?.roleCode || "LEARNER";
    const token = (0, jwt_1.generateToken)({
        userId: account.id.toString(),
        employeeId: account.employeeId.toString(),
        username: account.username,
        role: primaryRole,
        departmentId: account.employee.departmentId.toString(),
    });
    // Record Audit Log for successful login
    const actorName = `${account.employee.firstName} ${account.employee.lastName} (${primaryRole})`;
    await prisma_1.default.auditLog.create({
        data: {
            actorName,
            action: "Login Success",
            detail: "Successfully authenticated to LMS Portal",
            type: "login",
            actorId: account.employeeId,
            ipAddress: "192.168.1.38",
        },
    });
    return {
        token,
        employee: account.employee,
        roles,
    };
};
exports.login = login;
