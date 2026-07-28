"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, CheckSquare } from "lucide-react";

interface QuestionOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  text: string;
  type: "mcq" | "true-false" | "short-answer";
  options: QuestionOption[];
  marks: number;
  negativeMarks: number;
  explanation?: string;
}

const mockQuestions: Question[] = [
  {
    id: 1,
    text: "What is the correct way to create an object in Java?",
    type: "mcq",
    options: [
      {
        id: "a",
        label: "A",
        text: "ClassName obj = new ClassName();",
        isCorrect: true,
      },
      {
        id: "b",
        label: "B",
        text: "ClassName obj = ClassName();",
        isCorrect: false,
      },
      {
        id: "c",
        label: "C",
        text: "new ClassName obj = ClassName();",
        isCorrect: false,
      },
      {
        id: "d",
        label: "D",
        text: "ClassName obj = new obj.ClassName();",
        isCorrect: false,
      },
    ],
    marks: 2,
    negativeMarks: 0,
    explanation:
      "To create an object, use the new keyword followed by the constructor.",
  },
  {
    id: 2,
    text: "Which of the following is NOT a Java feature?",
    type: "mcq",
    options: [
      { id: "a", label: "A", text: "Object Oriented", isCorrect: false },
      { id: "b", label: "B", text: "Pointer based", isCorrect: true },
      { id: "c", label: "C", text: "Platform independent", isCorrect: false },
      { id: "d", label: "D", text: "Multithreaded", isCorrect: false },
    ],
    marks: 2,
    negativeMarks: 0,
  },
];

interface AssessmentsFormProps {
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function AssessmentsForm({
  onNext,
  onBack,
  onCancel,
}: AssessmentsFormProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question>(
    mockQuestions[0]
  );
  const [activeTab, setActiveTab] = useState<"details" | "questions" | "settings">("questions");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Create Quiz</h2>
        {/* Sub tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {[
            { key: "details" as const, label: "Quiz Details", step: 1 },
            { key: "questions" as const, label: "Questions", step: 2 },
            { key: "settings" as const, label: "Settings", step: 3 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.step}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Tab Content */}
      {activeTab === "questions" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Left: Questions List */}
          <div className="space-y-4 xl:col-span-2">
            {/* Add Question Bar */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </Button>

              <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                <button className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  MCQ
                </button>
                <button className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                  True/False
                </button>
              </div>

              <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <CheckSquare className="h-4 w-4" />
                Mark for Review
              </label>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {mockQuestions.map((question) => (
                <div
                  key={question.id}
                  onClick={() => setSelectedQuestion(question)}
                  className={`cursor-pointer rounded-xl border p-5 transition-all ${
                    selectedQuestion?.id === question.id
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/20"
                  }`}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className="shrink-0 bg-primary/10 text-primary border-primary/20"
                    >
                      Q{question.id}
                    </Badge>
                    <p className="text-sm font-medium">{question.text}</p>
                  </div>

                  <div className="ml-9 grid grid-cols-2 gap-2">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                          option.isCorrect
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold ${
                            option.isCorrect
                              ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          {option.label}
                        </div>
                        <span className="text-[13px]">{option.text}</span>
                      </label>
                    ))}
                  </div>

                  <button className="ml-9 mt-3 text-xs font-medium text-primary hover:underline">
                    Add Option
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Question Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Question Settings
            </h3>

            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Question Type</Label>
                <Select defaultValue="mcq">
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">MCQ (Single Answer)</SelectItem>
                    <SelectItem value="multi">MCQ (Multiple)</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                    <SelectItem value="short">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Marks</Label>
                <Input type="number" defaultValue="2" className="h-9" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Negative Marks</Label>
                <Input type="number" defaultValue="0" className="h-9" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Explanation (Optional)
                </Label>
                <Textarea
                  placeholder="To create an object, use the new keyword followed by the constructor."
                  className="min-h-[90px] resize-none text-sm"
                  defaultValue={selectedQuestion?.explanation || ""}
                  key={selectedQuestion?.id}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Details Tab */}
      {activeTab === "details" && (
        <div className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Quiz Title</Label>
            <Input
              placeholder="Module 1 Assessment"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea
              placeholder="Test your knowledge of Java fundamentals"
              className="min-h-[80px] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Time Limit (minutes)</Label>
              <Input type="number" placeholder="30" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Passing Score (%)</Label>
              <Input type="number" placeholder="60" className="h-9" />
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="space-y-3">
            {[
              { label: "Shuffle Questions", defaultChecked: true },
              { label: "Shuffle Options", defaultChecked: true },
              { label: "Show Results After Submission", defaultChecked: true },
              { label: "Allow Retakes", defaultChecked: false },
              { label: "Show Correct Answers", defaultChecked: false },
            ].map((setting) => (
              <label
                key={setting.label}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium">{setting.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={setting.defaultChecked}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Save &amp; Next</Button>
      </div>
    </div>
  );
}
