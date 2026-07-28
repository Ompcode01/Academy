"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getDashboardStats, type DashboardStats } from "@/services/api/dashboard.service";
import { ROLES, hasRole } from "@/lib/rbac";
import {
  Users,
  GraduationCap,
  Building2,
  Trophy,
  ArrowRight,
  BookOpen,
  PlusCircle,
  HelpCircle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || ROLES.GUEST;
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await getDashboardStats();
        if (res?.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [userRole]);

  // Welcome banner greeting text
  const greeting = user?.username ? `Welcome back, ${user.username}!` : "Welcome to Harbinger Academy!";

  // 1. SUPER_ADMIN & ADMIN VIEW
  const renderAdminDashboard = () => {
    const cardData = [
      {
        title: "Total Learners",
        value: stats?.employeesCount ?? 0,
        icon: Users,
        description: "Active employee directory",
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      },
      {
        title: "Total Courses",
        value: stats?.coursesCount ?? 0,
        icon: GraduationCap,
        description: `${stats?.publishedCoursesCount || 0} published, ${stats?.draftCoursesCount || 0} drafts`,
        color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      },
      {
        title: "Active Departments",
        value: stats?.departmentsCount ?? 0,
        icon: Building2,
        description: "Departments in sync",
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      },
      {
        title: "Completion Rate",
        value: `${stats?.completionRate ?? 0}%`,
        icon: Trophy,
        description: `${stats?.completedEnrollments || 0} completed learnings`,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      },
    ];

    return (
      <div className="space-y-6">
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
                  <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">System Audit & Activities</CardTitle>
              <CardDescription>Recent actions recorded across the LMS</CardDescription>
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
              ].map((act, idx) => {
                const ActIcon = act.icon;
                return (
                  <div key={idx} className="flex items-start gap-4 rounded-xl border border-border/40 bg-muted/10 p-3">
                    <div className={`rounded-lg p-2 border ${act.iconColor}`}>
                      <ActIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-xs text-muted-foreground">{act.time}</p>
                      <p className="text-sm font-medium text-foreground">
                        {act.user} <span className="font-normal text-muted-foreground">{act.action}</span> {act.target}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Create a new Course", href: "/courses" },
                { label: "View Learners Table", href: "/users" },
                { label: "Manage Departments", href: "/organization" },
                ...(userRole === ROLES.SUPER_ADMIN ? [{ label: "Configure Darwinbox Sync", href: "/darwinbox-sync" }] : []),
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
  };

  // 2. TEACHER VIEW
  const renderTeacherDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned/Created Courses
              </CardTitle>
              <div className="rounded-lg p-1.5 border text-blue-500 bg-blue-500/10 border-blue-500/20">
                <GraduationCap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.coursesCount ?? 0}</div>
              <p className="mt-1 text-xs text-muted-foreground">Courses in your scope/department</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Learners
              </CardTitle>
              <div className="rounded-lg p-1.5 border text-purple-500 bg-purple-500/10 border-purple-500/20">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeEnrollments ?? 0}</div>
              <p className="mt-1 text-xs text-muted-foreground">Active enrollments in your scope</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Class Completion Rate
              </CardTitle>
              <div className="rounded-lg p-1.5 border text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                <Trophy className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completionRate ?? 0}%</div>
              <p className="mt-1 text-xs text-muted-foreground">Completed assessments rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Teacher Quick Launch</CardTitle>
              <CardDescription>Actions for curating and reviewing curriculum</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/courses">
                <Button className="w-full justify-start gap-2 h-12" variant="outline">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">Create / Manage Courses</div>
                    <div className="text-xs text-muted-foreground">Add lessons and details</div>
                  </div>
                </Button>
              </Link>
              <Link href="/courses/categories">
                <Button className="w-full justify-start gap-2 h-12" variant="outline">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">Manage Categories</div>
                    <div className="text-xs text-muted-foreground">Classify curriculum areas</div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Curriculum Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg border border-border p-3 text-xs bg-muted/20">
                <h4 className="font-semibold text-foreground mb-1">Teacher Guide</h4>
                <p className="text-muted-foreground">Review internal pedagogy rules and course classification guidelines.</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-xs bg-muted/20">
                <h4 className="font-semibold text-foreground mb-1">Standard Scoring System</h4>
                <p className="text-muted-foreground">Ensure passing criteria is set to at least 60% on MCQ quizzes.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // 3. LEARNER VIEW
  const renderLearnerDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                My Enrolled Courses
              </CardTitle>
              <div className="rounded-lg p-1.5 border text-blue-500 bg-blue-500/10 border-blue-500/20">
                <BookOpen className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeEnrollments ?? 0}</div>
              <p className="mt-1 text-xs text-muted-foreground">Courses currently active</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completed Milestones
              </CardTitle>
              <div className="rounded-lg p-1.5 border text-purple-500 bg-purple-500/10 border-purple-500/20">
                <Trophy className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedEnrollments ?? 0}</div>
              <p className="mt-1 text-xs text-muted-foreground">Certificates earned</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Learning progress
              </CardTitle>
              <div className="rounded-lg p-1.5 border text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completionRate ?? 0}%</div>
              <p className="mt-1 text-xs text-muted-foreground">Average syllabus completion</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Active Learning Portal</CardTitle>
              <CardDescription>Ready to continue your training?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border p-4 bg-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Next Syllabus Course</h3>
                  <p className="text-sm text-muted-foreground">Check your pending department learning courses.</p>
                </div>
                <Link href="/courses">
                  <Button size="sm" className="gap-2">
                    Browse Courses <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Support & FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground p-1">
                <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">How do I unlock certificates?</p>
                  <p className="mt-0.5">Complete all lessons in a course and score 60% or higher in the final quiz.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground p-1">
                <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Where are my files?</p>
                  <p className="mt-0.5">Resources tabs within the player sidebar container allow direct downloads.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // 4. GUEST VIEW
  const renderGuestDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary border border-primary/20">
              <Sparkles className="h-3 w-3" /> Harbinger Guest Access
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Unlock Your Potential with Harbinger Academy
            </h2>
            <p className="text-sm text-muted-foreground">
              You are logged in as a Guest. View our public curriculum, browse syllabus details, and check training paths. Contact human resources or your team manager to register a full Learner account.
            </p>
          </div>
          <div className="shrink-0 flex gap-3">
            <Link href="/courses">
              <Button className="gap-2">
                Explore Courses <Search className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Academy Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4 bg-muted/10 text-center">
                <div className="text-3xl font-bold text-primary">{stats?.publishedCoursesCount ?? 4}+</div>
                <div className="text-xs text-muted-foreground mt-1">Syllabus Courses</div>
              </div>
              <div className="rounded-xl border border-border p-4 bg-muted/10 text-center">
                <div className="text-3xl font-bold text-primary">{stats?.departmentsCount ?? 3}+</div>
                <div className="text-xs text-muted-foreground mt-1">Core Departments</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">How to enroll</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                Authorized accounts are automatically provisioned based on corporate organizational listings synchronized via Darwinbox Sync daily.
              </p>
              <p>
                If you are a new hire, check your joining credentials file, or request help by opening a support ticket in settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[100vw] overflow-x-hidden">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting}
        </h1>
        <p className="text-sm text-muted-foreground">
          {userRole === ROLES.GUEST
            ? "Browse the public catalog and explore training programs."
            : "Here is what is happening across the academy today."}
        </p>
      </div>

      {/* Conditional Dashboards based on User Roles */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-sm text-muted-foreground">Loading dashboard layout...</p>
        </div>
      ) : (
        <>
          {hasRole(userRole, ROLES.SUPER_ADMIN, ROLES.ADMIN) && renderAdminDashboard()}
          {userRole === ROLES.TEACHER && renderTeacherDashboard()}
          {userRole === ROLES.LEARNER && renderLearnerDashboard()}
          {userRole === ROLES.GUEST && renderGuestDashboard()}
        </>
      )}
    </div>
  );
}