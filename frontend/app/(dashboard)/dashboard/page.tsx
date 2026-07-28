"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getCourses } from "@/services/api/course.service";
import { getEmployees, getDepartments } from "@/services/api/org.service";
import {
  Users,
  GraduationCap,
  Building2,
  Trophy,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    coursesCount: 0,
    employeesCount: 0,
    departmentsCount: 0,
    activeEnrollments: 342, // Mock enrollment count
    completionRate: 74.2, // Mock completion rate
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [coursesRes, employeesRes, departmentsRes] = await Promise.all([
          getCourses({ limit: 1 }),
          getEmployees(),
          getDepartments(),
        ]);
        setStats({
          coursesCount: coursesRes?.data?.total || 0,
          employeesCount: employeesRes?.data?.length || 0,
          departmentsCount: departmentsRes?.data?.length || 0,
          activeEnrollments: 342,
          completionRate: 74.2,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      }
    }
    fetchStats();
  }, []);

  const cardData = [
    {
      title: "Total Learners",
      value: stats.employeesCount,
      icon: Users,
      description: "+12.5% from last month",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Total Courses",
      value: stats.coursesCount,
      icon: GraduationCap,
      description: "6 new added recently",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Active Departments",
      value: stats.departmentsCount,
      icon: Building2,
      description: "Engineering, HR, Management",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate}%`,
      icon: Trophy,
      description: "Highest ever this year",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.username || "Priyanka Davhare"}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Here is what is happening across the academy today.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-1.5 border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Recent activities & Popular courses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                user: "Omprakash Pandey",
                action: "completed the course",
                target: "Java Fundamentals",
                time: "10 mins ago",
                icon: Trophy,
                iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
              },
              {
                user: "Sneha Patil",
                action: "published a new course",
                target: "HR Compliance Basics",
                time: "2 hours ago",
                icon: GraduationCap,
                iconColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
              },
              {
                user: "Rahul Sharma",
                action: "enrolled in",
                target: "Data Structures in Java",
                time: "4 hours ago",
                icon: Users,
                iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
              },
              {
                user: "Priyanka Davhare",
                action: "modified database credentials in",
                target: "Settings module",
                time: "1 day ago",
                icon: Clock,
                iconColor: "text-muted-foreground bg-muted border-border",
              },
            ].map((act, idx) => {
              const ActIcon = act.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-xl border border-border/40 bg-muted/10 p-3"
                >
                  <div className={`rounded-lg p-2 border ${act.iconColor}`}>
                    <ActIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      {act.time}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {act.user}{" "}
                      <span className="font-normal text-muted-foreground">
                        {act.action}
                      </span>{" "}
                      {act.target}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quick Links / Actions */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Create a new Course", href: "/courses/create" },
              { label: "View Learners Table", href: "/users" },
              { label: "Manage Departments", href: "/organization" },
              { label: "Configure Darwinbox Sync", href: "/darwinbox-sync" },
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm font-medium text-foreground hover:bg-muted/40 hover:text-primary transition-all group"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}