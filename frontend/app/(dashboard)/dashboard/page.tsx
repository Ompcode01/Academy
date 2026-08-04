"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getCourses, type Course } from "@/services/api/course.service";
import { getDashboardStats, type DashboardStats } from "@/services/api/dashboard.service";
import {
  getRecentlyAccessedCourses,
  RecentCourseItem,
} from "@/services/api/recentAccess.service";
import { useEventsStore } from "@/store/events.store";
import { ROLES } from "@/lib/rbac";
import { List, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCalendar from "@/components/events/EventCalendar";

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
        // Load courses
        const courseRes = await getCourses({ limit: 10 });
        if (courseRes?.success) {
          setCourses(courseRes.data.courses || []);
        }

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
  }, [fetchEvents]);

  // Sync user's recently accessed courses from local storage
  useEffect(() => {
    if (user?.username) {
      setRecentlyAccessedPrograms(getRecentlyAccessedCourses(user.username));
    } else {
      setRecentlyAccessedPrograms(getRecentlyAccessedCourses("guest"));
    }
  }, [user]);



  return (
    <div className="p-6 space-y-6 select-none">
      {/* Top Banner & Stats Overview */}
      <div className="rounded-xl border border-[#E0E6ED] bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#212529]">
              {fullName} — Dashboard Overview
            </h1>
            <p className="text-xs text-[#6C757D] font-medium mt-0.5">
              Scoped Role: <strong className="text-[#C82333]">{userRole}</strong> • Department: <strong className="text-[#212529]">{{ 1: "Engineering (ENG)", 2: "Human Resources (HR)", 3: "Management (MGT)" }[user?.departmentId || 1] || `Dept #${user?.departmentId}`}</strong>
            </p>
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

        {/* Global Key Metrics */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[#E0E6ED] text-center">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#6C757D] block">Learners</span>
              <span className="text-lg font-extrabold text-[#212529]">{(stats as any).activeLearners || (stats as any).totalEmployees || 20}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#6C757D] block">Courses</span>
              <span className="text-lg font-extrabold text-[#212529]">{(stats as any).publishedCoursesCount || (stats as any).totalCourses || 8}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#6C757D] block">Avg Progress</span>
              <span className="text-lg font-extrabold text-[#C82333]">{stats.completionRate}%</span>
            </div>
          </div>
        )}
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

              return (
                <div
                  key={prog.id}
                  onClick={() => router.push(`/courses/${prog.id}/preview`)}
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
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <h4 className="text-xs font-bold text-[#212529] line-clamp-2 leading-snug">
                      {prog.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-[#6C757D] font-semibold">
                      <span>{prog.category || "General"}</span>
                      <span className="text-[#C82333] font-bold">View Course →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Recently Added Programs & Department Mapped Courses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#E0E6ED] pb-1.5">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-[#C82333]" />
            <h3 className="text-sm font-bold tracking-wide text-[#212529]">
              {userRole === ROLES.LEARNER ? "My Department Courses" : "Recently Added Programs"}
            </h3>
          </div>
          {user?.departmentId && (
            <span className="text-[10px] font-bold bg-[#C82333]/10 text-[#C82333] px-2.5 py-0.5 rounded border border-[#C82333]/20">
              Department: {{ 1: "Engineering (ENG)", 2: "Human Resources (HR)", 3: "Management (MGT)" }[user.departmentId] || `Dept #${user.departmentId}`}
            </span>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E0E6ED] border-dashed py-8 flex flex-col items-center justify-center text-[#6C757D] shadow-sm">
            <BookOpen className="h-8 w-8 text-[#6C757D]/50 mb-2" />
            <p className="text-xs font-bold text-[#212529]">No published courses available for your department yet.</p>
            <p className="text-[11px] text-[#6C757D] mt-0.5">Courses published by Admins for your department will appear here.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
            {courses.map((prog) => (
              <div
                key={prog.id}
                onClick={() => router.push(`/courses/${prog.id}/preview`)}
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
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <h4 className="text-xs font-bold text-[#212529] line-clamp-2 leading-snug">
                    {prog.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-[#6C757D] font-semibold">
                    <span>{prog.category?.name || "General"}</span>
                    <span className="text-[#C82333] font-bold">View Course →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. DYNAMIC CALENDAR & EVENTS SECTION */}
      <EventCalendar />
    </div>
  );
}