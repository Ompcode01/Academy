"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, Trash2, CheckSquare, AlignLeft, ShieldAlert } from "lucide-react";

export interface FeedbackQuestion {
  id: number;
  questionText: string;
  questionType: "MCQ" | "WRITTEN";
  options?: string[];
  isMandatory: boolean;
}

interface FeedbackBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveFeedback: (feedbackData: {
    title: string;
    description: string;
    questions: FeedbackQuestion[];
  }) => void;
}

export default function FeedbackBuilderModal({
  open,
  onOpenChange,
  onSaveFeedback,
}: FeedbackBuilderModalProps) {
  const [title, setTitle] = useState("Course Feedback & Evaluation");
  const [description, setDescription] = useState(
    "Please share your honest review regarding course structure, content clarity, and instructor support."
  );

  const [questions, setQuestions] = useState<FeedbackQuestion[]>([
    {
      id: 1,
      questionText: "How satisfied are you with the course content and instructor explanations?",
      questionType: "MCQ",
      options: ["Excellent", "Good", "Average", "Needs Improvement"],
      isMandatory: true,
    },
    {
      id: 2,
      questionText: "What suggestions do you have for improving this course module?",
      questionType: "WRITTEN",
      isMandatory: false,
    },
  ]);

  // Question editing form state
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"MCQ" | "WRITTEN">("MCQ");
  const [newOptions, setNewOptions] = useState<string[]>(["Strongly Agree", "Agree", "Neutral", "Disagree"]);
  const [newOptionInput, setNewOptionInput] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);

  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;
    setNewOptions((prev) => [...prev, newOptionInput.trim()]);
    setNewOptionInput("");
  };

  const handleRemoveOption = (idx: number) => {
    setNewOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQ: FeedbackQuestion = {
      id: Date.now(),
      questionText: newQuestionText.trim(),
      questionType: newQuestionType,
      options: newQuestionType === "MCQ" ? [...newOptions] : undefined,
      isMandatory,
    };
    setQuestions((prev) => [...prev, newQ]);
    setNewQuestionText("");
    setNewOptions(["Excellent", "Good", "Average", "Needs Improvement"]);
    setIsMandatory(true);
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSaveFeedback({
      title: title.trim(),
      description: description.trim(),
      questions,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            Course Feedback Form Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Metadata */}
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Feedback Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. End of Module Feedback Form"
                className="text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Instructions / Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the purpose of this feedback form..."
                className="min-h-[60px] text-xs bg-background"
              />
            </div>
          </div>

          {/* Added Questions List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Form Questions ({questions.length})
            </h4>

            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <span>Q{idx + 1}.</span>
                      <span>{q.questionText}</span>
                      {q.isMandatory ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-600 font-bold border border-rose-500/20">
                          Mandatory
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-500/10 text-muted-foreground font-medium">
                          Optional
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                      {q.questionType === "MCQ" ? (
                        <>
                          <CheckSquare className="h-3.5 w-3.5 text-amber-500" />
                          <span>Multiple Choice Options: {q.options?.join(" | ")}</span>
                        </>
                      ) : (
                        <>
                          <AlignLeft className="h-3.5 w-3.5 text-blue-500" />
                          <span>Written Response Answer</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Question Section */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Add Feedback Question
            </h4>

            <div className="space-y-2">
              <Input
                placeholder="Enter feedback question text..."
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="text-xs bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Question Type</Label>
                <select
                  value={newQuestionType}
                  onChange={(e) => setNewQuestionType(e.target.value as "MCQ" | "WRITTEN")}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                >
                  <option value="MCQ">Multiple Choice (MCQ Options)</option>
                  <option value="WRITTEN">Written Response (Open Text)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Mandatory Requirement</Label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="mandatoryCheck"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="h-4 w-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <label htmlFor="mandatoryCheck" className="text-xs text-foreground font-semibold cursor-pointer">
                    Mandatory Question
                  </label>
                </div>
              </div>
            </div>

            {/* MCQ Options list if MCQ */}
            {newQuestionType === "MCQ" && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold">MCQ Response Options</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add option choice..."
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    className="text-xs bg-background h-8"
                  />
                  <Button size="sm" type="button" onClick={handleAddOption} className="h-8 text-xs font-bold">
                    Add Option
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {newOptions.map((opt, oIdx) => (
                    <span
                      key={oIdx}
                      className="px-2 py-1 rounded bg-background border border-border text-[11px] font-semibold text-foreground flex items-center gap-1"
                    >
                      {opt}
                      <button
                        onClick={() => handleRemoveOption(oIdx)}
                        className="text-destructive font-bold hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleAddQuestion}
              disabled={!newQuestionText.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold w-full"
            >
              Append Question to Form
            </Button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6">
              Save Feedback Form to Module
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
