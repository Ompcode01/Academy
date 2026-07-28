"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Download,
  BookOpen,
} from "lucide-react";

interface LessonItem {
  id: number;
  title: string;
  completed: boolean;
  active?: boolean;
}

interface ModuleItem {
  id: number;
  title: string;
  lessons: LessonItem[];
  completedCount: number;
  totalCount: number;
}

const courseModules: ModuleItem[] = [
  {
    id: 1,
    title: "Module 1: Introduction to Java",
    completedCount: 3,
    totalCount: 5,
    lessons: [
      { id: 1, title: "1.1 What is Java?", completed: true },
      { id: 2, title: "1.2 Java Setup & Installation", completed: true },
      { id: 3, title: "1.3 Your First Java Program", completed: false, active: true },
      { id: 4, title: "1.4 Java Ecosystem", completed: false },
      { id: 5, title: "1.5 Practice Exercise", completed: false },
    ],
  },
  {
    id: 2,
    title: "Module 2: Java Basics",
    completedCount: 0,
    totalCount: 6,
    lessons: [
      { id: 6, title: "2.1 Variables & Data Types", completed: false },
      { id: 7, title: "2.2 Operators", completed: false },
      { id: 8, title: "2.3 Control Flow", completed: false },
      { id: 9, title: "2.4 Arrays", completed: false },
      { id: 10, title: "2.5 Strings", completed: false },
      { id: 11, title: "2.6 Practice Exercise", completed: false },
    ],
  },
  {
    id: 3,
    title: "Module 3: OOP in Java",
    completedCount: 0,
    totalCount: 6,
    lessons: [
      { id: 12, title: "3.1 Classes & Objects", completed: false },
      { id: 13, title: "3.2 Inheritance", completed: false },
      { id: 14, title: "3.3 Polymorphism", completed: false },
      { id: 15, title: "3.4 Abstraction", completed: false },
      { id: 16, title: "3.5 Encapsulation", completed: false },
      { id: 17, title: "3.6 Practice Exercise", completed: false },
    ],
  },
  {
    id: 4,
    title: "Module 4: Exception Handling",
    completedCount: 0,
    totalCount: 4,
    lessons: [
      { id: 18, title: "4.1 Try-Catch", completed: false },
      { id: 19, title: "4.2 Custom Exceptions", completed: false },
      { id: 20, title: "4.3 Best Practices", completed: false },
      { id: 21, title: "4.4 Practice Exercise", completed: false },
    ],
  },
];

export default function CoursePreviewPage() {
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "notes">(
    "overview"
  );

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <Link
          href="/courses"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Link>
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            Java Fundamentals
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Your Progress</span>
            <Progress value={35} className="h-2 w-24" />
            <span className="text-xs font-semibold text-primary">35%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Course Content Sidebar */}
        <div className="w-[300px] shrink-0 overflow-y-auto border-r border-border bg-card">
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">
              Course Content
            </h3>
          </div>
          <div className="space-y-0.5 px-2 pb-4">
            {courseModules.map((module) => {
              const expanded = expandedModules.includes(module.id);
              return (
                <div key={module.id}>
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 text-[13px] font-medium text-foreground">
                      {module.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {module.completedCount}/{module.totalCount}
                    </span>
                  </button>
                  {expanded && (
                    <div className="ml-3 space-y-0.5 border-l border-border pl-4">
                      {module.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-all ${
                            lesson.active
                              ? "bg-primary/10 font-medium text-primary"
                              : lesson.completed
                              ? "text-muted-foreground"
                              : "text-foreground/70 hover:bg-muted/40"
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          ) : lesson.active ? (
                            <Play className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Video + Tabs */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Lesson Title */}
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-lg font-semibold text-foreground">
              1.3 Your First Java Program
            </h2>
          </div>

          {/* Video Placeholder */}
          <div className="px-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
              {/* Placeholder content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-blue-600 p-3">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-white">JAVA</p>
                    <p className="text-sm text-blue-300">Your First Program</p>
                  </div>
                </div>
                {/* Play button overlay */}
                <button className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105">
                  <Play className="h-6 w-6 fill-white text-white ml-0.5" />
                </button>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                  <div className="h-full w-[15%] bg-primary rounded-r" />
                </div>
              </div>
              {/* Timestamp */}
              <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                04:12 / 20:00
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 border-b border-border px-6">
            <div className="flex gap-6">
              {(["overview", "resources", "notes"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-5">
            {activeTab === "overview" && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                In this lesson you will learn how to write and run your first
                Java program using IntelliJ IDEA. We&apos;ll cover the basic
                structure of a Java program, including the main method, print
                statements, and how to compile and execute your code.
              </p>
            )}
            {activeTab === "resources" && (
              <div className="space-y-2">
                {[
                  { name: "Slides (PPT)", size: "2.4 MB" },
                  { name: "Cheat Sheet (PDF)", size: "1.1 MB" },
                  { name: "Sample Code (ZIP)", size: "345 KB" },
                ].map((resource) => (
                  <div
                    key={resource.name}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{resource.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {resource.size}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-xs">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "notes" && (
              <textarea
                placeholder="Add your notes here..."
                className="min-h-[120px] w-full rounded-lg border border-border bg-card p-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            )}
          </div>

          {/* Next Lesson */}
          <div className="mt-auto border-t border-border px-6 py-4">
            <Button className="w-full gap-2">
              Next Lesson
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right: Lesson Info */}
        <div className="w-[280px] shrink-0 overflow-y-auto border-l border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Lesson Info</h3>

          <div className="mt-4 space-y-4">
            {/* Info items */}
            {[
              { label: "Duration", value: "20:00" },
              { label: "Type", value: "Video" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-600 border-amber-200 text-xs"
              >
                In Progress
              </Badge>
            </div>

            {/* Resources */}
            <div className="border-t border-border pt-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resources
              </h4>
              <div className="space-y-2">
                {[
                  { icon: "📄", name: "Slides (PPT)" },
                  { icon: "📋", name: "Cheat Sheet (PDF)" },
                  { icon: "💻", name: "Sample Code (ZIP)" },
                ].map((resource) => (
                  <button
                    key={resource.name}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-primary transition-colors hover:bg-primary/5"
                  >
                    <span>{resource.icon}</span>
                    {resource.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Take Quiz */}
            <div className="border-t border-border pt-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Take Quiz
              </h4>
              <Button
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Start Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
