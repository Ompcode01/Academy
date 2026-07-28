"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CourseFiltersProps {
  onSearch?: (value: string) => void;
  onCategoryChange?: (value: string | null) => void;
  onDepartmentChange?: (value: string | null) => void;
  onStatusChange?: (value: string | null) => void;
}

export default function CourseFilters({
  onSearch,
  onCategoryChange,
  onDepartmentChange,
  onStatusChange,
}: CourseFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by course name or code..."
          onChange={(e) => onSearch?.(e.target.value)}
          className="h-9 w-[260px] rounded-lg border border-border bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Category Filter */}
      <Select onValueChange={onCategoryChange} defaultValue="all">
        <SelectTrigger className="h-9 w-[140px] bg-card text-sm">
          <span className="mr-1 text-muted-foreground">Category</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="technical">Technical</SelectItem>
          <SelectItem value="management">Management</SelectItem>
          <SelectItem value="soft-skills">Soft Skills</SelectItem>
          <SelectItem value="hr">HR</SelectItem>
        </SelectContent>
      </Select>

      {/* Department Filter */}
      <Select onValueChange={onDepartmentChange} defaultValue="all">
        <SelectTrigger className="h-9 w-[150px] bg-card text-sm">
          <span className="mr-1 text-muted-foreground">Department</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="dpu">DPU</SelectItem>
          <SelectItem value="management">Management</SelectItem>
          <SelectItem value="hr">HR</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select onValueChange={onStatusChange} defaultValue="all">
        <SelectTrigger className="h-9 w-[130px] bg-card text-sm">
          <span className="mr-1 text-muted-foreground">Status</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      {/* Filters Button */}
      <Button variant="outline" size="sm" className="h-9 gap-2">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </Button>
    </div>
  );
}
