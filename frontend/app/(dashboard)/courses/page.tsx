"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseFilters from "@/components/courses/CourseFilters";
import CourseTable, { type CourseItem } from "@/components/courses/CourseTable";
import Link from "next/link";

const mockCourses: CourseItem[] = [
  {
    id: 1,
    title: "Java Fundamentals",
    code: "DPU-JAVA-001",
    category: "Technical",
    categoryType: "technical",
    department: "DPU",
    instructor: "Priyanka Sharma",
    instructorInitials: "PS",
    learners: 125,
    status: "Published",
  },
  {
    id: 2,
    title: "Leadership Essentials",
    code: "MGMT-LEAD-002",
    category: "Management",
    categoryType: "management",
    department: "Management",
    instructor: "Rahul Varma",
    instructorInitials: "RV",
    learners: 78,
    status: "Published",
  },
  {
    id: 3,
    title: "Effective Communication",
    code: "MGMT-COMM-003",
    category: "Soft Skills",
    categoryType: "soft-skills",
    department: "Management",
    instructor: "Anita Patil",
    instructorInitials: "AP",
    learners: 93,
    status: "Draft",
  },
  {
    id: 4,
    title: "Data Structures in Java",
    code: "DPU-JAVA-004",
    category: "Technical",
    categoryType: "technical",
    department: "DPU",
    instructor: "John D'Souza",
    instructorInitials: "JD",
    learners: 64,
    status: "Draft",
  },
  {
    id: 5,
    title: "HR Compliance Basics",
    code: "HR-COMP-005",
    category: "HR",
    categoryType: "hr",
    department: "HR",
    instructor: "Neha Kulkarni",
    instructorInitials: "NK",
    learners: 40,
    status: "Archived",
  },
];

export default function CoursesPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and organize all courses in the academy.
          </p>
        </div>
        <Link href="/courses/create">
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <CourseFilters />
      </div>

      {/* Table */}
      <CourseTable courses={mockCourses} />
    </div>
  );
}
