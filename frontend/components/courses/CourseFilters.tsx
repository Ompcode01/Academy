"use client";

import { useEffect, useState } from "react";
import { getCategories, type Category } from "@/services/api/course.service";
import { getDepartments, type Department } from "@/services/api/org.service";
import DataFilterToolbar, { SortOption } from "@/components/common/DataFilterToolbar";

export type CourseSortOption = "a_z" | "z_a" | "newest" | "oldest";

interface CourseFiltersProps {
  onSearch?: (value: string) => void;
  onCategoryChange?: (value: string | null) => void;
  onDepartmentChange?: (value: string | null) => void;
  onStatusChange?: (value: string | null) => void;
  onSortChange?: (value: CourseSortOption) => void;
  onDateChange?: (start?: string, end?: string) => void;
  onResetAll?: () => void;
  searchQuery?: string;
  sortValue?: CourseSortOption;
  startDate?: string;
  endDate?: string;
}

export default function CourseFilters({
  onSearch,
  onCategoryChange,
  onDepartmentChange,
  onStatusChange,
  onSortChange,
  onDateChange,
  onResetAll,
  searchQuery = "",
  sortValue = "newest",
  startDate = "",
  endDate = "",
}: CourseFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Technical", isActive: true },
    { id: 2, name: "Soft Skill", isActive: true },
    { id: 3, name: "Process/Compliances", isActive: true },
    { id: 4, name: "Leadership (Futurefit, MCC, Basecamp)", isActive: true },
  ]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, departmentCode: "ABU", departmentName: "Across BUs", isActive: true, createdAt: "", updatedAt: "" },
    { id: 2, departmentCode: "TSC", departmentName: "Tech Services- Core", isActive: true, createdAt: "", updatedAt: "" },
    { id: 3, departmentCode: "TSD", departmentName: "Tech Services - DPU", isActive: true, createdAt: "", updatedAt: "" },
    { id: 4, departmentCode: "CS", departmentName: "Content Services", isActive: true, createdAt: "", updatedAt: "" },
    { id: 5, departmentCode: "BE", departmentName: "Business Enablers", isActive: true, createdAt: "", updatedAt: "" },
  ]);

  const [catFilter, setCatFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    <DataFilterToolbar
      title="Course Catalog Search & Filters"
      searchQuery={searchQuery}
      onSearchChange={onSearch}
      searchPlaceholder="Search courses by name or description..."
      sortValue={sortValue as SortOption}
      onSortChange={(val) => onSortChange?.(val as CourseSortOption)}
      sortOptions={[
        { label: "Course Title (A-Z)", value: "a_z" },
        { label: "Course Title (Z-A)", value: "z_a" },
        { label: "Newest Created", value: "newest" },
        { label: "Oldest Created", value: "oldest" },
      ]}
      startDate={startDate}
      endDate={endDate}
      onDateChange={onDateChange}
      columnFilters={[
        {
          key: "category",
          label: "Category",
          value: catFilter,
          options: categories.map((c) => ({ label: c.name, value: String(c.id) })),
        },
        {
          key: "department",
          label: "BU",
          value: deptFilter,
          options: departments.map((d) => ({ label: `${d.departmentCode} - ${d.departmentName}`, value: String(d.id) })),
        },
        {
          key: "status",
          label: "Status",
          value: statusFilter,
          options: [
            { label: "Published", value: "PUBLISHED" },
            { label: "Draft", value: "DRAFT" },
            { label: "Archived", value: "ARCHIVED" },
          ],
        },
      ]}
      onColumnFilterChange={(key, val) => {
        if (key === "category") {
          setCatFilter(val || "all");
          onCategoryChange?.(val);
        }
        if (key === "department") {
          setDeptFilter(val || "all");
          onDepartmentChange?.(val);
        }
        if (key === "status") {
          setStatusFilter(val || "all");
          onStatusChange?.(val);
        }
      }}
      onResetAll={() => {
        setCatFilter("all");
        setDeptFilter("all");
        setStatusFilter("all");
        onCategoryChange?.(null);
        onDepartmentChange?.(null);
        onStatusChange?.(null);
        onSearch?.("");
        onSortChange?.("newest");
        onDateChange?.("", "");
        onResetAll?.();
      }}
    />
  );
}
