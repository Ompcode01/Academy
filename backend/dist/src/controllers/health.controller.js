"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const response_1 = require("../utils/response");
exports.healthCheck = (0, asyncHandler_1.default)(async (_req, res) => {
    await prisma_1.default.$queryRaw `SELECT 1`;
    return (0, response_1.successResponse)(res, {
        server: "Running",
        database: "Connected",
    }, "Application is healthy");
});
