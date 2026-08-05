"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const serializer_1 = require("../../utils/serializer");
class AuditService {
    async getAuditLogs(limit = 100) {
        const logs = await prisma_1.default.auditLog.findMany({
            take: limit,
            orderBy: { timestamp: "desc" },
        });
        return (0, serializer_1.serialize)(logs);
    }
    async recordAuditLog(data) {
        const log = await prisma_1.default.auditLog.create({
            data: {
                actorName: data.actorName,
                action: data.action,
                detail: data.detail,
                type: data.type || "system",
                actorId: data.actorId || null,
                ipAddress: data.ipAddress || null,
            },
        });
        return (0, serializer_1.serialize)(log);
    }
}
exports.AuditService = AuditService;
exports.default = new AuditService();
