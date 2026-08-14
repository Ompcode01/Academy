"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  FileCheck,
  Plus,
  Trash2,
  Award,
} from "lucide-react";
import QuizBuilderModal from "../builder/QuizBuilderModal";
import AssignmentBuilderModal from "../builder/AssignmentBuilderModal";

interface AssessmentsFormProps {
  sections?: any[];
  onSectionsChange?: (sections: any[]) => void;
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function AssessmentsForm({
  sections = [],
  onSectionsChange,
  onNext,
  onBack,
  onCancel,
}: AssessmentsFormProps) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

  useEffect(() => {
    if (sections) {
      const parsedQuizzes = sections.flatMap((sec) =>
        (sec.contents || [])
          .filter((c: any) => c.contentType === "QUIZ")
          .map((c: any) => {
            let config = {};
            if (c.quizConfigJson) {
              try {
                config = typeof c.quizConfigJson === "string" ? JSON.parse(c.quizConfigJson) : c.quizConfigJson;
              } catch (e) {
                console.error("Error parsing quiz config:", e);
              }
            }
            return {
              id: c.id,
              title: c.title,
              description: c.description || (config as any).description || "",
              questions: (config as any).questions || [],
              totalMarks: c.maxMarks || (config as any).totalMarks || 100,
              durationMinutes: c.duration || (config as any).durationMinutes || 15,
              passingPercentage: (config as any).passingPercentage || 70,
              maxAttempts: (config as any).maxAttempts !== undefined && (config as any).maxAttempts !== null ? Number((config as any).maxAttempts) : 1,
            };
          })
      );

      const parsedAssignments = sections.flatMap((sec) =>
        (sec.contents || [])
          .filter((c: any) => c.contentType === "ASSIGNMENT")
          .map((c: any) => {
            let config = {};
            if (c.assignmentConfigJson) {
              try {
                config = typeof c.assignmentConfigJson === "string" ? JSON.parse(c.assignmentConfigJson) : c.assignmentConfigJson;
              } catch (e) {
                console.error("Error parsing assignment config:", e);
              }
            }
            return {
              id: c.id,
              title: c.title,
              description: c.description || (config as any).description || "",
              instructions: c.description || (config as any).instructions || "",
              maxMarks: c.maxMarks || (config as any).maxMarks || 100,
              deadline: (config as any).deadline || "",
              maxAttempts: (config as any).maxAttempts !== undefined && (config as any).maxAttempts !== null ? Number((config as any).maxAttempts) : 1,
            };
          })
      );

      setQuizzes(parsedQuizzes);
      setAssignments(parsedAssignments);
    }
  }, [sections]);

  const handleOpenNewQuiz = () => {
    setEditingQuiz(null);
    setQuizModalOpen(true);
  };

  const handleOpenEditQuiz = (quiz: any) => {
    setEditingQuiz(quiz);
    setQuizModalOpen(true);
  };

  const handleOpenNewAssignment = () => {
    setEditingAssignment(null);
    setAssignmentModalOpen(true);
  };

  const handleOpenEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setAssignmentModalOpen(true);
  };

  const handleSaveQuiz = (newQuiz: any) => {
    const updatedSections = [...sections];
    const quizContentItem = {
      id: editingQuiz?.id || Date.now(),
      title: newQuiz.title,
      contentType: "QUIZ" as const,
      questionsCount: newQuiz.questions ? newQuiz.questions.length : 0,
      maxMarks: newQuiz.totalMarks || 100,
      duration: newQuiz.durationMinutes || 15,
      quizConfigJson: JSON.stringify(newQuiz),
      status: "Published" as const,
    };

    if (editingQuiz) {
      // Update existing item in place
      const nextSections = updatedSections.map((sec) => ({
        ...sec,
        contents: (sec.contents || []).map((c: any) =>
          c.id === editingQuiz.id ? { ...c, ...quizContentItem } : c
        ),
      }));
      onSectionsChange?.(nextSections);
    } else {
      if (updatedSections.length === 0) {
        updatedSections.push({
          id: Date.now(),
          title: "Assessments",
          description: "Course Assessments",
          expanded: true,
          contents: [quizContentItem],
        });
      } else {
        const lastSecIdx = updatedSections.length - 1;
        updatedSections[lastSecIdx] = {
          ...updatedSections[lastSecIdx],
          contents: [...(updatedSections[lastSecIdx].contents || []), quizContentItem],
        };
      }
      onSectionsChange?.(updatedSections);
    }
    setEditingQuiz(null);
  };

  const handleSaveAssignment = (newAssignment: any) => {
    const updatedSections = [...sections];
    const assignmentContentItem = {
      id: editingAssignment?.id || Date.now(),
      title: newAssignment.title,
      contentType: "ASSIGNMENT" as const,
      description: newAssignment.instructions || newAssignment.description,
      maxMarks: newAssignment.maxMarks || 100,
      assignmentConfigJson: JSON.stringify(newAssignment),
      status: "Draft" as const,
    };

    if (editingAssignment) {
      // Update existing item in place
      const nextSections = updatedSections.map((sec) => ({
        ...sec,
        contents: (sec.contents || []).map((c: any) =>
          c.id === editingAssignment.id ? { ...c, ...assignmentContentItem } : c
        ),
      }));
      onSectionsChange?.(nextSections);
    } else {
      if (updatedSections.length === 0) {
        updatedSections.push({
          id: Date.now(),
          title: "Assessments",
          description: "Course Assessments",
          expanded: true,
          contents: [assignmentContentItem],
        });
      } else {
        const lastSecIdx = updatedSections.length - 1;
        updatedSections[lastSecIdx] = {
          ...updatedSections[lastSecIdx],
          contents: [...(updatedSections[lastSecIdx].contents || []), assignmentContentItem],
        };
      }
      onSectionsChange?.(updatedSections);
    }
    setEditingAssignment(null);
  };

  const handleDeleteQuiz = (id: number) => {
    const updatedSections = sections.map((sec) => ({
      ...sec,
      contents: (sec.contents || []).filter((c: any) => c.id !== id),
    }));
    onSectionsChange?.(updatedSections);
  };

  const handleDeleteAssignment = (id: number) => {
    const updatedSections = sections.map((sec) => ({
      ...sec,
      contents: (sec.contents || []).filter((c: any) => c.id !== id),
    }));
    onSectionsChange?.(updatedSections);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-500" />
          Assessments &amp; Quizzes Builder
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Configure quizzes, tests, and practical assignments for evaluating learner understanding.
        </p>
      </div>

      {/* Quizzes Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-indigo-500" />
            Course Quizzes ({quizzes.length})
          </h3>
          <Button
            size="sm"
            onClick={handleOpenNewQuiz}
            className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> + Create / Attach Quiz
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-xs text-muted-foreground">No quizzes attached yet.</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Click "+ Create / Attach Quiz" to add a new quiz with MCQs, Short Answer, or True/False questions.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/10 hover:border-indigo-500/40 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block text-sm">
                      {quiz.title}
                    </span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      {quiz.questions?.length || 0} Questions • {quiz.totalMarks || 0} Marks • {quiz.durationMinutes || 20} Min • Passing: {quiz.passingPercentage || 70}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500">
                    Published
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEditQuiz(quiz)}
                    className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400"
                  >
                    Edit
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignments Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-blue-500" />
            Course Assignments ({assignments.length})
          </h3>
          <Button
            size="sm"
            onClick={handleOpenNewAssignment}
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> + Create / Attach Assignment
          </Button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-xs text-muted-foreground">No assignments attached yet.</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Click "+ Create / Attach Assignment" to add project scenarios, deadlines, and submission rules.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignments.map((ass) => (
              <div
                key={ass.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/10 hover:border-blue-500/40 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block text-sm">
                      {ass.title}
                    </span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Max Marks: {ass.maxMarks || 50} • Deadline: {ass.deadline || "N/A"} • Max Attempts: {ass.maxAttempts === 0 ? "Unlimited" : (ass.maxAttempts || 1)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500">
                    Draft
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEditAssignment(ass)}
                    className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400"
                  >
                    Edit
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAssignment(ass.id)}
                    className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stepper Footer */}
      <div className="flex items-center justify-between border-t border-border pt-5">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onBack}>
            &larr; Back
          </Button>
          <Button onClick={onNext} className="bg-primary text-primary-foreground">
            Save &amp; Next &rarr;
          </Button>
        </div>
      </div>

      {/* Quiz Creator Modal */}
      <QuizBuilderModal
        open={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        initialData={editingQuiz}
        onSaveQuiz={handleSaveQuiz}
      />

      {/* Assignment Creator Modal */}
      <AssignmentBuilderModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        initialData={editingAssignment}
        onSaveAssignment={handleSaveAssignment}
      />
    </div>
  );
}
