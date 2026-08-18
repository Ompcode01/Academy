"use client";

import React from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  X,
  RotateCcw,
  Filter,
  Layers,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import CustomDateRangePicker from "@/components/common/CustomDateRangePicker";

export type SortOption = "a_z" | "z_a" | "newest" | "oldest" | "progress_high" | "progress_low";

export interface ColumnFilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  value?: string;
}

interface DataFilterToolbarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // Sorting
  sortValue?: SortOption;
  onSortChange?: (val: SortOption) => void;
  sortOptions?: { label: string; value: SortOption }[];

  // Date Range Picker
  startDate?: string;
  endDate?: string;
  onDateChange?: (start?: string, end?: string) => void;
  showDatePicker?: boolean;

  // Column Filters
  columnFilters?: ColumnFilterOption[];
  onColumnFilterChange?: (key: string, value: string | null) => void;

  // Reset Action
  onResetAll?: () => void;
  className?: string;
  title?: string;
}

export default function DataFilterToolbar({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search by keyword...",
  sortValue = "newest",
  onSortChange,
  sortOptions = [
    { label: "Title (A-Z)", value: "a_z" },
    { label: "Title (Z-A)", value: "z_a" },
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "Progress (High → Low)", value: "progress_high" },
    { label: "Progress (Low → High)", value: "progress_low" },
  ],
  startDate = "",
  endDate = "",
  onDateChange,
  showDatePicker = true,
  columnFilters = [],
  onColumnFilterChange,
  onResetAll,
  className = "",
  title = "Filter & Sort Controls",
}: DataFilterToolbarProps) {
  // Active Filter Count
  let activeCount = 0;
  if (searchQuery.trim()) activeCount++;
  if (sortValue && sortValue !== "newest") activeCount++;
  if (startDate) activeCount++;
  if (endDate) activeCount++;
  columnFilters.forEach((f) => {
    if (f.value && f.value !== "all" && f.value !== "ALL") activeCount++;
  });

  return (
    <div className={`bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4 ${className}`}>
      {/* Top Bar: Title & Active Filters Count + Reset Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C82333]/10 text-[#C82333]">
            <Filter className="h-4 w-4" />
          </div>
          <span className="text-xs font-extrabold tracking-wide uppercase text-slate-800 dark:text-slate-200">
            {title}
          </span>
          {activeCount > 0 ? (
            <Badge className="bg-[#C82333] text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
              {activeCount} active filter{activeCount > 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full text-slate-400 border-slate-200 dark:border-slate-800 font-semibold">
              Showing All Records
            </Badge>
          )}
        </div>

        {/* Reset Filters Action Button */}
        {activeCount > 0 && onResetAll && (
          <Button
            size="sm"
            variant="outline"
            onClick={onResetAll}
            className="h-8 text-xs gap-1.5 text-[#C82333] border-[#C82333]/30 hover:bg-[#C82333]/10 hover:border-[#C82333]/50 font-bold transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Filters ({activeCount})
          </Button>
        )}
      </div>

      {/* Streamlined Controls Grid without redundant stacked label text */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Keyword Search Bar */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px] sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#C82333] focus:outline-none focus:ring-2 focus:ring-[#C82333]/20 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 2. Sort Order Selector */}
        {onSortChange && (
          <div className="min-w-[150px]">
            <Select value={sortValue} onValueChange={(val) => onSortChange(val as SortOption)}>
              <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-900 text-xs font-bold border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-[#C82333] shrink-0" />
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 3. Column-Wise Filters */}
        {columnFilters.map((col) => (
          <div key={col.key} className="min-w-[140px]">
            <Select
              value={col.value || "all"}
              onValueChange={(val) => onColumnFilterChange?.(col.key, val === "all" ? null : val)}
            >
              <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-900 text-xs font-semibold border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
                <span className="text-slate-400 font-normal mr-1">{col.label}:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold text-slate-500">
                  {col.label === "Category" ? "All Categories" : `All ${col.label}s`}
                </SelectItem>
                {col.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {/* 4. Custom Date Range Picker */}
        {showDatePicker && onDateChange && (
          <div className="flex-1 min-w-[280px]">
            <CustomDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => onDateChange(s, e)}
              showPresets={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Utility helper function for client-side array sorting & date filtering
 */
export function applyDataFilters<T extends Record<string, any>>(
  data: T[],
  params: {
    searchQuery?: string;
    searchFields?: (keyof T)[];
    sortValue?: SortOption;
    titleField?: keyof T;
    dateField?: keyof T;
    startDate?: string;
    endDate?: string;
    columnFilters?: Record<string, string | null | undefined>;
  }
): T[] {
  let result = [...data];

  // 1. Column filters
  if (params.columnFilters) {
    Object.entries(params.columnFilters).forEach(([key, val]) => {
      if (val && val !== "all" && val !== "ALL") {
        result = result.filter((item) => {
          const itemVal = item[key];
          if (itemVal === undefined || itemVal === null) return false;
          return String(itemVal).toLowerCase() === String(val).toLowerCase();
        });
      }
    });
  }

  // 2. Keyword Search
  if (params.searchQuery?.trim()) {
    const q = params.searchQuery.trim().toLowerCase();
    const fields = params.searchFields || [];
    result = result.filter((item) => {
      if (fields.length > 0) {
        return fields.some((f) => {
          const val = item[f];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        });
      }
      return Object.values(item).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      );
    });
  }

  // 3. Date Range Filter
  if (params.startDate || params.endDate) {
    const dField = params.dateField || ("createdAt" in (data[0] || {}) ? "createdAt" : "eventDate");
    const startTs = params.startDate ? new Date(params.startDate).getTime() : 0;
    const endTs = params.endDate ? new Date(`${params.endDate}T23:59:59`).getTime() : Infinity;

    result = result.filter((item) => {
      const rawDate = item[dField];
      if (!rawDate) return false;
      const ts = new Date(rawDate).getTime();
      return ts >= startTs && ts <= endTs;
    });
  }

  // 4. Sorting (A-Z, Z-A, Newest, Oldest, Progress)
  if (params.sortValue) {
    const tField = params.titleField || ("title" in (data[0] || {}) ? "title" : "name" in (data[0] || {}) ? "name" : ("firstName" in (data[0] || {}) ? "firstName" : "id"));
    const dField = params.dateField || ("createdAt" in (data[0] || {}) ? "createdAt" : "eventDate");

    result.sort((a, b) => {
      if (params.sortValue === "a_z") {
        const valA = String(a[tField] || "").toLowerCase();
        const valB = String(b[tField] || "").toLowerCase();
        return valA.localeCompare(valB);
      }
      if (params.sortValue === "z_a") {
        const valA = String(a[tField] || "").toLowerCase();
        const valB = String(b[tField] || "").toLowerCase();
        return valB.localeCompare(valA);
      }
      if (params.sortValue === "newest") {
        const tsA = new Date(a[dField] || 0).getTime();
        const tsB = new Date(b[dField] || 0).getTime();
        return tsB - tsA;
      }
      if (params.sortValue === "oldest") {
        const tsA = new Date(a[dField] || 0).getTime();
        const tsB = new Date(b[dField] || 0).getTime();
        return tsA - tsB;
      }
      if (params.sortValue === "progress_high") {
        const progA = Number(a.progress || a.score || 0);
        const progB = Number(b.progress || b.score || 0);
        return progB - progA;
      }
      if (params.sortValue === "progress_low") {
        const progA = Number(a.progress || a.score || 0);
        const progB = Number(b.progress || b.score || 0);
        return progA - progB;
      }
      return 0;
    });
  }

  return result;
}
