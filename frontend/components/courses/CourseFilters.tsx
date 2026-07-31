"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { getCategories, type Category } from "@/services/api/course.service";
import { getDepartments, type Department } from "@/services/api/org.service";
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
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Technical", isActive: true },
    { id: 2, name: "Management", isActive: true },
    { id: 3, name: "Soft Skills", isActive: true },
    { id: 4, name: "HR", isActive: true },
  ]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, departmentCode: "ENG", departmentName: "Engineering", isActive: true, createdAt: "", updatedAt: "" },
    { id: 2, departmentCode: "HR", departmentName: "Human Resources", isActive: true, createdAt: "", updatedAt: "" },
    { id: 3, departmentCode: "MGT", departmentName: "Management", isActive: true, createdAt: "", updatedAt: "" },
  ]);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [catRes, deptRes] = await Promise.all([
          getCategories(),
          getDepartments(),
        ]);
        if (catRes?.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
          setCategories(catRes.data);
        }
        if (deptRes) {
          const depts = deptRes.data || deptRes;
          if (Array.isArray(depts) && depts.length > 0) {
            setDepartments(depts);
          }
        }
      } catch (err) {
        console.error("Failed to load filter dynamic options:", err);
      }
    }
    loadFilterOptions();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by course name or description..."
          onChange={(e) => onSearch?.(e.target.value)}
          className="h-9 w-[260px] rounded-lg border border-border bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Category Filter */}
      <Select onValueChange={(val) => onCategoryChange?.(val === "all" ? null : val)} defaultValue="all">
        <SelectTrigger className="h-9 w-[150px] bg-card text-sm">
          <span className="mr-1 text-muted-foreground">Category</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={String(cat.id)}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Department Filter */}
      <Select onValueChange={(val) => onDepartmentChange?.(val === "all" ? null : val)} defaultValue="all">
        <SelectTrigger className="h-9 w-[160px] bg-card text-sm">
          <span className="mr-1 text-muted-foreground">Department</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={String(dept.id)}>
              {dept.departmentCode}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select onValueChange={(val) => onStatusChange?.(val === "all" ? null : val)} defaultValue="all">
        <SelectTrigger className="h-9 w-[130px] bg-card text-sm">
          <span className="mr-1 text-muted-foreground">Status</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="PUBLISHED">Published</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="ARCHIVED">Archived</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset button indicator */}
      <Button variant="outline" size="sm" className="h-9 gap-2">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </Button>
    </div>
  );
}
