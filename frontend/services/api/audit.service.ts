import api from "./auth.service";

export interface AuditLogData {
  id: number;
  timestamp: string;
  actorName: string;
  action: string;
  detail: string;
  type: string; // role, login, course, security, user, settings, system
  ipAddress?: string | null;
}

export async function getAuditLogs(): Promise<AuditLogData[]> {
  try {
    const res = await api.get("/admin/audit-logs");
    return res.data?.data || [];
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    return [];
  }
}
