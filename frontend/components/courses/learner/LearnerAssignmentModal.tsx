"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileCode, CheckCircle2, Clock, Upload, Award, AlertCircle, Paperclip, Download, Calendar, HardDrive } from "lucide-react";
import { submitAssignment } from "@/services/api/course.service";
import toast from "react-hot-toast";

interface LearnerAssignmentModalProps {
  open: boolean;
  courseId: number;
  contentId?: number | null;
  assignmentTitle?: string;
  instructions?: string;
  configJson?: string;
  existingSubmission?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LearnerAssignmentModal({
  open,
  courseId,
  contentId,
  assignmentTitle = "Practical Assignment",
  instructions = "Design a secure microservice API endpoint with JWT authentication and role-based access control.",
  configJson,
  existingSubmission,
  onClose,
  onSuccess,
}: LearnerAssignmentModalProps) {
  let parsedConfig: any = {};
  if (configJson) {
    try {
      parsedConfig = typeof configJson === "string" ? JSON.parse(configJson) : configJson;
    } catch {}
  }

  const effectiveInstructions =
    parsedConfig.instructions || parsedConfig.description || instructions;
  const effectiveMaxMarks = parsedConfig.maxMarks || 50;
  const rawDeadline = parsedConfig.deadline || parsedConfig.dueDate || parsedConfig.deadlineDate || parsedConfig.endDate;
  const deadlineText = rawDeadline
    ? new Date(rawDeadline).toString() !== "Invalid Date"
      ? new Date(rawDeadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : String(rawDeadline)
    : "No strict deadline";

  const rawMaxAttempts = parsedConfig.maxAttempts ?? parsedConfig.attemptsAllowed ?? parsedConfig.attempts;
  const maxAttempts = rawMaxAttempts !== undefined && rawMaxAttempts !== null && rawMaxAttempts !== "" ? Number(rawMaxAttempts) : 1;
  const isUnlimitedAttempts = maxAttempts === 0 || maxAttempts >= 999;
  const allowedFileTypes: string[] = parsedConfig.allowedFileTypes || ["PDF", "DOC", "DOCX", "ZIP"];
  const maxFileSizeMb = parsedConfig.maxFileSizeMb || 50;

  const submittedDateText = existingSubmission?.submittedAt
    ? new Date(existingSubmission.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const gradedDateText = existingSubmission?.gradedAt
    ? new Date(existingSubmission.gradedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const referenceFiles: any[] =
    parsedConfig.questionFiles || parsedConfig.attachments || parsedConfig.files || [];

  const [submissionText, setSubmissionText] = useState(existingSubmission?.submissionText || "");
  const [fileUrl, setFileUrl] = useState(existingSubmission?.fileUrl || "");
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!submissionText.trim() && !fileUrl.trim()) return;

    try {
      setSubmitting(true);
      const res = await submitAssignment(courseId, {
        contentId: contentId || undefined,
        submissionText: submissionText.trim(),
        fileUrl: fileUrl.trim(),
      });

      if (res?.success) {
        setSubmittedMessage("Assignment successfully submitted! It has been queued for Teacher review and grading.");
        onSuccess();
      }
    } catch (err: any) {
      console.error("Assignment submission error:", err);
      toast.error(err?.response?.data?.message || "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const isGraded = existingSubmission?.status === "GRADED";
  const isSubmitted = Boolean(existingSubmission) || Boolean(submittedMessage);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileCode className="h-6 w-6 text-purple-600" />
              {assignmentTitle}
            </DialogTitle>
            <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Max Marks: {effectiveMaxMarks}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Assignment Timeline Card */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-foreground border-b border-border pb-2">
              <span className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Clock className="h-4 w-4" /> Assignment Lifecycle &amp; Timeline
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                Due: {deadlineText}
              </span>
            </div>

            <div className="relative pl-6 space-y-3 border-l-2 border-purple-500/30 ml-2">
              {/* Milestone 1: Assignment Assigned */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-[9px] text-purple-600 dark:text-purple-400 font-bold">1</span>
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">Assignment Released</div>
                  <div className="text-[11px] text-muted-foreground">Task assigned to enrolled learners.</div>
                </div>
              </div>

              {/* Milestone 2: Learner Submission */}
              <div className="relative">
                <span className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${isSubmitted ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400" : "bg-muted border-border text-muted-foreground"}`}>2</span>
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    Learner Submission
                    {isSubmitted && <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] px-1.5">Submitted</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {submittedDateText ? `Submitted on ${submittedDateText}` : `Pending submission (Deadline: ${deadlineText})`}
                  </div>
                </div>
              </div>

              {/* Milestone 3: Faculty Evaluation */}
              <div className="relative">
                <span className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${isGraded ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400" : "bg-muted border-border text-muted-foreground"}`}>3</span>
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    Faculty Review &amp; Grading
                    {isGraded && <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30 text-[9px] px-1.5">Graded</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {gradedDateText ? `Evaluated by ${existingSubmission?.gradedBy || "Faculty"} on ${gradedDateText}` : "Awaiting instructor review and grading"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Assignment Instructions
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {effectiveInstructions}
            </p>
          </div>

          {/* Reference Files Provided by Teacher */}
          {referenceFiles.length > 0 && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-purple-500" /> Instructor Reference Files &amp; Problem Attachments:
              </h4>
              <div className="flex flex-wrap gap-2">
                {referenceFiles.map((fileItem: any, fIdx: number) => {
                  const fileName = fileItem.name || fileItem.fileName || fileItem.title || `Attachment_${fIdx + 1}`;
                  const fUrl = fileItem.url || fileItem.fileUrl || fileItem.path || "#";
                  return (
                    <a
                      key={fIdx}
                      href={fUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border text-purple-600 dark:text-purple-400 hover:underline text-xs font-semibold"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{fileName}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* If already graded by teacher */}
          {isGraded ? (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Submission Graded by Teacher ({existingSubmission.gradedBy || "Instructor"})
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold">
                  Grade: {existingSubmission.grade || "A"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Score Awarded:</span>
                  <p className="text-lg font-bold text-foreground">{existingSubmission.score} / {existingSubmission.maxScore || 100} ({existingSubmission.percentage}%)</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Graded Date:</span>
                  <p className="text-xs font-semibold text-foreground">{existingSubmission.gradedAt ? new Date(existingSubmission.gradedAt).toLocaleDateString() : "Recently"}</p>
                </div>
              </div>

              {existingSubmission.feedback && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-foreground">Teacher Feedback:</span>
                  <p className="text-xs text-muted-foreground bg-background p-3 rounded-xl border border-border mt-1 italic">
                    "{existingSubmission.feedback}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Submission Input Form */
            <div className="space-y-4">
              {existingSubmission?.status === "NEEDS_REVISION" ? (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-700 dark:text-purple-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 text-purple-600" />
                    Teacher Requested Changes / Revision
                  </div>
                  {existingSubmission.feedback && (
                    <p className="italic bg-background p-3 rounded-lg border border-purple-500/20 text-muted-foreground">
                      Teacher Comment: "{existingSubmission.feedback}"
                    </p>
                  )}
                  <p className="font-semibold text-[11px]">
                    Please update your solution below and submit your revision (Attempt #{ (existingSubmission.attemptNumber || 1) + 1 }).
                  </p>
                </div>
              ) : existingSubmission && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Submitted on {new Date(existingSubmission.submittedAt).toLocaleDateString()}. Status: <strong>Pending Teacher Review</strong> (Attempt #{existingSubmission.attemptNumber || 1})</span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold">Submission Answer / Explanation</Label>
                <Textarea
                  placeholder="Enter your detailed solution explanation, architecture notes, or code snippet..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="min-h-[120px] text-xs bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">GitHub Repository or Documentation Link (Optional)</Label>
                <Input
                  placeholder="https://github.com/username/microservice-api"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="h-10 text-xs bg-background"
                />
              </div>

              {submittedMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {submittedMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || (!submissionText.trim() && !fileUrl.trim())}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {submitting ? "Submitting..." : existingSubmission?.status === "NEEDS_REVISION" ? "Submit Revision Task" : existingSubmission ? "Resubmit Assignment" : "Submit Assignment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
