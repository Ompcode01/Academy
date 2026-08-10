"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  Award,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface QuestionItem {
  id: number;
  questionText: string;
  type: "SINGLE" | "MULTIPLE" | "TEXT";
  options: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface InlineQuizPlayerProps {
  quizTitle: string;
  configJson?: string;
  isPreview?: boolean;
  onComplete?: (score: number, maxScore: number) => void;
}

export default function InlineQuizPlayer({
  quizTitle,
  configJson,
  isPreview = false,
  onComplete,
}: InlineQuizPlayerProps) {
  // Parse questions from configJson or use realistic module assessment questions
  let parsedQuestions: QuestionItem[] = [];
  if (configJson) {
    try {
      const data = JSON.parse(configJson);
      if (Array.isArray(data.questions)) {
        parsedQuestions = data.questions;
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  if (parsedQuestions.length === 0) {
    return (
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl select-none">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit mx-auto">
          <HelpCircle className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
            Interactive Quiz Assessment
          </Badge>
          <h2 className="text-xl font-extrabold text-white mt-1">{quizTitle}</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto pt-2">
            No quiz questions added by Admin yet. Questions added by the course author will display here.
          </p>
        </div>
      </div>
    );
  }

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const currentQ = parsedQuestions[currentQuestionIdx];
  const totalQ = parsedQuestions.length;
  const progressPercent = Math.round(((currentQuestionIdx + 1) / totalQ) * 100);

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
  };

  const handleSubmitQuiz = () => {
    let calculatedScore = 0;
    parsedQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        calculatedScore += 25;
      }
    });
    setScore(calculatedScore);
    setIsSubmitted(true);
    if (onComplete) {
      onComplete(calculatedScore, 100);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentQuestionIdx(0);
    setScore(0);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 select-none">
      {/* Quiz Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                Interactive Assessment
              </Badge>
              {isPreview && (
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                  Preview Mode
                </Badge>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{quizTitle}</h2>
          </div>
        </div>

        {/* Header Progress & Timer */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Question Progress</div>
            <div className="text-xs font-extrabold text-white">
              {currentQuestionIdx + 1} of {totalQ}
            </div>
          </div>
          <div className="w-24 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Submitted Results State */}
      {isSubmitted ? (
        <div className="p-8 bg-slate-950/90 border border-slate-800 rounded-xl text-center space-y-6 animate-in fade-in">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <Award className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Quiz Assessment Completed!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your responses have been recorded and evaluated.
            </p>
            <div className="inline-block mt-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-2xl font-black text-emerald-400">{score} / 100</div>
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Overall Score (Passed)</div>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="space-y-3 text-left max-w-xl mx-auto pt-4 border-t border-slate-800">
            {parsedQuestions.map((q, idx) => {
              const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white">Q{idx + 1}: {q.questionText}</span>
                    <Badge className={isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                      {isCorrect ? "Correct (+25)" : "Incorrect"}
                    </Badge>
                  </div>
                  <div className="text-slate-400">
                    Your Answer: <strong className={isCorrect ? "text-emerald-400" : "text-red-400"}>{selectedAnswers[q.id] || "Not answered"}</strong>
                  </div>
                  {!isCorrect && q.correctAnswer && (
                    <div className="text-emerald-400 text-[11px] pt-1">
                      Correct Answer: {q.correctAnswer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleReset}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-2 px-6 h-10 shadow"
          >
            <RotateCcw className="h-4 w-4" /> Retake Assessment
          </Button>
        </div>
      ) : (
        /* Active Question Card */
        <div className="space-y-6">
          {/* Question Body */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
              <span>Question {currentQuestionIdx + 1} of {totalQ}</span>
              <span>Single Choice (25 Marks)</span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
              {currentQ.questionText}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === opt;
              return (
                <div
                  key={oIdx}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs md:text-sm font-medium ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500 text-white font-bold shadow-md ring-1 ring-amber-500"
                      : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        isSelected
                          ? "border-amber-400 bg-amber-400 text-slate-950"
                          : "border-slate-700 text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span>{opt}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Question Footer Navigation Controls */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
            <Button
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
              variant="outline"
              className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            {currentQuestionIdx < totalQ - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIdx((prev) => Math.min(totalQ - 1, prev + 1))}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 cursor-pointer"
              >
                Next Question <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitQuiz}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs gap-1.5 px-6 h-10 shadow cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Submit Quiz Assessment
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
