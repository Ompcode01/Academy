"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileCode, CheckCircle2, Clock, Upload, Award, AlertCircle } from "lucide-react";
import { submitAssignment } from "@/services/api/course.service";

interface LearnerAssignmentModalProps {
  open: boolean;
  courseId: number;
  contentId?: number | null;
  assignmentTitle?: string;
  instructions?: string;
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
  existingSubmission,
  onClose,
  onSuccess,
}: LearnerAssignmentModalProps) {
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
      alert(err?.response?.data?.message || "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const isGraded = existingSubmission?.status === "GRADED";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileCode className="h-6 w-6 text-purple-600" />
            {assignmentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Instructions Box */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Assignment Instructions
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {instructions}
            </p>
          </div>

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
              {existingSubmission && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>You submitted on {new Date(existingSubmission.submittedAt).toLocaleDateString()}. Status: <strong>{existingSubmission.status} (Pending Teacher Review)</strong></span>
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
                  {submitting ? "Submitting..." : existingSubmission ? "Resubmit Assignment" : "Submit Assignment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
