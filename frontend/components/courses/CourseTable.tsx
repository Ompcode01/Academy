"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Trash2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CourseItem {
  id: number;
  title: string;
  code: string;
  category: string;
  categoryType: "technical" | "management" | "soft-skills" | "hr";
  department: string;
  instructor: string;
  instructorInitials: string;
  learners: number;
  status: "Published" | "Draft" | "Archived";
}

const categoryColors: Record<string, string> = {
  technical: "bg-blue-100 text-blue-700 border-blue-200",
  management: "bg-purple-100 text-purple-700 border-purple-200",
  "soft-skills": "bg-emerald-100 text-emerald-700 border-emerald-200",
  hr: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusColors: Record<string, string> = {
  Published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Archived: "bg-amber-100 text-amber-700 border-amber-200",
};

interface CourseTableProps {
  courses: CourseItem[];
  currentPage?: number;
  totalCourses?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function CourseTable({
  courses,
  currentPage = 1,
  totalCourses = 24,
  pageSize = 5,
  onPageChange,
  onEdit,
  onDelete,
}: CourseTableProps) {
  const totalPages = Math.ceil(totalCourses / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCourses);

  return (
    <div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5">
                Course
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Department
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Instructor
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Learners
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow
                key={course.id}
                className="border-border transition-colors hover:bg-muted/20"
              >
                <TableCell className="pl-5">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {course.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {course.code}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${
                      categoryColors[course.categoryType] || ""
                    }`}
                  >
                    {course.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {course.department}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                        {course.instructorInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{course.instructor}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {course.learners}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${
                      statusColors[course.status] || ""
                    }`}
                  >
                    {course.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onEdit?.(course.id)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete?.(course.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalCourses} courses
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            disabled={currentPage === 1}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
            (page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="icon-xs"
                onClick={() => onPageChange?.(page)}
                className="text-xs"
              >
                {page}
              </Button>
            )
          )}
          {totalPages > 5 && (
            <span className="px-1 text-xs text-muted-foreground">...</span>
          )}
          <Button
            variant="outline"
            size="icon-xs"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
