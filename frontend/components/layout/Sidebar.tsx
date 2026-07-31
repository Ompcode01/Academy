"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getCourses, type Course } from "@/services/api/course.service";
import { X, ChevronDown, ChevronRight, BookOpen, User, GraduationCap, Home, FileText, Award, Eye, EyeOff } from "lucide-react";
import { useEventsStore } from "@/store/events.store";

const fullNameMap: Record<string, string> = {
  omprakash: "Omprakash Pandey",
  priyanka: "Priyanka Davhare",
  rahul: "Rahul Sharma",
  sneha: "Sneha Patil",
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const { hiddenTypes, toggleTypeVisibility } = useEventsStore();
  
  // Collapsible state for Tree items
  const [navigationExpanded, setNavigationExpanded] = useState(true);
  const [sitePagesExpanded, setSitePagesExpanded] = useState(false);
  const [myCoursesExpanded, setMyCoursesExpanded] = useState(true);

  const username = user?.username || "Guest";
  const fullName = fullNameMap[username.toLowerCase()] || username;

  // Mock courses to enrich the list as shown in the mockup
  const mockCourses = [
    { id: 991, title: "CHAMP - JULY 2026" },
    { id: 992, title: "Prompt Engineering for Dev" },
  ];

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await getCourses({ limit: 100 });
        if (res?.success) {
          setCourses(res.data.courses || []);
        }
      } catch (err) {
        console.error("Failed to load courses for sidebar:", err);
      }
    }
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen]);

  // Combine dynamic courses and mock courses, ensuring no duplicate titles
  const allCourses = [...courses.map(c => ({ id: Number(c.id), title: c.title })), ...mockCourses];
  const uniqueCourses = allCourses.filter(
    (course, index, self) => self.findIndex(c => c.title === course.title) === index
  );

  if (!isOpen) return null;

  return (
    <aside className="w-80 shrink-0 border-l border-[#E0E6ED] bg-[#F4F7F9] text-[#212529] select-none flex flex-col h-full overflow-y-auto relative animate-in slide-in-from-right duration-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-md p-1.5 text-[#6C757D] hover:bg-slate-200 hover:text-[#212529] transition-all cursor-pointer"
        title="Close sidebar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="p-5 space-y-6">
        {/* Section: Events Key (Only on /events page) */}
        {pathname === "/events" && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C757D]">
                <span>≡</span>
                <span>Events key</span>
              </div>
              <div className="space-y-1.5 pl-1">
                {[
                  { type: "site", label: "site events", colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
                  { type: "category", label: "category events", colorClass: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
                  { type: "course", label: "course events", colorClass: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
                  { type: "group", label: "group events", colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
                  { type: "user", label: "user events", colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
                  { type: "other", label: "other events", colorClass: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
                ].map((item) => {
                  const isHidden = hiddenTypes.has(item.type);
                  return (
                    <button
                      key={item.type}
                      onClick={() => toggleTypeVisibility(item.type)}
                      className={`flex w-full items-center gap-2.5 rounded px-2 py-1 text-xs font-semibold hover:bg-slate-200/80 transition-all text-left cursor-pointer ${
                        isHidden ? "opacity-50 line-through" : ""
                      }`}
                    >
                      <span className={`rounded-sm p-1 border ${item.colorClass} shrink-0`}>
                        {isHidden ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </span>
                      <span>{isHidden ? `Show ${item.label}` : `Hide ${item.label}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <hr className="border-[#E0E6ED]" />
          </>
        )}

        {/* Section 1: Skill Cloud */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C757D]">
            <span>≡</span>
            <span>Skill Cloud</span>
          </div>
          <ul className="pl-4 text-xs font-medium text-[#212529]">
            <li className="list-disc hover:text-[#C82333] transition-colors cursor-pointer">
              Skill Cloud Dashboard
            </li>
          </ul>
        </div>

        <hr className="border-[#E0E6ED]" />

        {/* Section 2: Navigation */}
        <div className="space-y-2">
          <button
            onClick={() => setNavigationExpanded(!navigationExpanded)}
            className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6C757D] hover:text-[#212529] transition-all"
          >
            <div className="flex items-center gap-2">
              <span>≡</span>
              <span>Navigation</span>
            </div>
            {navigationExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {navigationExpanded && (
            <div className="pl-2 space-y-1.5 text-xs font-medium">
              {/* Dashboard Link */}
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 rounded px-2 py-1 transition-all ${
                  pathname === "/dashboard"
                    ? "bg-[#C82333]/10 font-bold text-[#C82333]"
                    : "text-[#212529] hover:bg-slate-200"
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>

              {/* Site Home Link */}
              <Link
                href="#"
                className="flex items-center gap-2 rounded px-2 py-1 text-[#212529] hover:bg-slate-200 transition-all"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Site home</span>
              </Link>

              {/* Site Pages (Collapsible) */}
              <div>
                <button
                  onClick={() => setSitePagesExpanded(!sitePagesExpanded)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-[#212529] hover:bg-slate-200 text-left transition-all"
                >
                  {sitePagesExpanded ? (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  )}
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>Site pages</span>
                </button>
                {sitePagesExpanded && (
                  <div className="ml-5 mt-1 border-l border-slate-300 pl-3 space-y-1 text-[11px] text-[#6C757D]">
                    <div className="hover:text-[#C82333] cursor-pointer py-0.5">LMS Guidelines</div>
                    <div className="hover:text-[#C82333] cursor-pointer py-0.5">Help Resources</div>
                  </div>
                )}
              </div>

              {/* My Courses (Collapsible / Active) */}
              <div>
                <button
                  onClick={() => setMyCoursesExpanded(!myCoursesExpanded)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-[#212529] hover:bg-slate-200 text-left transition-all"
                >
                  {myCoursesExpanded ? (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  )}
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span>My courses</span>
                </button>
                {myCoursesExpanded && (
                  <div className="ml-5 mt-1 border-l border-slate-300 pl-3 space-y-1 text-[11px] text-[#6C757D] max-h-60 overflow-y-auto">
                    {uniqueCourses.map((c) => {
                      const courseActive = pathname.includes(`/courses/${c.id}`);
                      return (
                        <Link
                          key={c.id}
                          href={`/courses`}
                          className={`block py-1 hover:text-[#C82333] truncate ${
                            courseActive ? "font-bold text-[#C82333]" : ""
                          }`}
                          title={c.title}
                        >
                          {`> ${c.title}`}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <hr className="border-[#E0E6ED]" />

        {/* Section 3: Latest Badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C757D]">
            <Award className="h-3.5 w-3.5 text-[#C82333]" />
            <span>Latest badges</span>
          </div>
          <p className="text-xs text-[#6C757D] pl-1 font-medium">
            You have no badges to display
          </p>
        </div>

        <hr className="border-[#E0E6ED]" />

        {/* Section 4: Online Users */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C757D]">
            <User className="h-3.5 w-3.5 text-[#C82333]" />
            <span>Online users</span>
          </div>
          <div className="pl-1 space-y-1.5">
            <p className="text-[11px] text-[#6C757D] font-medium">
              1 online user (last 5 minutes)
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#212529] font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span>{fullName}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
