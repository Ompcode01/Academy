"use client";

import React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";

interface CustomDateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (start: string, end: string) => void;
  className?: string;
  showPresets?: boolean;
}

export default function CustomDateRangePicker({
  startDate = "",
  endDate = "",
  onChange,
  className = "",
  showPresets = true,
}: CustomDateRangePickerProps) {
  const hasSelected = !!(startDate || endDate);

  const setPreset = (days: number | "today" | "month" | "all") => {
    if (days === "all") {
      onChange("", "");
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (days === "today") {
      onChange(todayStr, todayStr);
    } else if (days === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      onChange(firstDay, todayStr);
    } else if (typeof days === "number") {
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - days);
      onChange(pastDate.toISOString().split("T")[0], todayStr);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Inline Date Range Controls Container (No Popups) */}
      <div
        className={`flex items-center gap-1.5 h-9.5 px-3 rounded-xl border bg-white dark:bg-slate-900 shadow-sm transition-all ${
          hasSelected
            ? "border-[#C82333]/70 ring-2 ring-[#C82333]/15"
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
      >
        <CalendarIcon className="h-3.5 w-3.5 text-[#C82333] shrink-0" />
        
        {/* Inline Start Date */}
        <div className="flex-1 flex items-center min-w-0">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate)}
            className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            title="Start Date"
          />
        </div>

        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase shrink-0">to</span>

        {/* Inline End Date */}
        <div className="flex-1 flex items-center min-w-0">
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChange(startDate, e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            title="End Date"
          />
        </div>

        {/* Clear Dates Action */}
        {hasSelected && (
          <button
            onClick={() => onChange("", "")}
            className="text-slate-400 hover:text-[#C82333] transition-colors shrink-0 p-0.5"
            title="Clear date range"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Quick Presets Pills (Directly Visible Inline) */}
      {showPresets && (
        <div className="flex flex-wrap items-center gap-1">
          {[
            { label: "Today", action: () => setPreset("today") },
            { label: "7 Days", action: () => setPreset(7) },
            { label: "30 Days", action: () => setPreset(30) },
            { label: "This Month", action: () => setPreset("month") },
            { label: "All Time", action: () => setPreset("all") },
          ].map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={p.action}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 hover:bg-[#C82333] hover:text-white dark:bg-slate-800 dark:hover:bg-[#C82333] text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
