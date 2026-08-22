"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Plus,
  Trash2,
  CheckSquare,
  AlignLeft,
  Bookmark,
  Save,
  Sparkles,
} from "lucide-react";
import HarbingerConfirmModal from "@/components/common/HarbingerConfirmModal";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";

export interface FeedbackQuestion {
  id: number;
  questionText: string;
  questionType: "MCQ" | "WRITTEN";
  options?: string[];
  isMandatory: boolean;
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

interface FeedbackBuilderModalProps {
  open: boolean;
  initialData?: any;
  onOpenChange: (open: boolean) => void;
  onSaveFeedback: (feedbackData: {
    title: string;
    description: string;
    questions: FeedbackQuestion[];
  }) => void;
}

export default function FeedbackBuilderModal({
  open,
  initialData,
  onOpenChange,
  onSaveFeedback,
}: FeedbackBuilderModalProps) {
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id ? String(user.id) : ((user as any)?.email || "guest");
  const storageKey = `academy_feedback_templates_${currentUserId}`;

  const [title, setTitle] = useState("Course Feedback & Evaluation");
  const [description, setDescription] = useState(
    "Please share your honest review regarding course structure, content clarity, and instructor support."
  );
  const [validationModal, setValidationModal] = useState<{ open: boolean; title: string; description: string } | null>(null);

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

  useEffect(() => {
    if (open && initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.description) setDescription(initialData.description);
      if (Array.isArray(initialData.questions) && initialData.questions.length > 0) {
        setQuestions(initialData.questions);
      }
    }
  }, [open, initialData]);

  // Question editing form state
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
    setQuestions((prev) => [...prev, newQ]);
    setNewQuestionText("");
    setNewOptions(["Excellent", "Good", "Average", "Needs Improvement"]);
    setIsMandatory(true);
    setShowAddQuestionForm(false);
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const allTemplates = [...PRESET_TEMPLATES, ...customTemplates];

  // Save current form as reusable template
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
      title: title.trim() || "Course Feedback & Evaluation",
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

  // Delete custom template
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

  // Load selected template into state
  const handleApplyTemplate = (tmplId: string) => {
    if (!tmplId) return;
    const target = allTemplates.find((t) => t.id === tmplId);
    if (!target) return;

    setTitle(target.title);
    setDescription(target.description);
    setQuestions(target.questions.map((q, i) => ({ ...q, id: Date.now() + i })));
    toast.success(`Loaded template: "${target.name}"`);
    setSelectedTemplateId("");
  };

  const handleSave = () => {
    if (!title.trim()) {
      setValidationModal({
        open: true,
        title: "Required Fields Missing",
        description: "Please fill out the Feedback Form Title before saving.",
      });
      return;
    }
    onSaveFeedback({
      title: title.trim(),
      description: description.trim(),
      questions,
    });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              Course Feedback Form Builder
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Quick Template Selector Bar */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
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
                        onClick={(e) => handleDeleteCustomTemplate(t.id, e)}
                        title="Delete saved template"
                        className="text-destructive font-bold hover:text-red-700 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

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
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Form Questions ({questions.length})
                </h4>
                {questions.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setQuestions([])}
                    className="h-6 text-[11px] text-destructive hover:bg-destructive/10 px-2"
                  >
                    Clear All Questions
                  </Button>
                )}
              </div>

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
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
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
                            type="button"
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

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    disabled={!newQuestionText.trim()}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                  >
                    Save Question to Survey
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddQuestionForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveTemplateDialogOpen(true)}
                className="text-xs gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-bold"
              >
                <Save className="h-3.5 w-3.5" /> Save Questions as Template
              </Button>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6">
                  Save Feedback Form to Module
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <Button size="sm" variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveAsTemplate} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Error Popup Modal (No Cancel Button, Red Warning Icon) */}
      {validationModal && (
        <HarbingerConfirmModal
          open={validationModal.open}
          onOpenChange={(open) => {
            if (!open) setValidationModal(null);
          }}
          title={validationModal.title}
          description={validationModal.description}
          confirmLabel="OK"
          showCancelButton={false}
          variant="danger"
        />
      )}
    </>
  );
}
