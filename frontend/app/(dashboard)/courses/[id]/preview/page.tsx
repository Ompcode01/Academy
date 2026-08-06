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
  Award,
  Clock,
  HelpCircle,
  Sparkles,
  Lock,
  Building2,
  Tag,
  FileCheck2,
  ExternalLink,
  Tv,
} from "lucide-react";
import { getCourseById, selfEnrollCourse, type Course } from "@/services/api/course.service";
import {
  getLearnerCourseProgress,
  updateLessonProgress,
  LearnerProgressData,
} from "@/services/api/progress.service";
import { useAuthStore } from "@/store/auth.store";
import { recordRecentCourseAccess } from "@/services/api/recentAccess.service";
import LearnerQuizModal from "@/components/courses/learner/LearnerQuizModal";
import LearnerAssignmentModal from "@/components/courses/learner/LearnerAssignmentModal";
import LearnerCertificateModal from "@/components/certificates/LearnerCertificateModal";

interface LessonItem {
  id: number;
  title: string;
  contentType: string;
  description?: string;
  contentUrl?: string;
  quizConfigJson?: string;
  assignmentConfigJson?: string;
  isMandatory?: boolean;
  completed: boolean;
  active?: boolean;
}

interface ModuleItem {
  id: number;
  title: string;
  completedCount: number;
  totalCount: number;
  lessons: LessonItem[];
}

export default function CoursePreviewPage() {
  const params = useParams();
  const courseId = params?.id ? Number(params.id) : null;
  const { user } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "notes">("overview");

  // Progress & Time tracking
  const [progressData, setProgressData] = useState<LearnerProgressData | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [internalTimeSpentSeconds, setInternalTimeSpentSeconds] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);

  // Modals
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Load course details & learner progress strictly from DB
  const loadCourseAndProgress = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [courseRes, progRes] = await Promise.all([
        getCourseById(courseId),
        getLearnerCourseProgress(courseId),
      ]);

      if (courseRes?.success && courseRes.data) {
        const c = courseRes.data;
        setCourse(c);

        recordRecentCourseAccess(user?.username || "guest", {
          id: Number(c.id),
          title: c.title,
          category: c.category?.name || "General",
          thumbnail: c.thumbnail || undefined,
          level: c.level || undefined,
        });

        if (c.sections && c.sections.length > 0) {
          const expandedIds: number[] = [];
          const parsed: ModuleItem[] = c.sections.map((sec: any, sIdx: number) => {
            const mId = sec.id ? Number(sec.id) : sIdx + 1;
            expandedIds.push(mId);
            return {
              id: mId,
              title: sec.title || `Module ${sIdx + 1}`,
              completedCount: 0,
              totalCount: sec.contents?.length || 0,
              lessons: (sec.contents || []).map((cnt: any, cIdx: number) => ({
                id: Number(cnt.id || cIdx + 1),
                title: cnt.title || `Lesson ${sIdx + 1}.${cIdx + 1}`,
                contentType: cnt.contentType || "LESSON",
                description: cnt.description || "",
                contentUrl: cnt.contentUrl || "",
                quizConfigJson: cnt.quizConfigJson || "",
                assignmentConfigJson: cnt.assignmentConfigJson || "",
                isMandatory: Boolean(cnt.isMandatory),
                completed: false,
                active: sIdx === 0 && cIdx === 0,
              })),
            };
          });
          setModules(parsed);
          setExpandedModules(expandedIds);
          if (parsed[0]?.lessons[0]) {
            setSelectedLesson(parsed[0].lessons[0]);
          } else {
            setSelectedLesson(null);
          }
        } else {
          setModules([]);
          setSelectedLesson(null);
        }
      }

      if (progRes) {
        setProgressData(progRes);
        setCompletedLessonIds(progRes.completedLessonIds || []);
        setProgressPercent(Number(progRes.enrollment?.progress || 0));
        setInternalTimeSpentSeconds(progRes.enrollment?.timeSpentSeconds || 0);
      }
    } catch (err) {
      console.error("Failed to load course player:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseAndProgress();
  }, [courseId]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleToggleLessonComplete = async (lessonId: number) => {
    if (!courseId) return;
    const isCurrentlyCompleted = completedLessonIds.includes(lessonId);
    const newStatus = !isCurrentlyCompleted;

    if (newStatus) {
      setCompletedLessonIds((prev) => [...prev, lessonId]);
    } else {
      setCompletedLessonIds((prev) => prev.filter((id) => id !== lessonId));
    }

    try {
      const res = await updateLessonProgress(courseId, lessonId, newStatus, 5);
      if (res?.data?.calculatedProgress !== undefined) {
        setProgressPercent(Number(res.data.calculatedProgress));
      }
      if (res?.data?.issuedCert) {
        loadCourseAndProgress();
      }
    } catch (err) {
      console.error("Failed to update lesson completion:", err);
    }
  };

  // Direct External App Redirection Handler
  const handleOpenLessonContent = (lesson: LessonItem) => {
    if (requiresSelfEnrollment) {
      alert("Self-Enrollment Required — Please click 'Enroll Now' in the header to unlock lessons.");
      return;
    }

    setSelectedLesson(lesson);

    if (lesson.contentType === "QUIZ") {
      setIsQuizModalOpen(true);
    } else if (lesson.contentType === "ASSIGNMENT") {
      setIsAssignmentModalOpen(true);
    } else if (lesson.contentUrl && lesson.contentUrl.trim() !== "") {
      // Clean redirect to the external app / link
      window.open(lesson.contentUrl.trim(), "_blank", "noopener,noreferrer");
    }
  };

  const currentTitle = course?.title || "Course Experience";
  const selectedLessonId = selectedLesson?.id || 0;
  const isLessonCompleted = selectedLessonId ? completedLessonIds.includes(selectedLessonId) : false;
  const isCourseFullyCompleted = progressPercent >= 100 || Boolean(progressData?.certificate);

  const isSelfEnrollmentCourse = !course?.enrollmentType || course?.enrollmentType === "SELF";
  const requiresSelfEnrollment = isSelfEnrollmentCourse && !progressData?.enrollment;

  // Count quizzes and assignments in curriculum
  const totalQuizzesCount = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.contentType === "QUIZ").length,
    0
  );

  // Extract downloadable content URLs created by Admin
  const downloadableResources: { name: string; url: string }[] = [];
  modules.forEach((m) => {
    m.lessons.forEach((l) => {
      if (l.contentUrl && l.contentUrl.trim() !== "") {
        downloadableResources.push({
          name: `${l.title} Content Link`,
          url: l.contentUrl,
        });
      }
    });
  });

  // Check if learner has an assignment submission
  const latestSubmission = (progressData?.submissions || []).find(
    (s: any) => s.submissionType === "ASSIGNMENT"
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-card px-6 py-2.5 shadow-sm gap-3">
        <Link
          href="/courses"
          className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses Catalog
        </Link>

        {/* Progress Bar & Enrollment Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-muted-foreground">Course Progress:</span>
            <Progress value={progressPercent} className="h-2 w-32" />
            <span className="text-xs font-bold text-primary">{progressPercent}%</span>
          </div>

          {/* Self Enrollment Action */}
          {requiresSelfEnrollment && (
            <Button
              size="sm"
              onClick={async () => {
                if (!courseId) return;
                try {
                  await selfEnrollCourse(courseId);
                  await loadCourseAndProgress();
                } catch (err) {
                  console.error("Self enrollment error:", err);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow"
            >
              <Sparkles className="h-4 w-4" /> Enroll Now
            </Button>
          )}

          {/* Certificate Action */}
          {isCourseFullyCompleted && (
            <Button
              size="sm"
              onClick={() => setIsCertModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-1.5 shadow"
            >
              <Award className="h-4 w-4" /> Claim Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Dynamic Curriculum & Content Sections */}
        <div className="w-[340px] shrink-0 overflow-y-auto border-r border-border bg-card">
          <div className="px-5 py-4 border-b border-border space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Course Curriculum &amp; Contents
              </h3>
              {totalQuizzesCount > 0 && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    if (requiresSelfEnrollment) {
                      alert("Self-Enrollment Required — Please click 'Enroll Now' to take quizzes.");
                      return;
                    }
                    setIsQuizModalOpen(true);
                  }}
                  className="text-xs gap-1 text-indigo-600 border-indigo-500/30 font-semibold"
                >
                  <HelpCircle className="h-3.5 w-3.5" /> Take Quiz
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {modules.length} Modules • {completedLessonIds.length} Lessons Completed
            </p>
          </div>

          <div className="space-y-1 px-2 py-3">
            {modules.length === 0 ? (
              <div className="p-6 text-center space-y-2 border border-dashed border-border rounded-xl mx-2 my-4">
                <BookOpen className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-bold text-foreground">No Modules Published</p>
                <p className="text-[11px] text-muted-foreground">
                  The instructor has published this course overview.
                </p>
              </div>
            ) : (
              modules.map((module) => {
                const expanded = expandedModules.includes(module.id);
                return (
                  <div key={module.id} className="mb-1">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1 text-xs font-bold text-foreground truncate">
                        {module.title}
                      </span>
                    </button>

                    {expanded && (
                      <div className="ml-3 space-y-1 border-l border-border pl-3 mt-1">
                        {module.lessons.map((lesson) => {
                          const isDone = completedLessonIds.includes(lesson.id);
                          return (
                            <div
                              key={lesson.id}
                              className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all ${
                                lesson.id === selectedLessonId
                                  ? "bg-primary/10 font-bold text-primary border border-primary/20"
                                  : isDone
                                  ? "text-muted-foreground bg-muted/20"
                                  : "text-foreground/80 hover:bg-muted/40"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenLessonContent(lesson)}
                                className="flex items-center gap-2 text-left flex-1 truncate"
                              >
                                {requiresSelfEnrollment ? (
                                  <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                ) : isDone ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                ) : lesson.id === selectedLessonId ? (
                                  <Play className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                                )}

                                <div className="flex flex-col truncate">
                                  <span className="truncate text-xs flex items-center gap-1">
                                    {lesson.title}
                                    {lesson.contentUrl && (
                                      <ExternalLink className="h-3 w-3 text-primary shrink-0 inline ml-0.5" />
                                    )}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {lesson.contentType === "QUIZ" && (
                                      <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[9px] py-0 px-1 font-bold">
                                        Quiz Check
                                      </Badge>
                                    )}
                                    {lesson.contentType === "ASSIGNMENT" && (
                                      <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[9px] py-0 px-1 font-bold">
                                        Assignment
                                      </Badge>
                                    )}
                                    {lesson.isMandatory && (
                                      <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-[9px] py-0 px-1">
                                        Mandatory
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                title={isDone ? "Mark as Incomplete" : "Mark as Complete"}
                                onClick={() => handleToggleLessonComplete(lesson.id)}
                                className={`ml-2 p-1 rounded hover:bg-muted ${
                                  isDone ? "text-emerald-500" : "text-muted-foreground/40 hover:text-foreground"
                                }`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Content View Workspace */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-background">
          <div className="px-6 pt-5 pb-3 flex flex-wrap items-center justify-between border-b border-border gap-2">
            <div>
              <div className="flex items-center space-x-2 mb-0.5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  Active Unit: {selectedLesson?.contentType || "COURSE OVERVIEW"}
                </span>
                {selectedLesson?.contentType === "QUIZ" && (
                  <Badge className="bg-indigo-500/15 text-indigo-600 text-[10px]">Quiz Module</Badge>
                )}
                {selectedLesson?.contentType === "ASSIGNMENT" && (
                  <Badge className="bg-purple-500/15 text-purple-600 text-[10px]">Assignment Module</Badge>
                )}
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {selectedLesson?.title || course?.title || "Course Overview"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {selectedLesson?.contentType === "ASSIGNMENT" && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsAssignmentModalOpen(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  {latestSubmission ? "View Submitted Assignment" : "Submit Assignment"}
                </Button>
              )}
              {selectedLessonId > 0 && (
                <Button
                  size="sm"
                  variant={isLessonCompleted ? "outline" : "default"}
                  onClick={() => handleToggleLessonComplete(selectedLessonId)}
                  className="gap-1.5 font-bold text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {isLessonCompleted ? "Completed ✓" : "Mark Lesson Complete"}
                </Button>
              )}
            </div>
          </div>

          {/* Direct Redirection Launcher Display Area */}
          <div className="px-6 pt-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border border-border shadow-lg">
              {(course as any)?.thumbnail ? (
                <img
                  src={(course as any).thumbnail}
                  alt={currentTitle}
                  className="h-full w-full object-cover opacity-60"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 opacity-90" />
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                {requiresSelfEnrollment ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 max-w-md shadow-2xl">
                    <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                      <Lock className="h-8 w-8" />
                    </div>
                    <h3 className="text-base font-bold text-white">Self-Enrollment Required</h3>
                    <p className="text-xs text-white/80 leading-relaxed">
                      Enroll in this course to unlock video lessons, quizzes, assignments, and start learning.
                    </p>
                    <Button
                      onClick={async () => {
                        if (!courseId) return;
                        try {
                          await selfEnrollCourse(courseId);
                          await loadCourseAndProgress();
                        } catch (err) {
                          console.error("Self enrollment error:", err);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-xl gap-2 mt-1"
                    >
                      <Sparkles className="h-4 w-4" />
                      Enroll Now To Start Learning
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                      <Tv className="h-6 w-6 text-primary" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-white uppercase tracking-wider">{currentTitle}</p>
                        <p className="text-xs text-white/70">{selectedLesson?.title || "Course Overview"}</p>
                      </div>
                    </div>

                    {selectedLesson?.contentType === "ASSIGNMENT" ? (
                      <Button
                        onClick={() => {
                          setIsAssignmentModalOpen(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-3 rounded-full shadow-2xl"
                      >
                        Open Assignment Workspace →
                      </Button>
                    ) : selectedLesson?.contentType === "QUIZ" ? (
                      <Button
                        onClick={() => {
                          setIsQuizModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-full shadow-2xl"
                      >
                        Start Interactive Quiz →
                      </Button>
                    ) : selectedLesson?.contentUrl ? (
                      <a
                        href={selectedLesson.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <Button className="bg-primary text-primary-foreground font-bold text-xs px-6 py-3 rounded-full shadow-2xl gap-2 cursor-pointer hover:scale-105 transition-all">
                          <ExternalLink className="h-4 w-4" />
                          Open Content in External App ↗
                        </Button>
                      </a>
                    ) : (
                      <Button
                        disabled
                        className="bg-slate-800 text-slate-400 font-bold text-xs px-6 py-3 rounded-full shadow-2xl gap-2"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        No External Content Link Attached
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
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

          {/* Tab Content Area */}
          <div className="px-6 py-5 flex-1 space-y-4">
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Dynamic Metadata Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-card border border-border/80 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" /> Target Duration
                    </span>
                    <p className="text-sm font-bold text-foreground">{course?.duration || 5}.0 Hours</p>
                  </div>
                  <div className="p-3 bg-card border border-border/80 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3 text-emerald-500" /> Category
                    </span>
                    <p className="text-sm font-bold text-foreground">{course?.category?.name || "General"}</p>
                  </div>
                  <div className="p-3 bg-card border border-border/80 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-indigo-500" /> Department
                    </span>
                    <p className="text-sm font-bold text-foreground">{course?.department?.departmentName || "All Depts"}</p>
                  </div>
                  <div className="p-3 bg-card border border-border/80 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-purple-500" /> Total Curriculum
                    </span>
                    <p className="text-sm font-bold text-foreground">{modules.length} Modules • {totalQuizzesCount} Quizzes</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                    Course &amp; Lesson Description
                  </h4>
                  <div className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                    {selectedLesson?.description || course?.description || course?.shortDescription || "No detailed description provided by instructor."}
                  </div>
                </div>

                {/* Display Graded Assignment Results Banner if Available */}
                {latestSubmission && (
                  <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Assignment Submission Status</span>
                      <Badge variant="outline" className="bg-purple-600 text-white text-[10px]">
                        {latestSubmission.status}
                      </Badge>
                    </div>
                    {latestSubmission.status === "GRADED" && (
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-foreground">Score: {latestSubmission.score}/{latestSubmission.maxScore} ({latestSubmission.grade})</p>
                        {latestSubmission.feedback && (
                          <p className="text-muted-foreground italic">Teacher Feedback: &quot;{latestSubmission.feedback}&quot;</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Resources Tab */}
            {activeTab === "resources" && (
              <div className="space-y-2">
                {downloadableResources.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-border rounded-xl bg-card/50">
                    <FileText className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-bold text-foreground">No External Content Links Attached</p>
                    <p className="text-[11px] text-muted-foreground">
                      The instructor has not attached external resource URLs for this course.
                    </p>
                  </div>
                ) : (
                  downloadableResources.map((res, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-bold text-foreground">{res.name}</p>
                          <p className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono inline-block mt-0.5">
                            {res.url}
                          </p>
                        </div>
                      </div>
                      <a href={res.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary font-semibold">
                          <ExternalLink className="h-4 w-4" /> Open External Link ↗
                        </Button>
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <textarea
                placeholder={`Personal notes for ${selectedLesson?.title || "Lesson"}...`}
                className="min-h-[120px] w-full rounded-xl border border-border bg-card p-4 text-xs resize-none focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Interactive Quiz Modal */}
      {courseId && (
        <LearnerQuizModal
          open={isQuizModalOpen}
          courseId={courseId}
          contentId={selectedLesson?.id}
          quizTitle={selectedLesson?.title || "Module Quiz Check"}
          onClose={() => setIsQuizModalOpen(false)}
          onSuccess={() => loadCourseAndProgress()}
        />
      )}

      {/* Interactive Assignment Modal */}
      {courseId && (
        <LearnerAssignmentModal
          open={isAssignmentModalOpen}
          courseId={courseId}
          contentId={selectedLesson?.id}
          assignmentTitle={selectedLesson?.title || "Module Practical Assignment"}
          instructions={selectedLesson?.description || "Complete the practical assignment instructions."}
          existingSubmission={latestSubmission}
          onClose={() => setIsAssignmentModalOpen(false)}
          onSuccess={() => loadCourseAndProgress()}
        />
      )}

      {/* Download Certificate Modal */}
      {progressData?.certificate && (
        <LearnerCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          certificate={{
            id: Number(progressData.certificate.id || 1),
            certificateCode: progressData.certificate.certificateCode,
            userId: Number(progressData.enrollment.userId),
            courseId: Number(courseId || 1),
            issuedAt: progressData.certificate.issuedAt,
            recipientName: progressData.certificate.recipientName,
            courseTitle: progressData.certificate.courseTitle,
          }}
        />
      )}
    </div>
  );
}
