"use client";

import { useState } from "react";
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
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function AssessmentsForm({
  onNext,
  onBack,
  onCancel,
}: AssessmentsFormProps) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  const handleSaveQuiz = (newQuiz: any) => {
    setQuizzes((prev) => [...prev, { ...newQuiz, id: Date.now() }]);
  };

  const handleSaveAssignment = (newAssignment: any) => {
    setAssignments((prev) => [...prev, { ...newAssignment, id: Date.now() }]);
  };

  const handleDeleteQuiz = (id: number) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  };

  const handleDeleteAssignment = (id: number) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
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
            onClick={() => setQuizModalOpen(true)}
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
                  <button
                    type="button"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="text-red-500 hover:text-red-600 p-1"
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
            onClick={() => setAssignmentModalOpen(true)}
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
                      Max Marks: {ass.maxMarks || 50} • Deadline: {ass.deadline || "N/A"} • Max Attempts: {ass.maxAttempts || 2}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500">
                    Draft
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleDeleteAssignment(ass.id)}
                    className="text-red-500 hover:text-red-600 p-1"
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
        onSaveQuiz={handleSaveQuiz}
      />

      {/* Assignment Creator Modal */}
      <AssignmentBuilderModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        onSaveAssignment={handleSaveAssignment}
      />
    </div>
  );
}
