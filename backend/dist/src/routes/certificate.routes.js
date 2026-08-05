"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const certificate_controller_1 = require("../modules/certificate/certificate.controller");
const router = (0, express_1.Router)();
// Templates
router.get("/template/:courseId", certificate_controller_1.getTemplate);
router.put("/template/:courseId", auth_middleware_1.authenticate, certificate_controller_1.upsertTemplate);
// Certificate Operations
router.post("/issue", auth_middleware_1.authenticate, certificate_controller_1.issueCertificate);
router.get("/my-certificates", auth_middleware_1.authenticate, certificate_controller_1.getMyCertificates);
router.get("/all", auth_middleware_1.authenticate, certificate_controller_1.getAllCertificates);
router.get("/verify/:code", certificate_controller_1.verifyCertificate);
exports.default = router;
