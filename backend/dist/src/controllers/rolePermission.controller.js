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
exports.deleteRolePermission = exports.getRolePermissionById = exports.getRolePermissions = exports.assignPermission = void 0;
const rolePermissionService = __importStar(require("../services/rolePermission.service"));
const serializer_1 = require("../utils/serializer");
const assignPermission = async (req, res) => {
    try {
        const rolePermission = await rolePermissionService.assignPermission({
            roleId: BigInt(req.body.roleId),
            permissionId: BigInt(req.body.permissionId),
        });
        res.status(201).json({
            success: true,
            message: "Permission assigned successfully",
            data: (0, serializer_1.serialize)(rolePermission),
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
exports.assignPermission = assignPermission;
const getRolePermissions = async (req, res) => {
    try {
        const data = await rolePermissionService.getRolePermissions();
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(data),
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
exports.getRolePermissions = getRolePermissions;
const getRolePermissionById = async (req, res) => {
    try {
        const data = await rolePermissionService.getRolePermissionById(BigInt(String(req.params.id)));
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(data),
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
exports.getRolePermissionById = getRolePermissionById;
const deleteRolePermission = async (req, res) => {
    try {
        await rolePermissionService.deleteRolePermission(BigInt(String(req.params.id)));
        res.status(200).json({
            success: true,
            message: "Role Permission deleted successfully",
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
exports.deleteRolePermission = deleteRolePermission;
