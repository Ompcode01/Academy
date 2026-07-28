"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  FileText,
} from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  description?: string;
  duration?: number;
  type: "video" | "text" | "video-text" | "other";
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
  expanded: boolean;
}

const initialModules: Module[] = [
  {
    id: 1,
    title: "Module 1: Introduction to Java",
    expanded: true,
    lessons: [
      { id: 1, title: "1.1 What is Java?", type: "video" },
      { id: 2, title: "1.2 Java Setup & Installation", type: "video" },
      { id: 3, title: "1.3 Your First Java Program", type: "video" },
    ],
  },
  {
    id: 2,
    title: "Module 2: Java Basics",
    expanded: false,
    lessons: [
      { id: 4, title: "2.1 Variables & Data Types", type: "video" },
      { id: 5, title: "2.2 Operators", type: "text" },
    ],
  },
  {
    id: 3,
    title: "Module 3: OOP in Java",
    expanded: false,
    lessons: [
      { id: 6, title: "3.1 Classes & Objects", type: "video" },
      { id: 7, title: "3.2 Inheritance", type: "video" },
    ],
  },
  {
    id: 4,
    title: "Module 4: Exception Handling",
    expanded: false,
    lessons: [
      { id: 8, title: "4.1 Try-Catch", type: "video" },
      { id: 9, title: "4.2 Custom Exceptions", type: "text" },
      { id: 10, title: "4.3 Best Practices", type: "video" },
      { id: 11, title: "4.4 Advanced Patterns", type: "video-text" },
    ],
  },
];

interface ModulesFormProps {
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ModulesForm({
  onNext,
  onBack,
  onCancel,
}: ModulesFormProps) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(
    initialModules[0].lessons[2]
  );

  const toggleModule = (moduleId: number) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, expanded: !m.expanded } : m
      )
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Left Panel: Course Structure */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Course Structure
          </h3>
          <p className="text-xs text-muted-foreground">
            Organize your course into modules and lessons.
          </p>
        </div>

        <div className="space-y-1 rounded-xl border border-border bg-card p-3">
          {modules.map((module) => (
            <div key={module.id}>
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/50"
              >
                {module.expanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="flex-1">{module.title}</span>
                <span className="text-xs text-muted-foreground">
                  {module.lessons.length} lessons
                </span>
              </button>

              {/* Lessons */}
              {module.expanded && (
                <div className="ml-4 space-y-0.5 border-l border-border pl-4">
                  {module.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-all duration-150 ${
                        selectedLesson?.id === lesson.id
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab opacity-40" />
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Module */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-primary border-primary/30 hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" />
          Add Module
        </Button>
      </div>

      {/* Right Panel: Lesson Details */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-foreground">
          Lesson Details
        </h3>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Lesson Name *</Label>
            <Input
              defaultValue={selectedLesson?.title || ""}
              className="h-9"
              key={selectedLesson?.id}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea
              placeholder="Write a simple Java program and understand the structure."
              className="min-h-[90px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Duration Estimated</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="15"
                className="h-9 w-24"
                defaultValue="15"
              />
              <span className="text-sm text-muted-foreground">Minutes</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Lesson Type</Label>
            <div className="flex flex-wrap gap-4">
              {[
                { value: "video", label: "Video" },
                { value: "text", label: "Text" },
                { value: "video-text", label: "Video + Text" },
                { value: "other", label: "Other" },
              ].map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="lessonType"
                    value={type.value}
                    defaultChecked={type.value === (selectedLesson?.type || "video")}
                    className="h-4 w-4 border-border text-primary focus:ring-primary"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Button variant="outline" size="sm">
              Save Lesson
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
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
    </div>
  );
}
