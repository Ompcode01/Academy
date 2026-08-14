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
import { Textarea } from "@/components/ui/textarea";

interface QuestionItem {
  id: number;
  questionText: string;
  type: string;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface InlineQuizPlayerProps {
  quizTitle: string;
  configJson?: string;
  isPreview?: boolean;
  attemptNumber?: number;
  onComplete?: (score: number, maxScore: number, answersJson?: string) => void;
  onSkip?: () => void;
  onNextLesson?: () => void;
}

export default function InlineQuizPlayer({
  quizTitle,
  configJson,
  isPreview = false,
  attemptNumber = 1,
  onComplete,
  onSkip,
  onNextLesson,
}: InlineQuizPlayerProps) {
  // Parse quiz config object
  let parsedConfig: any = {};
  let rawQuestions: any[] = [];
  if (configJson) {
    try {
      parsedConfig = typeof configJson === "string" ? JSON.parse(configJson) : configJson;
      if (Array.isArray(parsedConfig.questions)) {
        rawQuestions = parsedConfig.questions;
      } else if (Array.isArray(parsedConfig)) {
        rawQuestions = parsedConfig;
      }
    } catch (err) {
      console.error("Error parsing quiz configJson:", err);
    }
  }

  const shuffleQuestionsSetting = Boolean(parsedConfig.shuffleQuestions);
  const showAnswersAfterSubmitSetting = parsedConfig.showAnswersAfterSubmit !== undefined ? Boolean(parsedConfig.showAnswersAfterSubmit) : true;
  
  // Read exact maxAttempts entered by author (Admin, SA, Teacher), or 1 if not specified
  const rawMaxAttempts = parsedConfig.maxAttempts ?? parsedConfig.attemptsAllowed ?? parsedConfig.attempts;
  const maxAttempts = rawMaxAttempts !== undefined && rawMaxAttempts !== null && rawMaxAttempts !== "" ? Number(rawMaxAttempts) : 1;
  const isUnlimitedAttempts = maxAttempts === 0 || maxAttempts >= 999;
  const durationMinutes = parsedConfig.durationMinutes || 15;

  // Normalize questions to guarantee safety
  const baseQuestions: QuestionItem[] = rawQuestions.map((q, idx) => {
    let opts: string[] = [];
    if (Array.isArray(q.options)) {
      opts = q.options.map((opt: any) =>
        typeof opt === "string" ? opt : (opt?.text || opt?.label || String(opt))
      );
    } else if (q.type === "TRUE_FALSE" || q.questionType === "TRUE_FALSE") {
      opts = ["True", "False"];
    }

    const qId = q.id !== undefined && q.id !== null ? Number(q.id) : idx + 1;
    return {
      id: qId,
      questionText: q.questionText || q.title || `Question ${idx + 1}`,
      type: (q.type || q.questionType || "SINGLE").toUpperCase(),
      options: opts,
      correctAnswer: q.correctAnswer || q.answer || "",
      explanation: q.explanation || "",
    };
  });

  const [currentAttempt, setCurrentAttempt] = useState(attemptNumber);
  React.useEffect(() => {
    setCurrentAttempt(attemptNumber);
  }, [attemptNumber]);

  const [hasStartedQuiz, setHasStartedQuiz] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<QuestionItem[]>(baseQuestions);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const isAttemptsExhausted = !isUnlimitedAttempts && currentAttempt > maxAttempts;
  const isFinalAttempt = isUnlimitedAttempts ? false : (currentAttempt >= maxAttempts || maxAttempts === 1);
  const shouldShowAnswers = showAnswersAfterSubmitSetting && (isFinalAttempt || isUnlimitedAttempts);

  const handleReset = () => {
    setCurrentAttempt((prev) => prev + 1);
    setIsSubmitted(false);
    setScore(0);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setHasStartedQuiz(true);
  };

  const handleStartQuiz = () => {
    if (isAttemptsExhausted) return;
    let qList = [...baseQuestions];
    if (shuffleQuestionsSetting && qList.length > 1) {
      qList = qList.sort(() => Math.random() - 0.5);
    }
    setActiveQuestions(qList);
    setHasStartedQuiz(true);
  };

  if (baseQuestions.length === 0) {
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
            No quiz questions configured by Admin yet. Questions added by the course author will display here.
          </p>
        </div>
      </div>
    );
  }

  const handleSkipQuiz = () => {
    if (onSkip) {
      onSkip();
    } else if (onNextLesson) {
      onNextLesson();
    } else {
      setHasStartedQuiz(true);
    }
  };

  const currentQ = activeQuestions[currentQuestionIdx] || activeQuestions[0];
  const totalQ = activeQuestions.length;
  const progressPercent = Math.round(((currentQuestionIdx + 1) / totalQ) * 100);
  const safeOptions = Array.isArray(currentQ?.options) ? currentQ.options : [];

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
  };

  const handleTextAnswerChange = (val: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: val,
    }));
  };

  const handleSubmitQuiz = () => {
    let calculatedScore = 0;
    const maxScore = activeQuestions.length * 25;
    activeQuestions.forEach((q: QuestionItem) => {
      if (
        selectedAnswers[q.id] &&
        q.correctAnswer &&
        selectedAnswers[q.id].trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      ) {
        calculatedScore += 25;
      }
    });
    const finalScore = maxScore > 0 ? Math.round((calculatedScore / maxScore) * 100) : 100;
    setScore(finalScore);
    setIsSubmitted(true);
    if (onComplete) {
      onComplete(finalScore, 100, JSON.stringify(selectedAnswers));
    }
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

        {/* Header Progress */}
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

      {/* Pre-Quiz Landing State */}
      {!hasStartedQuiz ? (
        <div className="p-8 bg-slate-950/90 border border-slate-800 rounded-xl text-center space-y-6 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit mx-auto shadow-inner">
            <HelpCircle className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                Module Assessment
              </Badge>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                {baseQuestions.length} Questions • {durationMinutes} Minutes
              </Badge>
            </div>
            <h2 className="text-2xl font-extrabold text-white">{quizTitle}</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed pt-1">
              Test your comprehension of this module. Your score and responses will be saved to the database and submitted for instructor evaluation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <div>Attempt: <strong className={isAttemptsExhausted ? "text-red-400" : "text-amber-400"}>#{attemptNumber} of {isUnlimitedAttempts ? "Unlimited" : maxAttempts}</strong></div>
            <div>Questions: <strong className="text-white">{baseQuestions.length}</strong></div>
            <div className="col-span-2 sm:col-span-1">Shuffle: <strong className="text-slate-200">{shuffleQuestionsSetting ? "Enabled" : "Off"}</strong></div>
          </div>

          {isAttemptsExhausted && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs max-w-md mx-auto">
              Maximum Quiz Attempts Reached ({maxAttempts} of {maxAttempts} Attempts Completed). Further attempts are restricted by course policy.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Button
              onClick={handleSkipQuiz}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-xs px-5 h-11 cursor-pointer"
            >
              Skip Quiz for Now &rarr;
            </Button>

            {!isAttemptsExhausted ? (
              <Button
                onClick={handleStartQuiz}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-7 h-11 shadow-lg gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Start Quiz Assessment
              </Button>
            ) : (
              <Button
                disabled
                className="bg-slate-800 text-slate-500 font-bold text-xs px-7 h-11 opacity-60 cursor-not-allowed"
              >
                Attempts Limit Reached
              </Button>
            )}
          </div>
        </div>
      ) : isSubmitted ? (
        <div className="p-8 bg-slate-950/90 border border-slate-800 rounded-xl text-center space-y-6 animate-in fade-in">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <Award className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Quiz Assessment Completed!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your responses for Attempt #{attemptNumber} of {maxAttempts} have been recorded.
            </p>
            <div className="inline-block mt-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-2xl font-black text-emerald-400">{score} / 100</div>
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Overall Grade Result</div>
            </div>
          </div>

          {/* Question Breakdown */}
          {shouldShowAnswers ? (
            <div className="space-y-3 text-left max-w-xl mx-auto pt-4 border-t border-slate-800">
              {activeQuestions.map((q, idx) => {
                const isCorrect =
                  selectedAnswers[q.id] &&
                  q.correctAnswer &&
                  selectedAnswers[q.id].trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                return (
                  <div key={q.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">Q{idx + 1}: {q.questionText}</span>
                      <Badge className={isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300"}>
                        {isCorrect ? "Correct" : "Recorded"}
                      </Badge>
                    </div>
                    <div className="text-slate-400">
                      Your Answer: <strong className={isCorrect ? "text-emerald-400" : "text-amber-300"}>{selectedAnswers[q.id] || "Not answered"}</strong>
                    </div>
                    {!isCorrect && q.correctAnswer && (
                      <div className="text-emerald-400 text-[11px] pt-1">
                        Correct Answer: {q.correctAnswer}
                      </div>
                    )}
                    {q.explanation && (
                      <div className="text-slate-400 italic text-[11px] pt-1">
                        Note: {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-400 max-w-md mx-auto italic font-medium">
              Your responses for Attempt #{attemptNumber} of {maxAttempts} have been saved. Answer keys will be revealed after your final attempt.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {(currentAttempt < maxAttempts || isUnlimitedAttempts) && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 font-extrabold text-xs gap-2 px-5 h-10 shadow cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" /> Retake Assessment (Attempt #{currentAttempt + 1} of {isUnlimitedAttempts ? "Unlimited" : maxAttempts})
              </Button>
            )}

            {onNextLesson && (
              <Button
                onClick={onNextLesson}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs gap-2 px-6 h-10 shadow cursor-pointer"
              >
                Next Lesson / Section &rarr;
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Active Question Card */
        <div className="space-y-6">
          {/* Question Body */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
              <span>Question {currentQuestionIdx + 1} of {totalQ}</span>
              <span>{currentQ.type || "SINGLE CHOICE"}</span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
              {currentQ.questionText}
            </h3>
          </div>

          {/* Options Grid or Text Response */}
          {safeOptions.length > 0 ? (
            <div className="space-y-2.5">
              {safeOptions.map((opt, oIdx) => {
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
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Type your answer / solution:
              </label>
              <Textarea
                rows={4}
                value={selectedAnswers[currentQ.id] || ""}
                onChange={(e) => handleTextAnswerChange(e.target.value)}
                placeholder="Type your response here..."
                className="bg-slate-950 border-slate-800 text-white text-xs placeholder:text-slate-500 rounded-xl focus:border-amber-500"
              />
            </div>
          )}

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
