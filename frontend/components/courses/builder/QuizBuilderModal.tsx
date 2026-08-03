"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AddQuestionModal, { QuestionType, QuestionData } from "./AddQuestionModal";
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
} from "lucide-react";

interface QuizBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveQuiz: (quizData: {
    title: string;
    description: string;
    durationMinutes: number;
    passingPercentage: number;
    maxAttempts: number;
    totalMarks: number;
    questions: QuestionData[];
  }) => void;
}

export default function QuizBuilderModal({
  open,
  onOpenChange,
  onSaveQuiz,
}: QuizBuilderModalProps) {
  const [activeStep, setActiveStep] = useState<"DETAILS" | "QUESTIONS">("DETAILS");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [oneQuestionAtTime, setOneQuestionAtTime] = useState(false);

  const [questions, setQuestions] = useState<QuestionData[]>([]);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | null>(null);

  const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);

  const handleOpenAddQuestion = (qType: QuestionType) => {
    setSelectedQuestionType(qType);
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = (newQuestion: QuestionData) => {
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMoveQuestion = (idx: number, direction: "UP" | "DOWN") => {
    if (direction === "UP" && idx === 0) return;
    if (direction === "DOWN" && idx === questions.length - 1) return;
    const newQuestions = [...questions];
    const targetIdx = direction === "UP" ? idx - 1 : idx + 1;
    const temp = newQuestions[idx];
    newQuestions[idx] = newQuestions[targetIdx];
    newQuestions[targetIdx] = temp;
    setQuestions(newQuestions);
  };

  const handleFinalSave = () => {
    if (!title.trim()) return;
    onSaveQuiz({
      title,
      description,
      durationMinutes,
      passingPercentage,
      maxAttempts,
      totalMarks: totalMarks || 0,
      questions,
    });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-indigo-500" />
              Quiz Builder
            </DialogTitle>
          </DialogHeader>

          {/* Stepper Header */}
          <div className="flex items-center gap-4 border-b border-border pb-3">
            <button
              onClick={() => setActiveStep("DETAILS")}
              className={`text-sm font-semibold pb-1 border-b-2 transition-all ${
                activeStep === "DETAILS"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              1. Quiz Details &amp; Settings
            </button>
            <button
              onClick={() => setActiveStep("QUESTIONS")}
              className={`text-sm font-semibold pb-1 border-b-2 transition-all ${
                activeStep === "QUESTIONS"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              2. Questions Bank ({questions.length})
            </button>
          </div>

          {/* Step 1: Details & Settings */}
          {activeStep === "DETAILS" && (
            <div className="space-y-5 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Quiz Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Module 1 Knowledge Check"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of what this quiz evaluates..."
                  className="min-h-[70px] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Duration (Minutes) *</Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Passing Percentage (%) *</Label>
                  <Input
                    type="number"
                    value={passingPercentage}
                    onChange={(e) => setPassingPercentage(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Maximum Attempts *</Label>
                  <Input
                    type="number"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Preferences Toggles */}
              <div className="space-y-3 pt-3 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quiz Behavior Preferences
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-medium">Shuffle Questions</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAnswers}
                      onChange={(e) => setShowAnswers(e.target.checked)}
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-medium">Show Answers After Submit</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oneQuestionAtTime}
                      onChange={(e) => setOneQuestionAtTime(e.target.checked)}
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-medium">One Question at a Time</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setActiveStep("QUESTIONS")}
                  className="bg-primary text-primary-foreground"
                >
                  Save &amp; Build Questions &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Questions Bank */}
          {activeStep === "QUESTIONS" && (
            <div className="space-y-5 pt-2">
              {/* Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-xl bg-muted/30 border border-border text-center">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Questions</span>
                  <span className="text-sm font-bold text-foreground">{questions.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Total Marks</span>
                  <span className="text-sm font-bold text-foreground">{totalMarks}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Duration</span>
                  <span className="text-sm font-bold text-foreground">{durationMinutes} Min</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Passing %</span>
                  <span className="text-sm font-bold text-foreground">{passingPercentage}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Attempts</span>
                  <span className="text-sm font-bold text-foreground">{maxAttempts}</span>
                </div>
              </div>

              {/* Add Question Selector Grid */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Add Question by Type:</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { type: "MCQ", label: "MCQ" },
                    { type: "FILL_IN_BLANK", label: "Fill in Blank" },
                    { type: "TRUE_FALSE", label: "True / False" },
                    { type: "MULTIPLE_SELECT", label: "Multi Select" },
                    { type: "SHORT_ANSWER", label: "Short Answer" },
                  ].map((item) => (
                    <Button
                      key={item.type}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddQuestion(item.type as QuestionType)}
                      className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Questions List Table */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Added Questions ({questions.length})</Label>
                {questions.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">No questions added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {q.questionText}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                {q.questionType}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {q.marks} Marks
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(idx, "UP")}
                            disabled={idx === 0}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(idx, "DOWN")}
                            disabled={idx === questions.length - 1}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(idx)}
                            className="p-1 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setActiveStep("DETAILS")}>
                  &larr; Back to Details
                </Button>
                <Button onClick={handleFinalSave} className="bg-primary text-primary-foreground">
                  Save &amp; Attach Quiz
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Question Creator Modal */}
      <AddQuestionModal
        open={questionModalOpen}
        type={selectedQuestionType}
        onOpenChange={setQuestionModalOpen}
        onSaveQuestion={handleSaveQuestion}
      />
    </>
  );
}
