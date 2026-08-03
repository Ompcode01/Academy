"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getCourses, type Course } from "@/services/api/course.service";
import { getDashboardStats, type DashboardStats } from "@/services/api/dashboard.service";
import { ROLES } from "@/lib/rbac";
import { Calendar as CalendarIcon, List, Plus, BookOpen, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fullNameMap: Record<string, string> = {
  omprakash: "Omprakash Pandey",
  priyanka: "Priyanka Davhare",
  rahul: "Rahul Sharma",
  sneha: "Sneha Patil",
};

interface CalendarEvent {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Calendar States
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 1, title: "Java OOP Quiz", date: "2026-07-08" },
    { id: 2, title: "Agile Standup", date: "2026-07-15" },
    { id: 3, title: "Design Thinking Review", date: "2026-07-22" },
  ]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("2026-07-15");

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
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const event: CalendarEvent = {
      id: Date.now(),
      title: newEventTitle,
      date: newEventDate,
    };
    setEvents([...events, event]);
    setNewEventTitle("");
    setShowAddEventModal(false);
  };

  // Program Gradient Grids helper
  const getGradient = (index: number) => {
    const gradients = [
      "from-blue-500 via-cyan-400 to-blue-600",
      "from-purple-500 via-violet-400 to-indigo-600",
      "from-amber-400 via-orange-350 to-amber-600",
      "from-teal-400 via-emerald-400 to-teal-600",
      "from-pink-400 via-rose-400 to-red-500",
      "from-slate-400 via-gray-400 to-slate-600",
      "from-sky-400 via-blue-400 to-sky-600",
      "from-emerald-400 via-green-400 to-emerald-600",
    ];
    return gradients[index % gradients.length];
  };

  // Mock list for recently accessed programs
  const recentlyAccessedPrograms = [
    { id: 101, title: "CHAMP - JULY 2026", category: "Corporate Integration" },
    { id: 102, title: "Prompt Engineering for Dev", category: "Technical" },
  ];

  // Recently added programs (merging dynamic db courses + static mock courses)
  const baseRecentlyAdded = [
    { id: 201, title: "Workato Customer Onboarding ...", category: "Integration" },
    { id: 203, title: "CHAMP - JULY 2026", category: "Corporate Integration" },
  ];

  // Map database courses to match program structure
  const dbProgramCourses = courses.map((c, i) => ({
    id: Number(c.id),
    title: c.title,
    category: c.category?.name || "LMS Course",
  }));

  // Combine dynamic and mock courses for Recently Added
  const combinedRecentlyAdded = [...dbProgramCourses, ...baseRecentlyAdded].filter(
    (item, index, self) => self.findIndex(t => t.title === item.title) === index
  );

  // Combine dynamic courses and mock courses, ensuring no duplicate titles
  const allCoursesList = [
    ...courses.map((c) => ({ id: Number(c.id), title: c.title })),
    ...recentlyAccessedPrograms,
  ];
  const uniqueCourses = allCoursesList.filter(
    (course, index, self) => self.findIndex((c) => c.title === course.title) === index
  );

  // Generate July 2026 calendar days
  // Wednesday is July 1st, 2026.
  // June 2026 ends on Tuesday 30th.
  // June inactive days in grid: June 28 (Sun), 29 (Mon), 30 (Tue)
  // July active days: 1 to 31
  // August inactive days: Aug 1 (Sat)
  const calendarCells = [
    { day: 28, isCurrentMonth: false, dateStr: "2026-06-28" },
    { day: 29, isCurrentMonth: false, dateStr: "2026-06-29" },
    { day: 30, isCurrentMonth: false, dateStr: "2026-06-30" },
    ...Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      isCurrentMonth: true,
      dateStr: `2026-07-${String(i + 1).padStart(2, "0")}`,
    })),
    { day: 1, isCurrentMonth: false, dateStr: "2026-08-01" },
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-8 pb-12 select-none px-6 py-6">
      {/* Role-Specific Metric Header Bar (Subtle integration to keep backend working) */}
      <div className="bg-white rounded border border-[#E0E6ED] p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-[#212529]">
            {fullName} — Dashboard Overview
          </h2>
          <p className="text-[11px] text-[#6C757D] flex items-center gap-2 mt-0.5">
            <span>Scoped Role: <strong className="text-[#C82333]">{userRole.replace("_", " ")}</strong></span>
            <span>•</span>
            <span>Department: <strong className="text-slate-800">{user?.departmentId ? ({ 1: "Engineering (ENG)", 2: "Human Resources (HR)", 3: "Management (MGT)" }[user.departmentId] || `Dept #${user.departmentId}`) : "Global / All Depts"}</strong></span>
          </p>
        </div>
        {stats && (
          <div className="flex gap-6 text-xs">
            <div>
              <span className="text-[#6C757D] block text-[10px] uppercase">Learners</span>
              <span className="font-bold text-[#212529]">{stats.employeesCount}</span>
            </div>
            <div className="w-px h-6 bg-[#E0E6ED]" />
            <div>
              <span className="text-[#6C757D] block text-[10px] uppercase">Courses</span>
              <span className="font-bold text-[#212529]">{stats.coursesCount}</span>
            </div>
            <div className="w-px h-6 bg-[#E0E6ED]" />
            <div>
              <span className="text-[#6C757D] block text-[10px] uppercase">Avg Progress</span>
              <span className="font-bold text-[#212529]">{stats.completionRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* 1. Recently Accessed Programs Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-[#E0E6ED] pb-1.5">
          <List className="h-4 w-4 text-[#C82333]" />
          <h3 className="text-sm font-bold tracking-wide text-[#212529]">
            Recently accessed Programs
          </h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
          {recentlyAccessedPrograms.map((prog, idx) => (
            <div
              key={prog.id}
              onClick={() => router.push(`/courses/${prog.id}/preview`)}
              className="w-48 shrink-0 bg-white rounded border border-[#E0E6ED] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col overflow-hidden group cursor-pointer"
            >
              {/* Geometric gradient thumbnail */}
              <div className={`h-24 w-full bg-gradient-to-br ${getGradient(idx)} opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                <BookOpen className="h-8 w-8 text-white/50" />
              </div>
              {/* Program details */}
              <div className="p-3 flex-1 flex flex-col justify-between min-h-[70px]">
                <h4 className="text-[11px] font-bold text-[#212529] line-clamp-2 leading-snug">
                  {prog.title}
                </h4>
                <span className="text-[9px] text-[#6C757D] font-medium mt-1">
                  {prog.category}
                </span>
              </div>
            </div>
          ))}
        </div>
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
          <div className="bg-white rounded border border-[#E0E6ED] border-dashed py-8 flex flex-col items-center justify-center text-[#6C757D] shadow-sm">
            <BookOpen className="h-8 w-8 text-[#6C757D]/50 mb-2" />
            <p className="text-xs font-bold text-[#212529]">No published courses available for your department yet.</p>
            <p className="text-[11px] text-[#6C757D] mt-0.5">Courses published by Admins for your department will appear here.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
            {courses.map((prog, idx) => (
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
                      (prog as any).thumbnailUrl ||
                      {
                        Technical: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80",
                        Business: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
                        "Soft Skills": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
                        HR: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
                      }[prog.category?.name || "Technical"] ||
                      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={prog.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                    {prog.level || "Beginner"}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between min-h-[75px]">
                  <h4 className="text-xs font-bold text-[#212529] line-clamp-2 leading-snug">
                    {prog.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2 text-[10px]">
                    <span className="text-[#C82333] font-bold">
                      {prog.category?.name || "Technical"}
                    </span>
                    <span className="text-[#6C757D]">
                      {prog.department?.departmentCode || "Global"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Capabilities Developed Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-[#E0E6ED] pb-1.5">
          <List className="h-4 w-4 text-[#C82333]" />
          <h3 className="text-sm font-bold tracking-wide text-[#212529]">
            Capabilities Developed
          </h3>
        </div>
        <div className="bg-white rounded border border-[#E0E6ED] border-dashed py-8 flex flex-col items-center justify-center text-[#6C757D] shadow-sm">
          <AlertCircle className="h-6 w-6 text-[#6C757D]/65 mb-1.5" />
          <span className="text-xs font-semibold">No attended trainings found</span>
        </div>
      </div>

      {/* 4. Calendar Section */}
      <div className="space-y-4">
        {/* Calendar Header Controls */}
        <div className="flex items-center justify-between border-b border-[#E0E6ED] pb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#C82333]" />
            <h3 className="text-sm font-bold tracking-wide text-[#212529]">
              Calendar
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Course Selector Dropdown */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="text-xs border border-[#E0E6ED] rounded bg-white px-2.5 py-1 font-semibold text-[#6C757D] outline-none shadow-sm cursor-pointer"
            >
              <option value="all">All courses</option>
              {uniqueCourses.map(c => (
                <option key={c.id} value={c.title}>{c.title}</option>
              ))}
            </select>
            {/* New Event Button */}
            <button
              onClick={() => setShowAddEventModal(true)}
              className="flex items-center gap-1 bg-[#C82333] hover:bg-[#C82333]/90 text-white text-[11px] font-bold px-3 py-1 rounded shadow transition-colors cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>New event</span>
            </button>
          </div>
        </div>

        {/* Month Selector Navigation */}
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-[#6C757D]">
          <button className="flex items-center gap-1 hover:text-[#C82333] transition-colors cursor-pointer">
            <ChevronLeft className="h-3 w-3" />
            <span>June</span>
          </button>
          <span className="text-sm font-bold text-[#212529]">July 2026</span>
          <button className="flex items-center gap-1 hover:text-[#C82333] transition-colors cursor-pointer">
            <span>August</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Calendar Month Grid */}
        <div className="bg-white rounded border border-[#E0E6ED] overflow-hidden shadow-sm">
          {/* Days of Week Row */}
          <div className="grid grid-cols-7 border-b border-[#E0E6ED] bg-slate-50 text-center">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-2 text-[11px] font-bold text-[#6C757D]">
                {day}
              </div>
            ))}
          </div>

          {/* Monthly Days Grid */}
          <div className="grid grid-cols-7 grid-rows-5 divide-x divide-y divide-[#E0E6ED]">
            {calendarCells.map((cell, idx) => {
              const dayEvents = events.filter((e) => e.date === cell.dateStr);
              return (
                <div
                  key={idx}
                  className={`min-h-[90px] p-2 flex flex-col justify-between hover:bg-slate-50/50 transition-colors ${
                    cell.isCurrentMonth ? "bg-white" : "bg-slate-50/30 text-slate-400"
                  }`}
                >
                  <span className="text-xs font-bold">{cell.day}</span>
                  
                  {/* Calendar Event Cards */}
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="rounded bg-[#C82333]/10 border-l-2 border-[#C82333] p-1 text-[9px] font-semibold text-[#C82333] truncate"
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Event Modal dialog */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#E0E6ED] w-96 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#212529] border-b border-[#E0E6ED] pb-2">
              Create New Calendar Event
            </h3>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[#6C757D] block">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Java Fundamentals Review"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full text-xs border border-[#E0E6ED] rounded p-2 outline-none focus:border-[#C82333] focus:ring-1 focus:ring-[#C82333]/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[#6C757D] block">
                  Event Date
                </label>
                <input
                  type="date"
                  required
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full text-xs border border-[#E0E6ED] rounded p-2 outline-none focus:border-[#C82333] focus:ring-1 focus:ring-[#C82333]/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddEventModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#C82333] hover:bg-[#C82333]/90 text-white"
                >
                  Save Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}