"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCertificate = exports.getAllCertificates = exports.getMyCertificates = exports.issueCertificate = exports.upsertTemplate = exports.getTemplate = void 0;
const certificate_service_1 = __importDefault(require("./certificate.service"));
const getTemplate = async (req, res) => {
    try {
        const courseIdStr = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
        if (!courseIdStr) {
            return res.status(400).json({ success: false, message: "Course ID is required" });
        }
        const template = await certificate_service_1.default.getTemplateByCourseId(BigInt(courseIdStr));
        res.json({ success: true, data: template });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTemplate = getTemplate;
const upsertTemplate = async (req, res) => {
    try {
        const courseIdStr = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
        if (!courseIdStr) {
            return res.status(400).json({ success: false, message: "Course ID is required" });
        }
        const updated = await certificate_service_1.default.upsertTemplateForCourse(BigInt(courseIdStr), req.body);
        res.json({ success: true, message: "Certificate template saved", data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.upsertTemplate = upsertTemplate;
const issueCertificate = async (req, res) => {
    try {
        if (req.user?.role === "GUEST") {
            return res.status(403).json({ success: false, message: "Guests are not permitted to generate or receive certificates." });
        }
        const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
        const { courseId, recipientName, courseTitle } = req.body;
        if (!courseId || !recipientName || !courseTitle) {
            return res.status(400).json({ success: false, message: "courseId, recipientName, and courseTitle are required" });
        }
        const issued = await certificate_service_1.default.issueCertificate(userId, BigInt(courseId), recipientName, courseTitle);
        res.status(201).json({ success: true, message: "Certificate issued successfully", data: issued });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.issueCertificate = issueCertificate;
const getMyCertificates = async (req, res) => {
    try {
        if (req.user?.role === "GUEST") {
            return res.json({ success: true, data: [] });
        }
        const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
        const certificates = await certificate_service_1.default.getUserCertificates(userId);
        res.json({ success: true, data: certificates });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyCertificates = getMyCertificates;
const getAllCertificates = async (req, res) => {
    try {
        const userRole = req.user?.role || "GUEST";
        const employeeId = req.user?.employeeId ? BigInt(req.user.employeeId) : undefined;
        const departmentId = req.user?.departmentId ? BigInt(req.user.departmentId) : undefined;
        const certificates = await certificate_service_1.default.getCertificatesForUser({
            role: userRole,
            employeeId,
            departmentId,
        });
        res.json({ success: true, data: certificates });
    }
    catch (error) {
        console.error("getAllCertificates Controller Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch certificates" });
    }
};
exports.getAllCertificates = getAllCertificates;
const verifyCertificate = async (req, res) => {
    try {
        const codeStr = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
        if (!codeStr) {
            return res.status(400).json({ success: false, message: "Code parameter is required" });
        }
        const certificate = await certificate_service_1.default.verifyCertificate(codeStr);
        if (!certificate) {
            return res.status(404).json({ success: false, message: "Certificate not found or invalid code" });
        }
        res.json({ success: true, data: certificate });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.verifyCertificate = verifyCertificate;
