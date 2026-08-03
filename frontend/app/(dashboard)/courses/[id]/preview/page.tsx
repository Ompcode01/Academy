"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  FileText,
  Download,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { getCourseById, type Course } from "@/services/api/course.service";

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

// Tailored curriculum fallback generator when course sections haven't been added yet
function generateTailoredModules(courseTitle: string): ModuleItem[] {
  const lower = (courseTitle || "").toLowerCase();

  if (lower.includes("communication") || lower.includes("soft")) {
    return [
      {
        id: 1,
        title: "Module 1: Core Principles of Communication",
        completedCount: 2,
        totalCount: 4,
        lessons: [
          { id: 1, title: "1.1 Active Listening & Empathy", completed: true },
          { id: 2, title: "1.2 Non-Verbal & Body Language Signals", completed: true },
          { id: 3, title: "1.3 Structuring Clear Messages", completed: false, active: true },
          { id: 4, title: "1.4 Overcoming Noise & Barriers", completed: false },
        ],
      },
      {
        id: 2,
        title: "Module 2: Professional Workplace Writing",
        completedCount: 0,
        totalCount: 4,
        lessons: [
          { id: 5, title: "2.1 Effective Email & Executive Reports", completed: false },
          { id: 6, title: "2.2 Constructive Feedback Techniques", completed: false },
          { id: 7, title: "2.3 Cross-Department Collaboration", completed: false },
          { id: 8, title: "2.4 Practical Communication Scenario", completed: false },
        ],
      },
      {
        id: 3,
        title: "Module 3: High-Impact Presentations & Speaking",
        completedCount: 0,
        totalCount: 3,
        lessons: [
          { id: 9, title: "3.1 Public Speaking Confidence", completed: false },
          { id: 10, title: "3.2 Visual Slide Design & Storytelling", completed: false },
          { id: 11, title: "3.3 Q&A Handling & Influence", completed: false },
        ],
      },
    ];
  } else if (lower.includes("hr") || lower.includes("compliance")) {
    return [
      {
        id: 1,
        title: "Module 1: Organizational HR Policies & Standards",
        completedCount: 1,
        totalCount: 4,
        lessons: [
          { id: 1, title: "1.1 Harassment & Discrimination Guidelines", completed: true },
          { id: 2, title: "1.2 Information Security & NDA Compliance", completed: false, active: true },
          { id: 3, title: "1.3 Workplace Health & Safety Protocols", completed: false },
          { id: 4, title: "1.4 Code of Conduct & Ethics Assessment", completed: false },
        ],
      },
      {
        id: 2,
        title: "Module 2: Leave, Benefits & Employee Lifecycle",
        completedCount: 0,
        totalCount: 3,
        lessons: [
          { id: 5, title: "2.1 Attendance & Leave Policies", completed: false },
          { id: 6, title: "2.2 Performance Appraisal Rules", completed: false },
          { id: 7, title: "2.3 Employee Grievance Mechanism", completed: false },
        ],
      },
    ];
  } else if (lower.includes("java") || lower.includes("tech") || lower.includes("architect")) {
    return [
      {
        id: 1,
        title: "Module 1: Language Fundamentals & Setup",
        completedCount: 2,
        totalCount: 4,
        lessons: [
          { id: 1, title: "1.1 Development Environment Setup", completed: true },
          { id: 2, title: "1.2 Syntax, Data Types & Variables", completed: true },
          { id: 3, title: "1.3 Control Flow & Loops", completed: false, active: true },
          { id: 4, title: "1.4 Hands-on Coding Exercise", completed: false },
        ],
      },
      {
        id: 2,
        title: "Module 2: Advanced System Architecture",
        completedCount: 0,
        totalCount: 4,
        lessons: [
          { id: 5, title: "2.1 Object-Oriented Design Patterns", completed: false },
          { id: 6, title: "2.2 Memory Management & Optimization", completed: false },
          { id: 7, title: "2.3 Exception Handling & Logging", completed: false },
          { id: 8, title: "2.4 Architecture Review Project", completed: false },
        ],
      },
    ];
  }

  // Default General Module Structure
  return [
    {
      id: 1,
      title: `Module 1: Introduction to ${courseTitle || "Course"}`,
      completedCount: 1,
      totalCount: 3,
      lessons: [
        { id: 1, title: "1.1 Course Overview & Objectives", completed: true },
        { id: 2, title: "1.2 Foundational Concepts & Terminology", completed: false, active: true },
        { id: 3, title: "1.3 Key Takeaways & Discussion", completed: false },
      ],
    },
    {
      id: 2,
      title: `Module 2: Core Applications & Mastery`,
      completedCount: 0,
      totalCount: 3,
      lessons: [
        { id: 4, title: "2.1 Step-by-Step Implementation", completed: false },
        { id: 5, title: "2.2 Best Practices & Industry Case Studies", completed: false },
        { id: 6, title: "2.3 Practical Capstone Exercise", completed: false },
      ],
    },
  ];
}

export default function CoursePreviewPage() {
  const params = useParams();
  const courseId = params?.id ? String(params.id) : null;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "notes">("overview");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolledNotice, setEnrolledNotice] = useState(false);
  const [selectedLessonTitle, setSelectedLessonTitle] = useState("1.1 Overview & Introduction");

  useEffect(() => {
    if (courseId) {
      setLoading(true);
      getCourseById(Number(courseId))
        .then((res) => {
          if (res?.success && res.data) {
            const c = res.data;
            setCourse(c);

            // Parse DB sections created by Admin
            if (c.sections && c.sections.length > 0) {
              const parsed: ModuleItem[] = c.sections.map((sec: any, sIdx: number) => ({
                id: sec.id || sIdx + 1,
                title: `Module ${sIdx + 1}: ${sec.title}`,
                completedCount: 0,
                totalCount: sec.contents?.length || 0,
                lessons: (sec.contents || []).map((cnt: any, cIdx: number) => ({
                  id: cnt.id || cIdx + 1,
                  title: `${sIdx + 1}.${cIdx + 1} ${cnt.title}`,
                  completed: false,
                  active: sIdx === 0 && cIdx === 0,
                })),
              }));
              setModules(parsed);
              if (parsed[0]?.lessons[0]) {
                setSelectedLessonTitle(parsed[0].lessons[0].title);
              }
            } else {
              setModules([]);
              setSelectedLessonTitle("Course Overview");
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [courseId]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelfEnroll = () => {
    setIsEnrolled(true);
    setEnrolledNotice(true);
    setTimeout(() => setEnrolledNotice(false), 5000);
  };

  const currentTitle = course?.title || "Course Preview";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shadow-sm">
        <Link
          href="/courses"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses Catalog
        </Link>
        <div className="flex items-center gap-4">
          <h2 className="text-base font-bold text-foreground truncate max-w-md">
            {currentTitle}
          </h2>
          
          {!isEnrolled ? (
            <Button
              onClick={handleSelfEnroll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
            >
              <Sparkles className="h-4 w-4" /> Self Enroll &amp; Start Course
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                Enrolled
              </Badge>
              <span className="text-xs text-muted-foreground">Your Progress</span>
              <Progress value={25} className="h-2 w-24" />
              <span className="text-xs font-semibold text-primary">25%</span>
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Notification Alert */}
      {enrolledNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-6 py-2.5 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            🎉 Enrolled Successfully! You now have full access to all curriculum modules and materials for {currentTitle}.
          </span>
          <button onClick={() => setEnrolledNotice(false)} className="text-white/80 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Course Content Sidebar */}
        <div className="w-[310px] shrink-0 overflow-y-auto border-r border-border bg-card">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">
              Curriculum Content ({modules.length} Modules)
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {course?.level || "Beginner"} • {course?.duration || 20} Hours
            </p>
          </div>
          <div className="space-y-0.5 px-2 py-3">
            {modules.length === 0 ? (
              <div className="p-5 text-center space-y-2">
                <BookOpen className="h-6 w-6 text-muted-foreground/50 mx-auto" />
                <p className="text-xs font-bold text-foreground">No Custom Modules Added</p>
                <p className="text-[11px] text-muted-foreground">
                  The instructor has published this course overview. Content sections will appear here once uploaded by the admin.
                </p>
              </div>
            ) : (
              modules.map((module) => {
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
                    <span className="flex-1 text-xs font-bold text-foreground">
                      {module.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {module.completedCount}/{module.totalCount}
                    </span>
                  </button>
                  {expanded && (
                    <div className="ml-3 space-y-0.5 border-l border-border pl-3">
                      {module.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLessonTitle(lesson.title)}
                          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-all ${
                            lesson.title === selectedLessonTitle
                              ? "bg-primary/10 font-bold text-primary"
                              : lesson.completed
                              ? "text-muted-foreground"
                              : "text-foreground/70 hover:bg-muted/40"
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          ) : lesson.title === selectedLessonTitle ? (
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
            })
            )}
          </div>
        </div>

        {/* Center: Video + Tabs */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-background">
          {/* Lesson Title Header */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-border">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-0.5">
                Active Lecture Unit
              </span>
              <h2 className="text-lg font-bold text-foreground">
                {selectedLessonTitle}
              </h2>
            </div>
            <Badge variant="outline" className="text-xs">
              {course?.category?.name || "General"}
            </Badge>
          </div>

          {/* Video / Banner Player Box */}
          <div className="px-6 pt-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border border-border shadow-lg">
              {/* Cover Image / Gradient */}
              {(course as any)?.thumbnail ? (
                <img
                  src={(course as any).thumbnail}
                  alt={currentTitle}
                  className="h-full w-full object-cover opacity-60"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 opacity-90" />
              )}

              {/* Player Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-white uppercase tracking-wider">{currentTitle}</p>
                    <p className="text-xs text-white/70">{selectedLessonTitle}</p>
                  </div>
                </div>

                <button className="mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-all hover:scale-110 cursor-pointer">
                  <Play className="h-7 w-7 fill-current ml-0.5" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                  <div className="h-full w-[25%] bg-primary rounded-r" />
                </div>
              </div>

              <div className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2.5 py-1 text-xs font-mono text-white backdrop-blur-sm">
                04:15 / 18:00
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-border px-6">
            <div className="flex gap-6">
              {(["overview", "resources", "notes"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 pb-3 text-xs font-bold uppercase tracking-wider transition-colors ${
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
          <div className="px-6 py-5 flex-1">
            {activeTab === "overview" && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Course Overview &amp; Learning Goals</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {course?.description || course?.shortDescription || `Master the principles of ${currentTitle}. This course provides structured modules, practical scenario exercises, and comprehensive evaluations designed to build professional capability.`}
                </p>
              </div>
            )}
            {activeTab === "resources" && (
              <div className="space-y-2">
                {[
                  { name: `${currentTitle} Lecture Slides (PDF)`, size: "2.4 MB" },
                  { name: `${currentTitle} Quick Reference Sheet`, size: "1.1 MB" },
                  { name: "Practical Case Study & Template (ZIP)", size: "450 KB" },
                ].map((resource) => (
                  <div
                    key={resource.name}
                    className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs font-bold text-foreground">{resource.name}</p>
                        <p className="text-[10px] text-muted-foreground">{resource.size}</p>
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
                placeholder={`Type your personal notes for ${selectedLessonTitle}...`}
                className="min-h-[120px] w-full rounded-xl border border-border bg-card p-4 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            )}
          </div>
        </div>

        {/* Right: Lesson Info Sidebar */}
        <div className="w-[270px] shrink-0 overflow-y-auto border-l border-border bg-card p-5 space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Course Metadata
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Department</span>
              <span className="font-bold text-foreground">{course?.department?.departmentCode || "Global"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Level</span>
              <span className="font-bold text-foreground">{course?.level || "Beginner"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Est. Duration</span>
              <span className="font-bold text-foreground">{course?.duration || 20} Hours</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                {course?.status || "PUBLISHED"}
              </Badge>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <h4 className="text-xs font-bold text-foreground">Course Instructor</h4>
            <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                {course?.creator?.firstName?.[0] || "A"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-foreground truncate">
                  {course?.creator ? `${course.creator.firstName} ${course.creator.lastName}` : "Academy Instructor"}
                </p>
                <p className="text-[10px] text-muted-foreground">Lead Trainer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
