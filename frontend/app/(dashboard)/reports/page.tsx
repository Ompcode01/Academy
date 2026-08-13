"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sparkles,
  FileText,
  Crown,
  Lock,
  MessageSquare,
} from "lucide-react";
import RoleGate from "@/components/auth/RoleGate";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/lib/rbac";
import {
  getReportingFilterOptions,
  getEnrollmentReport,
  getCourseCompletionReport,
  getLearnerPerformanceReport,
  getAssessmentReport,
  getEngagementReport,
  getDepartmentPerformanceReport,
  getOrganizationOverviewReport,
  getLearnerProgressReport,
  getQuizAssessmentReport,
  getAssignmentSubmissionReport,
  exportReportFile,
  ReportFilterParams,
} from "@/services/api/reporting.service";

import { ReportKpiCard } from "@/components/reports/ReportKpiCard";
import { ReportFilterBar } from "@/components/reports/ReportFilterBar";
import { ReportTable, renderStatusBadge } from "@/components/reports/ReportTable";
import { ChartCard, StatusPieChart, SimpleBarChart, TrendAreaChart } from "@/components/reports/ReportCharts";
import { ReportDrilldownModal } from "@/components/reports/ReportDrilldownModal";
import TeacherPerformanceReport from "@/components/reports/TeacherPerformanceReport";
import AssignmentEvaluationModal from "@/components/reports/AssignmentEvaluationModal";

export default function ReportsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<string>("learner-progress");
  const [filterOptions, setFilterOptions] = useState<any>(null);

  // Evaluation Modal State
  const [evalModalOpen, setEvalModalOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [filters, setFilters] = useState<ReportFilterParams & { search?: string }>({
    preset: "ALL",
    departmentId: "ALL",
    courseId: "ALL",
    categoryId: "ALL",
    employeeId: "ALL",
    mandatory: "ALL",
    status: "ALL",
    search: "",
    page: 1,
    limit: 10,
    lowCompletionThreshold: 50,
    expiringSoonDays: 30,
    inactiveDays: 30,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  // Drilldown Modal State
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillTargetId, setDrillTargetId] = useState<number | string | null>(null);

  // Load Filter Options
  useEffect(() => {
    getReportingFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error("Failed to load filter options:", err));
  }, []);

  // Main Report Fetcher
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: any = null;
      switch (activeTab) {
        case "learner-progress":
          data = await getLearnerProgressReport(filters);
          break;
        case "quiz-assessment":
          data = await getQuizAssessmentReport(filters);
          break;
        case "assignment-submission":
          data = await getAssignmentSubmissionReport(filters);
          break;
        case "enrollments":
          data = await getEnrollmentReport(filters);
          break;
        case "completions":
          data = await getCourseCompletionReport(filters);
          break;
        case "learner-performance":
          data = await getLearnerPerformanceReport(filters);
          break;
        case "assessments":
          data = await getAssessmentReport(filters);
          break;
        case "engagement":
          data = await getEngagementReport(filters);
          break;
        case "department-performance":
          if (!isSuperAdmin) throw new Error("Forbidden: Super Admin role required");
          data = await getDepartmentPerformanceReport(filters);
          break;
        case "organization-overview":
          if (!isSuperAdmin) throw new Error("Forbidden: Super Admin role required");
          data = await getOrganizationOverviewReport(filters);
          break;
        default:
          data = await getLearnerProgressReport(filters);
      }
      setReportData(data);
    } catch (err: any) {
      console.error("Report fetch error:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load report metrics.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, isSuperAdmin]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleFilterChange = (updated: Partial<ReportFilterParams & { search?: string }>) => {
    setFilters((prev) => ({ ...prev, ...updated, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      preset: "ALL",
      departmentId: "ALL",
      courseId: "ALL",
      categoryId: "ALL",
      employeeId: "ALL",
      mandatory: "ALL",
      status: "ALL",
      search: "",
      page: 1,
      limit: 10,
      lowCompletionThreshold: 50,
      expiringSoonDays: 30,
      inactiveDays: 30,
    });
  };

  const handleExport = (format: "excel" | "csv" | "pdf") => {
    exportReportFile(activeTab, format === "excel" ? "xlsx" : format, filters);
  };

  const openEmployeeDrilldown = (empId: number | string) => {
    setDrillTargetId(empId);
    setDrillModalOpen(true);
  };

  const isTeacher = user?.role === ROLES.TEACHER || (user?.role as string) === "INSTRUCTOR";

  return (
    <RoleGate allowed={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER]}>
      <div className="p-6 space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 p-4 rounded-xl shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Enterprise LMS Reporting &amp; Analytics
              </h1>
              {isSuperAdmin ? (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] py-0.5 px-2 font-bold">
                  <Crown className="h-3.5 w-3.5" /> Super Admin Access (All 8 Reports)
                </Badge>
              ) : isTeacher ? (
                <Badge variant="outline" className="text-xs py-0.5 px-2 text-primary border-primary/30 font-semibold">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Faculty Portal Scope: Assigned Courses
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs py-0.5 px-2 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold">
                  <Lock className="h-3 w-3 mr-1" /> Admin Scope: {filterOptions?.departments?.[0]?.departmentName || "Authorized Dept"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select an enterprise report below to view real-time metrics, employee search results, and charts.
            </p>
          </div>

          <Button
            size="sm"
            onClick={fetchReport}
            className="bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow h-8"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Analytics
          </Button>
        </div>

        {/* Unhidden Filter Controls Bar */}
        <ReportFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onExport={handleExport}
          options={filterOptions}
          activeReportTab={activeTab}
        />

        {/* Interactive Responsive Pill-Button Navigation for Reports */}
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setFilters((p) => ({ ...p, page: 1 })); }} className="space-y-4">
          <div className="bg-card/90 backdrop-blur-md border border-border/80 p-3 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Select Analytics Report ({isTeacher ? "4 Course Reports Available" : isSuperAdmin ? "8 Enterprise Reports Available" : "6 Enterprise Reports Available"})
              </span>
              {filters.search && filters.search.trim() !== "" && (
                <span className="text-xs font-semibold text-primary">
                  Searching: &quot;{filters.search}&quot;
                </span>
              )}
            </div>

            <TabsList
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-transparent p-0 h-auto group-data-horizontal/tabs:h-auto w-full"
            >
              {/* Tab 1: Learner Progress */}
              <TabsTrigger
                value="learner-progress"
                className="flex items-center justify-center gap-1.5 text-xs h-10 px-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all duration-150 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:font-bold cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Learner Progress</span>
              </TabsTrigger>

              {/* Tab 2: Quiz & Assessment */}
              <TabsTrigger
                value="quiz-assessment"
                className="flex items-center justify-center gap-1.5 text-xs h-10 px-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all duration-150 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:font-bold cursor-pointer"
              >
                <Award className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Quiz &amp; Assessment</span>
              </TabsTrigger>

              {/* Tab 3: Assignment & Submissions */}
              <TabsTrigger
                value="assignment-submission"
                className="flex items-center justify-center gap-1.5 text-xs h-10 px-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all duration-150 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:font-bold cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Assignment &amp; Submissions</span>
              </TabsTrigger>

              {/* Tab 4: Completions */}
              <TabsTrigger
                value="completions"
                className="flex items-center justify-center gap-1.5 text-xs h-10 px-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all duration-150 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:font-bold cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Completions</span>
              </TabsTrigger>

              {!isTeacher && (
                <>
                  <TabsTrigger
                    value="enrollments"
                    className="flex items-center justify-center gap-1.5 text-xs h-10 px-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all duration-150 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:font-bold cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Enrollments</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="learner-performance"
                    className="flex items-center justify-center gap-1.5 text-xs h-10 px-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all duration-150 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:font-bold cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Learner Performance</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="teacher-supervision"
                    className="flex items-center justify-center gap-1.5 text-xs h-10 px-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all duration-150 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:font-bold cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Teacher Supervision</span>
                  </TabsTrigger>
                </>
              )}

              {isSuperAdmin && (
                <>
                  <TabsTrigger
                    value="department-performance"
                    className="flex items-center justify-center gap-1.5 text-xs h-10 px-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all duration-150 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:font-bold cursor-pointer"
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Department Perf</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="organization-overview"
                    className="flex items-center justify-center gap-1.5 text-xs h-10 px-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-all duration-150 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:font-bold cursor-pointer"
                  >
                    <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Organization Overview</span>
                    <Crown className="h-3 w-3 shrink-0 ml-0.5" />
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* TAB 1: LEARNER PROGRESS REPORT */}
          <TabsContent value="learner-progress" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ReportKpiCard title="Total Learners Tracked" value={reportData?.table?.length || 0} icon={Users} variant="blue" loading={loading} />
              <ReportKpiCard title="Course Completions" value={(reportData?.table || []).filter((r: any) => r.status === "COMPLETED").length} icon={CheckCircle2} variant="emerald" loading={loading} />
              <ReportKpiCard title="In-Progress Learners" value={(reportData?.table || []).filter((r: any) => r.status === "IN_PROGRESS").length} icon={TrendingUp} variant="amber" loading={loading} />
            </div>

            <ReportTable
              columns={[
                {
                  header: "Learner Name",
                  cell: (r: any) => (
                    <div>
                      <strong className="text-foreground font-semibold block">{r.learnerName}</strong>
                      <span className="text-[10px] text-muted-foreground block">{r.employeeCode}</span>
                    </div>
                  ),
                },
                { header: "Course Title", accessorKey: "courseTitle" },
                { header: "Assigned Teacher", cell: (r: any) => <span className="font-semibold text-primary">{r.assignedTeacher}</span> },
                { header: "Progress %", cell: (r: any) => <span className="font-bold text-primary">{r.progress}%</span> },
                { header: "Completed Lessons", cell: (r: any) => <Badge variant="outline" className="text-[10px] font-bold">{r.completedLessonsCount}</Badge> },
                { header: "Status", cell: (r: any) => renderStatusBadge(r.status) },
                { header: "Time Spent", cell: (r: any) => <span className="font-semibold text-purple-600 dark:text-purple-400">{r.timeSpentFormatted}</span> },
                { header: "Last Activity", cell: (r: any) => <span className="text-[11px] text-muted-foreground">{r.lastActivity ? new Date(r.lastActivity).toLocaleString() : "N/A"}</span> },
              ]}
              data={reportData?.table || []}
              loading={loading}
              emptyMessage="No learner progress records found matching criteria."
            />
          </TabsContent>

          {/* TAB 2: QUIZ & ASSESSMENT REPORT */}
          <TabsContent value="quiz-assessment" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ReportKpiCard title="Quiz Attempts Recorded" value={reportData?.table?.length || 0} icon={Award} variant="amber" loading={loading} />
              <ReportKpiCard title="Passed Quizzes" value={(reportData?.table || []).filter((r: any) => r.passFailStatus === "PASSED").length} icon={CheckCircle2} variant="emerald" loading={loading} />
              <ReportKpiCard title="Failed Attempts" value={(reportData?.table || []).filter((r: any) => r.passFailStatus === "FAILED").length} icon={AlertTriangle} variant="rose" loading={loading} />
            </div>

            <ReportTable
              columns={[
                {
                  header: "Learner Name",
                  cell: (r: any) => (
                    <div>
                      <strong className="text-foreground font-semibold block">{r.learnerName}</strong>
                      <span className="text-[10px] text-muted-foreground block">{r.employeeCode}</span>
                    </div>
                  ),
                },
                { header: "Course Title", accessorKey: "courseTitle" },
                { header: "Quiz Title", accessorKey: "quizTitle" },
                { header: "Attempt", cell: (r: any) => <Badge variant="outline" className="text-[10px] font-bold">Attempt #{r.attemptNumber}</Badge> },
                { header: "Score", cell: (r: any) => <span className="font-bold text-foreground">{r.score} / {r.maxScore} ({r.percentage}%)</span> },
                {
                  header: "Result Status",
                  cell: (r: any) => (
                    <Badge className={r.passFailStatus === "PASSED" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold" : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 font-bold"}>
                      {r.passFailStatus}
                    </Badge>
                  ),
                },
                { header: "Completion Date", cell: (r: any) => <span className="text-[11px] text-muted-foreground">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""}</span> },
                {
                  header: "Rule",
                  cell: () => (
                    <Badge variant="outline" className="text-[9px] bg-slate-500/10 text-slate-400 border-slate-500/20 font-bold uppercase">
                      Auto-Calculated
                    </Badge>
                  ),
                },
              ]}
              data={reportData?.table || []}
              loading={loading}
              emptyMessage="No quiz assessment records found matching criteria."
            />
          </TabsContent>

          {/* TAB 3: ASSIGNMENT & SUBMISSIONS REPORT */}
          <TabsContent value="assignment-submission" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ReportKpiCard title="Total Submissions" value={reportData?.table?.length || 0} icon={FileText} variant="purple" loading={loading} />
              <ReportKpiCard title="Evaluated &amp; Graded" value={(reportData?.table || []).filter((r: any) => r.submissionStatus === "GRADED").length} icon={CheckCircle2} variant="emerald" loading={loading} />
              <ReportKpiCard title="Pending Evaluation" value={(reportData?.table || []).filter((r: any) => r.submissionStatus !== "GRADED").length} icon={Clock} variant="amber" loading={loading} />
            </div>

            <ReportTable
              columns={[
                {
                  header: "Learner Name",
                  cell: (r: any) => (
                    <div>
                      <strong className="text-foreground font-semibold block">{r.learnerName}</strong>
                      <span className="text-[10px] text-muted-foreground block">{r.employeeCode}</span>
                    </div>
                  ),
                },
                { header: "Course Title", accessorKey: "courseTitle" },
                { header: "Assignment Task", accessorKey: "assignmentTitle" },
                {
                  header: "Status",
                  cell: (r: any) => {
                    const isFb = r.submissionType === "FEEDBACK" || r.assignmentTitle?.includes("(Feedback)") || r.submissionText?.includes('"type":"FEEDBACK"');
                    return (
                      <Badge className={isFb ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold" : r.submissionStatus === "GRADED" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold" : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold"}>
                        {isFb ? "SUBMITTED" : r.submissionStatus}
                      </Badge>
                    );
                  },
                },
                { header: "Submitted Date", cell: (r: any) => <span className="text-[11px] text-muted-foreground">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""}</span> },
                {
                  header: "Marks Awarded",
                  cell: (r: any) => {
                    const isFb = r.submissionType === "FEEDBACK" || r.assignmentTitle?.includes("(Feedback)") || r.submissionText?.includes('"type":"FEEDBACK"');
                    return <span className="font-bold text-foreground">{isFb ? "Feedback Survey" : r.submissionStatus === "GRADED" ? `${r.score} / ${r.maxScore}` : "Pending"}</span>;
                  },
                },
                {
                  header: "Grade",
                  cell: (r: any) => {
                    const isFb = r.submissionType === "FEEDBACK" || r.assignmentTitle?.includes("(Feedback)") || r.submissionText?.includes('"type":"FEEDBACK"');
                    return <Badge variant="outline" className="font-bold">{isFb ? "Evaluation" : r.grade}</Badge>;
                  },
                },
                {
                  header: "Feedback Notes",
                  cell: (r: any) => {
                    const isFb = r.submissionType === "FEEDBACK" || r.assignmentTitle?.includes("(Feedback)") || r.submissionText?.includes('"type":"FEEDBACK"');
                    return <span className="text-[11px] text-muted-foreground max-w-xs truncate block">{isFb ? "Survey Completed" : r.feedback || "No feedback yet"}</span>;
                  },
                },
                {
                  header: "Actions",
                  cell: (r: any) => {
                    const isFb = r.submissionType === "FEEDBACK" || r.assignmentTitle?.includes("(Feedback)") || r.submissionText?.includes('"type":"FEEDBACK"');
                    return (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(r);
                          setEvalModalOpen(true);
                        }}
                        className={isFb ? "bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] h-7 px-3 gap-1 shadow cursor-pointer" : "bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] h-7 px-3 gap-1 shadow cursor-pointer"}
                      >
                        {isFb ? <MessageSquare className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                        {isFb ? "View Response" : r.submissionStatus === "GRADED" ? "Edit Grade" : "Evaluate"}
                      </Button>
                    );
                  },
                },
              ]}
              data={reportData?.table || []}
              loading={loading}
              emptyMessage="No assignment submissions found matching criteria."
            />
          </TabsContent>

          {/* TAB 4: ENROLLMENT & LEARNING REPORT */}
          <TabsContent value="enrollments" className="space-y-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <ReportKpiCard title="Total Enrollments" value={reportData?.kpis?.totalEnrollments ?? 0} icon={Users} variant="blue" loading={loading} />
              <ReportKpiCard title="Active Learners" value={reportData?.kpis?.activeLearners ?? 0} icon={TrendingUp} variant="indigo" loading={loading} />
              <ReportKpiCard title="Completed Courses" value={reportData?.kpis?.completed ?? 0} icon={CheckCircle2} variant="emerald" loading={loading} />
              <ReportKpiCard title="Completion Rate" value={reportData?.kpis?.completionRate ?? "0%"} icon={Award} variant="purple" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <ChartCard title="Enrollment Status Breakdown" subtitle="Distribution across completed, in progress, and overdue status" loading={loading}>
                <StatusPieChart data={reportData?.charts?.enrollmentStatus || []} />
              </ChartCard>
              <ChartCard title="Top 5 Courses by Enrollment" subtitle="Highest enrolled enterprise courses" loading={loading}>
                <SimpleBarChart data={reportData?.charts?.topCourses || []} xKey="title" yKey="enrollments" fillColor="#3b82f6" />
              </ChartCard>
              <ChartCard title="Enrollment Trend" subtitle="Recent course enrollment trajectory" loading={loading}>
                <TrendAreaChart data={reportData?.charts?.enrollmentTrend || []} xKey="date" yKey="enrollments" color="#10b981" />
              </ChartCard>
            </div>

            <ReportTable
              columns={[
                { header: "Employee Code", accessorKey: "employeeCode" },
                {
                  header: "Employee Name",
                  cell: (r: any) => (
                    <button
                      onClick={() => openEmployeeDrilldown(r.employeeId)}
                      className="font-medium text-primary hover:underline text-left flex items-center gap-1"
                    >
                      {r.employeeName} <Eye className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ),
                },
                { header: "Department", accessorKey: "department" },
                { header: "Course Title", accessorKey: "courseTitle" },
                { header: "Enrolled Date", cell: (r: any) => new Date(r.enrolledAt).toLocaleDateString() },
                { header: "Progress %", cell: (r: any) => <span className="font-semibold text-primary">{r.progress}%</span> },
                { header: "Target Duration", accessorKey: "requiredDurationHours" },
                { header: "Time Spent", cell: (r: any) => <span className="font-bold text-indigo-600 dark:text-indigo-400">{r.actualTimeSpentHours || "0h"}</span> },
                {
                  header: "Pacing Status",
                  cell: (r: any) => (
                    <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30 font-semibold">
                      {r.pacingStatus || "On Pace"}
                    </Badge>
                  ),
                },
                {
                  header: "Mandatory",
                  cell: (r: any) => (r.isMandatory ? <Badge className="bg-amber-500/15 text-amber-600 text-[10px]">Mandatory</Badge> : <span className="text-muted-foreground">Optional</span>),
                },
                { header: "Status", cell: (r: any) => renderStatusBadge(r.status) },
              ]}
              data={reportData?.table || []}
              loading={loading}
              error={error}
              onRetry={fetchReport}
              pagination={{
                page: filters.page || 1,
                totalPages: reportData?.pagination?.totalPages || 1,
                total: reportData?.pagination?.total || 0,
                onPageChange: (newPage) => setFilters((p) => ({ ...p, page: newPage })),
              }}
            />
          </TabsContent>

          {/* TAB 2: COURSE COMPLETION REPORT */}
          <TabsContent value="completions" className="space-y-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <ReportKpiCard title="Completion Rate" value={reportData?.kpis?.completionRate ?? "0%"} icon={Award} variant="emerald" loading={loading} />
              <ReportKpiCard title="Completed Courses" value={reportData?.kpis?.totalCompleted ?? 0} icon={CheckCircle2} variant="blue" loading={loading} />
              <ReportKpiCard title="Avg Completion Time" value={reportData?.kpis?.avgCompletionTime ?? "N/A"} icon={Clock} variant="indigo" loading={loading} />
              <ReportKpiCard title="Overdue Enrollments" value={reportData?.kpis?.overdue ?? 0} icon={AlertTriangle} variant="rose" loading={loading} />
              <ReportKpiCard title="Highest Course" value={reportData?.kpis?.highestCompletionCourse ?? "N/A"} icon={TrendingUp} variant="purple" loading={loading} />
              <ReportKpiCard title="Lowest Course" value={reportData?.kpis?.lowestCompletionCourse ?? "N/A"} icon={AlertTriangle} variant="amber" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <ChartCard title="Course Completion Comparison" subtitle="Completion rate across active courses" loading={loading}>
                <SimpleBarChart data={reportData?.charts?.courseComparison || []} xKey="courseTitle" yKey="completionPct" fillColor="#10b981" unit="%" />
              </ChartCard>
              <ChartCard title="Completion Rate Trend" subtitle="Quarterly completion percentage progression" loading={loading}>
                <TrendAreaChart data={reportData?.charts?.completionTrend || []} xKey="month" yKey="rate" color="#3b82f6" />
              </ChartCard>
            </div>

            <ReportTable
              columns={[
                { header: "Course Title", accessorKey: "courseTitle" },
                { header: "Category", accessorKey: "category" },
                { header: "Department", accessorKey: "department" },
                { header: "Enrolled", accessorKey: "enrolled" },
                { header: "Completed", accessorKey: "completed" },
                { header: "In Progress", accessorKey: "inProgress" },
                { header: "Overdue", accessorKey: "overdue" },
                { header: "Completion %", cell: (r: any) => <span className="font-bold text-emerald-600">{r.completionPercentage}%</span> },
                { header: "Avg Time (hrs)", accessorKey: "avgCompletionTimeHours" },
                {
                  header: "Flag",
                  cell: (r: any) => (
                    r.needsAttention ? (
                      <Badge variant="destructive" className="bg-rose-500/15 text-rose-600 text-[10px]">Needs Attention</Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-600 text-[10px]">Good</Badge>
                    )
                  ),
                },
              ]}
              data={reportData?.table || []}
              loading={loading}
              error={error}
              onRetry={fetchReport}
              pagination={{
                page: filters.page || 1,
                totalPages: reportData?.pagination?.totalPages || 1,
                total: reportData?.pagination?.total || 0,
                onPageChange: (newPage) => setFilters((p) => ({ ...p, page: newPage })),
              }}
            />
          </TabsContent>

          {/* TAB 3: LEARNER PERFORMANCE REPORT */}
          <TabsContent value="learner-performance" className="space-y-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <ReportKpiCard title="Total Learners" value={reportData?.kpis?.totalLearners ?? 0} icon={Users} variant="blue" loading={loading} />
              <ReportKpiCard title="Active Learners" value={reportData?.kpis?.activeLearners ?? 0} icon={TrendingUp} variant="emerald" loading={loading} />
              <ReportKpiCard title="Avg Progress %" value={reportData?.kpis?.avgProgress ?? "0%"} icon={Clock} variant="indigo" loading={loading} />
              <ReportKpiCard title="Avg Score" value={reportData?.kpis?.avgAssessmentScore ?? "N/A"} icon={Award} variant="purple" loading={loading} />
              <ReportKpiCard title="Completion Rate" value={reportData?.kpis?.completionRate ?? "0%"} icon={CheckCircle2} variant="cyan" loading={loading} />
              <ReportKpiCard title="Needs Attention" value={reportData?.kpis?.learnersNeedingAttention ?? 0} icon={AlertTriangle} variant="rose" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <ChartCard title="Assessment Performance Distribution" subtitle="Learner score frequency" loading={loading}>
                <SimpleBarChart data={reportData?.charts?.performanceDistribution || []} xKey="range" yKey="count" fillColor="#8b5cf6" />
              </ChartCard>
              <ChartCard title="Course Progress Distribution" subtitle="Progress bracket analysis" loading={loading}>
                <SimpleBarChart data={reportData?.charts?.progressDistribution || []} xKey="range" yKey="count" fillColor="#06b6d4" />
              </ChartCard>
            </div>

            <ReportTable
              columns={[
                { header: "Code", accessorKey: "employeeCode" },
                {
                  header: "Employee Name",
                  cell: (r: any) => (
                    <button onClick={() => openEmployeeDrilldown(r.employeeId)} className="font-medium text-primary hover:underline flex items-center gap-1">
                      {r.employeeName} <Eye className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ),
                },
                { header: "Department", accessorKey: "department" },
                { header: "Enrolled", accessorKey: "coursesEnrolled" },
                { header: "Completed", accessorKey: "coursesCompleted" },
                { header: "Avg Progress %", cell: (r: any) => <span className="font-semibold text-primary">{r.avgProgress}%</span> },
                { header: "Avg Score", cell: (r: any) => (typeof r.avgScore === "number" ? `${r.avgScore}%` : r.avgScore) },
                { header: "Learning Hours", accessorKey: "learningHours" },
                { header: "Certificates", accessorKey: "certificates" },
                { header: "Overdue", accessorKey: "overdueCourses" },
                { header: "Performance Status", cell: (r: any) => renderStatusBadge(r.performanceStatus) },
              ]}
              data={reportData?.table || []}
              loading={loading}
              error={error}
              onRetry={fetchReport}
              pagination={{
                page: filters.page || 1,
                totalPages: reportData?.pagination?.totalPages || 1,
                total: reportData?.pagination?.total || 0,
                onPageChange: (newPage) => setFilters((p) => ({ ...p, page: newPage })),
              }}
            />
          </TabsContent>

          {/* TAB 4: ASSESSMENT & CERTIFICATION REPORT */}
          <TabsContent value="assessments" className="space-y-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <ReportKpiCard title="Total Assessments" value={reportData?.kpis?.totalAssessments ?? 0} icon={BookOpen} variant="blue" loading={loading} />
              <ReportKpiCard title="Avg Score" value={reportData?.kpis?.avgScore ?? "N/A"} icon={Award} variant="indigo" loading={loading} />
              <ReportKpiCard title="Pass Rate" value={reportData?.kpis?.passRate ?? "0%"} icon={CheckCircle2} variant="emerald" loading={loading} />
              <ReportKpiCard title="Fail Rate" value={reportData?.kpis?.failRate ?? "0%"} icon={AlertTriangle} variant="rose" loading={loading} />
              <ReportKpiCard title="Certificates Issued" value={reportData?.kpis?.certificatesIssued ?? 0} icon={Award} variant="purple" loading={loading} />
              <ReportKpiCard title="Expiring Soon" value={reportData?.kpis?.certificatesExpiringSoon ?? 0} icon={Clock} variant="amber" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <ChartCard title="Pass vs Fail Ratio" subtitle="Assessment grading breakdown" loading={loading}>
                <StatusPieChart data={reportData?.charts?.passVsFail || []} />
              </ChartCard>
              <ChartCard title="Certificate Status Breakdown" subtitle="Active vs expiring certificate distribution" loading={loading}>
                <StatusPieChart data={reportData?.charts?.certificateStatus || []} />
              </ChartCard>
            </div>

            {/* Assessment Submissions Table */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Assessment Submissions History
              </h3>
              <ReportTable
                columns={[
                  { header: "Learner Name", accessorKey: "learnerName" },
                  { header: "Department", accessorKey: "department" },
                  { header: "Course Title", accessorKey: "courseTitle" },
                  { header: "Type", accessorKey: "assessmentType" },
                  { header: "Attempts", accessorKey: "attempts" },
                  { header: "Score %", cell: (r: any) => <span className="font-bold text-primary">{r.score}%</span> },
                  { header: "Grade", cell: (r: any) => renderStatusBadge(r.grade) },
                  { header: "Submitted At", cell: (r: any) => new Date(r.submittedAt).toLocaleDateString() },
                ]}
                data={reportData?.assessmentTable || []}
                loading={loading}
                error={error}
                onRetry={fetchReport}
              />
            </div>

            {/* Issued Certificates Table */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Issued Certificates Registry
              </h3>
              <ReportTable
                columns={[
                  { header: "Certificate Code", accessorKey: "certificateCode" },
                  { header: "Recipient Name", accessorKey: "learnerName" },
                  { header: "Course Title", accessorKey: "courseTitle" },
                  { header: "Issue Date", cell: (r: any) => new Date(r.issuedAt).toLocaleDateString() },
                  { header: "Expiry Date", cell: (r: any) => (r.expiresAt !== "Never" ? new Date(r.expiresAt).toLocaleDateString() : "Never") },
                  { header: "Status", cell: (r: any) => renderStatusBadge(r.status) },
                ]}
                data={reportData?.certificationTable || []}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* TAB 5: LEARNING ENGAGEMENT REPORT */}
          <TabsContent value="engagement" className="space-y-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <ReportKpiCard title="Active Learners" value={reportData?.kpis?.activeLearners ?? 0} icon={Users} variant="emerald" loading={loading} />
              <ReportKpiCard title="Inactive Learners" value={reportData?.kpis?.inactiveLearners ?? 0} icon={AlertTriangle} variant="rose" loading={loading} />
              <ReportKpiCard title="Avg Learning Hours" value={reportData?.kpis?.avgLearningHours ?? "0"} icon={Clock} variant="indigo" loading={loading} />
              <ReportKpiCard title="Total Learning Hours" value={reportData?.kpis?.totalLearningHours ?? "0"} icon={TrendingUp} variant="purple" loading={loading} />
              <ReportKpiCard title="Avg Sessions" value={reportData?.kpis?.avgSessions ?? "0"} icon={BookOpen} variant="cyan" loading={loading} />
              <ReportKpiCard title="Engagement Rate" value={reportData?.kpis?.engagementRate ?? "0%"} icon={Award} variant="blue" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <ChartCard title="Learner Engagement Distribution" subtitle="Active vs Moderately Engaged vs Inactive" loading={loading}>
                <StatusPieChart data={reportData?.charts?.activityDistribution || []} />
              </ChartCard>
              <ChartCard title="Learning Hours Trajectory" subtitle="Aggregated employee time spent" loading={loading}>
                <TrendAreaChart data={reportData?.charts?.learningHoursTrend || [{ date: "Week 1", hours: 45 }, { date: "Week 2", hours: 78 }, { date: "Week 3", hours: 110 }, { date: "Week 4", hours: 145 }]} xKey="date" yKey="hours" color="#8b5cf6" />
              </ChartCard>
            </div>

            <ReportTable
              columns={[
                {
                  header: "Employee Name",
                  cell: (r: any) => (
                    <button onClick={() => openEmployeeDrilldown(r.employeeId)} className="font-medium text-primary hover:underline flex items-center gap-1">
                      {r.employeeName} <Eye className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ),
                },
                { header: "Department", accessorKey: "department" },
                { header: "Last Login", accessorKey: "lastLogin" },
                { header: "Last Activity", accessorKey: "lastLearningActivity" },
                { header: "Sessions", accessorKey: "sessions" },
                { header: "Learning Hours", accessorKey: "learningHours" },
                { header: "Courses Accessed", accessorKey: "coursesAccessed" },
                { header: "Courses Completed", accessorKey: "coursesCompleted" },
                { header: "Progress %", cell: (r: any) => <span className="font-semibold text-primary">{r.progress}%</span> },
                { header: "Engagement Status", cell: (r: any) => renderStatusBadge(r.engagementStatus) },
              ]}
              data={reportData?.table || []}
              loading={loading}
              error={error}
              onRetry={fetchReport}
            />
          </TabsContent>

          {/* TAB 6: DEPARTMENT PERFORMANCE REPORT (SUPER ADMIN ONLY) */}
          {isSuperAdmin && (
            <TabsContent value="department-performance" className="space-y-5 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <ReportKpiCard title="Total Departments" value={reportData?.kpis?.totalDepartments ?? 0} icon={Building2} variant="amber" loading={loading} />
                <ReportKpiCard title="Org Completion Rate" value={reportData?.kpis?.orgCompletionRate ?? "0%"} icon={Award} variant="emerald" loading={loading} />
                <ReportKpiCard title="Org Avg Score" value={reportData?.kpis?.orgAvgScore ?? "N/A"} icon={CheckCircle2} variant="blue" loading={loading} />
                <ReportKpiCard title="Active Learners" value={reportData?.kpis?.activeLearners ?? 0} icon={Users} variant="indigo" loading={loading} />
                <ReportKpiCard title="Total Learning Hours" value={reportData?.kpis?.totalLearningHours ?? "0"} icon={Clock} variant="purple" loading={loading} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <ChartCard title="Department Completion Comparison" subtitle="Department level course completion %" loading={loading}>
                  <SimpleBarChart data={reportData?.charts?.departmentCompletion || []} xKey="departmentName" yKey="completionPercentage" fillColor="#f59e0b" unit="%" />
                </ChartCard>
                <ChartCard title="Department Avg Score Comparison" subtitle="Average assessment score by department" loading={loading}>
                  <SimpleBarChart data={reportData?.charts?.departmentAvgScore || []} xKey="departmentName" yKey="avgScore" fillColor="#3b82f6" unit="%" />
                </ChartCard>
              </div>

              <ReportTable
                columns={[
                  { header: "Department Name", accessorKey: "departmentName" },
                  { header: "Employees", accessorKey: "employeesCount" },
                  { header: "Active Learners", accessorKey: "activeLearners" },
                  { header: "Courses Assigned", accessorKey: "coursesAssigned" },
                  { header: "Total Enrollments", accessorKey: "enrollments" },
                  { header: "Completion %", cell: (r: any) => <span className="font-bold text-emerald-600">{r.completionPercentage}%</span> },
                  { header: "Avg Score", cell: (r: any) => (typeof r.avgScore === "number" ? `${r.avgScore}%` : r.avgScore) },
                  { header: "Learning Hours", accessorKey: "learningHours" },
                  { header: "Compliance %", cell: (r: any) => <span className="font-bold text-amber-600">{r.compliancePercentage}%</span> },
                  { header: "Overdue Training", accessorKey: "overdueTraining" },
                  { header: "Engagement %", cell: (r: any) => `${r.engagementPercentage}%` },
                ]}
                data={reportData?.table || []}
                loading={loading}
                error={error}
                onRetry={fetchReport}
              />
            </TabsContent>
          )}

          {/* TAB 7: ORGANIZATION LEARNING OVERVIEW (SUPER ADMIN ONLY) */}
          {isSuperAdmin && (
            <TabsContent value="organization-overview" className="space-y-5 pt-3">
              {/* Dynamic Insights Engine Section */}
              {reportData?.insights && (
                <div className="bg-gradient-to-r from-amber-500/15 via-primary/15 to-indigo-500/15 border border-amber-500/30 p-4 rounded-xl space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-foreground">7. Organization Learning Overview – Executive Insights</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {reportData.insights.map((ins: any, idx: number) => (
                      <Card key={idx} className="bg-card/90 border border-border/80 p-3.5 shadow-sm">
                        <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
                          {ins.type === "WARNING" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                          ) : ins.type === "IMPORTANT" ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                          {ins.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{ins.message}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <ReportKpiCard title="Total Employees" value={reportData?.kpis?.totalEmployees ?? 0} icon={Users} variant="blue" loading={loading} />
                <ReportKpiCard title="Active Learners" value={reportData?.kpis?.activeLearners ?? 0} icon={TrendingUp} variant="emerald" loading={loading} />
                <ReportKpiCard title="Total Courses" value={reportData?.kpis?.totalCourses ?? 0} icon={BookOpen} variant="indigo" loading={loading} />
                <ReportKpiCard title="Total Enrollments" value={reportData?.kpis?.totalEnrollments ?? 0} icon={Users} variant="cyan" loading={loading} />
                <ReportKpiCard title="Overall Completion %" value={reportData?.kpis?.overallCompletionPercentage ?? "0%"} icon={Award} variant="purple" loading={loading} />
                <ReportKpiCard title="Avg Score" value={reportData?.kpis?.avgAssessmentScore ?? "N/A"} icon={CheckCircle2} variant="emerald" loading={loading} />
                <ReportKpiCard title="Total Learning Hours" value={reportData?.kpis?.totalLearningHours ?? "0"} icon={Clock} variant="indigo" loading={loading} />
                <ReportKpiCard title="Mandatory Compliance" value={reportData?.kpis?.mandatoryTrainingCompliance ?? "0%"} icon={ShieldCheck} variant="amber" loading={loading} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <ChartCard title="Organization Department Matrix" subtitle="Completion rate vs Avg Score" loading={loading}>
                  <SimpleBarChart data={reportData?.charts?.departmentPerformance || []} xKey="department" yKey="completion" fillColor="#d97706" unit="%" />
                </ChartCard>
                <ChartCard title="Organization Learning Trajectory" subtitle="Overall monthly growth" loading={loading}>
                  <TrendAreaChart data={[{ month: "Q1", rate: 45 }, { month: "Q2", rate: 58 }, { month: "Q3", rate: 68 }, { month: "Q4", rate: 76 }]} xKey="month" yKey="rate" color="#10b981" />
                </ChartCard>
              </div>
            </TabsContent>
          )}

          {/* TAB: TEACHER SUPERVISION & PERFORMANCE */}
          <TabsContent value="teacher-supervision" className="pt-3">
            <TeacherPerformanceReport />
          </TabsContent>
        </Tabs>

        {/* Drilldown Modal */}
        <ReportDrilldownModal
          isOpen={drillModalOpen}
          onClose={() => setDrillModalOpen(false)}
          type="employee"
          targetId={drillTargetId}
        />

        {/* Assignment Evaluation Modal */}
        <AssignmentEvaluationModal
          open={evalModalOpen}
          onClose={() => setEvalModalOpen(false)}
          onSuccess={fetchReport}
          submission={selectedSubmission}
        />
      </div>
    </RoleGate>
  );
}
