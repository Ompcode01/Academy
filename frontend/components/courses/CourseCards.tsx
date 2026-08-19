"use client";

import { useAuthStore } from "@/store/auth.store";
import { ROLES, canManageCourses } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Course } from "@/services/api/course.service";
import { useRouter } from "next/navigation";

import { getCourseDisplayTitle } from "@/lib/courseTitleHelper";

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

interface CourseCardsProps {
  courses: Course[];
  userEnrollments?: Array<{ courseId: number; progress: number; status: string }>;
  currentPage?: number;
  totalCourses?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function CourseCards({
  courses,
  userEnrollments = [],
  currentPage = 1,
  totalCourses = 0,
  pageSize = 10,
  onPageChange,
  onEdit,
  onDelete,
}: CourseCardsProps) {
  const router = useRouter();
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

  const handleCardClick = (courseId: number) => {
    router.push(`/courses/${courseId}/preview`);
  };

  return (
    <div className="space-y-6">
      {courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border border-border bg-card rounded-xl">
          No courses found matching filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map((course) => {
            const instructorName = course.creator
              ? `${course.creator.firstName} ${course.creator.lastName}`
              : "Assigned Instructor";
            const initials = getInitials(course.creator?.firstName, course.creator?.lastName);
            const categoryName = course.category?.name || "Uncategorized";
            const departmentCode = course.department?.departmentCode || "Global";
            const thumbnail =
              (course as any).thumbnail ||
              "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80";

            const matchedEnrollment = userEnrollments.find((e) => Number(e.courseId) === Number(course.id));

            return (
              <div
                key={course.id}
                onClick={() => handleCardClick(Number(course.id))}
                className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col overflow-hidden group cursor-pointer"
              >
                {/* Thumbnail Cover Image */}
                <div className="h-32 w-full relative bg-muted overflow-hidden shrink-0">
                  <img
                    src={thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Status Overlay */}
                  <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded border ${
                    statusColors[course.status] || "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {course.status}
                  </span>
                  {/* Level Overlay */}
                  <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded">
                    {course.level || "Beginner"}
                  </span>

                  {/* Learner Progress Badge Overlay */}
                  {matchedEnrollment && (
                    <span className={
                      matchedEnrollment.status === "COMPLETED" || matchedEnrollment.progress === 100
                        ? "absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow"
                        : "absolute bottom-2 left-2 bg-amber-500/90 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded shadow"
                    }>
                      {matchedEnrollment.status === "COMPLETED" || matchedEnrollment.progress === 100
                        ? "✓ 100% Done"
                        : `${matchedEnrollment.progress}% Progress`}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* ID & Dept */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>ID: {course.id.toString()}</span>
                      <span>BU: {departmentCode}</span>
                    </div>

                    {/* Title */}
                    <h4
                      title={course.title}
                      className="text-sm font-bold text-[#212529] line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                    >
                      {getCourseDisplayTitle(course.title, (course as any).shortName)}
                    </h4>

                    {matchedEnrollment && (
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${matchedEnrollment.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="pt-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold border ${
                          categoryColors[categoryName] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {categoryName}
                      </Badge>
                    </div>
                  </div>

                  {/* Creator Info & Metadata */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2 shrink-0">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-[8px] font-semibold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-foreground font-semibold truncate max-w-[90px]" title={instructorName}>
                          {instructorName}
                        </span>
                        <span className={`text-[8px] font-extrabold px-1 rounded border uppercase shrink-0 ${
                          course.creatorInfo?.creatorRole === "SUPER_ADMIN"
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}>
                          {course.creatorInfo?.creatorRole === "SUPER_ADMIN" ? "SA" : "Admin"}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground truncate pl-6">
                        {course.creatorInfo?.creatorDepartment || departmentCode}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isAuthorizedToManage ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(Number(course.id));
                            }}
                            className="text-muted-foreground hover:text-primary"
                            title="Edit Course"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete?.(Number(course.id));
                            }}
                            className="text-muted-foreground hover:text-destructive"
                            title="Delete Course"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-primary text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
                          View &amp; Enroll &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
