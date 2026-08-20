"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  RotateCcw,
  User,
  Building2,
  Lock,
  Clock,
  Eye,
  FileCode2,
  Activity,
  Layers,
  Crown,
} from "lucide-react";
import RoleGate from "@/components/auth/RoleGate";
import { ROLES } from "@/lib/rbac";
import { getAuditLogs, AuditLogData, AuditFilterQueryParams } from "@/services/api/audit.service";
import { ReportKpiCard } from "@/components/reports/ReportKpiCard";
import { ReportTable } from "@/components/reports/ReportTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DataFilterToolbar, { SortOption } from "@/components/common/DataFilterToolbar";

export default function SuperAdminAuditLogsPage() {
  const [filters, setFilters] = useState<AuditFilterQueryParams>({
    username: "ALL",
    departmentName: "ALL",
    type: "ALL",
    search: "",
    page: 1,
    limit: 15,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<{
    logs: AuditLogData[];
    total: number;
    totalPages: number;
    filterOptions: { usernames: string[]; departmentNames: string[]; types: string[] };
  }>({
    logs: [],
    total: 0,
    totalPages: 1,
    filterOptions: { usernames: [], departmentNames: [], types: [] },
  });

  const [selectedLog, setSelectedLog] = useState<AuditLogData | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditLogs(filters);
      if (res.success) {
        setAuditData({
          logs: res.logs,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
          filterOptions: res.filterOptions,
        });
      } else {
        setError("Failed to retrieve audit log records.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while loading audit records.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (updated: Partial<AuditFilterQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...updated, page: 1 }));
  };

  const handleReset = () => {
    setFilters({
      username: "ALL",
      departmentName: "ALL",
      type: "ALL",
      search: "",
      dateFrom: "",
      dateTo: "",
      page: 1,
      limit: 15,
    });
  };

  // Render Type Badge
  const renderTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "security":
        return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">Security</Badge>;
      case "role":
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30">Role Access</Badge>;
      case "login":
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">Auth Login</Badge>;
      case "course":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Course</Badge>;
      case "user":
        return <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">User Admin</Badge>;
      case "settings":
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Settings</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">System</Badge>;
    }
  };

  // Active filter count
  let activeFilterCount = 0;
  if (filters.username && filters.username !== "ALL") activeFilterCount++;
  if (filters.departmentName && filters.departmentName !== "ALL") activeFilterCount++;
  if (filters.type && filters.type !== "ALL") activeFilterCount++;
  if (filters.search && filters.search.trim() !== "") activeFilterCount++;

  return (
    <RoleGate allowed={[ROLES.SUPER_ADMIN]}>
      <div className="p-6 space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 p-4 rounded-xl shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                Real-Time System Audit Logs
              </h1>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] py-0.5 px-2 font-bold">
                <Crown className="h-3.5 w-3.5" /> Super Admin Restricted Access
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live enterprise system activity stream, tracking user logins, security updates, role permissions, and course changes.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              onClick={fetchLogs}
              className="bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow h-8 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Log Feed
            </Button>
          </div>
        </div>



        {/* Universal Filter & Sorting Toolbar for Audit Logs */}
        <DataFilterToolbar
          searchQuery={filters.search || ""}
          onSearchChange={(val: string) => handleFilterChange({ search: val })}
          searchPlaceholder="Search action code, actor name, username, IP address..."
          startDate={filters.dateFrom || (filters as any).startDate || ""}
          endDate={filters.dateTo || (filters as any).endDate || ""}
          onDateChange={(start?: string, end?: string) =>
            handleFilterChange({ dateFrom: start || "", dateTo: end || "", startDate: start || "", endDate: end || "" } as any)
          }
          columnFilters={[
            {
              key: "type",
              label: "Event Type",
              value: filters.type || "all",
              options: [
                { label: "Security", value: "security" },
                { label: "Role Access", value: "role" },
                { label: "Authentication / Login", value: "login" },
                { label: "Course Actions", value: "course" },
                { label: "User Admin", value: "user" },
                { label: "System Settings", value: "settings" },
              ],
            },
          ]}
          onColumnFilterChange={(key: string, val: string | null) => {
            handleFilterChange({ [key]: val || "ALL" });
          }}
          onResetAll={handleReset}
        />

        {/* Audit Log Table */}
        <ReportTable
          columns={[
            {
              header: "Timestamp",
              cell: (r: AuditLogData) => (
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                  <Clock className="h-3 w-3 text-primary shrink-0" />
                  {new Date(r.timestamp).toLocaleString()}
                </div>
              ),
            },
            {
              header: "Actor Name",
              cell: (r: AuditLogData) => <span className="font-bold text-foreground">{r.actorName}</span>,
            },
            {
              header: "Employee ID",
              cell: (r: AuditLogData) => (
                <span className="font-mono text-xs font-semibold text-primary">
                  {r.username && r.username !== "system" && r.username !== "null" ? r.username : "EMP001"}
                </span>
              ),
            },
            {
              header: "Action Code",
              cell: (r: AuditLogData) => (
                <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                  {r.action}
                </span>
              ),
            },
            {
              header: "Event Type",
              cell: (r: AuditLogData) => renderTypeBadge(r.type),
            },
            {
              header: "Event Summary",
              cell: (r: AuditLogData) => (
                <p className="text-xs text-muted-foreground truncate max-w-xs" title={r.detail}>
                  {r.detail}
                </p>
              ),
            },
            {
              header: "Payload",
              cell: (r: AuditLogData) => (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedLog(r)}
                  className="h-7 text-xs gap-1 font-semibold text-primary hover:underline"
                >
                  <Eye className="h-3 w-3" /> View JSON
                </Button>
              ),
            },
          ]}
          data={auditData.logs}
          loading={loading}
          error={error}
          onRetry={fetchLogs}
          pagination={{
            page: filters.page || 1,
            totalPages: auditData.totalPages,
            total: auditData.total,
            onPageChange: (newPage) => setFilters((p) => ({ ...p, page: newPage })),
          }}
        />

        {/* Audit Log Modal Viewer */}
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-primary" /> Audit Log Event Detail #{selectedLog?.id}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Detailed record of action executed by {selectedLog?.actorName} ({selectedLog?.username})
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-3 pt-2 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-lg border border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Actor Name</span>
                    <span className="font-bold text-foreground">{selectedLog.actorName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Username</span>
                    <span className="font-mono font-bold text-primary">{selectedLog.username || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Business Unit Name</span>
                    <span className="font-semibold text-foreground">{selectedLog.departmentName || "Global / System"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Action Code</span>
                    <span className="font-mono font-bold text-amber-600">{selectedLog.action}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Timestamp</span>
                    <span className="font-mono text-muted-foreground">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">IP Address</span>
                    <span className="font-mono text-muted-foreground">{selectedLog.ipAddress || "Unknown"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-foreground block mb-1">Event Description &amp; Details:</span>
                  <div className="p-3 bg-card border border-border/80 rounded-lg text-foreground font-mono text-[11px] leading-relaxed">
                    {selectedLog.detail}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-foreground block mb-1">Raw Event Payload:</span>
                  <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGate>
  );
}
