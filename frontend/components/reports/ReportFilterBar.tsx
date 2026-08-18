"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Filter,
  RotateCcw,
  Calendar,
  Building2,
  BookOpen,
  Search,
  SlidersHorizontal,
  Lock,
  Tag,
  CheckCircle,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import { ReportFilterParams } from "@/services/api/reporting.service";
import CustomDateRangePicker from "@/components/common/CustomDateRangePicker";

interface FilterOptionsData {
  departments: { id: number; departmentName: string; departmentCode: string }[];
  categories: { id: number; name: string }[];
  courses: { id: number; title: string; categoryId: number; departmentId?: number }[];
  employees: { id: number; firstName: string; lastName: string; employeeCode: string }[];
  isSuperAdmin: boolean;
}

interface ReportFilterBarProps {
  filters: ReportFilterParams & { search?: string; startDate?: string; endDate?: string; sortOrder?: string };
  onFilterChange: (updated: Partial<ReportFilterParams & { search?: string; startDate?: string; endDate?: string; sortOrder?: string }>) => void;
  onReset: () => void;
  onExport: (format: "excel" | "csv" | "pdf") => void;
  options?: FilterOptionsData;
  activeReportTab: string;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  onExport,
  options,
  activeReportTab,
}) => {
  const isSuperAdmin = options?.isSuperAdmin ?? true;

  // Selected department object
  const selectedDeptObj = options?.departments?.find(
    (d) => String(d.id) === String(filters.departmentId)
  );

  // Active filter count
  let activeCount = 0;
  if (filters.preset && filters.preset !== "ALL") activeCount++;
  if (filters.departmentId && filters.departmentId !== "ALL") activeCount++;
  if (filters.categoryId && filters.categoryId !== "ALL") activeCount++;
  if (filters.courseId && filters.courseId !== "ALL") activeCount++;
  if (filters.search && filters.search.trim() !== "") activeCount++;
  if (filters.mandatory && filters.mandatory !== "ALL") activeCount++;
  if (filters.status && filters.status !== "ALL") activeCount++;
  if (filters.startDate || filters.endDate) activeCount++;
  if ((filters as any).sortOrder && (filters as any).sortOrder !== "newest") activeCount++;

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
      {/* Top Header Row with Export Actions & Active Filter Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C82333]/10 text-[#C82333]">
            <Filter className="h-4 w-4" />
          </div>
          <span className="text-xs font-extrabold tracking-wide uppercase text-slate-800 dark:text-slate-200">
            Enterprise Report Controls &amp; Filters
          </span>
          {activeCount > 0 ? (
            <Badge className="bg-[#C82333] text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
              {activeCount} active filter{activeCount > 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full text-slate-400 border-slate-200 dark:border-slate-800 font-semibold">
              All Analytics Scope
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReset}
              className="h-8 text-xs gap-1.5 text-rose-600 border-rose-200 dark:border-rose-800 hover:bg-rose-50 font-bold transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport("excel")}
            className="h-8 text-xs gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Excel
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport("csv")}
            className="h-8 text-xs gap-1.5 border-blue-500/30 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Controls Grid without redundant stacked label text */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Custom Date Range Picker */}
        <div className="flex-1 min-w-[280px]">
          <CustomDateRangePicker
            startDate={filters.startDate || ""}
            endDate={filters.endDate || ""}
            onChange={(s, e) => onFilterChange({ startDate: s, endDate: e, preset: "CUSTOM" })}
            showPresets={false}
          />
        </div>

        {/* 2. Sort Order */}
        <div className="min-w-[160px]">
          <Select
            value={(filters as any).sortOrder || "desc"}
            onValueChange={(val) => onFilterChange({ sortOrder: val } as any)}
          >
            <SelectTrigger className="h-9.5 w-full bg-white dark:bg-slate-900 text-xs font-bold border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-[#C82333] shrink-0" />
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a_z" className="text-xs font-medium">Name / Title (A-Z)</SelectItem>
              <SelectItem value="z_a" className="text-xs font-medium">Name / Title (Z-A)</SelectItem>
              <SelectItem value="newest" className="text-xs font-medium">Newest First</SelectItem>
              <SelectItem value="oldest" className="text-xs font-medium">Oldest First</SelectItem>
              <SelectItem value="progress_high" className="text-xs font-medium">Progress (High → Low)</SelectItem>
              <SelectItem value="progress_low" className="text-xs font-medium">Progress (Low → High)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 3. Department Scope */}
        <div className="min-w-[170px]">
          {isSuperAdmin ? (
            <Select
              value={filters.departmentId ? String(filters.departmentId) : "ALL"}
              onValueChange={(val) => onFilterChange({ departmentId: val || "ALL" })}
            >
              <SelectTrigger className="h-9.5 w-full bg-white dark:bg-slate-900 text-xs font-semibold border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
                <span className="text-slate-400 font-normal mr-1">Dept:</span>
                <SelectValue>
                  {selectedDeptObj ? `${selectedDeptObj.departmentName}` : "All Depts"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-bold text-slate-500">All Organization Departments</SelectItem>
                {options?.departments?.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)} className="text-xs font-medium">
                    {d.departmentName} ({d.departmentCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9.5 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-semibold shadow-sm">
              <span className="truncate">
                {options?.departments?.[0]?.departmentName || "Authorized Dept"}
              </span>
              <Badge variant="outline" className="text-[9px] bg-amber-500/20 text-amber-600 border-amber-500/40 shrink-0">
                <Lock className="h-2.5 w-2.5 mr-0.5" /> Scope Locked
              </Badge>
            </div>
          )}
        </div>

        {/* 4. Course Filter */}
        <div className="min-w-[160px]">
          <Select
            value={filters.courseId ? String(filters.courseId) : "ALL"}
            onValueChange={(val) => onFilterChange({ courseId: val || "ALL" })}
          >
            <SelectTrigger className="h-9.5 w-full bg-white dark:bg-slate-900 text-xs font-semibold border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
              <span className="text-slate-400 font-normal mr-1">Course:</span>
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs font-bold text-slate-500">All Courses</SelectItem>
              {options?.courses?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="text-xs font-medium">
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 5. Category Filter */}
        <div className="min-w-[150px]">
          <Select
            value={filters.categoryId ? String(filters.categoryId) : "ALL"}
            onValueChange={(val) => onFilterChange({ categoryId: val || "ALL" })}
          >
            <SelectTrigger className="h-9.5 w-full bg-white dark:bg-slate-900 text-xs font-semibold border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
              <span className="text-slate-400 font-normal mr-1">Category:</span>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs font-bold text-slate-500">All Categories</SelectItem>
              {options?.categories?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="text-xs font-medium">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 6. Status Filter */}
        <div className="min-w-[140px]">
          <Select
            value={filters.status || "ALL"}
            onValueChange={(val) => onFilterChange({ status: val || "ALL" })}
          >
            <SelectTrigger className="h-9.5 w-full bg-white dark:bg-slate-900 text-xs font-semibold border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
              <span className="text-slate-400 font-normal mr-1">Status:</span>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs font-bold text-slate-500">All Statuses</SelectItem>
              <SelectItem value="COMPLETED" className="text-xs font-medium">Completed</SelectItem>
              <SelectItem value="IN_PROGRESS" className="text-xs font-medium">In Progress</SelectItem>
              <SelectItem value="NOT_STARTED" className="text-xs font-medium">Not Started</SelectItem>
              <SelectItem value="OVERDUE" className="text-xs font-medium">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 7. Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by Employee Name, Code, or Email..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="h-9.5 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs pl-8 rounded-xl shadow-sm focus:border-[#C82333]"
          />
        </div>
      </div>
    </div>
  );
};
