"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  FileCheck2,
  UserCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { getTeacherPerformanceReport } from "@/services/api/reporting.service";

interface TeacherSummary {
  teacherId: number;
  teacherName: string;
  employeeCode: string;
  officialEmail: string;
  departmentName: string;
  assignedCoursesCount: number;
  courseTitles: string[];
  distinctLearnersCount: number;
  totalSubmissions: number;
  pendingEvaluations: number;
  evaluatedCount: number;
  needsRevisionCount: number;
  averagePercentage: number;
}

interface AuditItem {
  submissionId: number;
  userId: number;
  studentName: string;
  studentCode: string;
  courseId: number;
  courseTitle: string;
  contentTitle: string;
  submissionType: string;
  attemptNumber: number;
  submissionText: string;
  fileUrl: string;
  submittedAt: string;
  status: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  feedback: string;
  gradedBy: string;
  gradedAt: string;
}

interface ReportData {
  kpis: {
    totalTeachers: number;
    totalAssignedCourses: number;
    totalSupervisedLearners: number;
    totalSubmissions: number;
    pendingEvaluations: number;
    evaluatedSubmissions: number;
    needsRevisionCount: number;
  };
  teacherSummaries: TeacherSummary[];
  auditTrail: AuditItem[];
}

export default function TeacherPerformanceReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherSummary | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getTeacherPerformanceReport();
      if (res) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to fetch teacher performance report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const summaries = data?.teacherSummaries || [];
  const filteredSummaries = summaries.filter(
    (t) =>
      t.teacherName.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      t.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  const auditTrail = data?.auditTrail || [];
  const teacherAuditItems = selectedTeacher
    ? auditTrail.filter((a) =>
        selectedTeacher.courseTitles.includes(a.courseTitle)
      )
    : auditTrail;

  return (
    <div className="space-y-5 pt-1">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-card/60 p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Teacher Supervision &amp; Workload Summary</h3>
            <p className="text-[11px] text-muted-foreground">Oversight monitoring instructor workload, supervised learners, and pending evaluations.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading} className="gap-2 font-bold text-xs cursor-pointer">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Active Teachers</span>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {loading ? "..." : data?.kpis.totalTeachers || 0}
            </div>
            <p className="text-[10px] text-muted-foreground">Assigned Instructors</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Supervised Learners</span>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-600">
              {loading ? "..." : data?.kpis.totalSupervisedLearners || 0}
            </div>
            <p className="text-[10px] text-muted-foreground">Distinct Supervised Users</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Assigned Courses</span>
              <BookOpen className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {loading ? "..." : data?.kpis.totalAssignedCourses || 0}
            </div>
            <p className="text-[10px] text-muted-foreground">Active Courses</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Pending Reviews</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-500">
              {loading ? "..." : data?.kpis.pendingEvaluations || 0}
            </div>
            <p className="text-[10px] text-amber-600 font-semibold">Awaiting Teacher Grade</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Evaluated &amp; Graded</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {loading ? "..." : data?.kpis.evaluatedSubmissions || 0}
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold">Completed Reviews</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Needs Revision</span>
              <AlertCircle className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-600">
              {loading ? "..." : data?.kpis.needsRevisionCount || 0}
            </div>
            <p className="text-[10px] text-purple-600 font-semibold">Revisions Requested</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by teacher name, code, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          Showing <span className="font-bold text-foreground">{filteredSummaries.length}</span> Teachers
        </div>
      </div>

      {/* Teacher Supervision Table */}
      <div className="overflow-x-auto border border-border rounded-xl bg-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold border-b border-border">
            <tr>
              <th className="p-3">Teacher Profile</th>
              <th className="p-3">Department</th>
              <th className="p-3">Assigned Courses</th>
              <th className="p-3 text-center">Supervised Learners</th>
              <th className="p-3 text-center">Total Submissions</th>
              <th className="p-3 text-center">Pending Review</th>
              <th className="p-3 text-center">Evaluated / Graded</th>
              <th className="p-3 text-center">Avg Grade %</th>
              <th className="p-3 text-right">Audit Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground font-semibold">
                  Loading teacher supervision analytics...
                </td>
              </tr>
            ) : filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  No active teachers found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredSummaries.map((t) => (
                <tr key={t.teacherId} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-semibold">
                    <div className="text-foreground">{t.teacherName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{t.employeeCode} • {t.officialEmail}</div>
                  </td>
                  <td className="p-3 font-medium text-muted-foreground">{t.departmentName}</td>
                  <td className="p-3 max-w-[200px]">
                    <div className="font-bold text-foreground">{t.assignedCoursesCount} Courses</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {t.courseTitles.join(", ") || "No courses"}
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold text-blue-600 bg-blue-500/5">
                    {t.distinctLearnersCount} Learners
                  </td>
                  <td className="p-3 text-center font-semibold">{t.totalSubmissions}</td>
                  <td className="p-3 text-center">
                    {t.pendingEvaluations > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {t.pendingEvaluations} Pending
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-600">
                    {t.evaluatedCount} Graded
                  </td>
                  <td className="p-3 text-center font-extrabold text-foreground">
                    {t.averagePercentage > 0 ? `${t.averagePercentage}%` : "N/A"}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTeacher(t);
                        setAuditModalOpen(true);
                      }}
                      className="h-7 text-xs font-bold gap-1 text-purple-600 border-purple-600/30 hover:bg-purple-600/10"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      View Audit Log
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Teacher Audit Log Dialog */}
      <Dialog open={auditModalOpen} onOpenChange={setAuditModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center justify-between">
              <span>
                Teacher Audit Trail: {selectedTeacher?.teacherName || "All Teachers"}
              </span>
              <Badge variant="outline" className="text-xs font-bold border-purple-500 text-purple-600">
                {selectedTeacher?.departmentName || "All Departments"}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300">
              Full timeline audit history documenting learner submissions, teacher evaluation responses, scores, grades, feedback comments, and revision requests.
            </div>

            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="p-2.5">Attempt &amp; Date</th>
                    <th className="p-2.5">Learner</th>
                    <th className="p-2.5">Course &amp; Task</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Score &amp; Grade</th>
                    <th className="p-2.5">Teacher Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {teacherAuditItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        No submission logs found for this teacher.
                      </td>
                    </tr>
                  ) : (
                    teacherAuditItems.map((item) => (
                      <tr key={item.submissionId} className="hover:bg-muted/20">
                        <td className="p-2.5 font-semibold">
                          <div>Attempt #{item.attemptNumber}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(item.submittedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-2.5 font-semibold">
                          <div>{item.studentName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{item.studentCode}</div>
                        </td>
                        <td className="p-2.5 max-w-[180px]">
                          <div className="font-bold truncate">{item.courseTitle}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{item.contentTitle}</div>
                        </td>
                        <td className="p-2.5">
                          {item.status === "SUBMITTED" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              Pending Review
                            </span>
                          ) : item.status === "NEEDS_REVISION" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                              Needs Revision
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Graded
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold">
                          {item.status === "GRADED" ? (
                            <span>{item.score}/{item.maxScore} ({item.grade || "Passed"})</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2.5 max-w-[220px]">
                          {item.feedback ? (
                            <p className="italic text-muted-foreground text-[11px] truncate" title={item.feedback}>
                              "{item.feedback}"
                            </p>
                          ) : (
                            <span className="text-muted-foreground text-[11px] italic">No feedback entered</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
