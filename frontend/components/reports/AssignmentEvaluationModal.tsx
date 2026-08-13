"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileCheck2, CheckCircle2, Paperclip, Download, Award, Clock, User, AlertCircle, RefreshCw, MessageSquare, Archive, ExternalLink, FileText } from "lucide-react";
import { evaluateAssignmentSubmission } from "@/services/api/reporting.service";
import { getStorageUrl } from "@/services/api/course.service";
import InteractiveDocViewer from "@/components/courses/player/InteractiveDocViewer";

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
  const [score, setScore] = useState<number>(50);
  const [grade, setGrade] = useState<string>("A");
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (submission) {
      setScore(submission.score !== undefined && submission.score !== null ? Number(submission.score) : 50);
      setGrade(submission.grade && submission.grade !== "N/A" ? submission.grade : "A");
      setFeedback(submission.feedback || "");
    }
  }, [submission]);

  if (!submission) return null;

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
      alert(err?.response?.data?.message || "Failed to submit assignment evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  const isGraded = submission.submissionStatus === "GRADED" || submission.status === "GRADED";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              {isFeedback ? (
                <>
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  View Learner Course Feedback
                </>
              ) : (
                <>
                  <FileCheck2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Evaluate Learner Assignment
                </>
              )}
            </DialogTitle>
            <Badge
              className={
                isFeedback
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold"
                  : isGraded
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold"
              }
            >
              {isFeedback ? "SURVEY SUBMISSION" : isGraded ? "GRADED" : "SUBMITTED"}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleGradeSubmit} className="space-y-5 pt-2">
          {/* Submission Info Bar */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                {submission.learnerName} ({submission.employeeCode})
              </span>
              <span className="text-muted-foreground">
                {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : ""}
              </span>
            </div>
            <div className="text-muted-foreground truncate">
              Course: <strong className="text-foreground">{submission.courseTitle}</strong>
            </div>
            <div className="text-muted-foreground truncate">
              Task: <strong className={isFeedback ? "text-amber-600 dark:text-amber-400" : "text-purple-600 dark:text-purple-400"}>{submission.assignmentTitle}</strong>
            </div>
          </div>

          {/* Learner Feedback Responses or Written Solution */}
          {isFeedback ? (
            <div className="space-y-3">
              <Label className="text-xs font-bold text-foreground block flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-amber-500" />
                Learner Survey Questions &amp; Feedback Responses:
              </Label>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 max-h-[50vh] overflow-y-auto">
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
              <Label className="text-xs font-bold text-foreground block">Learner Written Solution:</Label>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs text-foreground leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                {submission.submissionText}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground italic">
              No written solution text provided by learner.
            </div>
          )}

          {/* Learner Solution File Artifacts (Multiple Files Support) */}
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
                <span className="font-bold text-foreground text-xs block">
                  Submitted Solution Artifact Files ({submittedFiles.length} file{submittedFiles.length > 1 ? "s" : ""}):
                </span>
                {submittedFiles.map((fileUrlItem, idx) => (
                  <div key={idx} className="space-y-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 truncate max-w-[70%]">
                        {fileUrlItem.toLowerCase().includes(".zip") ? (
                          <Archive className="h-4 w-4 text-purple-500 shrink-0" />
                        ) : (
                          <Paperclip className="h-4 w-4 shrink-0" />
                        )}
                        File #{idx + 1}: <span className="truncate">{fileUrlItem.split("/").pop()}</span>
                      </span>
                      <a
                        href={getStorageUrl(fileUrlItem)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline font-bold text-xs shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </div>

                    {/* Inline Document & Slide Viewer for PDF/PPT/PPTX */}
                    {fileUrlItem.toLowerCase().match(/\.(pdf|ppt|pptx)$/i) && (
                      <div className="rounded-xl border border-border overflow-hidden bg-card mt-2">
                        <div className="p-2 bg-muted/40 border-b border-border text-[11px] font-bold text-foreground flex items-center justify-between">
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

          {/* Evaluation Form Inputs (ONLY for Assignments) */}
          {!isFeedback ? (
            <>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Score / Marks (Max: {maxMarks}) *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={maxMarks}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Grade Awarded *</Label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                  rows={3}
                  required
                  className="text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={onClose} className="text-xs h-9">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-2 h-9 px-5 cursor-pointer shadow"
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                  {submitting ? "Saving Evaluation..." : "Save Evaluation & Grade"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" onClick={onClose} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-6 cursor-pointer shadow">
                Close Feedback
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
