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
exports.deletePermission = exports.updatePermission = exports.getPermissionById = exports.getPermissions = exports.createPermission = void 0;
const permissionService = __importStar(require("../services/permission.service"));
const serializer_1 = require("../utils/serializer");
const createPermission = async (req, res) => {
    try {
        const permission = await permissionService.createPermission({
            permissionName: req.body.permissionName,
            permissionCode: req.body.permissionCode,
            moduleName: req.body.moduleName,
            description: req.body.description,
        });
        res.status(201).json({
            success: true,
            message: "Permission created successfully",
            data: (0, serializer_1.serialize)(permission),
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
exports.createPermission = createPermission;
const getPermissions = async (req, res) => {
    try {
        const permissions = await permissionService.getPermissions();
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(permissions),
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
exports.getPermissions = getPermissions;
const getPermissionById = async (req, res) => {
    try {
        const permission = await permissionService.getPermissionById(BigInt(String(req.params.id)));
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(permission),
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
exports.getPermissionById = getPermissionById;
const updatePermission = async (req, res) => {
    try {
        const permission = await permissionService.updatePermission(BigInt(String(req.params.id)), req.body);
        res.status(200).json({
            success: true,
            message: "Permission updated successfully",
            data: (0, serializer_1.serialize)(permission),
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
exports.updatePermission = updatePermission;
const deletePermission = async (req, res) => {
    try {
        await permissionService.deletePermission(BigInt(String(req.params.id)));
        res.status(200).json({
            success: true,
            message: "Permission deleted successfully",
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
exports.deletePermission = deletePermission;
