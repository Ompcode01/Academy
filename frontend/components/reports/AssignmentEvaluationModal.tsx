"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileCheck2, CheckCircle2, Paperclip, Download, Award, Clock, User, AlertCircle, RefreshCw, MessageSquare, Archive, ExternalLink, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { evaluateAssignmentSubmission } from "@/services/api/reporting.service";
import { getStorageUrl } from "@/services/api/course.service";
import InteractiveDocViewer from "@/components/courses/player/InteractiveDocViewer";

import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/lib/rbac";

interface AssignmentEvaluationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  submission: any | null;
}

export default function AssignmentEvaluationModal({
  open,
  onClose,
  onSuccess,
  submission,
}: AssignmentEvaluationModalProps) {
  const { user } = useAuthStore();
  const [score, setScore] = useState<number>(50);
  const [grade, setGrade] = useState<string>("A");
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  useEffect(() => {
    if (submission) {
      setScore(submission.score !== undefined && submission.score !== null ? Number(submission.score) : 50);
      setGrade(submission.grade && submission.grade !== "N/A" ? submission.grade : "A");
      setFeedback(submission.feedback || "");
    }
  }, [submission]);

  if (!submission) return null;

  const gradedByRole =
    submission?.gradedByRole ||
    (submission?.gradedBy?.includes("[SUPER_ADMIN]") || submission?.gradedBy?.toLowerCase().includes("priyanka")
      ? "SUPER_ADMIN"
      : submission?.gradedBy?.includes("[ADMIN]")
      ? "ADMIN"
      : submission?.gradedBy
      ? "TEACHER"
      : null);

  const currentUserRole = user?.role || ROLES.GUEST;

  const isGradeLockedForUser = false;

  const isFeedback =
    submission.submissionType === "FEEDBACK" ||
    submission.assignmentTitle?.includes("(Feedback)") ||
    (typeof submission.submissionText === "string" && submission.submissionText.includes('"type":"FEEDBACK"'));

  let parsedFbData: any = null;
  if (isFeedback && typeof submission.submissionText === "string" && submission.submissionText.trim().startsWith("{")) {
    try {
      parsedFbData = JSON.parse(submission.submissionText);
    } catch {}
  }

  const maxMarks = submission.maxScore || 50;

  const triggerDirectDownload = async (fileUrlItem: string) => {
    const fileName = fileUrlItem.split("/").pop() || "submission_artifact";
    try {
      setDownloadingFile(fileUrlItem);
      const targetUrl = getStorageUrl(fileUrlItem);
      const res = await fetch(targetUrl);
      if (!res.ok) {
        window.open(targetUrl, "_blank");
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Blob download failed, opening directly:", err);
      window.open(getStorageUrl(fileUrlItem), "_blank");
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFeedback) {
      onClose();
      return;
    }
    try {
      setSubmitting(true);
      const res = await evaluateAssignmentSubmission(submission.id, {
        score: Number(score),
        grade,
        feedback: feedback.trim(),
      });

      if (res?.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Failed to evaluate assignment:", err);
      toast.error(err?.response?.data?.message || "Failed to submit assignment evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  const isGraded = submission.submissionStatus === "GRADED" || submission.status === "GRADED";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl w-[96vw] h-[92vh] max-h-[92vh] flex flex-col p-6 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        <DialogHeader className="shrink-0 pb-3 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
                {isFeedback ? (
                  <>
                    <MessageSquare className="h-6 w-6 text-amber-500" />
                    View Learner Course Feedback
                  </>
                ) : (
                  <>
                    <FileCheck2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    Evaluate Learner Assignment
                  </>
                )}
              </DialogTitle>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                className={
                  isFeedback
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold px-3 py-1 text-xs"
                    : isGraded
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1 text-xs"
                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold px-3 py-1 text-xs"
                }
              >
                {isFeedback ? "SURVEY SUBMISSION" : isGraded ? "GRADED" : "SUBMITTED"}
              </Badge>
            </div>
          </div>

          {/* Context Header Info */}
          <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <User className="h-4 w-4 text-primary" />
              <span>{submission.learnerName}</span>
              <span className="font-mono text-muted-foreground text-[11px]">({submission.employeeCode})</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground text-[11px]">
              <span>Course: <strong className="text-foreground">{submission.courseTitle}</strong></span>
              <span>Task: <strong className={isFeedback ? "text-amber-600 dark:text-amber-400" : "text-purple-600 dark:text-purple-400"}>{submission.assignmentTitle}</strong></span>
              <span>Submitted: <strong className="text-foreground">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "Recently"}</strong></span>
            </div>
          </div>
        </DialogHeader>

        {/* 2-Column Full Screen Workspace Grid */}
        <form onSubmit={handleGradeSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0 pt-4">
          
          {/* Left Column: Solution Artifacts, Files, and Document Viewers */}
          <div className="lg:col-span-7 flex flex-col space-y-4 overflow-y-auto pr-2">
            
            {/* Written Solution or Feedback Responses */}
            {isFeedback ? (
              <div className="space-y-3">
                <Label className="text-xs font-bold text-foreground block flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-amber-500" />
                  Learner Survey Questions &amp; Feedback Responses:
                </Label>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  {parsedFbData && parsedFbData.responses && Object.keys(parsedFbData.responses).length > 0 ? (
                    Object.entries(parsedFbData.responses).map(([qKey, ansVal], idx) => {
                      const getQuestionPrompt = (keyStr: string, i: number) => {
                        if (parsedFbData?.questions && Array.isArray(parsedFbData.questions)) {
                          const found = parsedFbData.questions.find(
                            (q: any) => String(q.id) === String(keyStr) || String(q.questionId) === String(keyStr)
                          );
                          if (found?.questionText) return found.questionText;
                          if (parsedFbData.questions[i]?.questionText) return parsedFbData.questions[i].questionText;
                        }
                        const defaultPrompts: Record<string, string> = {
                          "1": "How satisfied are you with the course content and instructor explanations?",
                          "2": "How well did the practical exercises help reinforce your learning?",
                          "3": "What suggestions do you have for improving this course module?",
                          "4": "Overall Course & Instructor Support Rating",
                          "5": "Additional Instructor & Material Review Notes",
                        };
                        return defaultPrompts[keyStr] || `Evaluation Prompt #${i + 1}`;
                      };

                      return (
                        <div key={qKey} className="p-3.5 rounded-xl bg-card border border-border space-y-2 shadow-sm">
                          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                            Question #{idx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-foreground leading-snug">
                            {getQuestionPrompt(qKey, idx)}
                          </h4>
                          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/70 text-xs font-semibold text-foreground whitespace-pre-line leading-relaxed">
                            <span className="text-muted-foreground text-[10px] block font-medium uppercase mb-0.5">Learner Response:</span>
                            {String(ansVal)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 rounded-lg bg-card border border-border text-xs text-foreground leading-relaxed whitespace-pre-line">
                      {submission.submissionText || "No feedback responses available."}
                    </div>
                  )}
                </div>
              </div>
            ) : submission.submissionText ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground block">Learner Written Solution Notes:</Label>
                <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs text-foreground leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                  {submission.submissionText}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground italic">
                No written solution text provided by learner.
              </div>
            )}

            {/* Learner Submitted Artifact Files (ZIP, PDF, DOC, PPT) */}
            {!isFeedback && (() => {
              let submittedFiles: string[] = [];
              if (submission?.fileUrl) {
                if (typeof submission.fileUrl === "string" && submission.fileUrl.startsWith("[")) {
                  try {
                    submittedFiles = JSON.parse(submission.fileUrl);
                  } catch {
                    submittedFiles = [submission.fileUrl];
                  }
                } else {
                  submittedFiles = [submission.fileUrl];
                }
              }

              if (submittedFiles.length === 0) return null;

              return (
                <div className="space-y-3">
                  <span className="font-extrabold text-foreground text-xs block uppercase tracking-wider">
                    Submitted Solution Artifact Files ({submittedFiles.length} file{submittedFiles.length > 1 ? "s" : ""}):
                  </span>
                  {submittedFiles.map((fileUrlItem, idx) => (
                    <div key={idx} className="space-y-3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 truncate max-w-[65%] text-xs">
                          {fileUrlItem.toLowerCase().includes(".zip") ? (
                            <Archive className="h-5 w-5 text-purple-500 shrink-0" />
                          ) : (
                            <Paperclip className="h-5 w-5 text-purple-500 shrink-0" />
                          )}
                          <span className="truncate">{fileUrlItem.split("/").pop()}</span>
                        </span>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => triggerDirectDownload(fileUrlItem)}
                          disabled={downloadingFile === fileUrlItem}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs h-8 gap-1.5 px-4 cursor-pointer shadow"
                        >
                          {downloadingFile === fileUrlItem ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          Download File
                        </Button>
                      </div>

                      {/* Inline Document Viewer for PDF / PPT */}
                      {fileUrlItem.toLowerCase().match(/\.(pdf|ppt|pptx)$/i) && (
                        <div className="rounded-xl border border-border overflow-hidden bg-card mt-2">
                          <div className="p-2.5 bg-muted/40 border-b border-border text-[11px] font-bold text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-primary">
                              <FileText className="h-3.5 w-3.5" /> Document Preview #{idx + 1}
                            </span>
                            <a
                              href={getStorageUrl(fileUrlItem)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                            >
                              <ExternalLink className="h-3 w-3" /> Open Fullscreen
                            </a>
                          </div>
                          <div className="p-2">
                            <InteractiveDocViewer
                              title={`Artifact #${idx + 1} Preview`}
                              contentType={fileUrlItem.toLowerCase().includes(".pdf") ? "PDF" : "PPT"}
                              contentUrl={fileUrlItem}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Right Column: Grading & Evaluation Controls */}
          <div className="lg:col-span-5 bg-muted/20 border border-border p-5 rounded-2xl flex flex-col justify-between space-y-4 overflow-y-auto">
            {!isFeedback ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Award className="h-5 w-5 text-amber-500" />
                    <h3 className="text-sm font-extrabold text-foreground">Faculty Evaluation Form</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Score / Marks (Max: {maxMarks}) *</Label>
                      <Input
                        type="number"
                        min={0}
                        max={maxMarks}
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        disabled={isGradeLockedForUser}
                        required
                        className="h-10 text-xs font-bold bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Grade Awarded *</Label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        disabled={isGradeLockedForUser}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      >
                        <option value="A+">Grade A+ (Outstanding)</option>
                        <option value="A">Grade A (Excellent)</option>
                        <option value="B">Grade B (Good)</option>
                        <option value="C">Grade C (Satisfactory)</option>
                        <option value="F">Grade F (Needs Revision)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Evaluator Feedback &amp; Review Notes *</Label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide constructive feedback notes to the learner..."
                      rows={6}
                      disabled={isGradeLockedForUser}
                      required
                      className="text-xs leading-relaxed bg-background"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-auto">
                  <Button type="button" variant="outline" onClick={onClose} className="text-xs h-10 px-5">
                    Close
                  </Button>
                  {!isGradeLockedForUser && (
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-2 h-10 px-6 cursor-pointer shadow-lg"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                      {submitting ? "Saving Evaluation..." : "Save Evaluation & Grade"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-500" />
                    Feedback Review Complete
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This survey response is saved for analytics and course quality improvements. No manual grading is required.
                  </p>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-border">
                  <Button type="button" onClick={onClose} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 px-6 cursor-pointer shadow">
                    Close Feedback
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
