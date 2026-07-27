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
exports.deleteRole = exports.updateRole = exports.getRoleById = exports.getRoles = exports.createRole = void 0;
const roleService = __importStar(require("../services/role.service"));
const serializer_1 = require("../utils/serializer");
const createRole = async (req, res) => {
    try {
        const role = await roleService.createRole({
            roleName: req.body.roleName,
            roleCode: req.body.roleCode,
            description: req.body.description,
        });
        res.status(201).json({
            success: true,
            message: "Role created successfully",
            data: (0, serializer_1.serialize)(role),
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
exports.createRole = createRole;
const getRoles = async (req, res) => {
    try {
        const roles = await roleService.getRoles();
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(roles),
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
exports.getRoles = getRoles;
const getRoleById = async (req, res) => {
    try {
        const role = await roleService.getRoleById(BigInt(String(req.params.id)));
        res.status(200).json({
            success: true,
            data: (0, serializer_1.serialize)(role),
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
exports.getRoleById = getRoleById;
const updateRole = async (req, res) => {
    try {
        const role = await roleService.updateRole(BigInt(String(req.params.id)), req.body);
        res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: (0, serializer_1.serialize)(role),
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
exports.updateRole = updateRole;
const deleteRole = async (req, res) => {
    try {
        await roleService.deleteRole(BigInt(String(req.params.id)));
        res.status(200).json({
            success: true,
            message: "Role deleted successfully",
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
exports.deleteRole = deleteRole;
