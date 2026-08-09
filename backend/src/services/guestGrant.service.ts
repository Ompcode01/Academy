import prisma from "../config/prisma";
import { GuestAccessScope } from "@prisma/client";

export interface CreateGuestGrantDto {
  userId?: bigint | number;
  departmentId?: bigint | number;
  scope?: "GLOBAL" | "DEPARTMENT";
}

export interface UserContext {
  role: string;
  employeeId?: bigint;
  departmentId?: bigint;
}

class GuestGrantService {
  async getGrants(userContext: UserContext) {
    const { role, departmentId } = userContext;

    let whereClause: any = { isActive: true };

    if (role === "ADMIN") {
      whereClause.OR = [
        { scope: GuestAccessScope.GLOBAL },
        ...(departmentId ? [{ departmentId }] : []),
      ];
    }

    const grants = await prisma.guestAccessGrant.findMany({
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

  async createGrant(dto: CreateGuestGrantDto, grantedById: bigint, userRole: string, userDeptId?: bigint) {
    let scope: GuestAccessScope = dto.scope === "GLOBAL" ? GuestAccessScope.GLOBAL : GuestAccessScope.DEPARTMENT;
    let targetDeptId: bigint | null = dto.departmentId ? BigInt(dto.departmentId) : null;
    let targetUserId: bigint | null = dto.userId ? BigInt(dto.userId) : null;

    if (userRole === "ADMIN") {
      // Admins can ONLY grant access to their own department
      if (scope === GuestAccessScope.GLOBAL) {
        throw new Error("Admins are not permitted to grant Global Guest access. Only Super Admins can grant global access.");
      }
      if (!userDeptId) {
        throw new Error("Admin user has no assigned department");
      }
      targetDeptId = userDeptId;
      scope = GuestAccessScope.DEPARTMENT;
    }

    if (scope === GuestAccessScope.DEPARTMENT && !targetDeptId) {
      throw new Error("Department ID is required for department-scoped Guest access grant.");
    }

    // Upsert or create
    const grant = await prisma.guestAccessGrant.create({
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

  async revokeGrant(grantId: bigint, userRole: string, userDeptId?: bigint) {
    const existing = await prisma.guestAccessGrant.findUnique({
      where: { id: grantId },
    });

    if (!existing) {
      throw new Error("Guest access grant not found");
    }

    if (userRole === "ADMIN") {
      if (existing.scope === GuestAccessScope.GLOBAL || (userDeptId && existing.departmentId !== userDeptId)) {
        throw new Error("Admins can only revoke grants for their own department.");
      }
    }

    return prisma.guestAccessGrant.update({
      where: { id: grantId },
      data: { isActive: false },
    });
  }

  /**
   * Check if a Guest user has permission for a specific department or global access
   */
  async getGuestPermittedDepartmentIds(guestEmployeeId?: bigint): Promise<{ isGlobal: boolean; departmentIds: bigint[] }> {
    const grants = await prisma.guestAccessGrant.findMany({
      where: {
        isActive: true,
        OR: [
          ...(guestEmployeeId ? [{ userId: guestEmployeeId }] : []),
          { userId: null },
        ],
      },
    });

    const isGlobal = grants.some((g) => g.scope === GuestAccessScope.GLOBAL);
    const departmentIds = grants
      .filter((g) => g.scope === GuestAccessScope.DEPARTMENT && g.departmentId !== null)
      .map((g) => g.departmentId as bigint);

    return { isGlobal, departmentIds };
  }
}

export default new GuestGrantService();
