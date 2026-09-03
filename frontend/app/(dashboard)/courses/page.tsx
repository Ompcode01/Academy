"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseFilters, { CourseSortOption } from "@/components/courses/CourseFilters";
import CourseTable from "@/components/courses/CourseTable";
import CourseCards from "@/components/courses/CourseCards";
import CreateCourseModal from "@/components/courses/CreateCourseModal";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/lib/rbac";
import RoleGate from "@/components/auth/RoleGate";
import { getCourses, type Course, deleteCourse, updateCourse } from "@/services/api/course.service";
import { getMyEnrollments, UserEnrollmentItem } from "@/services/api/progress.service";
import toast from "react-hot-toast";
import HarbingerConfirmModal from "@/components/common/HarbingerConfirmModal";

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userEnrollments, setUserEnrollments] = useState<UserEnrollmentItem[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; description: string } | null>(null);
  const [statusCounts, setStatusCounts] = useState<{
    published: number;
    draft: number;
    archived: number;
    all: number;
  }>({
    published: 0,
    draft: 0,
    archived: 0,
    all: 0,
  });

  // Filter States
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>("PUBLISHED");
  const [sortValue, setSortValue] = useState<CourseSortOption>("newest");

  const pageSize = 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCoursesList = async () => {
    try {
      setLoading(true);
      const [res, summaryRes, myEnrolls] = await Promise.all([
        getCourses({
          search: debouncedSearch,
          categoryId,
          departmentId,
          status,
          page: currentPage,
          limit: pageSize,
        }),
        getCourses({ limit: 1000, status: "ALL" }),
        getMyEnrollments(),
      ]);

      if (res?.success) {
        setCourses(res.data.courses || []);
        setTotalCourses(res.data.total || 0);
      }
      if (summaryRes?.success && Array.isArray(summaryRes.data.courses)) {
        const allList: Course[] = summaryRes.data.courses;
        setStatusCounts({
          published: allList.filter((c) => c.status === "PUBLISHED").length,
          draft: allList.filter((c) => c.status === "DRAFT").length,
          archived: allList.filter((c) => c.status === "ARCHIVED").length,
          all: allList.length,
        });
      }
      setUserEnrollments(myEnrolls || []);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesList();
  }, [currentPage, debouncedSearch, categoryId, departmentId, status]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string | null) => {
    setCategoryId(value ? Number(value) : undefined);
    setCurrentPage(1);
  };

  const handleDepartmentChange = (value: string | null) => {
    setDepartmentId(value ? Number(value) : undefined);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string | null) => {
    setStatus(value || undefined);
    setCurrentPage(1);
  };

  const handleSortChange = (value: CourseSortOption) => {
    setSortValue(value);
  };

  const handleResetAll = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId(undefined);
    setDepartmentId(undefined);
    setStatus("PUBLISHED");
    setSortValue("newest");
    setCurrentPage(1);
  };

  const handleEdit = (id: number) => {
    router.push(`/courses/create?id=${id}`);
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleToggleStatus = async (id: number, newStatus: "PUBLISHED" | "ARCHIVED") => {
    try {
      setLoading(true);
      const res = await updateCourse(id, { status: newStatus });
      if (res?.success) {
        toast.success(
          `Course #${id} marked as ${
            newStatus === "PUBLISHED" ? "Active (Published)" : "Inactive (Archived)"
          }!`
        );
        await fetchCoursesList();
      } else {
        toast.error("Failed to update course status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating course status.");
    } finally {
      setLoading(false);
    }
  };

  // Client-side sorting on loaded courses
  const sortedCourses = [...courses].sort((a, b) => {
    if (sortValue === "a_z") {
      return (a.title || "").localeCompare(b.title || "");
    }
    if (sortValue === "z_a") {
      return (b.title || "").localeCompare(a.title || "");
    }
    if (sortValue === "newest") {
      const getTs = (c: Course) =>
        Math.max(
          (c as any).updatedAt ? new Date((c as any).updatedAt).getTime() : 0,
          c.createdAt ? new Date(c.createdAt).getTime() : 0,
          Number(c.id || 0)
        );
      return getTs(b) - getTs(a);
    }
    if (sortValue === "oldest") {
      const getTs = (c: Course) =>
        Math.max(
          (c as any).updatedAt ? new Date((c as any).updatedAt).getTime() : 0,
          c.createdAt ? new Date(c.createdAt).getTime() : 0,
          Number(c.id || 0)
        );
      return getTs(a) - getTs(b);
    }
    return 0;
  });

  return (
    <div className="p-6 space-y-6 max-w-[100vw] overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Academy Curriculum Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.role === ROLES.LEARNER
              ? "Explore and discover available learning programs and courses across your organization."
              : "Manage, classify, and organize all learning courses in the academy database."}
          </p>
        </div>
        <RoleGate allowed={["ADMIN", "SUPER_ADMIN", "TEACHER"]}>
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <Button
              onClick={() => router.push("/sessions")}
              className="gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold hover:opacity-90 shadow-md"
            >
              <Video className="h-4 w-4" />
              Add session
            </Button>
            <Button
              onClick={() => router.push("/courses/create")}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </div>
        </RoleGate>
      </div>

      {/* Active, Draft, Inactive, and All Courses Status Tabs with Scores (Strictly for Admin/Teacher/SuperAdmin) */}
      <RoleGate allowed={["ADMIN", "SUPER_ADMIN", "TEACHER"]}>
        <div className="flex flex-wrap items-center gap-2.5 pb-1">
          <button
            onClick={() => handleStatusChange("PUBLISHED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              status === "PUBLISHED"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Active Courses
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold ml-1">
              {statusCounts.published}
            </span>
          </button>

          <button
            onClick={() => handleStatusChange("DRAFT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              status === "DRAFT"
                ? "bg-slate-500/15 text-slate-800 dark:text-slate-200 border border-slate-500/40 shadow-xs"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400 inline-block" />
            Draft Courses
            <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold ml-1">
              {statusCounts.draft}
            </span>
          </button>

          <button
            onClick={() => handleStatusChange("ARCHIVED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              status === "ARCHIVED"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
            Inactive Courses (Archived)
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold ml-1">
              {statusCounts.archived}
            </span>
          </button>

          <button
            onClick={() => handleStatusChange(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              !status
                ? "bg-primary/15 text-primary border border-primary/40 shadow-xs"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
            }`}
          >
            All Courses
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold ml-1">
              {statusCounts.all}
            </span>
          </button>
        </div>
      </RoleGate>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <CourseFilters
          searchQuery={search}
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          onDepartmentChange={handleDepartmentChange}
          onStatusChange={handleStatusChange}
          onSortChange={handleSortChange}
          onResetAll={handleResetAll}
          sortValue={sortValue}
          statusValue={status}
        />
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 border border-border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">Fetching dynamically scoped courses...</p>
        </div>
      ) : user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN ? (
        <CourseTable
          courses={sortedCourses}
          currentPage={currentPage}
          totalCourses={totalCourses}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <CourseCards
          courses={sortedCourses}
          userEnrollments={userEnrollments}
          currentPage={currentPage}
          totalCourses={totalCourses}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Quick Creation Form Modal */}
      <CreateCourseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchCoursesList}
      />

      {/* Harbinger Branded Course Deletion Confirmation Modal */}
      {(() => {
        const targetCourse = courses.find((c) => Number(c.id) === deleteConfirmId);
        const isArchived = targetCourse?.status === "ARCHIVED" || targetCourse?.isActive === false;
        return (
          <HarbingerConfirmModal
            open={deleteConfirmId !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteConfirmId(null);
            }}
            title={
              isArchived
                ? "Are you sure you want to delete this course?"
                : "Archive Course?"
            }
            description={
              isArchived
                ? "This course will be permanently removed from the catalog database for all users."
                : "This course will be archived and safely stored in the catalog archive."
            }
            confirmLabel={isArchived ? "Delete Course" : "Archive Course"}
            cancelLabel="Cancel"
            variant="danger"
            onConfirm={async () => {
              if (deleteConfirmId !== null) {
                const idToDelete = deleteConfirmId;
                setDeleteConfirmId(null);
                try {
                  const res = await deleteCourse(idToDelete, isArchived);
                  if (res?.success) {
                    setSuccessModal({
                      open: true,
                      title: isArchived ? "Course permanently deleted" : "Course archived successfully",
                      description: isArchived
                        ? "This course has been permanently removed from the catalog database for all users."
                        : "This course has been archived and safely stored in the catalog archive.",
                    });
                    fetchCoursesList();
                  } else {
                    toast.error(res?.message || "Failed to delete course");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to delete course due to role authorization restrictions.");
                }
              }
            }}
          />
        );
      })()}

      {/* Harbinger Branded Success Popup Modal (No Cancel Button) */}
      {successModal && (
        <HarbingerConfirmModal
          open={successModal.open}
          onOpenChange={(open) => {
            if (!open) setSuccessModal(null);
          }}
          title={successModal.title}
          description={successModal.description}
          confirmLabel="OK"
          showCancelButton={false}
          variant="success"
          autoCloseMs={4000}
        />
      )}
    </div>
  );
}
