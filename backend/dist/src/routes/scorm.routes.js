"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const scorm_controller_1 = require("../modules/scorm/scorm.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/zip" ||
            file.mimetype === "application/x-zip-compressed" ||
            file.originalname.toLowerCase().endsWith(".zip")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only .zip files are allowed for SCORM package upload."));
        }
    },
});
router.use(auth_middleware_1.authenticate);
// Validate package
router.post("/validate", (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN", "ADMIN", "TEACHER"), upload.single("package"), scorm_controller_1.validateScormPackage);
// Create SCORM course
router.post("/create-course", (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN", "ADMIN", "TEACHER"), upload.single("package"), scorm_controller_1.createScormCourse);
// Get package & launch details
router.get("/course/:courseId", scorm_controller_1.getScormPackage);
// Tracking endpoints for learner runtime
router.get("/tracking/:courseId", scorm_controller_1.getScormTracking);
router.post("/tracking/:courseId", scorm_controller_1.commitScormTracking);
// Replace SCORM package
router.post("/course/:courseId/replace", (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN", "ADMIN"), upload.single("package"), scorm_controller_1.replaceScormPackage);
exports.default = router;
