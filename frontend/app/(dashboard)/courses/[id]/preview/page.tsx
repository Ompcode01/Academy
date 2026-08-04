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
import LearnerCertificateModal from "@/components/certificates/LearnerCertificateModal";

interface LessonItem {
  id: number;
  title: string;
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
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "notes">("overview");

  // Progress & Time tracking
  const [progressData, setProgressData] = useState<LearnerProgressData | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [selectedLessonId, setSelectedLessonId] = useState<number>(1);
  const [selectedLessonTitle, setSelectedLessonTitle] = useState("1.1 Overview & Introduction");

  // Modals
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Load course details & learner progress
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

        // Record dynamically in recently accessed list for current user
        recordRecentCourseAccess(user?.username || "guest", {
          id: Number(c.id),
          title: c.title,
          category: c.category?.name || "General",
          thumbnail: c.thumbnail || undefined,
          level: c.level || undefined,
        });

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
            setSelectedLessonId(parsed[0].lessons[0].id);
            setSelectedLessonTitle(parsed[0].lessons[0].title);
          }
        }
      }

      if (progRes) {
        setProgressData(progRes);
        setCompletedLessonIds(progRes.completedLessonIds || []);
        setProgressPercent(Number(progRes.enrollment?.progress || 0));
        setTimeSpentSeconds(progRes.enrollment?.timeSpentSeconds || 0);
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

  // Live timer for time spent tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync elapsed time to backend every 30 seconds
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (courseId && selectedLessonId) {
        updateLessonProgress(courseId, selectedLessonId, completedLessonIds.includes(selectedLessonId), 30);
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [courseId, selectedLessonId, completedLessonIds]);

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

    // Optimistic UI update
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

  const formatTimeSpent = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const currentTitle = course?.title || "Course Experience";
  const isLessonCompleted = completedLessonIds.includes(selectedLessonId);
  const isCourseFullyCompleted = progressPercent >= 100 || Boolean(progressData?.certificate);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shadow-sm">
        <Link
          href="/courses"
          className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses Catalog
        </Link>

        {/* Live Course Progress & Time Spent */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span>Time Spent: <strong className="text-foreground">{formatTimeSpent(timeSpentSeconds)}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">Progress:</span>
            <Progress value={progressPercent} className="h-2 w-28" />
            <span className="text-xs font-bold text-primary">{progressPercent}%</span>
          </div>

          {/* Self Enrollment Action if not enrolled */}
          {!progressData?.enrollment && (
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
              <CheckCircle2 className="h-4 w-4" /> Enroll Now
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Course Content Sidebar */}
        <div className="w-[320px] shrink-0 overflow-y-auto border-r border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Curriculum Content
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {modules.length} Modules • {completedLessonIds.length} Completed
              </p>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setIsQuizModalOpen(true)}
              className="text-xs gap-1 text-indigo-600 border-indigo-500/30"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Take Quiz
            </Button>
          </div>

          <div className="space-y-0.5 px-2 py-3">
            {modules.length === 0 ? (
              <div className="p-5 text-center space-y-2">
                <BookOpen className="h-6 w-6 text-muted-foreground/50 mx-auto" />
                <p className="text-xs font-bold text-foreground">No Modules Published</p>
                <p className="text-[11px] text-muted-foreground">
                  The instructor has published this course overview.
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
                      <span className="flex-1 text-xs font-bold text-foreground truncate">
                        {module.title}
                      </span>
                    </button>

                    {expanded && (
                      <div className="ml-3 space-y-0.5 border-l border-border pl-3">
                        {module.lessons.map((lesson) => {
                          const isDone = completedLessonIds.includes(lesson.id);
                          return (
                            <div
                              key={lesson.id}
                              className={`flex items-center justify-between rounded-md px-3 py-2 text-xs transition-all ${
                                lesson.id === selectedLessonId
                                  ? "bg-primary/10 font-bold text-primary"
                                  : isDone
                                  ? "text-muted-foreground"
                                  : "text-foreground/70 hover:bg-muted/40"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLessonId(lesson.id);
                                  setSelectedLessonTitle(lesson.title);
                                }}
                                className="flex items-center gap-2 text-left flex-1 truncate"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                ) : lesson.id === selectedLessonId ? (
                                  <Play className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                                )}
                                <span className="truncate">{lesson.title}</span>
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

        {/* Center: Lecture Display + Interactive Controls */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-background">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-border">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-0.5">
                Active Lecture Unit
              </span>
              <h2 className="text-lg font-bold text-foreground">
                {selectedLessonTitle}
              </h2>
            </div>
            <Button
              size="sm"
              variant={isLessonCompleted ? "outline" : "default"}
              onClick={() => handleToggleLessonComplete(selectedLessonId)}
              className="gap-1.5 font-bold text-xs"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {isLessonCompleted ? "Completed ✓" : "Mark Lesson Complete"}
            </Button>
          </div>

          {/* Player Box */}
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
              </div>

              <div className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2.5 py-1 text-xs font-mono text-white backdrop-blur-sm flex items-center gap-1">
                <Clock className="h-3 w-3 text-indigo-400" />
                <span>Elapsed: {formatTimeSpent(timeSpentSeconds)}</span>
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
                  {course?.description || course?.shortDescription || `Master the principles of ${currentTitle}. This course provides structured modules, practical scenario exercises, and comprehensive evaluations.`}
                </p>
              </div>
            )}
            {activeTab === "resources" && (
              <div className="space-y-2">
                {[
                  { name: `${currentTitle} Lecture Slides (PDF)`, size: "2.4 MB" },
                  { name: `${currentTitle} Quick Reference Guide`, size: "1.1 MB" },
                ].map((resource) => (
                  <div
                    key={resource.name}
                    className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs font-bold text-foreground">{resource.name}</p>
                        <p className="text-[10px] text-muted-foreground">{resource.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "notes" && (
              <textarea
                placeholder={`Personal notes for ${selectedLessonTitle}...`}
                className="min-h-[100px] w-full rounded-xl border border-border bg-card p-4 text-xs resize-none focus:outline-none"
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
          onClose={() => setIsQuizModalOpen(false)}
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
