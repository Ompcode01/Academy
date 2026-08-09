"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceScormPackage = exports.commitScormTracking = exports.getScormTracking = exports.getScormPackage = exports.createScormCourse = exports.validateScormPackage = void 0;
const scorm_service_1 = require("./scorm.service");
const validateScormPackage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No SCORM ZIP package file uploaded." });
        }
        const validation = await scorm_service_1.scormService.validatePackage(req.file.buffer, req.file.originalname);
        res.json({ success: true, data: validation });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to validate SCORM package." });
    }
};
exports.validateScormPackage = validateScormPackage;
const createScormCourse = async (req, res) => {
    try {
        const creatorId = req.user?.id ? BigInt(req.user.id) : undefined;
        if (!creatorId) {
            return res.status(401).json({ success: false, message: "Unauthorized user." });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: "SCORM ZIP package is required." });
        }
        const { categoryId, departmentId, title, shortDescription, description, thumbnail, level, language, enrollmentType, isMandatory, status, targetDepartmentIds, } = req.body;
        if (!categoryId) {
            return res.status(400).json({ success: false, message: "Course category is required." });
        }
        const parsedDepts = targetDepartmentIds
            ? typeof targetDepartmentIds === "string"
                ? JSON.parse(targetDepartmentIds)
                : targetDepartmentIds
            : undefined;
        const result = await scorm_service_1.scormService.createScormCourse(creatorId, {
            categoryId: BigInt(categoryId),
            departmentId: departmentId ? BigInt(departmentId) : undefined,
            title,
            shortDescription,
            description,
            thumbnail,
            level,
            language,
            enrollmentType,
            isMandatory: isMandatory === "true" || isMandatory === true,
            status,
            targetDepartmentIds: parsedDepts,
        }, req.file.buffer, req.file.originalname);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to create SCORM course." });
    }
};
exports.createScormCourse = createScormCourse;
const getScormPackage = async (req, res) => {
    try {
        const courseId = BigInt(req.params.courseId);
        const data = await scorm_service_1.scormService.getScormPackage(courseId);
        if (!data) {
            return res.status(404).json({ success: false, message: "SCORM course package not found." });
        }
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to get SCORM package." });
    }
};
exports.getScormPackage = getScormPackage;
const getScormTracking = async (req, res) => {
    try {
        const userId = req.user?.id ? BigInt(req.user.id) : undefined;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized user." });
        }
        const courseId = BigInt(req.params.courseId);
        const tracking = await scorm_service_1.scormService.getOrInitScormAttempt(userId, courseId);
        res.json({ success: true, data: tracking });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to get SCORM tracking state." });
    }
};
exports.getScormTracking = getScormTracking;
const commitScormTracking = async (req, res) => {
    try {
        const userId = req.user?.id ? BigInt(req.user.id) : undefined;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized user." });
        }
        const courseId = BigInt(req.params.courseId);
        const { cmi } = req.body;
        const result = await scorm_service_1.scormService.commitScormTracking(userId, courseId, cmi || {});
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to commit SCORM tracking state." });
    }
};
exports.commitScormTracking = commitScormTracking;
const replaceScormPackage = async (req, res) => {
    try {
        const courseId = BigInt(req.params.courseId);
        if (!req.file) {
            return res.status(400).json({ success: false, message: "New SCORM ZIP package file is required." });
        }
        const result = await scorm_service_1.scormService.replacePackage(courseId, req.file.buffer, req.file.originalname);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to replace SCORM package." });
    }
};
exports.replaceScormPackage = replaceScormPackage;
