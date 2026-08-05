"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPrismaConnection = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const prismaSerializer_1 = require("../utils/prismaSerializer");
exports.testPrismaConnection = (0, asyncHandler_1.default)(async (req, res) => {
    const departments = await prisma_1.default.department.findMany();
    return (0, response_1.successResponse)(res, (0, prismaSerializer_1.serializeBigInt)(departments), "Prisma connected successfully");
});
