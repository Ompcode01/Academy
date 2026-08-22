"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getCourses, type Course } from "@/services/api/course.service";
import {
  User,
  MessageSquare,
  ChevronRight,
  Home,
  Edit3,
  Award,
  BookOpen,
  FileText,
  Shield,
  Activity,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fullNameMap: Record<string, string> = {
  omprakash: "Omprakash Pandey",
  priyanka: "Priyanka Davhare",
  rahul: "Rahul Sharma",
  sneha: "Sneha Patil",
  guest: "Guest Visitor",
};

const userDetailsMap: Record<string, any> = {
  omprakash: {
    email: "omprakash.pandey@harbingergroup.com",
    country: "India",
    city: "Pune",
    timezone: "Asia/Kolkata",
    employeeId: "HS2020",
    directManagerId: "HS1972",
    directManager: "Amit Kulkarni",
    manager12: "Umesh Sukhisa (HS104)",
    departmentCode: "HSPLRMG.RESOURGROUP",
    designationCode: "HSPLRMG.RESOURGROUP.TRAINEESOFTWAREENGINEER-GRADUATEAPPRENTICE",
    businessUnit: "Resource Management Group",
    businessUnitCode: "HSPLRMG",
    designationName: "Trainee Software Engineer - Graduate Apprentice",
    manager12Id: "HS104",
  },
  priyanka: {
    email: "priyanka.davhare@harbingergroup.com",
    country: "India",
    city: "Pune",
    timezone: "Asia/Kolkata",
    employeeId: "HS1001",
    directManagerId: "HS1000",
    directManager: "Executive Director",
    manager12: "CEO Office (HS100)",
    departmentCode: "HSPL.ADMIN",
    designationCode: "HSPL.ADMIN.SUPERADMIN",
    businessUnit: "LMS Platform Operations",
    businessUnitCode: "HSPLADMIN",
    designationName: "Super Admin & Platform Director",
    manager12Id: "HS100",
  },
  sneha: {
    email: "sneha.patil@harbingergroup.com",
    country: "India",
    city: "Pune",
    timezone: "Asia/Kolkata",
    employeeId: "HS1540",
    directManagerId: "HS1200",
    directManager: "Rajesh Kumar",
    manager12: "Academy Head (HS105)",
    departmentCode: "HSPL.ACADEMY",
    designationCode: "HSPL.ACADEMY.SENIORINSTRUCTOR",
    businessUnit: "Learning & Development Group",
    businessUnitCode: "HSPLACAD",
    designationName: "Senior Technical Instructor",
    manager12Id: "HS105",
  },
  rahul: {
    email: "rahul.sharma@harbingergroup.com",
    country: "India",
    city: "Pune",
    timezone: "Asia/Kolkata",
    employeeId: "HS1890",
    directManagerId: "HS1001",
    directManager: "Priyanka Davhare",
    manager12: "Operations Manager (HS102)",
    departmentCode: "HSPL.OPS",
    designationCode: "HSPL.OPS.SYSTEMADMIN",
    businessUnit: "IT Operations & Infrastructure",
    businessUnitCode: "HSPLOPS",
    designationName: "LMS Systems Administrator",
    manager12Id: "HS102",
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const username = user?.username || "omprakash";
  const fullName = fullNameMap[username.toLowerCase()] || user?.username || "Omprakash Pandey";
  
  const profileDetails = userDetailsMap[username.toLowerCase()] || {
    email: `${username.toLowerCase()}@harbingergroup.com`,
    country: "India",
    city: "Pune",
    timezone: "Asia/Kolkata",
    employeeId: "HS2020",
    directManagerId: "HS1972",
    directManager: "Amit Kulkarni",
    manager12: "Umesh Sukhisa (HS104)",
    departmentCode: "HSPLRMG.RESOURGROUP",
    designationCode: "HSPLRMG.RESOURGROUP.TRAINEESOFTWAREENGINEER-GRADUATEAPPRENTICE",
    businessUnit: "Resource Management Group",
    businessUnitCode: "HSPLRMG",
    designationName: "Trainee Software Engineer - Graduate Apprentice",
    manager12Id: "HS104",
  };

  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function loadUserCourses() {
      try {
        const res = await getCourses({ limit: 10 });
        if (res?.success && res.data?.courses) {
          setCourses(res.data.courses);
        }
      } catch (err) {
        console.error("Failed to load profile courses:", err);
      }
    }
    loadUserCourses();
  }, []);

  const defaultCourseList = [
    "CHAMP - JULY 2026",
    "Tech Radar",
    "Design Thinking - The Fundamentals - Feb 2026",
    "CHAMP - JAN 2026",
    "Web Accessibility Feb 2024",
    "Prompt Engineering for Dev",
    "1 Minute Design Tips",
    "Agile Project Management Self Learning",
    "Coding Principles Self Learning",
  ];

  const getInitials = (name: string) => {
    if (!name) return "OP";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-800 p-6 space-y-6">
      {/* ── Breadcrumb Header ── */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-[#C82333] transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-semibold text-slate-700">Profile</span>
      </div>

      {/* ── Profile Top Identity Bar ── */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <Avatar className="h-16 w-16 border-2 border-slate-200 shadow-sm">
          <AvatarFallback className="bg-[#C82333] text-lg font-bold text-white">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{fullName}</h1>
          <Button
            onClick={() => router.push("/messages")}
            size="sm"
            className="bg-[#2B3A4A] hover:bg-[#1f2a36] text-white text-xs h-7 px-3 gap-1.5 rounded"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Message</span>
          </Button>
        </div>
      </div>

      {/* ── Main 2-Column Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── LEFT COLUMN (2 Cols) ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User Details Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">User details</h2>
              <button
                onClick={() => router.push("/settings")}
                className="text-xs text-[#1D70B8] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Edit profile</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div>
                <span className="font-bold block text-slate-900 mb-0.5">Email address</span>
                <span className="text-slate-600">{profileDetails.email}</span>{" "}
                <span className="text-slate-400 text-[11px]">(Visible to other course participants)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Country</span>
                  <span>{profileDetails.country}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">City/town</span>
                  <span>{profileDetails.city}</span>
                </div>
              </div>

              <div>
                <span className="font-bold block text-slate-900 mb-0.5">Timezone</span>
                <span>{profileDetails.timezone}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Employee ID</span>
                  <span className="font-mono text-slate-800">{profileDetails.employeeId}</span>
                </div>

                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Direct manager employee ID</span>
                  <span className="font-mono text-slate-800">{profileDetails.directManagerId}</span>
                </div>

                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Direct manager</span>
                  <span>{profileDetails.directManager}</span>
                </div>

                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Manager 12</span>
                  <span>{profileDetails.manager12}</span>
                </div>

                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Department code</span>
                  <span className="font-mono text-slate-800 text-[11px]">{profileDetails.departmentCode}</span>
                </div>

                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Designation code</span>
                  <span className="font-mono text-slate-800 text-[11px] break-all">{profileDetails.designationCode}</span>
                </div>

                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Business unit</span>
                  <span>{profileDetails.businessUnit}</span>
                </div>

                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Business unit code</span>
                  <span className="font-mono text-slate-800 text-[11px]">{profileDetails.businessUnitCode}</span>
                </div>

                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Designation name</span>
                  <span>{profileDetails.designationName}</span>
                </div>

                <div>
                  <span className="font-bold block text-slate-900 mb-0.5">Manager 12 ID</span>
                  <span className="font-mono text-slate-800 text-[11px]">{profileDetails.manager12Id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy and policies Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
              Privacy and policies
            </h2>
            <div className="text-xs text-[#1D70B8] hover:underline cursor-pointer">
              Data retention summary
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (1 Col) ── */}
        <div className="space-y-6">
          
          {/* Course Details Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Course details
            </h2>
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Course profiles</span>
              <ul className="space-y-1.5 text-xs text-[#1D70B8]">
                {courses.length > 0
                  ? courses.map((crs) => (
                      <li key={crs.id} className="hover:underline cursor-pointer truncate">
                        <Link href={`/courses/${crs.id}/preview`}>
                          {crs.title}
                        </Link>
                      </li>
                    ))
                  : defaultCourseList.map((courseTitle, idx) => (
                      <li key={idx} className="hover:underline cursor-pointer truncate">
                        <Link href="/courses">{courseTitle}</Link>
                      </li>
                    ))}
              </ul>
            </div>
          </div>

          {/* Miscellaneous Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Miscellaneous
            </h2>
            <ul className="space-y-1.5 text-xs text-[#1D70B8]">
              <li className="hover:underline cursor-pointer">Blog entries</li>
              <li className="hover:underline cursor-pointer">
                <Link href="/certificates" className="flex items-center gap-1 text-[#C82333] font-semibold">
                  <Award className="h-3.5 w-3.5" />
                  <span>My certificates</span>
                </Link>
              </li>
              <li className="hover:underline cursor-pointer">Forum posts</li>
              <li className="hover:underline cursor-pointer">Forum discussions</li>
              <li className="hover:underline cursor-pointer">Learning plans</li>
              <li className="hover:underline cursor-pointer">User Competency</li>
            </ul>
          </div>

          {/* Reports Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Reports
            </h2>
            <ul className="space-y-1.5 text-xs text-[#1D70B8]">
              <li className="hover:underline cursor-pointer">Monitoring of learning plans</li>
              <li className="hover:underline cursor-pointer">Browser sessions</li>
              <li className="hover:underline cursor-pointer">Grades overview</li>
            </ul>
          </div>

          {/* Login activity Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Login activity
            </h2>
            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="font-bold block text-slate-900 mb-0.5">First access to site</span>
                <span className="text-slate-600">Thursday, 2 July 2026, 3:00 PM (51 days)</span>
              </div>
              <div>
                <span className="font-bold block text-slate-900 mb-0.5">Last access to site</span>
                <span className="text-slate-600">Saturday, 22 August 2026, 3:50 PM (now)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
