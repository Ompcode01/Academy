"use client";

import React, { useState, useEffect } from "react";
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
  FileUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface QuizBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    title?: string;
    description?: string;
    durationMinutes?: number;
    passingPercentage?: number;
    maxAttempts?: number;
    totalMarks?: number;
    shuffleQuestions?: boolean;
    showAnswersAfterSubmit?: boolean;
    oneQuestionAtATime?: boolean;
    questions?: QuestionData[];
  } | null;
  onSaveQuiz: (quizData: {
    title: string;
    description: string;
    durationMinutes: number;
    passingPercentage: number;
    maxAttempts: number;
    totalMarks: number;
    shuffleQuestions: boolean;
    showAnswersAfterSubmit: boolean;
    oneQuestionAtATime: boolean;
    questions: QuestionData[];
  }) => void;
}

export default function QuizBuilderModal({
  open,
  onOpenChange,
  initialData,
  onSaveQuiz,
}: QuizBuilderModalProps) {
  const [activeStep, setActiveStep] = useState<"DETAILS" | "QUESTIONS">("DETAILS");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [oneQuestionAtTime, setOneQuestionAtTime] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [questions, setQuestions] = useState<QuestionData[]>([]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setDurationMinutes(initialData.durationMinutes || 20);
        setPassingPercentage(initialData.passingPercentage || 70);
        setMaxAttempts(initialData.maxAttempts !== undefined && initialData.maxAttempts !== null ? Number(initialData.maxAttempts) : 1);
        setShuffleQuestions(initialData.shuffleQuestions !== undefined ? Boolean(initialData.shuffleQuestions) : true);
        setShowAnswers(initialData.showAnswersAfterSubmit !== undefined ? Boolean(initialData.showAnswersAfterSubmit) : true);
        setOneQuestionAtTime(initialData.oneQuestionAtATime !== undefined ? Boolean(initialData.oneQuestionAtATime) : false);
        setQuestions(initialData.questions || []);
      } else {
        setTitle("");
        setDescription("");
        setDurationMinutes(20);
        setPassingPercentage(70);
        setMaxAttempts(3);
        setShuffleQuestions(true);
        setShowAnswers(true);
        setOneQuestionAtTime(false);
        setQuestions([]);
      }
    }
  }, [open, initialData]);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | null>(null);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);

  const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);

  const handleOpenAddQuestion = (qType: QuestionType) => {
    setEditingQuestionIdx(null);
    setSelectedQuestionType(qType);
    setQuestionModalOpen(true);
  };

  const handleEditQuestion = (idx: number) => {
    setEditingQuestionIdx(idx);
    setSelectedQuestionType(questions[idx].questionType as QuestionType);
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = (newQuestion: QuestionData, editIdx?: number | null) => {
    if (editIdx !== undefined && editIdx !== null) {
      setQuestions((prev) => {
        const copy = [...prev];
        copy[editIdx] = newQuestion;
        return copy;
      });
    } else {
      setQuestions((prev) => [...prev, newQuestion]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const newQs: QuestionData[] = [];
      // Expected CSV: QuestionText,Type,Option1,Option2,Option3,Option4,CorrectAnswer
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) continue;
        
        const qText = cols[0];
        let qTypeStr = cols[1].toUpperCase();
        if (qTypeStr === "TF" || qTypeStr === "TRUE/FALSE") qTypeStr = "TRUE_FALSE";
        if (qTypeStr === "MULTI") qTypeStr = "MULTIPLE_SELECT";
        
        const type = ["MCQ", "TRUE_FALSE", "MULTIPLE_SELECT", "SHORT_ANSWER"].includes(qTypeStr) ? qTypeStr as QuestionType : "MCQ";
        
        let options: string[] | undefined = undefined;
        let correctAnswer: any = cols[6] || "";
        
        if (type === "MCQ" || type === "MULTIPLE_SELECT") {
          options = cols.slice(2, 6).filter(Boolean);
          if (type === "MULTIPLE_SELECT") {
            correctAnswer = correctAnswer.split(";").map((s: string) => s.trim());
          }
        }
        
        newQs.push({
          questionText: qText,
          questionType: type,
          marks: 2,
          options,
          correctAnswer,
        });
      }
      if (newQs.length > 0) {
        setQuestions((prev) => [...prev, ...newQs]);
      }
      e.target.value = ""; // Reset
    };
    reader.readAsText(file);
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
    if (!title.trim()) {
      setActiveStep("DETAILS");
      toast.error("Please provide a Quiz Title before saving.");
      return;
    }
    onSaveQuiz({
      title,
      description,
      durationMinutes,
      passingPercentage,
      maxAttempts,
      totalMarks: totalMarks || 0,
      shuffleQuestions,
      showAnswersAfterSubmit: showAnswers,
      oneQuestionAtATime: oneQuestionAtTime,
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
                  <Label className="text-xs font-semibold">Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={durationMinutes || ""}
                    placeholder="Optional (e.g. 20)"
                    onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Passing Percentage (%)</Label>
                  <Input
                    type="number"
                    value={passingPercentage || ""}
                    placeholder="Optional (e.g. 70)"
                    onChange={(e) => setPassingPercentage(e.target.value ? Number(e.target.value) : 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Maximum Attempts</Label>
                  <Input
                    type="number"
                    min={0}
                    value={maxAttempts !== undefined && maxAttempts !== null ? maxAttempts : 1}
                    placeholder="Enter attempts (e.g. 1, 3, 5, or 0 for Unlimited)"
                    onChange={(e) => setMaxAttempts(e.target.value !== "" ? Number(e.target.value) : 1)}
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    {maxAttempts === 0 ? "0 = Unlimited attempts allowed for learners" : `Learners get ${maxAttempts} attempt(s)`}
                  </span>
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
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Add Question by Type:</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Bulk Upload (CSV)
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </div>
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
                            onClick={() => handleEditQuestion(idx)}
                            className="p-1 text-primary hover:text-primary/80"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
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
        initialQuestion={editingQuestionIdx !== null ? questions[editingQuestionIdx] : null}
        editIndex={editingQuestionIdx}
      />
    </>
  );
}
