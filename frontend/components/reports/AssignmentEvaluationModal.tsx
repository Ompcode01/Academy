"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileCheck2, CheckCircle2, Paperclip, Download, Award, Clock, User, AlertCircle, RefreshCw } from "lucide-react";
import { evaluateAssignmentSubmission } from "@/services/api/reporting.service";

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

  const maxMarks = submission.maxScore || 50;

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
              <FileCheck2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Evaluate Learner Assignment
            </DialogTitle>
            <Badge className={isGraded ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"}>
              {isGraded ? "GRADED" : "SUBMITTED"}
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
              Task: <strong className="text-purple-600 dark:text-purple-400">{submission.assignmentTitle}</strong>
            </div>
          </div>

          {/* Learner Solution Text */}
          {submission.submissionText ? (
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

          {/* Learner Solution File Artifact */}
          {submission.fileUrl ? (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1.5">
              <span className="font-bold text-purple-700 dark:text-purple-300 block flex items-center gap-1.5">
                <Paperclip className="h-4 w-4" /> Submitted Solution Artifact File:
              </span>
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline font-semibold text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="truncate">{submission.fileUrl}</span>
              </a>
            </div>
          ) : null}

          {/* Evaluation Form Inputs */}
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
