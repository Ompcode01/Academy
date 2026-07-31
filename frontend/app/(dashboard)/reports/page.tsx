"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Award,
  BookOpen,
  Users,
  Download,
  Calendar,
  ShieldCheck,
  Shield,
  LogIn,
  UserCog,
  AlertTriangle,
} from "lucide-react";
import RoleGate from "@/components/auth/RoleGate";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/lib/rbac";

// Mock audit log data
const auditLog = [
  { id: 1, timestamp: "2026-07-30 14:23:11", user: "Priyanka Davhare", action: "Role Changed", detail: "Changed Sneha Patil from LEARNER to TEACHER", type: "role" },
  { id: 2, timestamp: "2026-07-30 13:45:02", user: "Omprakash Pandey", action: "Login Success", detail: "Logged in from 192.168.1.45", type: "login" },
  { id: 3, timestamp: "2026-07-30 12:18:56", user: "Priyanka Davhare", action: "Course Created", detail: "Created 'Advanced React Patterns' course", type: "course" },
  { id: 4, timestamp: "2026-07-30 11:02:33", user: "System", action: "Security Alert", detail: "3 failed login attempts for user 'employee5'", type: "security" },
  { id: 5, timestamp: "2026-07-29 16:55:19", user: "Priyanka Davhare", action: "User Deactivated", detail: "Deactivated account for Employee #EMP019", type: "user" },
  { id: 6, timestamp: "2026-07-29 15:30:00", user: "Rahul Sharma", action: "Login Success", detail: "Logged in from 10.0.0.112", type: "login" },
  { id: 7, timestamp: "2026-07-29 14:12:45", user: "Priyanka Davhare", action: "Settings Updated", detail: "Changed session timeout from 30 to 45 minutes", type: "settings" },
  { id: 8, timestamp: "2026-07-29 09:00:00", user: "System", action: "Backup Completed", detail: "Daily automated backup completed successfully", type: "system" },
];

const AUDIT_ICON: Record<string, React.ReactNode> = {
  role: <UserCog className="h-3.5 w-3.5 text-purple-500" />,
  login: <LogIn className="h-3.5 w-3.5 text-blue-500" />,
  course: <BookOpen className="h-3.5 w-3.5 text-emerald-500" />,
  security: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  user: <Users className="h-3.5 w-3.5 text-red-500" />,
  settings: <ShieldCheck className="h-3.5 w-3.5 text-primary" />,
  system: <Shield className="h-3.5 w-3.5 text-slate-500" />,
};

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  return (
    <RoleGate
      allowed={["SUPER_ADMIN", "ADMIN"]}
      fallback={
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
          <div className="rounded-full bg-red-100 p-4">
            <ShieldCheck className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Reports &amp; Analytics are available to Admins and Super Admins only.
          </p>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Reports &amp; Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor learning performance, audit completion metrics, and export data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`gap-1.5 px-3 py-1.5 ${isSuperAdmin ? "bg-red-50 text-red-700 border-red-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
              {isSuperAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
              {isSuperAdmin ? "Org-wide Reports" : "Department Scope"}
            </Badge>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Last 30 Days
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Analytics highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Certifications
              </CardTitle>
              <Award className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">148</div>
              <p className="text-xs text-muted-foreground mt-1">
                +14% completed this week
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Average Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">84%</div>
              <p className="text-xs text-muted-foreground mt-1">
                +2% overall test score growth
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Study Time (Average)
              </CardTitle>
              <BookOpen className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">4.2 Hrs</div>
              <p className="text-xs text-muted-foreground mt-1">
                Spent per active learner/week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Completion Rates by Course */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Course Completion Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { course: "Java Fundamentals", enrollments: 125, rate: 82, badge: "technical" },
              { course: "Leadership Essentials", enrollments: 78, rate: 68, badge: "management" },
              { course: "Effective Communication", enrollments: 93, rate: 45, badge: "soft-skills" },
              { course: "Data Structures in Java", enrollments: 64, rate: 12, badge: "technical" },
              { course: "HR Compliance Basics", enrollments: 40, rate: 95, badge: "hr" },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5 p-3 rounded-lg border border-border/40 hover:bg-muted/10 transition-colors">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{item.course}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.enrollments} enrolled • {item.rate}% complete
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-r"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Full Audit Log — SUPER_ADMIN Only */}
        {isSuperAdmin && (
          <Card className="border border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Full Audit Log
                </CardTitle>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                  Super Admin Only
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-4">Timestamp</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((entry) => (
                      <TableRow key={entry.id} className="border-border hover:bg-muted/20">
                        <TableCell className="pl-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {entry.timestamp}
                        </TableCell>
                        <TableCell className="text-sm font-medium whitespace-nowrap">
                          {entry.user}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {AUDIT_ICON[entry.type] || AUDIT_ICON.system}
                            <span className="text-xs font-semibold">{entry.action}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-sm truncate">
                          {entry.detail}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGate>
  );
}
