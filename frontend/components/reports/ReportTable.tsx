"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, AlertCircle, FileX, RefreshCw } from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface ReportTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (newPage: number) => void;
  };
  emptyMessage?: string;
}

export function renderStatusBadge(status: string) {
  const upper = String(status || "").toUpperCase();
  switch (upper) {
    case "COMPLETED":
    case "PASS":
    case "ACTIVE":
    case "EXCEEDING":
    case "HIGHLY ENGAGED":
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">{status}</Badge>;
    case "IN_PROGRESS":
    case "ON TRACK":
    case "MODERATELY ENGAGED":
      return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20">{status}</Badge>;
    case "NOT_STARTED":
      return <Badge variant="outline" className="text-muted-foreground">{status}</Badge>;
    case "OVERDUE":
    case "FAIL":
    case "EXPIRED":
    case "NEEDS ATTENTION":
    case "INACTIVE":
      return <Badge variant="destructive" className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">{status}</Badge>;
    case "EXPIRING_SOON":
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">EXPIRING SOON</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function ReportTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  pagination,
  emptyMessage = "No reporting records found for the selected filters.",
}: ReportTableProps<T>) {
  if (error) {
    return (
      <div className="bg-card border border-destructive/30 rounded-xl p-8 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h4 className="text-sm font-semibold text-foreground">Failed to Load Report Data</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
        {onRetry && (
          <Button size="sm" onClick={onRetry} variant="outline" className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Retry Request
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={`text-xs font-semibold text-muted-foreground ${col.className || ""}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <FileX className="h-8 w-8 stroke-[1.5]" />
                    <p className="text-xs">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rIdx) => (
                <TableRow key={rIdx} className="hover:bg-muted/40 transition-colors">
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx} className={`text-xs text-foreground ${col.className || ""}`}>
                      {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? "—") : "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      {pagination && pagination.totalPages > 0 && (
        <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{data.length}</span> of{" "}
            <span className="font-semibold text-foreground">{pagination.total}</span> records
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs">
              Page <span className="font-medium text-foreground">{pagination.page}</span> of{" "}
              <span className="font-medium text-foreground">{pagination.totalPages}</span>
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
