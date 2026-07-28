"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, CheckCircle2, AlertCircle, Play, ShieldCheck } from "lucide-react";

interface SyncLog {
  id: string;
  timestamp: string;
  type: string;
  recordsSynced: number;
  status: "SUCCESS" | "FAILED" | "WARNING";
  message: string;
}

export default function DarwinboxSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<SyncLog[]>([
    {
      id: "LOG-489",
      timestamp: "2026-07-28T05:30:00Z",
      type: "Hourly Sync",
      recordsSynced: 12,
      status: "SUCCESS",
      message: "Synced new employee user accounts successfully.",
    },
    {
      id: "LOG-488",
      timestamp: "2026-07-28T04:30:00Z",
      type: "Hourly Sync",
      recordsSynced: 0,
      status: "SUCCESS",
      message: "No database schema changes or new records found.",
    },
    {
      id: "LOG-487",
      timestamp: "2026-07-27T23:15:00Z",
      type: "Full Manual Sync",
      recordsSynced: 84,
      status: "WARNING",
      message: "Sync completed with 3 duplicate record skips.",
    },
    {
      id: "LOG-486",
      timestamp: "2026-07-27T12:00:00Z",
      type: "System Sync",
      recordsSynced: 0,
      status: "FAILED",
      message: "Network Timeout: Failed to reach Darwinbox API endpoint.",
    },
  ]);

  const handleSync = () => {
    if (syncing) return;
    setSyncing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setSyncing(false);
            const newLog: SyncLog = {
              id: `LOG-${Math.floor(Math.random() * 900) + 100}`,
              timestamp: new Date().toISOString(),
              type: "Manual Sync",
              recordsSynced: Math.floor(Math.random() * 10) + 1,
              status: "SUCCESS",
              message: "Manual sync executed successfully. All database records are updated.",
            };
            setLogs([newLog, ...logs]);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">Success</Badge>;
      case "WARNING":
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Warning</Badge>;
      case "FAILED":
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Darwinbox Sync
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Synchronize employee directory details and department codes directly from Darwinbox ERP.
          </p>
        </div>
      </div>

      {/* Sync Control Widget */}
      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                <ShieldCheck className="h-3.5 w-3.5" />
                ERP Integration Active
              </div>
              <h2 className="text-base font-bold text-foreground">ERP Directory Sync</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Manually trigger a sync to retrieve immediate changes (new hires, department changes, or designation updates). Automatically runs hourly.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center shrink-0">
              <Button
                size="lg"
                disabled={syncing}
                onClick={handleSync}
                className="w-full md:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[150px]"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
              <span className="text-[11px] text-muted-foreground mt-2">
                Last sync: 10 minutes ago
              </span>
            </div>
          </div>

          {syncing && (
            <div className="mt-6 space-y-2 border-t border-border pt-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Reading Darwinbox records &amp; mapping database schemas...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Log Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground pl-1">Sync History Log</h3>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5 w-32">
                  Log ID
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Timestamp
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sync Type
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Records Synced
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-5">
                  Message
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-border transition-colors hover:bg-muted/20">
                  <TableCell className="pl-5 text-sm font-mono text-muted-foreground">
                    {log.id}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {log.type}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {log.recordsSynced} records
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate pr-5">
                    {log.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
