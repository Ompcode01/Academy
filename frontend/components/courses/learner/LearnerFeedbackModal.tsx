"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { submitAssignment } from "@/services/api/course.service";

export interface FeedbackFormQuestion {
  id: number;
  questionText: string;
  questionType: "MCQ" | "WRITTEN";
  options?: string[];
  isMandatory: boolean;
}

interface LearnerFeedbackModalProps {
  open: boolean;
  courseId: number;
  contentId?: number | null;
  feedbackTitle?: string;
  description?: string;
  questions?: FeedbackFormQuestion[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function LearnerFeedbackModal({
  open,
  courseId,
  contentId,
  feedbackTitle = "Course Evaluation & Feedback Form",
  description = "Please share your review regarding course structure, content clarity, and instructor support.",
  questions,
  onClose,
  onSuccess,
}: LearnerFeedbackModalProps) {
  const activeQuestions: FeedbackFormQuestion[] =
    questions && questions.length > 0
      ? questions
      : [
          {
            id: 1,
            questionText: "How satisfied are you with the course content and instructor explanations?",
            questionType: "MCQ",
            options: ["Excellent", "Good", "Average", "Needs Improvement"],
            isMandatory: true,
          },
          {
            id: 2,
            questionText: "How well did the practical exercises help reinforce your learning?",
            questionType: "MCQ",
            options: ["Extremely Helpful", "Moderately Helpful", "Neutral", "Not Helpful"],
            isMandatory: true,
          },
          {
            id: 3,
            questionText: "What suggestions do you have for improving this course module?",
            questionType: "WRITTEN",
            isMandatory: false,
          },
        ];
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSelectOption = (qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleTextChange = (qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    // Validate mandatory questions
    for (const q of activeQuestions) {
      if (q.isMandatory && (!answers[q.id] || !answers[q.id].trim())) {
        alert(`Please complete mandatory question: "${q.questionText}"`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await submitAssignment(courseId, {
        contentId: contentId || undefined,
        submissionText: JSON.stringify({
          type: "FEEDBACK",
          title: feedbackTitle,
          responses: answers,
          questions: activeQuestions.map((q) => ({ id: q.id, questionText: q.questionText })),
        }),
      });

      if (res?.success) {
        setSubmitted(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      alert(err?.response?.data?.message || "Failed to submit course feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            {feedbackTitle}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Thank You for Your Feedback!</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your feedback has been saved and shared with the course creator and assigned instructor to help maintain course quality.
            </p>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              {description}
            </p>

            <div className="space-y-5">
              {activeQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {idx + 1}. {q.questionText}
                      {q.isMandatory && <span className="text-rose-500 font-black ml-1">*</span>}
                    </span>
                    {q.isMandatory && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded shrink-0">
                        Required
                      </span>
                    )}
                  </div>

                  {q.questionType === "MCQ" && q.options ? (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold shadow-sm"
                                : "border-border bg-background hover:bg-muted text-foreground"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Write your answer / suggestion here..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      className="min-h-[80px] text-xs bg-background"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
