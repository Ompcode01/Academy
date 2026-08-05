"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, CheckCircle2, Award, ExternalLink } from "lucide-react";
import { getTeacherSubmissions, gradeSubmission } from "@/services/api/course.service";

export interface SubmissionItem {
  id: number;
  studentName: string;
  studentCode: string;
  studentEmail: string;
  courseTitle: string;
  submissionType: string;
  submissionText?: string;
  fileUrl?: string;
  status: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade?: string;
  feedback?: string;
  submittedAt: string;
}

interface AdminSubmissionsReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentTitle?: string;
  maxMarks?: number;
  onGraded?: () => void;
}

export default function AdminSubmissionsReview({
  open,
  onOpenChange,
  assignmentTitle = "All Student Course Submissions",
  maxMarks = 100,
  onGraded,
}: AdminSubmissionsReviewProps) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [gradingItem, setGradingItem] = useState<SubmissionItem | null>(null);
  const [givenMarks, setGivenMarks] = useState<number>(85);
  const [letterGrade, setLetterGrade] = useState<string>("A");
  const [feedbackText, setFeedbackText] = useState<string>("Great architectural work!");
  const [submittingGrade, setSubmittingGrade] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await getTeacherSubmissions();
      if (res?.success && Array.isArray(res.data)) {
        setSubmissions(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSubmissions();
    }
  }, [open]);

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleGradeSubmit = async () => {
    if (!gradingItem) return;
    try {
      setSubmittingGrade(true);
      const res = await gradeSubmission(gradingItem.id, {
        grade: letterGrade,
        score: givenMarks,
        feedback: feedbackText,
      });

      if (res?.success) {
        setGradingItem(null);
        await fetchSubmissions();
        if (onGraded) onGraded();
      }
    } catch (err: any) {
      console.error("Failed to grade submission:", err);
      alert(err?.response?.data?.message || "Failed to grade submission.");
    } finally {
      setSubmittingGrade(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center justify-between">
            <span>Teacher &amp; Admin Review: {assignmentTitle}</span>
            <span className="text-xs font-semibold text-muted-foreground">
              Total Submissions: {submissions.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by learner name or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchSubmissions} className="gap-2 text-xs font-bold">
            Refresh List
          </Button>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold border-b border-border">
              <tr>
                <th className="p-3">Learner &amp; Code</th>
                <th className="p-3">Course Title</th>
                <th className="p-3">Submission / Link</th>
                <th className="p-3">Submitted On</th>
                <th className="p-3">Status</th>
                <th className="p-3">Score &amp; Grade</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-semibold">
                    Loading student submissions...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No assignment submissions found. When learners submit their work, submissions will appear here for Teacher review.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-semibold text-foreground">
                      <div>{item.studentName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{item.studentCode}</div>
                    </td>
                    <td className="p-3 font-semibold text-foreground">{item.courseTitle}</td>
                    <td className="p-3 max-w-[200px] truncate">
                      {item.submissionText && <div className="truncate text-muted-foreground">{item.submissionText}</div>}
                      {item.fileUrl && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary font-bold text-[11px] inline-flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Link / Code
                        </a>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "Recently"}
                    </td>
                    <td className="p-3">
                      {item.status === "SUBMITTED" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Pending Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Graded
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold">
                      {item.status === "GRADED" ? (
                        <span>{item.score}/{item.maxScore} ({item.grade || "Passed"})</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant={item.status === "SUBMITTED" ? "default" : "outline"}
                        onClick={() => {
                          setGradingItem(item);
                          setGivenMarks(item.score || 85);
                          setLetterGrade(item.grade || "A");
                          setFeedbackText(item.feedback || "Well structured submission.");
                        }}
                        className={`h-7 gap-1 text-xs font-bold ${
                          item.status === "SUBMITTED" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
                        }`}
                      >
                        <Award className="h-3.5 w-3.5" />
                        {item.status === "SUBMITTED" ? "Grade Now" : "Edit Grade"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Grading Dialog */}
        {gradingItem && (
          <Dialog open={!!gradingItem} onOpenChange={() => setGradingItem(null)}>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">
                  Grade Submission: {gradingItem.studentName}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {gradingItem.submissionText && (
                  <div className="p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground space-y-1">
                    <span className="font-bold text-foreground block">Student Answer:</span>
                    <p className="italic">"{gradingItem.submissionText}"</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Score (Max {gradingItem.maxScore || 100})</label>
                    <Input
                      type="number"
                      value={givenMarks}
                      onChange={(e) => setGivenMarks(Number(e.target.value))}
                      max={gradingItem.maxScore || 100}
                      min={0}
                      className="text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Letter Grade</label>
                    <select
                      value={letterGrade}
                      onChange={(e) => setLetterGrade(e.target.value)}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                    >
                      <option value="A+">A+ (Outstanding)</option>
                      <option value="A">A (Excellent)</option>
                      <option value="B">B (Good)</option>
                      <option value="C">C (Satisfactory)</option>
                      <option value="F">F (Fail)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Teacher Feedback &amp; Review Notes</label>
                  <Textarea
                    placeholder="Enter detailed feedback for the student..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="min-h-[80px] text-xs bg-background"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <Button variant="outline" onClick={() => setGradingItem(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGradeSubmit}
                    disabled={submittingGrade}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    {submittingGrade ? "Saving Grade..." : "Submit Grade & Notify Learner"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
