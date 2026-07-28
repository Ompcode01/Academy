"use client";

import { useAuthStore } from "@/store/auth.store";
import { ROLES, canManageCourses } from "@/lib/rbac";
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
import type { Course } from "@/services/api/course.service";

const categoryColors: Record<string, string> = {
  Technical: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30",
  Management: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/30",
  "Soft Skills": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30",
  HR: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30",
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  ARCHIVED: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30",
};

interface CourseTableProps {
  courses: Course[];
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
  totalCourses = 0,
  pageSize = 10,
  onPageChange,
  onEdit,
  onDelete,
}: CourseTableProps) {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || ROLES.GUEST;
  const isAuthorizedToManage = canManageCourses(userRole);

  const totalPages = Math.ceil(totalCourses / pageSize);
  const startItem = totalCourses === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCourses);

  const getInitials = (first?: string, last?: string) => {
    if (first && last) return (first[0] + last[0]).toUpperCase();
    if (first) return first.slice(0, 2).toUpperCase();
    return "TR";
  };

  return (
    <div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto w-full max-w-full">
        <Table className="min-w-[800px] w-full">
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
                Level
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              {isAuthorizedToManage && (
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAuthorizedToManage ? 7 : 6} className="text-center py-8 text-muted-foreground text-sm">
                  No courses found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => {
                const instructorName = course.creator
                  ? `${course.creator.firstName} ${course.creator.lastName}`
                  : "Assigned Instructor";
                const initials = getInitials(course.creator?.firstName, course.creator?.lastName);
                const categoryName = course.category?.name || "Uncategorized";
                const departmentCode = course.department?.departmentCode || "Global";

                return (
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
                          ID: {course.id.toString()} • {course.level || "Beginner"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium border ${
                          categoryColors[categoryName] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {departmentCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{instructorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {course.level || "Beginner"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium border ${
                          statusColors[course.status] || "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {course.status}
                      </Badge>
                    </TableCell>
                    {isAuthorizedToManage && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onEdit?.(Number(course.id))}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDelete?.(Number(course.id))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalCourses > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {startItem} to {endItem} of {totalCourses} courses
          </p>
          <div className="flex items-center justify-center gap-1">
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
      )}
    </div>
  );
}
