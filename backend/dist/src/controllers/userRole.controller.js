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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserRole = exports.getUserRoleById = exports.getUserRoles = exports.assignRole = void 0;
const userRoleService = __importStar(require("../services/userRole.service"));
const serializer_1 = require("../utils/serializer");
const assignRole = async (req, res) => {
    try {
        const userRole = await userRoleService.assignRole({
            employeeId: BigInt(req.body.employeeId),
            roleId: BigInt(req.body.roleId),
            assignedBy: BigInt(req.body.assignedBy),
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
        await userRoleService.deleteUserRole(BigInt(String(req.params.id)));
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
