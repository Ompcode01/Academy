"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const audit_controller_1 = require("../modules/audit/audit.controller");
const router = (0, express_1.Router)();
// Restricted exclusively to SUPER_ADMIN
router.get("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN"), audit_controller_1.getAuditLogs);
exports.default = router;
