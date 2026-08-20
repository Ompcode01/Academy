import prisma from "../../config/prisma";
import { serialize } from "../../utils/serializer";

export interface AuditFilterParams {
  username?: string;
  departmentName?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export class AuditService {
  async getAuditLogs(filters: AuditFilterParams = {}) {
    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {};

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
      if (filters.dateFrom) {
        const dFrom = new Date(filters.dateFrom);
        dFrom.setHours(0, 0, 0, 0);
        where.timestamp.gte = dFrom;
      }
      if (filters.dateTo) {
        const dTo = new Date(filters.dateTo);
        dTo.setHours(23, 59, 59, 999);
        where.timestamp.lte = dTo;
      }
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
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Distinct usernames, departmentNames, and types for filter dropdown options
    const [allUsernames, allDeptNames, allTypes] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ["username"],
        where: { username: { not: null } },
      }),
      prisma.auditLog.groupBy({
        by: ["departmentName"],
        where: { departmentName: { not: null } },
      }),
      prisma.auditLog.groupBy({
        by: ["type"],
      }),
    ]);

    const usernamesOptions = allUsernames.map((u) => u.username).filter(Boolean);
    const deptNamesOptions = allDeptNames.map((d) => d.departmentName).filter(Boolean);
    const typesOptions = allTypes.map((t) => t.type).filter(Boolean);

    return serialize({
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

  async recordAuditLog(data: {
    actorName: string;
    action: string;
    detail: string;
    type?: string;
    username?: string | null;
    departmentName?: string | null;
    actorId?: bigint | null;
    ipAddress?: string | null;
  }) {
    let username = data.username || null;
    let departmentName = data.departmentName || null;

    // Auto-resolve username and departmentName if actorId is provided but info missing
    if (data.actorId && (!username || !departmentName)) {
      try {
        const emp = await prisma.employee.findFirst({
          where: {
            OR: [{ id: data.actorId }, { userAccount: { id: data.actorId } }],
          },
          include: { userAccount: true, department: true },
        });
        if (emp) {
          username = emp.employeeCode || emp.userAccount?.username || "EMP001";
          if (!departmentName) departmentName = emp.department?.departmentName || "Global Organization";
        }
      } catch (err) {
        console.error("Audit log user auto-resolution skipped:", err);
      }
    }

    const log = await prisma.auditLog.create({
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
    return serialize(log);
  }
}

export default new AuditService();
