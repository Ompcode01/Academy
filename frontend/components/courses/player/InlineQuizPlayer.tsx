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
import HarbingerConfirmModal from "@/components/common/HarbingerConfirmModal";

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
  existingSubmission?: any;
  onComplete?: (score: number, maxScore: number, answersJson?: string) => void;
  onSkip?: () => void;
  onNextLesson?: () => void;
}

function getSafeAnswerString(ans: any): string {
  if (ans === undefined || ans === null) return "";
  if (typeof ans === "string") return ans.trim();
  if (typeof ans === "number" || typeof ans === "boolean") return String(ans).trim();
  if (Array.isArray(ans)) {
    return ans.map((item) => getSafeAnswerString(item)).filter(Boolean).join(", ");
  }
  if (typeof ans === "object") {
    return (ans.text || ans.label || ans.answer || JSON.stringify(ans)).trim();
  }
  return String(ans).trim();
}

function isQuestionMultiSelect(q: QuestionItem): boolean {
  if (!q) return false;
  const qType = (q.type || "").toUpperCase();
  if (
    qType === "MULTIPLE_SELECT" ||
    qType === "MULTI_SELECT" ||
    qType === "MULTIPLE" ||
    qType === "MULTIPLE_CHOICE"
  ) {
    return true;
  }
  if (Array.isArray(q.correctAnswer) && q.correctAnswer.length > 1) {
    return true;
  }
  return false;
}

export default function InlineQuizPlayer({
  quizTitle,
  configJson,
  isPreview = false,
  attemptNumber = 1,
  existingSubmission,
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
  const maxAttempts = rawMaxAttempts !== undefined && rawMaxAttempts !== null && rawMaxAttempts !== "" ? Number(rawMaxAttempts) : 3;
  const isUnlimitedAttempts = isPreview ? true : (maxAttempts === 0 || maxAttempts >= 999);
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
      correctAnswer: q.correctAnswer ?? q.answer ?? q.correctAnswers ?? "",
      explanation: q.explanation || "",
    };
  });

  const [currentAttempt, setCurrentAttempt] = useState(attemptNumber);
  const [hasStartedQuiz, setHasStartedQuiz] = useState(Boolean(existingSubmission));
  const [activeQuestions, setActiveQuestions] = useState<QuestionItem[]>(baseQuestions);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(Boolean(existingSubmission));
  const [score, setScore] = useState(0);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  React.useEffect(() => {
    if (existingSubmission) {
      setHasStartedQuiz(true);
      setIsSubmitted(true);
      if (existingSubmission.score !== undefined && existingSubmission.score !== null) {
        const sc = Number(existingSubmission.score);
        const maxSc = Number(existingSubmission.maxScore || 100);
        setScore(maxSc > 0 ? Math.round((sc / maxSc) * 100) : sc);
      }
      if (existingSubmission.answersJson || existingSubmission.submissionText) {
        try {
          const parsedAns = JSON.parse(existingSubmission.answersJson || existingSubmission.submissionText);
          if (parsedAns && typeof parsedAns === "object") {
            setSelectedAnswers(parsedAns);
          }
        } catch {}
      }
    } else if (attemptNumber > maxAttempts && !isUnlimitedAttempts) {
      setHasStartedQuiz(true);
      setIsSubmitted(true);
    } else {
      setHasStartedQuiz(false);
      setIsSubmitted(false);
      setScore(0);
    }
  }, [existingSubmission, attemptNumber, maxAttempts, isUnlimitedAttempts]);

  React.useEffect(() => {
    if (attemptNumber) {
      setCurrentAttempt(attemptNumber);
    }
  }, [attemptNumber]);

  const totalAllowedAttempts = maxAttempts > 0 ? maxAttempts : 3;
  const isFirstAttempt = currentAttempt === 1 || attemptNumber === 1;
  const isAttemptsExhausted = !isUnlimitedAttempts && currentAttempt > totalAllowedAttempts;

  // Reveal correct answer keys ONLY when:
  // 1. Viewing in Course Builder preview mode (isPreview)
  // 2. NEVER on 1st attempt (isFirstAttempt === false)
  // 3. Learner has completed all allowed attempts (currentAttempt >= totalAllowedAttempts)
  const shouldRevealCorrectKey = isPreview
    ? true
    : isFirstAttempt
    ? false
    : (currentAttempt >= totalAllowedAttempts || isAttemptsExhausted);

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
    if (isSubmitted || !currentQ) return;
    const isMulti = isQuestionMultiSelect(currentQ);

    if (isMulti) {
      const currentRaw = selectedAnswers[currentQ.id] || "";
      const currentList = currentRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      let updatedList: string[];
      if (currentList.some((item) => item.toLowerCase() === option.trim().toLowerCase())) {
        updatedList = currentList.filter((item) => item.toLowerCase() !== option.trim().toLowerCase());
      } else {
        updatedList = [...currentList, option.trim()];
      }

      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: updatedList.join(", "),
      }));
    } else {
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: option,
      }));
    }
  };

  const handleTextAnswerChange = (val: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: val,
    }));
  };

  const isOptionSelected = (q: QuestionItem, option: string) => {
    const rawVal = selectedAnswers[q.id] || "";
    if (!rawVal) return false;
    const isMulti = isQuestionMultiSelect(q);

    if (isMulti) {
      const selectedList = rawVal.split(",").map((s) => s.trim().toLowerCase());
      return selectedList.includes(option.trim().toLowerCase());
    }
    return rawVal.trim().toLowerCase() === option.trim().toLowerCase();
  };

  const handleSubmitQuiz = () => {
    let calculatedScore = 0;
    const totalQuestions = activeQuestions.length;
    const pointsPerQuestion = totalQuestions > 0 ? 100 / totalQuestions : 100;

    activeQuestions.forEach((q: QuestionItem) => {
      const userAnsStr = getSafeAnswerString(selectedAnswers[q.id]);
      const correctAnsStr = getSafeAnswerString(q.correctAnswer);

      if (!userAnsStr || !correctAnsStr) return;

      const isMulti = isQuestionMultiSelect(q);

      if (isMulti) {
        const userItems = userAnsStr
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .sort();
        const correctItems = correctAnsStr
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .sort();

        const isMatch =
          userItems.length === correctItems.length &&
          userItems.every((val, idx) => val === correctItems[idx]);

        if (isMatch) {
          calculatedScore += pointsPerQuestion;
        }
      } else {
        if (userAnsStr.toLowerCase() === correctAnsStr.toLowerCase()) {
          calculatedScore += pointsPerQuestion;
        }
      }
    });

    const finalScore = Math.min(100, Math.max(0, Math.round(calculatedScore)));
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

            {/* Retake Quiz CTA Button at Top */}
            {(currentAttempt < totalAllowedAttempts || isUnlimitedAttempts) && (
              <div className="pt-2">
                <Button
                  onClick={handleReset}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs gap-2 px-6 h-10 shadow-lg cursor-pointer animate-pulse"
                >
                  <RotateCcw className="h-4 w-4" /> Retake Quiz (Start Attempt #{currentAttempt + 1} of {totalAllowedAttempts})
                </Button>
              </div>
            )}
          </div>

          {/* Question Breakdown with Scrollbar */}
          <div className="space-y-3 text-left max-w-xl mx-auto pt-4 border-t border-slate-800 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {activeQuestions.map((q, idx) => {
              const userAnsStr = getSafeAnswerString(selectedAnswers[q.id]);
              const correctAnsStr = getSafeAnswerString(q.correctAnswer);
              const isMulti = isQuestionMultiSelect(q);

              let isCorrect = false;
              if (userAnsStr && correctAnsStr) {
                if (isMulti) {
                  const userItems = userAnsStr.split(",").map((s) => s.trim().toLowerCase()).sort();
                  const correctItems = correctAnsStr.split(",").map((s) => s.trim().toLowerCase()).sort();
                  isCorrect = userItems.length === correctItems.length && userItems.every((val, i) => val === correctItems[i]);
                } else {
                  isCorrect = userAnsStr.toLowerCase() === correctAnsStr.toLowerCase();
                }
              }

              return (
                <div key={q.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white">Q{idx + 1}: {q.questionText}</span>
                    <Badge className={shouldRevealCorrectKey ? (isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400") : "bg-slate-700 text-slate-300"}>
                      {shouldRevealCorrectKey ? (isCorrect ? "Correct" : "Incorrect") : "Recorded"}
                    </Badge>
                  </div>
                  <div className="text-slate-400">
                    Your Answer: <strong className={shouldRevealCorrectKey ? (isCorrect ? "text-emerald-400" : "text-amber-300") : "text-slate-200"}>{userAnsStr || "Not answered"}</strong>
                  </div>
                  {!isCorrect && correctAnsStr && shouldRevealCorrectKey && (
                    <div className="text-emerald-400 font-semibold text-[11px] pt-1">
                      Correct Answer: {correctAnsStr}
                    </div>
                  )}
                  {q.explanation && shouldRevealCorrectKey && (
                    <div className="text-slate-400 italic text-[11px] pt-1">
                      Note: {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!shouldRevealCorrectKey && (
            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-amber-400 max-w-md mx-auto italic font-medium">
              💡 Correct answer keys and explanations are hidden while retake attempts remain. Click &quot;Retake Quiz&quot; to start Attempt #{currentAttempt + 1}.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {(currentAttempt < totalAllowedAttempts || isUnlimitedAttempts) && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 font-extrabold text-xs gap-2 px-6 h-10 shadow cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" /> Retake Quiz (Attempt #{currentAttempt + 1} of {totalAllowedAttempts})
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
                const isSelected = isOptionSelected(currentQ, opt);
                const isMulti = isQuestionMultiSelect(currentQ);

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
                        className={`h-5 w-5 ${
                          isMulti ? "rounded-md" : "rounded-full"
                        } border flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? "border-amber-400 bg-amber-400 text-slate-950"
                            : "border-slate-700 text-slate-400"
                        }`}
                      >
                        {isSelected ? "✓" : String.fromCharCode(65 + oIdx)}
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-xs">
            <Button
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
              className={
                currentQuestionIdx === 0
                  ? "bg-slate-800/50 text-slate-500 border border-slate-800 font-bold text-xs gap-1.5 px-4 h-10 cursor-not-allowed opacity-50"
                  : "bg-[#C82333] hover:bg-[#a71d2a] text-white font-extrabold text-xs gap-1.5 px-4 h-10 shadow cursor-pointer transition-all"
              }
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => setShowSubmitConfirmModal(true)}
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white font-extrabold text-xs gap-1.5 px-4 h-10 shadow-sm cursor-pointer transition-all"
                title="Submit your quiz responses at any time"
              >
                <Sparkles className="h-4 w-4" /> Submit Quiz
              </Button>

              {currentQuestionIdx < totalQ - 1 && (
                <Button
                  onClick={() => setCurrentQuestionIdx((prev) => Math.min(totalQ - 1, prev + 1))}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 px-5 h-10 shadow cursor-pointer"
                >
                  Next Question <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Quiz Confirmation Popup Modal */}
      <HarbingerConfirmModal
        open={showSubmitConfirmModal}
        onOpenChange={setShowSubmitConfirmModal}
        title="Submit Quiz Assessment?"
        description={`You have answered ${
          Object.keys(selectedAnswers).filter((k) => selectedAnswers[Number(k)] && String(selectedAnswers[Number(k)]).trim() !== "").length
        } of ${baseQuestions.length} questions. Are you sure you want to submit your quiz attempt now?`}
        confirmLabel="Yes, Submit"
        cancelLabel="No"
        showCancelButton={true}
        variant="success"
        onConfirm={() => {
          setShowSubmitConfirmModal(false);
          handleSubmitQuiz();
        }}
      />
    </div>
  );
}
