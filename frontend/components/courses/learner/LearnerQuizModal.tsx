"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, CheckCircle2, Clock, Award, AlertCircle } from "lucide-react";
import { recordQuizSubmission } from "@/services/api/progress.service";

interface QuizQuestion {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer: number; // index of correct option
}

interface LearnerQuizModalProps {
  open: boolean;
  courseId: number;
  contentId?: number | null;
  quizTitle?: string;
  configJson?: string;
  passingScore?: number;
  onClose: () => void;
  onSuccess: (score: number, maxScore: number) => void;
}

export default function LearnerQuizModal({
  open,
  courseId,
  contentId,
  quizTitle = "Module Assessment & Knowledge Check",
  configJson,
  passingScore = 70,
  onClose,
  onSuccess,
}: LearnerQuizModalProps) {
  // Parse questions from configJson or use fallback questions
  let rawQuestions: any[] = [];
  if (configJson) {
    try {
      const data = typeof configJson === "string" ? JSON.parse(configJson) : configJson;
      if (Array.isArray(data.questions)) {
        rawQuestions = data.questions;
      } else if (Array.isArray(data)) {
        rawQuestions = data;
      }
    } catch {}
  }

  let questions: QuizQuestion[] = [];
  if (rawQuestions.length > 0) {
    questions = rawQuestions.map((q, idx) => {
      let opts: string[] = [];
      if (Array.isArray(q.options)) {
        opts = q.options.map((o: any) => typeof o === "string" ? o : (o?.text || String(o)));
      } else if (q.type === "TRUE_FALSE" || q.questionType === "TRUE_FALSE") {
        opts = ["True", "False"];
      }

      let correctIdx = 0;
      if (typeof q.correctAnswer === "number") {
        correctIdx = q.correctAnswer;
      } else if (typeof q.correctAnswer === "string") {
        const found = opts.findIndex((o) => o.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());
        if (found !== -1) correctIdx = found;
      }

      return {
        id: q.id !== undefined && q.id !== null ? Number(q.id) : idx + 1,
        questionText: q.questionText || q.title || `Question ${idx + 1}`,
        options: opts,
        correctAnswer: correctIdx,
      };
    });
  } else {
    questions = [
      {
        id: 1,
        questionText: "What is the primary architectural advantage of Microservices over Monolithic architecture?",
        options: [
          "Independent scalability and decoupled deployments",
          "Smaller total codebase file size",
          "No database required",
          "Faster single-thread execution",
        ],
        correctAnswer: 0,
      },
      {
        id: 2,
        questionText: "Which HTTP method is idempotent and used to replace an entire resource in REST APIs?",
        options: ["POST", "PUT", "PATCH", "CONNECT"],
        correctAnswer: 1,
      },
    ];
  }

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedAnswers({});
      setSubmittedResult(null);
    }
  }, [open]);

  const handleOptionSelect = (questionId: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    let earnedPoints = 0;
    const maxScore = questions.length * 10;

    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        earnedPoints += 10;
      }
    });

    const percentage = Math.round((earnedPoints / maxScore) * 100);
    const passed = percentage >= passingScore;

    setSubmitting(true);
    try {
      await recordQuizSubmission(
        courseId,
        contentId || null,
        earnedPoints,
        maxScore,
        JSON.stringify(selectedAnswers)
      );

      setSubmittedResult({
        score: earnedPoints,
        maxScore,
        percentage,
        passed,
      });

      onSuccess(earnedPoints, maxScore);
    } catch (err) {
      console.error("Failed to submit quiz:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-indigo-500" />
            {quizTitle}
          </DialogTitle>
        </DialogHeader>

        {!submittedResult ? (
          <div className="space-y-6 pt-2">
            {/* Quiz Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                <Clock className="h-4 w-4" />
                <span>3 Questions • Passing Score: {passingScore}%</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Interactive Assessment
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-border bg-muted/20 space-y-3"
                >
                  <h4 className="text-xs font-bold text-foreground flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[11px]">
                      {idx + 1}
                    </span>
                    {q.questionText}
                  </h4>

                  <div className="space-y-2 pl-7">
                    {(q.options || []).map((opt, optIdx) => {
                      const isSelected = selectedAnswers[q.id] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleOptionSelect(q.id, optIdx)}
                          className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                              : "border-border bg-background hover:bg-muted text-foreground"
                          }`}
                        >
                          <span className="inline-block w-6 font-bold text-muted-foreground uppercase">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitQuiz}
                disabled={submitting || Object.keys(selectedAnswers).length < questions.length}
                className="bg-primary text-primary-foreground font-bold px-6"
              >
                {submitting ? "Submitting..." : "Submit Quiz & Get Grade →"}
              </Button>
            </div>
          </div>
        ) : (
          /* Result Card */
          <div className="py-8 text-center space-y-5">
            <div
              className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
                submittedResult.passed
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              }`}
            >
              {submittedResult.passed ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <AlertCircle className="h-8 w-8" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-foreground">
                {submittedResult.passed ? "Quiz Passed! 🎉" : "Assessment Evaluation Complete"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Score: <span className="font-bold text-foreground">{submittedResult.score} / {submittedResult.maxScore}</span> ({submittedResult.percentage}%)
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-xs font-bold">
              <Award className="h-4 w-4 text-amber-500" />
              <span>
                Grade: {submittedResult.percentage >= 90 ? "A+" : submittedResult.percentage >= 80 ? "A" : submittedResult.percentage >= 70 ? "B" : "F"}
              </span>
            </div>

            <div className="pt-4 flex justify-center">
              <Button onClick={onClose} className="bg-primary text-primary-foreground px-6 font-bold">
                Continue Course
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
