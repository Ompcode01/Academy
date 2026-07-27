"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const department_controller_1 = require("../controllers/department.controller");
const router = (0, express_1.Router)();
router.post("/", department_controller_1.createDepartment);
router.get("/", auth_middleware_1.authenticate, department_controller_1.getDepartments);
exports.default = router;
