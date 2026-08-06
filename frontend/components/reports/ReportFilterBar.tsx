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
} from "lucide-react";
import { ReportFilterParams } from "@/services/api/reporting.service";

interface FilterOptionsData {
  departments: { id: number; departmentName: string; departmentCode: string }[];
  categories: { id: number; name: string }[];
  courses: { id: number; title: string; categoryId: number; departmentId?: number }[];
  employees: { id: number; firstName: string; lastName: string; employeeCode: string }[];
  isSuperAdmin: boolean;
}

interface ReportFilterBarProps {
  filters: ReportFilterParams & { search?: string };
  onFilterChange: (updated: Partial<ReportFilterParams & { search?: string }>) => void;
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

  // Find selected department name for Super Admin dropdown display
  const selectedDeptObj = options?.departments?.find(
    (d) => String(d.id) === String(filters.departmentId)
  );

  // Active filter count calculation
  let activeCount = 0;
  if (filters.preset && filters.preset !== "ALL") activeCount++;
  if (filters.departmentId && filters.departmentId !== "ALL") activeCount++;
  if (filters.categoryId && filters.categoryId !== "ALL") activeCount++;
  if (filters.courseId && filters.courseId !== "ALL") activeCount++;
  if (filters.search && filters.search.trim() !== "") activeCount++;
  if (filters.mandatory && filters.mandatory !== "ALL") activeCount++;
  if (filters.status && filters.status !== "ALL") activeCount++;

  return (
    <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm space-y-3">
      {/* Header Bar with Export & Reset Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-border/60">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Report Controls &amp; Filters</span>
          {activeCount > 0 ? (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
              {activeCount} active filter{activeCount > 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground">
              All Records
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Always Visible Reset Filters Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            className="h-8 text-xs gap-1.5 border-border hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport("excel")}
            className="h-8 text-xs gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
          >
            <Download className="h-3.5 w-3.5" /> Export Excel
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport("csv")}
            className="h-8 text-xs gap-1.5 border-blue-500/30 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Visible Unhidden Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Date Range Preset */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Date Range</label>
          <Select
            value={filters.preset || "ALL"}
            onValueChange={(val) => onFilterChange({ preset: val || "ALL" })}
          >
            <SelectTrigger className="h-9 text-xs">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Time</SelectItem>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="7D">Last 7 Days</SelectItem>
              <SelectItem value="30D">Last 30 Days</SelectItem>
              <SelectItem value="MONTH">This Month</SelectItem>
              <SelectItem value="QUARTER">This Quarter</SelectItem>
              <SelectItem value="YEAR">This Year</SelectItem>
              <SelectItem value="CUSTOM">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. Department Scope (Locked for Admin, Dropdown with names for Super Admin) */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Department Scope</label>
          {isSuperAdmin ? (
            <Select
              value={filters.departmentId ? String(filters.departmentId) : "ALL"}
              onValueChange={(val) => onFilterChange({ departmentId: val || "ALL" })}
            >
              <SelectTrigger className="h-9 text-xs">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-primary" />
                <SelectValue>
                  {selectedDeptObj ? `${selectedDeptObj.departmentName} (${selectedDeptObj.departmentCode})` : "All Organization Departments"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Organization Departments</SelectItem>
                {options?.departments?.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.departmentName} ({d.departmentCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 px-3 rounded-md border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                {options?.departments?.[0]?.departmentName || "Authorized Department"}
              </span>
              <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-600 border-amber-500/40 gap-0.5 py-0">
                <Lock className="h-2.5 w-2.5" /> Scope Locked
              </Badge>
            </div>
          )}
        </div>

        {/* 3. Course Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Course Filter</label>
          <Select
            value={filters.courseId ? String(filters.courseId) : "ALL"}
            onValueChange={(val) => onFilterChange({ courseId: val || "ALL" })}
          >
            <SelectTrigger className="h-9 text-xs">
              <BookOpen className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Courses</SelectItem>
              {options?.courses?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Employee Search Input */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Search Employee</label>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Name, Code, or Email..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="h-9 text-xs pl-8"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Category, Status, Training Type & Configurable Thresholds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/50">
        {/* Category Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Course Category</label>
          <Select
            value={filters.categoryId ? String(filters.categoryId) : "ALL"}
            onValueChange={(val) => onFilterChange({ categoryId: val || "ALL" })}
          >
            <SelectTrigger className="h-9 text-xs">
              <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {options?.categories?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Training Type (Mandatory / Optional) */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Training Type</label>
          <Select
            value={filters.mandatory || "ALL"}
            onValueChange={(val) => onFilterChange({ mandatory: val || "ALL" })}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="All Trainings (Mandatory & Optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Trainings (Mandatory &amp; Optional)</SelectItem>
              <SelectItem value="MANDATORY">Mandatory Trainings Only</SelectItem>
              <SelectItem value="OPTIONAL">Optional Trainings Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Completion Status</label>
          <Select
            value={filters.status || "ALL"}
            onValueChange={(val) => onFilterChange({ status: val || "ALL" })}
          >
            <SelectTrigger className="h-9 text-xs">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tab Specific Threshold Controls */}
        {activeReportTab === "completions" && (
          <div>
            <label className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1 block flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" /> Low Completion Threshold (%)
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={filters.lowCompletionThreshold || 50}
              onChange={(e) => onFilterChange({ lowCompletionThreshold: Number(e.target.value) || 50 })}
              className="h-9 text-xs font-semibold"
            />
          </div>
        )}

        {activeReportTab === "assessments" && (
          <div>
            <label className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1 block flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" /> Cert Expiring Threshold (Days)
            </label>
            <Input
              type="number"
              min={1}
              max={180}
              value={filters.expiringSoonDays || 30}
              onChange={(e) => onFilterChange({ expiringSoonDays: Number(e.target.value) || 30 })}
              className="h-9 text-xs font-semibold"
            />
          </div>
        )}

        {activeReportTab === "engagement" && (
          <div>
            <label className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1 block flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" /> Inactivity Threshold (Days)
            </label>
            <Input
              type="number"
              min={1}
              max={180}
              value={filters.inactiveDays || 30}
              onChange={(e) => onFilterChange({ inactiveDays: Number(e.target.value) || 30 })}
              className="h-9 text-xs font-semibold"
            />
          </div>
        )}
      </div>

      {/* Custom Date Pickers */}
      {filters.preset === "CUSTOM" && (
        <div className="flex items-center space-x-3 pt-2 border-t border-border/50">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Date From</label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
              className="h-9 text-xs"
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Date To</label>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => onFilterChange({ dateTo: e.target.value })}
              className="h-9 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};
