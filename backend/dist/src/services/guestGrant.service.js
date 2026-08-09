"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
class GuestGrantService {
    async getGrants(userContext) {
        const { role, departmentId } = userContext;
        let whereClause = { isActive: true };
        if (role === "ADMIN") {
            whereClause.OR = [
                { scope: client_1.GuestAccessScope.GLOBAL },
                ...(departmentId ? [{ departmentId }] : []),
            ];
        }
        const grants = await prisma_1.default.guestAccessGrant.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                        officialEmail: true,
                    },
                },
                department: {
                    select: {
                        id: true,
                        departmentCode: true,
                        departmentName: true,
                    },
                },
                grantedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        officialEmail: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return grants;
    }
    async createGrant(dto, grantedById, userRole, userDeptId) {
        let scope = dto.scope === "GLOBAL" ? client_1.GuestAccessScope.GLOBAL : client_1.GuestAccessScope.DEPARTMENT;
        let targetDeptId = dto.departmentId ? BigInt(dto.departmentId) : null;
        let targetUserId = dto.userId ? BigInt(dto.userId) : null;
        if (userRole === "ADMIN") {
            // Admins can ONLY grant access to their own department
            if (scope === client_1.GuestAccessScope.GLOBAL) {
                throw new Error("Admins are not permitted to grant Global Guest access. Only Super Admins can grant global access.");
            }
            if (!userDeptId) {
                throw new Error("Admin user has no assigned department");
            }
            targetDeptId = userDeptId;
            scope = client_1.GuestAccessScope.DEPARTMENT;
        }
        if (scope === client_1.GuestAccessScope.DEPARTMENT && !targetDeptId) {
            throw new Error("Department ID is required for department-scoped Guest access grant.");
        }
        // Upsert or create
        const grant = await prisma_1.default.guestAccessGrant.create({
            data: {
                userId: targetUserId,
                departmentId: targetDeptId,
                scope,
                grantedById,
                isActive: true,
            },
            include: {
                user: true,
                department: true,
                grantedBy: true,
            },
        });
        return grant;
    }
    async revokeGrant(grantId, userRole, userDeptId) {
        const existing = await prisma_1.default.guestAccessGrant.findUnique({
            where: { id: grantId },
        });
        if (!existing) {
            throw new Error("Guest access grant not found");
        }
        if (userRole === "ADMIN") {
            if (existing.scope === client_1.GuestAccessScope.GLOBAL || (userDeptId && existing.departmentId !== userDeptId)) {
                throw new Error("Admins can only revoke grants for their own department.");
            }
        }
        return prisma_1.default.guestAccessGrant.update({
            where: { id: grantId },
            data: { isActive: false },
        });
    }
    /**
     * Check if a Guest user has permission for a specific department or global access
     */
    async getGuestPermittedDepartmentIds(guestEmployeeId) {
        const grants = await prisma_1.default.guestAccessGrant.findMany({
            where: {
                isActive: true,
                OR: [
                    ...(guestEmployeeId ? [{ userId: guestEmployeeId }] : []),
                    { userId: null },
                ],
            },
        });
        const isGlobal = grants.some((g) => g.scope === client_1.GuestAccessScope.GLOBAL);
        const departmentIds = grants
            .filter((g) => g.scope === client_1.GuestAccessScope.DEPARTMENT && g.departmentId !== null)
            .map((g) => g.departmentId);
        return { isGlobal, departmentIds };
    }
}
exports.default = new GuestGrantService();
