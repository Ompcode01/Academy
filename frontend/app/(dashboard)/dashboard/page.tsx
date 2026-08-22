"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getCourses, type Course } from "@/services/api/course.service";
import { getDashboardStats, type DashboardStats } from "@/services/api/dashboard.service";
import {
  getRecentlyAccessedCourses,
  purgeDeletedRecentCourses,
  RecentCourseItem,
} from "@/services/api/recentAccess.service";
import { getMyEnrollments, UserEnrollmentItem } from "@/services/api/progress.service";
import { useEventsStore } from "@/store/events.store";
import { ROLES } from "@/lib/rbac";
import { formatCourseTitle } from "@/lib/utils";
import { List, BookOpen, CheckCircle2, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCalendar from "@/components/events/EventCalendar";
import AdminSubmissionsReview from "@/components/courses/builder/AdminSubmissionsReview";

const fullNameMap: Record<string, string> = {
  omprakash: "Omprakash Pandey",
  priyanka: "Priyanka Davhare",
  rahul: "Rahul Sharma",
  sneha: "Sneha Patil",
};

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userEnrollments, setUserEnrollments] = useState<UserEnrollmentItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Recent Access State
  const [recentlyAccessedPrograms, setRecentlyAccessedPrograms] = useState<RecentCourseItem[]>([]);

  // Events Store
  const { fetchEvents } = useEventsStore();

  const username = user?.username || "Guest";
  const fullName = fullNameMap[username.toLowerCase()] || username;
  const userRole = user?.role || ROLES.GUEST;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load courses (only PUBLISHED programs appear on main learner dashboard)
        const courseRes = await getCourses({ status: "PUBLISHED", limit: 100 });
        let activeCourses: Course[] = [];
        if (courseRes?.success && Array.isArray(courseRes.data.courses)) {
          activeCourses = courseRes.data.courses.filter((c: Course) => c.status === "PUBLISHED");
          setCourses(activeCourses);
        }

        // Load user enrollments & progress
        const myEnrolls = await getMyEnrollments();
        setUserEnrollments(myEnrolls);

        // Purge deleted courses from local recent access storage
        const activeIds = activeCourses.map((c) => Number(c.id));
        const cleanRecent = purgeDeletedRecentCourses(username, activeIds);
        setRecentlyAccessedPrograms(cleanRecent);

        // Load stats
        const statsRes = await getDashboardStats();
        if (statsRes?.success) {
          setStats(statsRes.data);
        }

        // Fetch DB events
        await fetchEvents();
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [fetchEvents, username]);

  // Sync user's recently accessed courses with live API course data
  useEffect(() => {
    const activeIds = courses.map((c) => Number(c.id));
    if (activeIds.length > 0) {
      const rawRecent = purgeDeletedRecentCourses(username, activeIds);
      const syncedRecent = rawRecent.map((recent) => {
        const liveMatch = courses.find((c) => Number(c.id) === Number(recent.id));
        if (liveMatch) {
          return {
            ...recent,
            title: liveMatch.title,
            category: liveMatch.category?.name || recent.category || "General",
            thumbnail: (liveMatch as any).thumbnail || recent.thumbnail,
            level: liveMatch.level || recent.level,
          };
        }
        return recent;
      });
      setRecentlyAccessedPrograms(syncedRecent);
    } else {
      setRecentlyAccessedPrograms(getRecentlyAccessedCourses(username));
    }
  }, [username, courses]);



  // Guest Preview Modal State
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Teacher / Admin Submissions Review Modal State
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

  const handleCourseClick = (courseId: number) => {
    if (userRole === ROLES.GUEST) {
      setShowGuestModal(true);
    } else {
      router.push(`/courses/${courseId}/preview`);
    }
  };

  // Computed Learner-Specific Progress and Enrollment Stats
  const enrolledCount = userEnrollments.length;
  const completedEnrollments = userEnrollments.filter(
    (e) => e.status === "COMPLETED" || Number(e.progress) >= 100
  );
  const inProgressEnrollments = userEnrollments.filter(
    (e) => e.status !== "COMPLETED" && Number(e.progress) < 100
  );
  const completedCount = completedEnrollments.length;
  const learnerAvgProgress =
    enrolledCount > 0
      ? Math.round(
        (userEnrollments.reduce((sum, e) => sum + (Number(e.progress) || 0), 0) /
          enrolledCount) *
        10
      ) / 10
      : 0;

  // Title by Role
  const dashboardTitleMap: Record<string, string> = {
    [ROLES.SUPER_ADMIN]: "Super Admin Dashboard",
    [ROLES.ADMIN]: "Business Unit Admin Dashboard",
    [ROLES.TEACHER]: "Educator Dashboard",
    [ROLES.LEARNER]: "Learner Dashboard",
    [ROLES.GUEST]: "Guest Catalog Preview",
  };

  const dashboardTitle = dashboardTitleMap[userRole] || "Dashboard Overview";

  return (
    <div className="p-6 space-y-6 select-none">
      {/* Top Banner & Stats Overview */}
      <div className="rounded-xl border border-[#E0E6ED] bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#212529]">
              {dashboardTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => router.push("/courses")}
              className="bg-[#C82333] hover:bg-[#C82333]/90 text-white font-bold text-xs shadow"
            >
              Explore Catalog →
            </Button>
          </div>
        </div>

        {/* Role-tailored Key Metrics */}
        <div className="pt-3 border-t border-[#E0E6ED]">
          {userRole === ROLES.LEARNER && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Enrolled Courses
                </span>
                <span className="text-2xl font-black text-[#212529]">
                  {enrolledCount}
                </span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Completed Courses
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {completedCount}
                </span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  My Avg Progress
                </span>
                <span className="text-2xl font-black text-[#C82333]">
                  {learnerAvgProgress}%
                </span>
              </div>
            </div>
          )}

          {userRole === ROLES.TEACHER && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Total Active Courses
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {stats?.publishedCoursesCount || courses.length || 0}
                </span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Enrolled Learners
                </span>
                <span className="text-2xl font-black text-[#212529]">
                  {stats?.activeEnrollments || stats?.employeesCount || 0}
                </span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Pending Evaluations
                </span>
                <span className="text-2xl font-black text-amber-600">
                  {(stats as any)?.pendingAssignmentsCount ?? 0}
                </span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Approved Evaluations
                </span>
                <span className="text-2xl font-black text-blue-600">
                  {(stats as any)?.approvedAssignmentsCount ?? 0}
                </span>
              </div>
            </div>
          )}

          {userRole === ROLES.ADMIN && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Total Active Courses
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {courses.length}
                </span>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Business Unit Learners
                </span>
                <span className="text-2xl font-black text-[#212529]">
                  {stats?.employeesCount ?? 0}
                </span>
              </div>
            </div>
          )}

          {userRole === ROLES.SUPER_ADMIN && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Total Active Courses
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {stats?.publishedCoursesCount ?? courses.length ?? 0}
                </span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Total Learners
                </span>
                <span className="text-2xl font-black text-[#212529]">
                  {stats?.employeesCount ?? 0}
                </span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Active Business Units
                </span>
                <span className="text-2xl font-black text-[#212529]">
                  {stats?.departmentsCount ?? 5}
                </span>
              </div>
            </div>
          )}

          {userRole === ROLES.GUEST && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Catalog Courses
                </span>
                <span className="text-2xl font-black text-[#212529]">
                  {stats?.publishedCoursesCount || courses.length || 0}
                </span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Business Units
                </span>
                <span className="text-2xl font-black text-[#212529]">
                  {stats?.departmentsCount ?? 5}
                </span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-xs font-bold uppercase text-[#6C757D] tracking-wider mb-1">
                  Access Level
                </span>
                <span className="text-2xl font-black text-[#C82333]">
                  Preview Only
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1. Recently Accessed Programs Section (DYNAMIC & User Specific) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#E0E6ED] pb-1.5">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-[#C82333]" />
            <h3 className="text-sm font-bold tracking-wide text-[#212529]">
              Recently accessed Programs
            </h3>
          </div>
          {recentlyAccessedPrograms.length > 0 && (
            <span className="text-[10px] font-bold text-[#6C757D]">
              {recentlyAccessedPrograms.length} Recently Opened
            </span>
          )}
        </div>

        {recentlyAccessedPrograms.length === 0 ? (
          /* CLEAN EMPTY STATE for First-Time Admin / User */
          <div className="bg-white rounded-xl border border-dashed border-[#E0E6ED] p-6 text-center flex flex-col items-center justify-center space-y-1.5 shadow-sm">
            <BookOpen className="h-7 w-7 text-[#6C757D]/30" />
            <p className="text-xs font-bold text-[#212529]">No recently accessed programs yet.</p>
            <p className="text-[11px] text-[#6C757D]">
              Select and open any course from the catalog below to access it quickly here.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
            {recentlyAccessedPrograms.map((prog) => {
              const matchedCourse = courses.find((c) => Number(c.id) === Number(prog.id));
              const thumbnail =
                prog.thumbnail ||
                (matchedCourse as any)?.thumbnail ||
                "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80";
              const level = prog.level || matchedCourse?.level || "Beginner";

              const matchedEnrollment = userEnrollments.find((e) => Number(e.courseId) === Number(prog.id));

              return (
                <div
                  key={prog.id}
                  onClick={() => handleCourseClick(Number(prog.id))}
                  className="w-52 shrink-0 bg-white rounded-xl border border-[#E0E6ED] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col overflow-hidden group cursor-pointer"
                >
                  {/* Thumbnail Cover Image */}
                  <div className="h-28 w-full relative bg-slate-100 overflow-hidden">
                    <img
                      src={thumbnail}
                      alt={prog.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      {level}
                    </span>

                    {/* Progress Badge overlay */}
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

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <h4 className="text-xs font-bold text-[#212529] line-clamp-2 leading-snug" title={prog.title}>
                      {formatCourseTitle(prog.title)}
                    </h4>
                    {matchedEnrollment && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${matchedEnrollment.progress}%` }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-[#6C757D] font-semibold">
                      <span>{prog.category || "General"}</span>
                      <span className="text-[#C82333] font-bold">
                        {userRole === ROLES.GUEST ? "Preview Only" : "View Course →"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1.5. Dedicated My Enrolled Courses & Completed Courses Sections for Learners */}
      {userRole === ROLES.LEARNER && (
        <div className="space-y-6">
          {/* A. IN PROGRESS COURSES SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E0E6ED] pb-1.5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#C82333]" />
                <h3 className="text-sm font-bold tracking-wide text-[#212529]">
                  In-Progress Enrolled Courses
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#6C757D]">
                {inProgressEnrollments.length} Active Courses
              </span>
            </div>

            {inProgressEnrollments.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-[#E0E6ED] p-5 text-center flex flex-col items-center justify-center space-y-1 shadow-sm">
                <BookOpen className="h-6 w-6 text-[#6C757D]/30" />
                <p className="text-xs font-bold text-[#212529]">No active in-progress courses.</p>
                <p className="text-[11px] text-[#6C757D]">
                  Browse the catalog below to enroll in new courses.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
                {inProgressEnrollments.map((enr) => {
                  const matchedCourse = courses.find((c) => Number(c.id) === Number(enr.courseId));
                  const courseTitle = enr.course?.title || matchedCourse?.title || `Course #${enr.courseId}`;
                  const thumbnail =
                    enr.course?.thumbnail ||
                    (matchedCourse as any)?.thumbnail ||
                    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80";
                  const level = enr.course?.level || matchedCourse?.level || "Beginner";
                  const categoryName = enr.course?.category?.name || matchedCourse?.category?.name || "General";

                  return (
                    <div
                      key={enr.courseId}
                      onClick={() => handleCourseClick(Number(enr.courseId))}
                      className="w-56 shrink-0 bg-white rounded-xl border border-[#E0E6ED] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col overflow-hidden group cursor-pointer"
                    >
                      <div className="h-28 w-full relative bg-slate-100 overflow-hidden">
                        <img
                          src={thumbnail}
                          alt={courseTitle}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded">
                          {level}
                        </span>
                        <span className="absolute bottom-2 left-2 bg-amber-500/90 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                          {enr.progress}% Completed
                        </span>
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <h4 className="text-xs font-bold text-[#212529] line-clamp-2 leading-snug">
                          {courseTitle}
                        </h4>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                            <span>Progress</span>
                            <span className="font-extrabold text-[#C82333]">{enr.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="bg-[#C82333] h-full transition-all"
                              style={{ width: `${enr.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#6C757D] font-semibold pt-1 border-t border-slate-100">
                          <span>{categoryName}</span>
                          <span className="text-[#C82333] font-bold">Continue →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. COMPLETED COURSES SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E0E6ED] pb-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold tracking-wide text-[#212529]">
                  Completed Courses &amp; Certificates
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 font-mono">
                {completedEnrollments.length} Completed
              </span>
            </div>

            {completedEnrollments.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-[#E0E6ED] p-5 text-center flex flex-col items-center justify-center space-y-1 shadow-sm">
                <Award className="h-6 w-6 text-emerald-500/30" />
                <p className="text-xs font-bold text-[#212529]">No completed courses yet.</p>
                <p className="text-[11px] text-[#6C757D]">
                  Finish 100% of modules and assignments in an active course to claim your certificate here.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
                {completedEnrollments.map((enr) => {
                  const matchedCourse = courses.find((c) => Number(c.id) === Number(enr.courseId));
                  const courseTitle = enr.course?.title || matchedCourse?.title || `Course #${enr.courseId}`;
                  const thumbnail =
                    enr.course?.thumbnail ||
                    (matchedCourse as any)?.thumbnail ||
                    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80";
                  const categoryName = enr.course?.category?.name || matchedCourse?.category?.name || "General";

                  return (
                    <div
                      key={enr.courseId}
                      onClick={() => handleCourseClick(Number(enr.courseId))}
                      className="w-56 shrink-0 bg-white rounded-xl border border-emerald-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col overflow-hidden group cursor-pointer"
                    >
                      <div className="h-28 w-full relative bg-slate-100 overflow-hidden">
                        <img
                          src={thumbnail}
                          alt={courseTitle}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow">
                          ✓ 100% Completed
                        </span>
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <h4 className="text-xs font-bold text-[#212529] line-clamp-2 leading-snug">
                          {courseTitle}
                        </h4>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-600">
                            <span>Status</span>
                            <span className="font-extrabold">Passed</span>
                          </div>
                          <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-full" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#6C757D] font-semibold pt-1 border-t border-slate-100">
                          <span>{categoryName}</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Award className="h-3 w-3" /> Certificate →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Recently Added Programs & Business Unit Mapped Courses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#E0E6ED] pb-1.5">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-[#C82333]" />
            <h3 className="text-sm font-bold tracking-wide text-[#212529]">
              {userRole === ROLES.LEARNER
                ? "My Business Unit Courses"
                : userRole === ROLES.TEACHER
                  ? "Assigned & Business Unit Programs"
                  : userRole === ROLES.ADMIN
                    ? "Business Unit Program Catalog"
                    : userRole === ROLES.SUPER_ADMIN
                      ? "All Programs"
                      : "Featured Catalog Programs"}
              {" "}
              <span className="text-[#6C757D] font-bold">({courses.length})</span>
            </h3>
          </div>
          {user?.departmentId && (
            <span className="text-[10px] font-bold bg-[#C82333]/10 text-[#C82333] px-2.5 py-0.5 rounded border border-[#C82333]/20">
              Business Unit: {{ 1: "Tech Services- Core (TSC)", 2: "Tech Services - DPU (TSD)", 3: "Content Services (CS)", 4: "Business Enablers (BE)" }[user.departmentId] || `BU #${user.departmentId}`}
            </span>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E0E6ED] border-dashed py-8 flex flex-col items-center justify-center text-[#6C757D] shadow-sm">
            <BookOpen className="h-8 w-8 text-[#6C757D]/50 mb-2" />
            <p className="text-xs font-bold text-[#212529]">No published courses available for your Business Unit yet.</p>
            <p className="text-[11px] text-[#6C757D] mt-0.5">Courses published by Admins for your Business Unit will appear here.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
            {courses.map((prog) => {
              const matchedEnrollment = userEnrollments.find((e) => Number(e.courseId) === Number(prog.id));

              return (
                <div
                  key={prog.id}
                  onClick={() => handleCourseClick(Number(prog.id))}
                  className="w-52 shrink-0 bg-white rounded-xl border border-[#E0E6ED] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col overflow-hidden group cursor-pointer"
                >
                  {/* Thumbnail Cover Image */}
                  <div className="h-28 w-full relative bg-slate-100 overflow-hidden">
                    <img
                      src={
                        (prog as any).thumbnail ||
                        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={prog.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      {prog.level || "Beginner"}
                    </span>

                    {/* Progress Badge overlay */}
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

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <h4 className="text-xs font-bold text-[#212529] line-clamp-2 leading-snug" title={prog.title}>
                      {formatCourseTitle(prog.title)}
                    </h4>
                    {matchedEnrollment && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${matchedEnrollment.progress}%` }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-[#6C757D] font-semibold">
                      <span>{prog.category?.name || "General"}</span>
                      <span className="text-[#C82333] font-bold">
                        {userRole === ROLES.GUEST ? "Preview Only" : "View Course →"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. DYNAMIC CALENDAR & EVENTS SECTION */}
      <EventCalendar />

      {/* GUEST ACCESS RESTRICTED MODAL */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-gray-100 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl">
              🔒
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Guest Preview Mode</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                You are currently viewing the LMS in Guest Preview Mode. Guest accounts can browse dashboard layout, view catalog metrics, and explore events preview, but course lesson execution, quizzes, and assignment submissions are restricted.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={() => {
                  setShowGuestModal(false);
                  router.push("/login");
                }}
                className="w-full bg-[#C82333] hover:bg-[#C82333]/90 text-white font-bold text-xs"
              >
                Sign In to Full Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowGuestModal(false)}
                className="w-full text-xs text-gray-500"
              >
                Continue Previewing Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER & ADMIN SUBMISSIONS REVIEW MODAL */}
      <AdminSubmissionsReview
        open={showSubmissionsModal}
        onOpenChange={setShowSubmissionsModal}
        onGraded={() => {
          // refresh dashboard stats if needed
          getDashboardStats().then((res) => {
            if (res?.success) setStats(res.data);
          });
        }}
      />
    </div>
  );
}