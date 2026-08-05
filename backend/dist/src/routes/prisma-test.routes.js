"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_test_controller_1 = require("../controllers/prisma-test.controller");
const router = (0, express_1.Router)();
router.get("/", prisma_test_controller_1.testPrismaConnection);
exports.default = router;
