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
exports.deleteUserAccount = exports.getUserAccountById = exports.getUserAccounts = exports.createUserAccount = void 0;
const userAccountService = __importStar(require("../services/userAccount.service"));
const serializer_1 = require("../utils/serializer");
const prisma_1 = __importDefault(require("../config/prisma"));
const createUserAccount = async (req, res) => {
    try {
        const account = await userAccountService.createUserAccount({
            employeeId: BigInt(req.body.employeeId),
            username: req.body.username,
            password: req.body.password,
        });
        // Record Audit Log
        const authReq = req;
        const actorName = authReq.user
            ? `${authReq.user.username} (${authReq.user.role || 'USER'})`
            : "System Admin";
        await prisma_1.default.auditLog.create({
            data: {
                actorName,
                action: "Account Created",
                detail: `Created user account '${account.username}'`,
                type: "user",
                ipAddress: req.ip || "Internal",
            },
        });
        res.status(201).json({
            success: true,
            message: "User Account Created Successfully",
            data: (0, serializer_1.serialize)(account),
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
exports.createUserAccount = createUserAccount;
const getUserAccounts = async (req, res) => {
    try {
        const accounts = await userAccountService.getUserAccounts();
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(accounts),
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
exports.getUserAccounts = getUserAccounts;
const getUserAccountById = async (req, res) => {
    try {
        const account = await userAccountService.getUserAccountById(BigInt(String(req.params.id)));
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(account),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getUserAccountById = getUserAccountById;
const deleteUserAccount = async (req, res) => {
    try {
        const id = BigInt(String(req.params.id));
        const existingAccount = await userAccountService.getUserAccountById(id);
        await userAccountService.deleteUserAccount(id);
        // Record Audit Log
        const authReq = req;
        const actorName = authReq.user
            ? `${authReq.user.username} (${authReq.user.role || 'USER'})`
            : "System Admin";
        await prisma_1.default.auditLog.create({
            data: {
                actorName,
                action: "Account Deleted",
                detail: `Deleted user account '${existingAccount?.username || id}'`,
                type: "user",
                ipAddress: req.ip || "Internal",
            },
        });
        res.status(200).json({
            success: true,
            message: "User Account Deleted Successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.deleteUserAccount = deleteUserAccount;
