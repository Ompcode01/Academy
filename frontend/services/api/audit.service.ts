import api from "./auth.service";

export interface AuditLogData {
  id: number;
  timestamp: string;
  actorName: string;
  username?: string | null;
  departmentName?: string | null;
  action: string;
  detail: string;
  type: string; // role, login, course, security, user, settings, system
  ipAddress?: string | null;
}

export interface AuditFilterQueryParams {
  username?: string;
  departmentName?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsResponse {
  success: boolean;
  logs: AuditLogData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filterOptions: {
    usernames: string[];
    departmentNames: string[];
    types: string[];
  };
}

export async function getAuditLogs(params: AuditFilterQueryParams = {}): Promise<AuditLogsResponse> {
  try {
    const res = await api.get("/admin/audit-logs", { params });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    return {
      success: false,
      logs: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
      filterOptions: { usernames: [], departmentNames: [], types: [] },
    };
  }
}
