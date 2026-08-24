"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Clock,
  CheckCircle2,
  BookOpen,
  Award,
  Calendar,
  Building2,
  Mail,
  X,
  FileText,
  HelpCircle,
  Video,
  BarChart2,
  Sparkles,
} from "lucide-react";

export interface LearnerProgressSummary {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  officialEmail: string;
  designation?: string;
  departmentName?: string;
  profileImage?: string;
  enrolledAt: string;
  progress: number;
  status: string;
  completedAt?: string;
  timeSpentSeconds: number;
  formattedTimeSpent: string;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lastActivityAt: string;
  lessonsProgress: Array<{
    contentId: number;
    title: string;
    contentType: string;
    sectionTitle: string;
    isCompleted: boolean;
    completedAt?: string;
    activeLearningSeconds: number;
    lastPosition?: number;
  }>;
  submissions: Array<{
    id: number;
    submissionType: string;
    status: string;
    score?: number;
    maxScore?: number;
    percentage?: number;
    submittedAt: string;
    feedbackNotes?: string;
    gradedBy?: string;
  }>;
}

interface TeacherLearnerSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learner: LearnerProgressSummary | null;
  courseTitle?: string;
}

export default function TeacherLearnerSummaryModal({
  open,
  onOpenChange,
  learner,
  courseTitle = "Course",
}: TeacherLearnerSummaryModalProps) {
  const [activeTab, setActiveTab] = useState<"lessons" | "assessments">("lessons");

  if (!learner) return null;

  const getInitials = (first?: string, last?: string) => {
    if (first && last) return (first[0] + last[0]).toUpperCase();
    if (first) return first.slice(0, 2).toUpperCase();
    return "LN";
  };

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400",
    IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400",
    NOT_STARTED: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
  };

  const getContentTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "VIDEO":
        return <Video className="h-3.5 w-3.5 text-blue-600" />;
      case "QUIZ":
        return <HelpCircle className="h-3.5 w-3.5 text-purple-600" />;
      case "ASSIGNMENT":
        return <FileText className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <BookOpen className="h-3.5 w-3.5 text-emerald-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-white/20 shadow-md">
                {learner.profileImage ? (
                  <AvatarImage src={learner.profileImage} alt={learner.firstName} />
                ) : (
                  <AvatarFallback className="bg-primary/20 text-primary-foreground font-extrabold text-lg">
                    {getInitials(learner.firstName, learner.lastName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold text-white">
                    {learner.firstName} {learner.lastName}
                  </DialogTitle>
                  <Badge variant="outline" className={`text-xs font-semibold border ${statusColors[learner.status] || "bg-slate-800 text-slate-200"}`}>
                    {learner.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 font-medium">
                  <span>ID: <strong className="text-white">{learner.employeeCode}</strong></span>
                  <span>•</span>
                  <span>{learner.designation || "Learner"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    {learner.departmentName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 pt-0.5">
                  <Mail className="h-3 w-3" />
                  {learner.officialEmail}
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-indigo-200/80 pt-2 border-t border-white/10 mt-4 font-medium">
            Course Performance Summary for: <span className="font-bold text-white">{courseTitle}</span>
          </p>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-card-foreground">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 p-3.5 rounded-xl border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                <span>Overall Progress</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <p className="text-2xl font-extrabold text-primary">{learner.progress}%</p>
              <Progress value={learner.progress} className="h-1.5 bg-muted" />
            </div>

            <div className="bg-muted/50 p-3.5 rounded-xl border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                <span>Time Spent</span>
                <Clock className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <p className="text-xl font-extrabold text-foreground truncate">{learner.formattedTimeSpent}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Active Learning Duration</p>
            </div>

            <div className="bg-muted/50 p-3.5 rounded-xl border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                <span>Lessons Completed</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {learner.completedLessonsCount} / {learner.totalLessonsCount}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">Course Content Items</p>
            </div>

            <div className="bg-muted/50 p-3.5 rounded-xl border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                <span>Last Activity</span>
                <Calendar className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <p className="text-sm font-bold text-foreground pt-1">
                {learner.lastActivityAt ? new Date(learner.lastActivityAt).toLocaleDateString() : "N/A"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Enrolled: {learner.enrolledAt ? new Date(learner.enrolledAt).toLocaleDateString() : "Recently"}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-border gap-4">
            <button
              onClick={() => setActiveTab("lessons")}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "lessons"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Lesson Progress ({learner.lessonsProgress.length})
            </button>
            <button
              onClick={() => setActiveTab("assessments")}
              className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "assessments"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              Assessments &amp; Submissions ({learner.submissions.length})
            </button>
          </div>

          {/* Tab 1: Lesson Progress Breakdown Table */}
          {activeTab === "lessons" && (
            <div className="space-y-3">
              {learner.lessonsProgress.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground bg-muted/20 border border-border rounded-xl">
                  No detailed lesson records found for this learner yet.
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                      <tr>
                        <th className="py-2.5 px-4">Content Title</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Time Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {learner.lessonsProgress.map((lp, idx) => {
                        const mins = Math.floor(lp.activeLearningSeconds / 60);
                        const secs = lp.activeLearningSeconds % 60;
                        const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                        return (
                          <tr key={idx} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4 font-semibold text-foreground">
                              <div>
                                <p className="font-bold text-xs">{lp.title}</p>
                                <p className="text-[10px] text-muted-foreground">{lp.sectionTitle}</p>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                {getContentTypeIcon(lp.contentType)}
                                {lp.contentType}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {lp.isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                  In Progress
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-muted-foreground">
                              {timeStr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Assessment & Submissions Table */}
          {activeTab === "assessments" && (
            <div className="space-y-3">
              {learner.submissions.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground bg-muted/20 border border-border rounded-xl">
                  No quiz or assignment submissions recorded for this learner yet.
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                      <tr>
                        <th className="py-2.5 px-4">Submission Type</th>
                        <th className="py-2.5 px-3">Submitted At</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {learner.submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-bold text-foreground">
                            {sub.submissionType || "Assessment"}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground font-medium">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-[10px] font-bold bg-muted text-foreground">
                              {sub.status || "GRADED"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-foreground">
                            {sub.score !== undefined && sub.maxScore !== undefined
                              ? `${sub.score} / ${sub.maxScore} (${sub.percentage ?? Math.round((sub.score / sub.maxScore) * 100)}%)`
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-end shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs font-semibold">
            Close Summary
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
