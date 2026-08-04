"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Award, CheckCircle2 } from "lucide-react";
import { gradeAssessmentSubmission, AdminLearnerMatrixItem } from "@/services/api/progress.service";

interface GradeAssessmentModalProps {
  open: boolean;
  item: AdminLearnerMatrixItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GradeAssessmentModal({
  open,
  item,
  onClose,
  onSuccess,
}: GradeAssessmentModalProps) {
  const [grade, setGrade] = useState("A+");
  const [score, setScore] = useState<number>(90);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setGrade(item.grade || "A+");
      setScore(item.latestScore !== null && item.latestScore !== undefined ? item.latestScore : 90);
      setFeedback(item.feedback || "");
    }
  }, [item]);

  if (!item) return null;

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.submissionId) return;

    setSubmitting(true);
    try {
      await gradeAssessmentSubmission(item.submissionId, grade, score, feedback);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to grade submission:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Evaluate Assessment &amp; Assign Grade
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmitGrade} className="space-y-4 pt-2">
          {/* Employee & Course Info Summary */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee:</span>
              <span className="font-bold text-foreground">{item.employeeName} ({item.employeeCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Course:</span>
              <span className="font-semibold text-foreground">{item.courseTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Score:</span>
              <span className="font-mono text-primary font-bold">{item.latestScore || 0} / {item.latestMaxScore || 100} ({item.latestPercentage || 0}%)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assign Letter Grade *</Label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-input text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="A+">A+ (Outstanding)</option>
                <option value="A">A (Excellent)</option>
                <option value="B">B (Good)</option>
                <option value="C">C (Satisfactory)</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Numerical Score (Points)</Label>
              <Input
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                min={0}
                max={item.latestMaxScore || 100}
                className="h-10 text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Instructor Feedback / Reviewer Comments</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Outstanding execution on System Design assignment! Keep up the great work."
              className="min-h-[90px] text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !item.submissionId}
              className="bg-primary text-primary-foreground font-bold px-5"
            >
              {submitting ? "Saving..." : "Save Grade & Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
