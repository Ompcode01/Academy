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
exports.deleteEmployee = exports.updateEmployee = exports.getEmployeeById = exports.getEmployees = exports.createEmployee = void 0;
const employeeService = __importStar(require("../services/employee.service"));
const prisma_1 = __importDefault(require("../config/prisma"));
const serialize = (obj) => JSON.parse(JSON.stringify(obj, (_, value) => typeof value === "bigint" ? value.toString() : value));
const createEmployee = async (req, res) => {
    try {
        const employee = await employeeService.createEmployee({
            employeeCode: req.body.employeeCode,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            officialEmail: req.body.officialEmail,
            phoneNumber: req.body.phoneNumber,
            designation: req.body.designation,
            departmentId: BigInt(req.body.departmentId),
            managerId: req.body.managerId
                ? BigInt(req.body.managerId)
                : undefined,
            joiningDate: new Date(req.body.joiningDate),
            profileImage: req.body.profileImage,
        });
        res.status(201).json({
            success: true,
            data: serialize(employee),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Unable to create employee",
        });
    }
};
exports.createEmployee = createEmployee;
const getEmployees = async (req, res) => {
    try {
        const employees = await employeeService.getEmployees();
        res.json({
            success: true,
            data: serialize(employees),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};
exports.getEmployees = getEmployees;
const getEmployeeById = async (req, res) => {
    try {
        const employee = await employeeService.getEmployeeById(BigInt(String(req.params.id)));
        res.json({
            success: true,
            data: serialize(employee),
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};
exports.getEmployeeById = getEmployeeById;
const updateEmployee = async (req, res) => {
    try {
        const employee = await employeeService.updateEmployee(BigInt(String(req.params.id)), req.body);
        res.json({
            success: true,
            data: serialize(employee),
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (req, res) => {
    try {
        const callerRole = req.user?.role;
        const targetId = BigInt(String(req.params.id));
        // Check if the target employee holds an ADMIN or SUPER_ADMIN role
        const targetRoles = await prisma_1.default.userRole.findMany({
            where: { employeeId: targetId, isActive: true },
            include: { role: true },
        });
        const targetRoleCodes = targetRoles.map((r) => r.role.roleCode);
        const targetIsAdmin = targetRoleCodes.includes("ADMIN") || targetRoleCodes.includes("SUPER_ADMIN");
        // Only SUPER_ADMIN can delete admin-level employees
        if (targetIsAdmin && callerRole !== "SUPER_ADMIN") {
            res.status(403).json({
                success: false,
                message: "Only Super Admins can delete admin-level employees",
            });
            return;
        }
        await employeeService.deleteEmployee(targetId);
        res.json({
            success: true,
            message: "Employee deleted successfully",
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};
exports.deleteEmployee = deleteEmployee;
