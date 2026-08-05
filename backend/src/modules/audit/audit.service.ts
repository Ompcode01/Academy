import prisma from "../../config/prisma";
import { serialize } from "../../utils/serializer";

export class AuditService {
  async getAuditLogs(limit: number = 100) {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: "desc" },
    });
    return serialize(logs);
  }

  async recordAuditLog(data: {
    actorName: string;
    action: string;
    detail: string;
    type?: string;
    actorId?: bigint | null;
    ipAddress?: string | null;
  }) {
    const log = await prisma.auditLog.create({
      data: {
        actorName: data.actorName,
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
