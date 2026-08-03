"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

export type QuestionType =
  | "MCQ"
  | "FILL_IN_BLANK"
  | "TRUE_FALSE"
  | "MULTIPLE_SELECT"
  | "SHORT_ANSWER"
  | "LONG_ANSWER";

export interface QuestionData {
  id?: string;
  questionType: QuestionType;
  questionText: string;
  marks: number;
  options?: string[];
  correctAnswer?: string | string[];
  alternativeAnswers?: string[];
  explanation?: string;
  maxWords?: number;
  instructions?: string;
}

interface AddQuestionModalProps {
  open: boolean;
  type: QuestionType | null;
  onOpenChange: (open: boolean) => void;
  onSaveQuestion: (question: QuestionData) => void;
}

export default function AddQuestionModal({
  open,
  type,
  onOpenChange,
  onSaveQuestion,
}: AddQuestionModalProps) {
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState(2);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [multiCorrect, setMultiCorrect] = useState<string[]>([]);
  const [altAnswers, setAltAnswers] = useState<string>("");
  const [explanation, setExplanation] = useState("");
  const [maxWords, setMaxWords] = useState(100);
  const [instructions, setInstructions] = useState("");

  if (!type) return null;

  const handleAddOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    let finalCorrect: any = correctAnswer;
    if (type === "MULTIPLE_SELECT") {
      finalCorrect = multiCorrect;
    }

    onSaveQuestion({
      questionType: type,
      questionText: questionText.trim(),
      marks: Number(marks),
      options: ["MCQ", "MULTIPLE_SELECT"].includes(type) ? options.filter(Boolean) : undefined,
      correctAnswer: finalCorrect,
      alternativeAnswers: altAnswers ? altAnswers.split(",").map((s) => s.trim()) : undefined,
      explanation: explanation.trim() || undefined,
      maxWords: type === "SHORT_ANSWER" ? Number(maxWords) : undefined,
      instructions: instructions.trim() || undefined,
    });

    // Reset form
    setQuestionText("");
    setMarks(2);
    setOptions(["", ""]);
    setCorrectAnswer("");
    setMultiCorrect([]);
    setAltAnswers("");
    setExplanation("");
    onOpenChange(false);
  };

  const getModalTitle = () => {
    switch (type) {
      case "MCQ":
        return "MCQ (Multiple Choice Question)";
      case "FILL_IN_BLANK":
        return "Fill in the Blank Question";
      case "TRUE_FALSE":
        return "True / False Question";
      case "MULTIPLE_SELECT":
        return "Multiple Select Question";
      case "SHORT_ANSWER":
        return "Short Answer Question";
      case "LONG_ANSWER":
        return "Long Answer / Paragraph Question";
      default:
        return "Add Question";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Question Text */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Question *</Label>
            <Textarea
              placeholder="Enter your question here..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="min-h-[80px] resize-none"
              required
            />
          </div>

          {/* Marks */}
          <div className="space-y-1.5 w-32">
            <Label className="text-xs font-semibold">Marks *</Label>
            <Input
              type="number"
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              min={1}
              required
            />
          </div>

          {/* MCQ Options */}
          {type === "MCQ" && (
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold">Options *</Label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="mcqCorrect"
                    checked={correctAnswer === opt && opt.length > 0}
                    onChange={() => setCorrectAnswer(opt)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="gap-2 text-xs text-primary border-primary/30"
              >
                <Plus className="h-3.5 w-3.5" /> Add Option
              </Button>
            </div>
          )}

          {/* Multiple Select Options */}
          {type === "MULTIPLE_SELECT" && (
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold">Options (Select all correct ones) *</Label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={multiCorrect.includes(opt) && opt.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMultiCorrect((prev) => [...prev, opt]);
                      } else {
                        setMultiCorrect((prev) => prev.filter((o) => o !== opt));
                      }
                    }}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="gap-2 text-xs text-primary border-primary/30"
              >
                <Plus className="h-3.5 w-3.5" /> Add Option
              </Button>
            </div>
          )}

          {/* Fill in the Blank */}
          {type === "FILL_IN_BLANK" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Correct Answer *</Label>
                <Input
                  placeholder="e.g. James Gosling"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Alternative Answers (Comma separated)
                </Label>
                <Input
                  placeholder="e.g. J. Gosling, James A. Gosling"
                  value={altAnswers}
                  onChange={(e) => setAltAnswers(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* True / False */}
          {type === "TRUE_FALSE" && (
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold">Correct Answer *</Label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="tfCorrect"
                    value="True"
                    checked={correctAnswer === "True"}
                    onChange={() => setCorrectAnswer("True")}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  True
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="tfCorrect"
                    value="False"
                    checked={correctAnswer === "False"}
                    onChange={() => setCorrectAnswer("False")}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  False
                </label>
              </div>
            </div>
          )}

          {/* Short Answer */}
          {type === "SHORT_ANSWER" && (
            <div className="space-y-3">
              <div className="space-y-1.5 w-40">
                <Label className="text-xs font-semibold">Max Answer Length (Words)</Label>
                <Input
                  type="number"
                  value={maxWords}
                  onChange={(e) => setMaxWords(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Instructions (Optional)</Label>
                <Input
                  placeholder="e.g. Write a short and clear answer."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Long Answer */}
          {type === "LONG_ANSWER" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Instructions (Optional)</Label>
              <Input
                placeholder="e.g. Write a detailed explanation."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold">Explanation (Optional)</Label>
            <Textarea
              placeholder="Provide explanation shown to learners after evaluation..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              Save Question
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
