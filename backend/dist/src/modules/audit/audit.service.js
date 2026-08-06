"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const serializer_1 = require("../../utils/serializer");
class AuditService {
    async getAuditLogs(filters = {}) {
        const page = Number(filters.page || 1);
        const limit = Number(filters.limit || 20);
        const skip = (page - 1) * limit;
        const where = {};
        // Filter by username
        if (filters.username && filters.username !== "ALL") {
            where.username = filters.username;
        }
        // Filter by departmentName
        if (filters.departmentName && filters.departmentName !== "ALL") {
            where.departmentName = filters.departmentName;
        }
        // Filter by type
        if (filters.type && filters.type !== "ALL") {
            where.type = filters.type;
        }
        // Date range
        if (filters.dateFrom || filters.dateTo) {
            where.timestamp = {};
            if (filters.dateFrom)
                where.timestamp.gte = new Date(filters.dateFrom);
            if (filters.dateTo)
                where.timestamp.lte = new Date(filters.dateTo);
        }
        // Search query across fields
        if (filters.search && filters.search.trim() !== "") {
            const q = filters.search.trim();
            where.OR = [
                { actorName: { contains: q } },
                { username: { contains: q } },
                { departmentName: { contains: q } },
                { action: { contains: q } },
                { detail: { contains: q } },
                { ipAddress: { contains: q } },
            ];
        }
        const [total, logs] = await Promise.all([
            prisma_1.default.auditLog.count({ where }),
            prisma_1.default.auditLog.findMany({
                where,
                orderBy: { timestamp: "desc" },
                skip,
                take: limit,
            }),
        ]);
        // Distinct usernames, departmentNames, and types for filter dropdown options
        const [allUsernames, allDeptNames, allTypes] = await Promise.all([
            prisma_1.default.auditLog.groupBy({
                by: ["username"],
                where: { username: { not: null } },
            }),
            prisma_1.default.auditLog.groupBy({
                by: ["departmentName"],
                where: { departmentName: { not: null } },
            }),
            prisma_1.default.auditLog.groupBy({
                by: ["type"],
            }),
        ]);
        const usernamesOptions = allUsernames.map((u) => u.username).filter(Boolean);
        const deptNamesOptions = allDeptNames.map((d) => d.departmentName).filter(Boolean);
        const typesOptions = allTypes.map((t) => t.type).filter(Boolean);
        return (0, serializer_1.serialize)({
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
            filterOptions: {
                usernames: usernamesOptions,
                departmentNames: deptNamesOptions,
                types: typesOptions,
            },
        });
    }
    async recordAuditLog(data) {
        let username = data.username || null;
        let departmentName = data.departmentName || null;
        // Auto-resolve username and departmentName if actorId is provided but info missing
        if (data.actorId && (!username || !departmentName)) {
            try {
                const emp = await prisma_1.default.employee.findFirst({
                    where: {
                        OR: [{ id: data.actorId }, { userAccount: { id: data.actorId } }],
                    },
                    include: { userAccount: true, department: true },
                });
                if (emp) {
                    if (!username)
                        username = emp.userAccount?.username || emp.employeeCode;
                    if (!departmentName)
                        departmentName = emp.department.departmentName;
                }
            }
            catch (err) {
                console.error("Audit log user auto-resolution skipped:", err);
            }
        }
        const log = await prisma_1.default.auditLog.create({
            data: {
                actorName: data.actorName,
                username,
                departmentName,
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
