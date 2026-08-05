"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const prisma_1 = __importDefault(require("../../config/prisma"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const response_1 = require("../../utils/response");
const prismaSerializer_1 = require("../../utils/prismaSerializer");
const router = (0, express_1.Router)();
// GET /api/categories — accessible to all authenticated users
router.get("/", auth_middleware_1.authenticate, (0, asyncHandler_1.default)(async (_req, res) => {
    const categories = await prisma_1.default.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(categories), "Categories fetched successfully");
}));
// POST /api/categories — restricted to TEACHER, ADMIN, SUPER_ADMIN
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("TEACHER", "ADMIN", "SUPER_ADMIN"), (0, asyncHandler_1.default)(async (req, res) => {
    const { name, description } = req.body;
    const category = await prisma_1.default.category.create({
        data: { name, description },
    });
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(category), "Category created successfully", 201);
}));
exports.default = router;
