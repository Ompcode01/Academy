"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  Trash2,
  CheckSquare,
  AlignLeft,
  Sparkles,
  Bookmark,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

export interface FeedbackQuestion {
  id: number;
  questionText: string;
  questionType: "MCQ" | "WRITTEN";
  options?: string[];
  isMandatory: boolean;
}

export interface FeedbackRuleData {
  enableFeedback: boolean;
  requireFeedbackForCertificate: boolean;
  feedbackTitle: string;
  description: string;
  questions: FeedbackQuestion[];
}

export interface FeedbackTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  isCustom?: boolean;
  userId?: string;
}

const PRESET_TEMPLATES: FeedbackTemplate[] = [
  {
    id: "preset-standard",
    name: "Standard Course Evaluation",
    title: "Course Feedback & Evaluation",
    description: "Please share your honest review regarding course structure, content clarity, and instructor support.",
    questions: [
      {
        id: 101,
        questionText: "How satisfied are you with the course content and instructor explanations?",
        questionType: "MCQ",
        options: ["Excellent", "Good", "Average", "Needs Improvement"],
        isMandatory: true,
      },
      {
        id: 102,
        questionText: "How would you rate the practical relevance of the assignments & materials?",
        questionType: "MCQ",
        options: ["Highly Relevant", "Relevant", "Somewhat Relevant", "Not Relevant"],
        isMandatory: true,
      },
      {
        id: 103,
        questionText: "What suggestions do you have for improving this course module?",
        questionType: "WRITTEN",
        isMandatory: false,
      },
    ],
  },
];

interface FeedbackStepFormProps {
  data?: Partial<FeedbackRuleData>;
  onChange?: (updated: Partial<FeedbackRuleData>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function FeedbackStepForm({
  data,
  onChange,
  onNext,
  onBack,
  onCancel,
}: FeedbackStepFormProps) {
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id ? String(user.id) : ((user as any)?.email || "guest");
  const storageKey = `academy_feedback_templates_${currentUserId}`;

  const [enableFeedback, setEnableFeedback] = useState<boolean>(data?.enableFeedback ?? true);
  const [requireFeedbackForCertificate, setRequireFeedbackForCertificate] = useState<boolean>(
    data?.requireFeedbackForCertificate ?? true
  );
  const [feedbackTitle, setFeedbackTitle] = useState<string>(
    data?.feedbackTitle || "End-of-Course Feedback & Evaluation Survey"
  );
  const [description, setDescription] = useState<string>(
    data?.description ||
      "Please share your review regarding course structure, content clarity, and instructor support."
  );

  const [questions, setQuestions] = useState<FeedbackQuestion[]>(
    data?.questions && data.questions.length > 0
      ? data.questions
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
        ]
  );

  // Templates state
  const [customTemplates, setCustomTemplates] = useState<FeedbackTemplate[]>([]);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Toggle for showing the Add Question Form
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);

  // Load user-scoped custom templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomTemplates(parsed);
        }
      } else {
        setCustomTemplates([]);
      }
    } catch (err) {
      console.warn("Failed to load saved feedback templates from localStorage:", err);
    }
  }, [storageKey]);

  // Form state for adding new question
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"MCQ" | "WRITTEN">("MCQ");
  const [newOptions, setNewOptions] = useState<string[]>(["Excellent", "Good", "Average", "Needs Improvement"]);
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
    const updated = [...questions, newQ];
    setQuestions(updated);
    setNewQuestionText("");
    setNewOptions(["Excellent", "Good", "Average", "Needs Improvement"]);
    setIsMandatory(true);
    setShowAddQuestionForm(false);

    if (onChange) {
      onChange({ questions: updated });
    }
  };

  const handleDeleteQuestion = (id: number) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    if (onChange) {
      onChange({ questions: updated });
    }
  };

  const allTemplates = [...PRESET_TEMPLATES, ...customTemplates];

  const handleSaveAsTemplate = () => {
    if (!templateNameInput.trim()) {
      toast.error("Please provide a template name.");
      return;
    }
    if (questions.length === 0) {
      toast.error("Add at least one question before saving as template.");
      return;
    }

    const newTmpl: FeedbackTemplate = {
      id: `custom-${Date.now()}`,
      name: templateNameInput.trim(),
      title: feedbackTitle.trim() || "Course Feedback & Evaluation Survey",
      description: description.trim() || "",
      questions: questions.map((q, idx) => ({ ...q, id: Date.now() + idx })),
      isCustom: true,
      userId: currentUserId,
    };

    const updated = [newTmpl, ...customTemplates];
    setCustomTemplates(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    toast.success(`Template "${newTmpl.name}" saved successfully!`);
    setTemplateNameInput("");
    setSaveTemplateDialogOpen(false);
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (selectedTemplateId === id) {
      setSelectedTemplateId("");
    }
    toast.success("Template deleted successfully");
  };

  const handleApplyTemplate = (tmplId: string) => {
    if (!tmplId) return;
    const target = allTemplates.find((t) => t.id === tmplId);
    if (!target) return;

    setFeedbackTitle(target.title);
    setDescription(target.description);
    const newQList = target.questions.map((q, i) => ({ ...q, id: Date.now() + i }));
    setQuestions(newQList);
    if (onChange) {
      onChange({ feedbackTitle: target.title, description: target.description, questions: newQList });
    }
    toast.success(`Loaded template: "${target.name}"`);
    setSelectedTemplateId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onChange) {
      onChange({
        enableFeedback,
        requireFeedbackForCertificate,
        feedbackTitle: feedbackTitle.trim(),
        description: description.trim(),
        questions,
      });
    }
    onNext();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-amber-500" />
              Course Feedback &amp; Evaluation Setup
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Configure course-level evaluation surveys, feedback rules, and learner review questionnaires.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-3 py-1 font-bold text-xs">
              Step 5 of 7
            </Badge>
          </div>
        </div>

        {/* Global Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableFeedbackToggle" className="text-xs font-bold text-foreground cursor-pointer">
                Enable Course Feedback Survey
              </Label>
              <input
                type="checkbox"
                id="enableFeedbackToggle"
                checked={enableFeedback}
                onChange={(e) => {
                  setEnableFeedback(e.target.checked);
                  if (onChange) onChange({ enableFeedback: e.target.checked });
                }}
                className="h-4 w-4 accent-amber-600 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Allow learners to evaluate course materials and submit reviews upon completing curriculum modules.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reqCertToggle" className="text-xs font-bold text-foreground cursor-pointer">
                Require Feedback Before Claiming Certificate
              </Label>
              <input
                type="checkbox"
                id="reqCertToggle"
                checked={requireFeedbackForCertificate}
                onChange={(e) => {
                  setRequireFeedbackForCertificate(e.target.checked);
                  if (onChange) onChange({ requireFeedbackForCertificate: e.target.checked });
                }}
                className="h-4 w-4 accent-amber-600 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Learners must complete this survey before their official completion certificate can be unlocked.
            </p>
          </div>
        </div>

        {enableFeedback && (
          <div className="space-y-5">
            {/* Quick Template Selector Bar */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600" /> Load Pre-built or Saved Template
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    if (e.target.value) handleApplyTemplate(e.target.value);
                  }}
                  className="w-full h-9 rounded-lg border border-amber-500/30 bg-background px-3 text-xs text-foreground font-medium"
                >
                  <option value="">-- Choose a Feedback Template to Load --</option>
                  <optgroup label="✨ Standard Template">
                    {PRESET_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} ({tmpl.questions.length} Questions)
                      </option>
                    ))}
                  </optgroup>
                  {customTemplates.length > 0 && (
                    <optgroup label="📌 My Saved Templates">
                      {customTemplates.map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id}>
                          ⭐ {tmpl.name} ({tmpl.questions.length} Questions)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {selectedTemplateId && (
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedTemplateId("")}
                    className="h-9 px-2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Saved Custom Templates Quick Tags */}
              {customTemplates.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                    Your Saved Templates:
                  </span>
                  {customTemplates.map((t) => (
                    <span
                      key={t.id}
                      onClick={() => handleApplyTemplate(t.id)}
                      className="px-2 py-0.5 rounded bg-background border border-amber-500/40 text-[11px] font-semibold text-foreground flex items-center gap-1 cursor-pointer hover:bg-amber-500/20 transition-all shadow-xs"
                    >
                      <span>{t.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomTemplate(t.id, e)}
                        title="Delete saved template"
                        className="text-destructive font-bold hover:text-red-700 ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Survey Metadata */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Survey Title &amp; Learner Instructions
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Survey Title *</Label>
                  <Input
                    value={feedbackTitle}
                    onChange={(e) => {
                      setFeedbackTitle(e.target.value);
                      if (onChange) onChange({ feedbackTitle: e.target.value });
                    }}
                    placeholder="e.g. End-of-Course Feedback & Evaluation Survey"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Learner Instructions &amp; Overview</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (onChange) onChange({ description: e.target.value });
                    }}
                    placeholder="Explain the purpose of this feedback form..."
                    className="min-h-[70px] text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Survey Questions List */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-500" /> Configured Survey Questions ({questions.length})
                </h3>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSaveTemplateDialogOpen(true)}
                  className="h-7 text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-bold"
                >
                  <Bookmark className="h-3.5 w-3.5" /> Save Questions as Template
                </Button>
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-border bg-muted/20 space-y-2 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <span>Q{idx + 1}.</span>
                          <span>{q.questionText}</span>
                          {q.isMandatory ? (
                            <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px]">
                              Mandatory
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Optional
                            </Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 font-medium">
                          {q.questionType === "MCQ" ? (
                            <>
                              <CheckSquare className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>Multiple Choice Options: {q.options?.join(" | ")}</span>
                            </>
                          ) : (
                            <>
                              <AlignLeft className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span>Written Response (Open Text Answer)</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Toggleable Add Question Section */}
              {!showAddQuestionForm ? (
                <Button
                  type="button"
                  onClick={() => setShowAddQuestionForm(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Feedback Question
                </Button>
              ) : (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Plus className="h-4 w-4" /> Add Feedback Question
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddQuestionForm(false)}
                      className="h-6 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Enter feedback question text..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="text-xs bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <Label className="text-xs font-semibold">Requirement</Label>
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="stepMandatoryCheck"
                          checked={isMandatory}
                          onChange={(e) => setIsMandatory(e.target.checked)}
                          className="h-4 w-4 accent-amber-600 rounded cursor-pointer"
                        />
                        <label htmlFor="stepMandatoryCheck" className="text-xs text-foreground font-semibold cursor-pointer">
                          Mandatory Question
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* MCQ Options list */}
                  {newQuestionType === "MCQ" && (
                    <div className="space-y-2 pt-1">
                      <Label className="text-xs font-semibold">MCQ Response Options</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add choice..."
                          value={newOptionInput}
                          onChange={(e) => setNewOptionInput(e.target.value)}
                          className="text-xs bg-background h-8"
                        />
                        <Button size="sm" type="button" onClick={handleAddOption} className="h-8 text-xs font-bold">
                          Add Choice
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {newOptions.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className="px-2.5 py-1 rounded-md bg-card border border-border text-xs font-semibold flex items-center gap-1.5 text-foreground"
                          >
                            {opt}
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(oIdx)}
                              className="text-muted-foreground hover:text-destructive text-xs"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={handleAddQuestion}
                      disabled={!newQuestionText.trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 h-9"
                    >
                      <Plus className="h-4 w-4" /> Save Question to Survey
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddQuestionForm(false)}
                      className="text-xs h-9"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stepper Footer */}
        <div className="flex items-center justify-between border-t border-border pt-5">
          <Button variant="outline" type="button" onClick={onCancel} className="gap-2 text-xs font-semibold cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="secondary" type="button" onClick={onBack} className="gap-1.5 text-xs font-semibold cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Previous Step
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6 cursor-pointer">
              Continue to Certificate &rarr;
            </Button>
          </div>
        </div>
      </form>

      {/* Save Template Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-amber-500" /> Save Feedback Form as Template
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Template Name</Label>
              <Input
                value={templateNameInput}
                onChange={(e) => setTemplateNameInput(e.target.value)}
                placeholder="e.g. Technical Department Feedback Template"
                className="text-xs bg-background"
              />
              <p className="text-[11px] text-muted-foreground">
                This template will save current title, description, and {questions.length} questions for future reuse across all course modules.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button size="sm" type="button" variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="button" onClick={handleSaveAsTemplate} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
