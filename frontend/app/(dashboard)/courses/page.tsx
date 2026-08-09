"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseFilters from "@/components/courses/CourseFilters";
import CourseTable from "@/components/courses/CourseTable";
import CourseCards from "@/components/courses/CourseCards";
import CreateCourseModal from "@/components/courses/CreateCourseModal";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/lib/rbac";
import RoleGate from "@/components/auth/RoleGate";
import { getCourses, type Course, deleteCourse } from "@/services/api/course.service";
import { getMyEnrollments, UserEnrollmentItem } from "@/services/api/progress.service";

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userEnrollments, setUserEnrollments] = useState<UserEnrollmentItem[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter States
  const [search, setSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);

  const pageSize = 5;

  const fetchCoursesList = async () => {
    try {
      setLoading(true);
      const [res, myEnrolls] = await Promise.all([
        getCourses({
          search,
          categoryId,
          departmentId,
          status,
          page: currentPage,
          limit: pageSize,
        }),
        getMyEnrollments(),
      ]);

      if (res?.success) {
        setCourses(res.data.courses || []);
        setTotalCourses(res.data.total || 0);
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
  }, [currentPage, search, categoryId, departmentId, status]);

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

  const handleEdit = (id: number) => {
    router.push(`/courses/create?id=${id}`);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this course from the directory?")) {
      try {
        const res = await deleteCourse(id);
        if (res?.success) {
          fetchCoursesList();
        } else {
          alert(res?.message || "Failed to delete course");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to delete course due to role authorization restrictions.");
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[100vw] overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Academy Curriculum Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage, classify, and organize all learning courses in the academy database.
          </p>
        </div>
        <RoleGate allowed={["ADMIN", "SUPER_ADMIN"]}>
          <Button
            onClick={() => router.push("/courses/create")}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 self-start sm:self-center"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </RoleGate>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <CourseFilters
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          onDepartmentChange={handleDepartmentChange}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 border border-border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">Fetching dynamically scoped courses...</p>
        </div>
      ) : user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN ? (
        <CourseTable
          courses={courses}
          currentPage={currentPage}
          totalCourses={totalCourses}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <CourseCards
          courses={courses}
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
    </div>
  );
}
