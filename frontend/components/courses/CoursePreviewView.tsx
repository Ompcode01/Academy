"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  BookOpen,
  Award,
  Clock,
  HelpCircle,
  Sparkles,
  Lock,
  Building2,
  FileCheck2,
  ExternalLink,
  Paperclip,
  Download,
  Tv,
  Layers,
  User,
  ShieldCheck,
  Check,
  RefreshCw,
  Archive,
} from "lucide-react";
import { getCourseById, selfEnrollCourse, type Course, getStorageUrl } from "@/services/api/course.service";
import {
  getLearnerCourseProgress,
  updateLessonProgress,
  recordQuizSubmission,
  submitAssignment,
  LearnerProgressData,
} from "@/services/api/progress.service";
import { useAuthStore } from "@/store/auth.store";
import { recordRecentCourseAccess } from "@/services/api/recentAccess.service";
import LearnerQuizModal from "@/components/courses/learner/LearnerQuizModal";
import LearnerAssignmentModal from "@/components/courses/learner/LearnerAssignmentModal";
import LearnerCertificateModal from "@/components/certificates/LearnerCertificateModal";
import InteractiveDocViewer from "@/components/courses/player/InteractiveDocViewer";
import InlineQuizPlayer from "@/components/courses/player/InlineQuizPlayer";
import InlineAssignmentPlayer from "@/components/courses/player/InlineAssignmentPlayer";
import LearnerFeedbackModal from "@/components/courses/learner/LearnerFeedbackModal";
import ScormPlayer from "@/components/courses/player/ScormPlayer";
import { MessageSquare } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/lib/utils";

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

export default function CoursePreviewView() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params?.id ? Number(params.id) : null;
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  
  // View mode: "overview" (Course Landing Page) vs "player" (Udemy Course Player)
  const [viewMode, setViewMode] = useState<"overview" | "player">("overview");

  // Player active tabs
  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "notes" | "submissions">("overview");

  // Progress & Time tracking
  const [progressData, setProgressData] = useState<LearnerProgressData | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);

  // Modals
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Guest restriction modal
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestModalLessonTitle, setGuestModalLessonTitle] = useState<string | null>(null);

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
          // Ensure Course Feedback survey item is present
          const hasFeedbackLesson = parsed.some((m) => m.lessons.some((l) => l.contentType?.toUpperCase() === "FEEDBACK"));
          if (!hasFeedbackLesson) {
            const fbModule: ModuleItem = {
              id: 999999,
              title: "Course Feedback & Evaluation",
              completedCount: 0,
              totalCount: 1,
              lessons: [
                {
                  id: 999999,
                  title: "End-of-Course Feedback Survey",
                  contentType: "FEEDBACK",
                  description: "Please share your review regarding course structure, content clarity, and instructor support.",
                  completed: false,
                },
              ],
            };
            parsed.push(fbModule);
            expandedIds.push(999999);
          }

          setModules(parsed);
          setExpandedModules(expandedIds);

          // If contentId or sectionId query param exists (e.g. from Global Search navigation)
          const targetContentParam = searchParams?.get("contentId");
          const targetSectionParam = searchParams?.get("sectionId");
          const targetContentId = targetContentParam ? Number(targetContentParam) : null;
          const targetSectionId = targetSectionParam ? Number(targetSectionParam) : null;

          let targetLesson: LessonItem | null = null;
          if (targetContentId) {
            for (const m of parsed) {
              const match = m.lessons.find((l) => Number(l.id) === targetContentId);
              if (match) {
                targetLesson = match;
                break;
              }
            }
          } else if (targetSectionId) {
            const targetMod = parsed.find((m) => Number(m.id) === targetSectionId);
            if (targetMod && targetMod.lessons[0]) {
              targetLesson = targetMod.lessons[0];
            }
          }

          if (targetLesson) {
            setSelectedLesson(targetLesson);
            setViewMode("player");
          } else if (parsed[0]?.lessons[0]) {
            setSelectedLesson(parsed[0].lessons[0]);
          } else {
            setSelectedLesson(null);
          }
        } else {
          const defaultFbModule: ModuleItem = {
            id: 999999,
            title: "Course Feedback & Evaluation",
            completedCount: 0,
            totalCount: 1,
            lessons: [
              {
                id: 999999,
                title: "End-of-Course Feedback Survey",
                contentType: "FEEDBACK",
                description: "Please share your review regarding course structure, content clarity, and instructor support.",
                completed: false,
              },
            ],
          };
          setModules([defaultFbModule]);
          setExpandedModules([999999]);
          setSelectedLesson(defaultFbModule.lessons[0]);
        }
      }

      if (progRes) {
        setProgressData(progRes);
        setCompletedLessonIds(progRes.completedLessonIds || []);
        setProgressPercent(Number(progRes.enrollment?.progress || 0));
      }
    } catch (err) {
      console.error("Failed to load course details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseAndProgress();
  }, [courseId]);

  // Active player time-spent heartbeat (pings backend every 15s to increment timeSpentSeconds in DB)
  useEffect(() => {
    if (viewMode !== "player" || !courseId || !selectedLesson) return;

    const interval = setInterval(() => {
      updateLessonProgress(courseId, selectedLesson.id, false, 15).catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, [viewMode, courseId, selectedLesson]);

  // Handle explicit self enrollment
  const handleEnrollNow = async () => {
    if (isGuest) {
      setGuestModalLessonTitle(null);
      setIsGuestModalOpen(true);
      return;
    }
    if (!courseId || enrolling) return;
    setEnrolling(true);
    try {
      await selfEnrollCourse(courseId);
      await loadCourseAndProgress();
      setViewMode("player");
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to enroll in course");
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleToggleLessonComplete = async (lessonId: number) => {
    if (isGuest) {
      setGuestModalLessonTitle(null);
      setIsGuestModalOpen(true);
      return;
    }
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

  const handleMarkModuleComplete = async (module: ModuleItem) => {
    if (isGuest) {
      setGuestModalLessonTitle(null);
      setIsGuestModalOpen(true);
      return;
    }
    if (!courseId || module.lessons.length === 0) return;

    const uncompletedLessons = module.lessons.filter(
      (l) => !completedLessonIds.includes(l.id)
    );

    if (uncompletedLessons.length === 0) {
      const lessonIds = module.lessons.map((l) => l.id);
      setCompletedLessonIds((prev) => prev.filter((id) => !lessonIds.includes(id)));
      for (const les of module.lessons) {
        await updateLessonProgress(courseId, les.id, false, 2).catch(() => {});
      }
    } else {
      const newIds = uncompletedLessons.map((l) => l.id);
      setCompletedLessonIds((prev) => Array.from(new Set([...prev, ...newIds])));
      for (const les of uncompletedLessons) {
        await updateLessonProgress(courseId, les.id, true, 5).catch(() => {});
      }
    }
    await loadCourseAndProgress();
  };

  const handleCertificateClick = () => {
    if (isGuest) {
      setGuestModalLessonTitle(null);
      setIsGuestModalOpen(true);
      return;
    }
    if (!isCourseFullyCompleted) {
      alert(
        `Certificate Locked (${computedProgressPercent}% Completed) — Please complete 100% of all course sections and lessons to unlock your official certificate.`
      );
      return;
    }
    setIsCertModalOpen(true);
  };

  const handleOpenLessonContent = (lesson: LessonItem) => {
    if (isGuest) {
      setGuestModalLessonTitle(lesson.title);
      setIsGuestModalOpen(true);
      return;
    }
    if (requiresSelfEnrollment) {
      alert("Self-Enrollment Required — Please click 'Enroll Now' on the course overview page to unlock lessons.");
      return;
    }

    setSelectedLesson(lesson);

    // Auto-mark lesson as completed upon viewing/watching content
    if (!completedLessonIds.includes(lesson.id)) {
      handleToggleLessonComplete(lesson.id);
    }
  };

  // Helper variables & computed metrics
  const isEnrolled = Boolean(progressData?.enrollment);
  const isSelfEnrollmentCourse = !course?.enrollmentType || course?.enrollmentType === "SELF";
  const isRestrictedEnrollment = course?.enrollmentType === "ADMIN_ASSIGNED" || course?.enrollmentType === "MANUAL";
  const requiresSelfEnrollment = !loading && !isEnrolled && isSelfEnrollmentCourse;
  const requiresAdminEnrollment = !loading && !isEnrolled && isRestrictedEnrollment;

  // Dynamic counts computed from actual curriculum data
  const totalSectionsCount = modules.length;
  const totalContentsCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalQuizzesCount = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.contentType === "QUIZ").length,
    0
  );
  const totalAssignmentsCount = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.contentType === "ASSIGNMENT").length,
    0
  );

  const latestSubmission = (progressData?.submissions || []).find(
    (s: any) => s.submissionType === "ASSIGNMENT"
  );

  const creatorName =
    (course as any)?.creator
      ? `${(course as any).creator.firstName} ${(course as any).creator.lastName}`
      : "Admin / Super Admin";

  const instructorName =
    (course as any)?.teachers?.[0]?.teacher
      ? `${(course as any).teachers[0].teacher.firstName} ${(course as any).teachers[0].teacher.lastName}`
      : creatorName;

  // Calculate positive total duration
  const totalContentMinutes = modules.reduce((acc, m) => {
    return acc + m.lessons.length * 15;
  }, 0);
  const rawDuration = course?.duration ? Math.abs(course.duration) : 0;
  const calculatedHours = totalContentMinutes > 0 ? Math.ceil(totalContentMinutes / 60) : 0;
  const displayDurationHours = Math.max(1, rawDuration > 0 ? rawDuration : calculatedHours || 10);

  const departmentLabel =
    (course as any)?.department?.departmentName ||
    ({ 1: "Engineering (ENG)", 2: "Human Resources (HR)", 3: "Management (MGT)" }[Number((course as any)?.departmentId)] || "Global Organizational Audience");

  const categoryLabel = course?.category?.name || "Technical";

  // Flat list of lessons for Next/Prev player navigation
  const allLessonsFlat: LessonItem[] = modules.flatMap((m) => m.lessons);
  const currentLessonIndex = allLessonsFlat.findIndex((l) => l.id === selectedLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? allLessonsFlat[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessonsFlat.length - 1 ? allLessonsFlat[currentLessonIndex + 1] : null;

  const isSelectedLessonCompleted = selectedLesson ? completedLessonIds.includes(selectedLesson.id) : false;
  const computedProgressPercent = totalContentsCount > 0
    ? Math.min(100, Math.round((completedLessonIds.length / totalContentsCount) * 100))
    : progressPercent;
  const isCourseFullyCompleted = computedProgressPercent >= 100 || Boolean(progressData?.certificate);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-3 text-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Loading course curriculum &amp; progress...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-xl font-bold text-foreground">Course Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested course could not be located or has been archived.</p>
        <Link href="/courses">
          <Button variant="outline" size="sm">&larr; Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER VIEW 1: COURSE LANDING PAGE / OVERVIEW (UDEMY STYLE)
  // ═══════════════════════════════════════════════════════════════════════════
  if (viewMode === "overview") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground pb-12 select-none">
        {/* Header Breadcrumb */}
        <div className="border-b border-border bg-background px-6 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/courses">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
              </Button>
            </Link>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span>{categoryLabel}</span>
              <span>&rsaquo;</span>
              <span className="text-foreground truncate max-w-xs">{course.title}</span>
            </div>
          </div>

          {isEnrolled && (
            <Button
              onClick={() => setViewMode("player")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Go to Course Player
            </Button>
          )}
        </div>

        {/* Hero Banner Section */}
        <div className="bg-slate-900 text-white px-6 py-10 border-b border-slate-800">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Columns: Course Hero Details */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#C82333] text-white font-bold text-[10px] uppercase tracking-wider">
                  Code: {course.code || `CO${course.id}`}
                </Badge>
                <Badge className="bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wider">
                  {categoryLabel}
                </Badge>
                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 text-[10px] font-semibold">
                  Level: {course.level || "Beginner"}
                </Badge>
                {(course as any)?.isMandatory && (
                  <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px]">
                    Mandatory Program
                  </Badge>
                )}
                <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                  Status: {course.status || "Published"}
                </Badge>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-white">
                {course.title}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {course.shortDescription || course.description || "Master core domain skills and practical workflows in this structured training curriculum."}
              </p>

              {/* Instructor & Meta Details Row */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Created by <strong className="text-white font-semibold">{course.creatorInfo?.creatorName || creatorName}</strong>
                    <span className={`ml-1.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded border uppercase ${
                      course.creatorInfo?.creatorRole === "SUPER_ADMIN"
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    }`}>
                      {course.creatorInfo?.creatorRole === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Business Unit: <strong className="text-white font-semibold">{course.creatorInfo?.creatorDepartment || departmentLabel}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{displayDurationHours} Hours Duration</span>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Action Card */}
            <div className="bg-background dark:bg-slate-900 border border-border rounded-2xl shadow-xl overflow-hidden text-foreground">
              {/* Media Thumbnail */}
              <div className="h-44 w-full relative bg-slate-950">
                <img
                  src={course.thumbnail || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80"}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                    <Tv className="h-4 w-4 text-primary" /> Self-Paced Interactive Player
                  </span>
                </div>
              </div>

              {/* Action Button & Enrolment Logic */}
              <div className="p-5 space-y-4">
                {isGuest ? (
                  <div className="space-y-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Guest Preview Mode</span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      You are exploring the course curriculum in read-only mode. Video content, quizzes, assignments, and certificates are locked.
                    </p>
                    <Button
                      onClick={() => router.push("/login")}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold h-10 text-xs shadow-md cursor-pointer"
                    >
                      Sign In as Learner to Enroll
                    </Button>
                  </div>
                ) : isEnrolled ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => setViewMode("player")}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold h-11 text-sm gap-2 shadow-lg"
                    >
                      <Play className="h-4 w-4 fill-current" /> Continue Learning
                    </Button>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Your Progress</span>
                        <span className="text-primary font-bold">{computedProgressPercent}%</span>
                      </div>
                      <Progress value={computedProgressPercent} className="h-2 bg-muted" />
                    </div>
                  </div>
                ) : requiresSelfEnrollment ? (
                  <div className="space-y-2">
                    <Button
                      onClick={handleEnrollNow}
                      disabled={enrolling}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-11 text-sm gap-2 shadow-lg"
                    >
                      {enrolling ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" /> Enrolling...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Enroll Now (Free)
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground">
                      Self-enrolment enabled. Instant access to full course player.
                    </p>
                  </div>
                ) : requiresAdminEnrollment ? (
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Admin Enrolment Required</span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      Self-enrolment is restricted by administrator. Contact your manager or HR to receive access.
                    </p>
                  </div>
                ) : null}

                {/* Dynamic Curriculum Metrics */}
                <div className="pt-3 border-t border-border space-y-2.5 text-xs text-muted-foreground">
                  <div className="font-bold text-foreground text-xs">This course includes:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      <span><strong>{totalSectionsCount}</strong> Sections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-blue-500" />
                      <span><strong>{totalContentsCount}</strong> Lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span><strong>{totalQuizzesCount}</strong> Quizzes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-3.5 w-3.5 text-purple-500" />
                      <span><strong>{totalAssignmentsCount}</strong> Assignments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Details Body */}
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Tabs & Curriculum Breakdown */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Course Identity & Classification Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  1. Course Identity &amp; Classification
                </h3>
                <Badge className="bg-[#C82333] text-white font-bold text-xs">
                  Code: {course.code || `CO${course.id}`}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-muted/20 rounded-xl border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Course Name</span>
                  <span className="font-extrabold text-foreground block truncate">{course.title}</span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Course Code</span>
                  <span className="font-extrabold text-primary block">{course.code || `CO${course.id}`}</span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Business Unit</span>
                  <span className="font-extrabold text-foreground block">{departmentLabel}</span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Category</span>
                  <span className="font-extrabold text-foreground block">{categoryLabel}</span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Difficulty Level</span>
                  <span className="font-extrabold text-amber-500 block">{course.level || "Beginner"}</span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Estimated Duration</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">{displayDurationHours} Hours</span>
                </div>
              </div>
            </div>

            {/* 2. Course Summary & Learning Objectives Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <FileText className="h-5 w-5 text-primary" />
                2. Course Summary &amp; Learning Objectives
              </h3>

              {/* Short Description */}
              <div className="space-y-1.5 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-200">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                  Short Description
                </span>
                <p className="text-xs leading-relaxed font-medium">
                  {course.shortDescription || "No short description provided for this course."}
                </p>
              </div>

              {/* Detailed Description / Learning Objectives */}
              <div className="space-y-1.5 p-4 rounded-xl bg-muted/30 border border-border text-foreground">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Detailed Description / Learning Objectives
                </span>
                <p className="text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
                  {course.description || "No detailed description provided for this course."}
                </p>
              </div>
            </div>

            {/* Curriculum Structure (Section Accordions) */}
            <div className="bg-background rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" /> Course Content / Curriculum
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {totalSectionsCount} sections • {totalContentsCount} items • {course.duration || 15} total hours
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {modules.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                    No curriculum modules configured yet.
                  </div>
                ) : (
                  modules.map((module, idx) => (
                    <div key={module.id} className="border border-border rounded-xl overflow-hidden bg-card">
                      <div
                        onClick={() => toggleModule(module.id)}
                        className="px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                          {expandedModules.includes(module.id) ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>Module {idx + 1}: {module.title}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {module.lessons.length} lessons
                        </span>
                      </div>

                      {expandedModules.includes(module.id) && (
                        <div className="divide-y divide-border">
                          {module.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-muted/20 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                {!isEnrolled ? (
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleLessonComplete(lesson.id);
                                    }}
                                    className="p-0.5 rounded-full hover:bg-muted/80 transition-transform cursor-pointer shrink-0"
                                    title={completedLessonIds.includes(lesson.id) ? "Click to mark as uncompleted" : "Click to mark as completed"}
                                  >
                                    {completedLessonIds.includes(lesson.id) ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 hover:scale-110 transition-transform" />
                                    ) : (
                                      <Circle className="h-3.5 w-3.5 text-muted-foreground hover:text-emerald-500 hover:scale-110 transition-transform" />
                                    )}
                                  </button>
                                )}
                                <span className="font-medium text-foreground">{lesson.title}</span>
                                {lesson.contentType === "QUIZ" && (
                                  <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px]">Quiz</Badge>
                                )}
                                {lesson.contentType === "ASSIGNMENT" && (
                                  <Badge className="bg-purple-500/10 text-purple-600 border border-purple-500/20 text-[9px]">Assignment</Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">15 mins</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Instructor & Requirements Card */}
          <div className="space-y-6">
            <div className="bg-background rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Instructor Information
              </h3>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  {instructorName[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{instructorName}</h4>
                  <p className="text-[11px] text-muted-foreground">Certified Course Faculty</p>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-2xl border border-border p-6 shadow-sm space-y-3 text-xs">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Course Requirements
              </h3>
              <ul className="space-y-2 text-muted-foreground text-[11px]">
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Internet access &amp; modern browser required</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Assigned for <strong>{departmentLabel}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Complete mandatory quizzes &amp; assignments to receive certificate</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER VIEW 2: UDEMY-STYLE COURSE PLAYER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col select-none">
      {/* 1. Player Top Header */}
      <header className="h-14 border-b border-border bg-card/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setViewMode("overview")}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted text-xs gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Overview
          </Button>
          <span className="text-muted-foreground">|</span>
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span className="text-muted-foreground truncate max-w-xs">{course.title}</span>
            {selectedLesson && (
              <>
                <span>&rsaquo;</span>
                <span className="text-foreground font-bold truncate max-w-xs">{selectedLesson.title}</span>
              </>
            )}
          </div>
        </div>

        {/* Header Progress & Certificate Action */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Overall Progress</div>
              <div className="text-xs font-extrabold text-foreground">{computedProgressPercent}% Completed</div>
            </div>
            <div className="w-24 bg-muted h-2 rounded-full overflow-hidden border border-border">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${computedProgressPercent}%` }} />
            </div>
          </div>

          <Button
            onClick={handleCertificateClick}
            size="sm"
            className={
              isCourseFullyCompleted
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-1.5 shadow animate-pulse"
                : "bg-muted border border-border text-foreground hover:bg-accent text-xs gap-1.5 cursor-pointer"
            }
          >
            <Award className={isCourseFullyCompleted ? "h-4 w-4 text-slate-950" : "h-4 w-4 text-amber-500"} />
            {isCourseFullyCompleted ? "Claim Certificate" : "Certificate (Locked)"}
          </Button>
        </div>
      </header>

      {/* 2. Main Player Body (Sidebar + Content Viewport) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left / Center Viewport */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-background">
          
          {/* Main Content Player Card */}
          <div className="p-6 max-w-5xl mx-auto w-full space-y-6 flex-1">
            
            {selectedLesson ? (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                
                {/* Content Header Title & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary/20 text-primary border border-primary/30 font-bold text-[10px]">
                        {selectedLesson.contentType}
                      </Badge>
                      {selectedLesson.isMandatory && (
                        <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px]">
                          Mandatory
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{selectedLesson.title}</h2>
                  </div>

                  {/* Mark as Complete Toggle */}
                  <Button
                    onClick={() => handleToggleLessonComplete(selectedLesson.id)}
                    variant={isSelectedLessonCompleted ? "outline" : "default"}
                    className={
                      isSelectedLessonCompleted
                        ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 font-bold text-xs gap-2"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2"
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isSelectedLessonCompleted ? "Completed" : "Mark as Completed"}
                  </Button>
                </div>

                {/* Lesson Media / Viewport Handler */}
                {selectedLesson.contentType?.toUpperCase() === "QUIZ" ? (
                  (() => {
                    const quizSubmissions = (progressData?.submissions || []).filter(
                      (s: any) =>
                        (s.submissionType === "QUIZ" || s.type === "QUIZ") &&
                        (!s.contentId || !selectedLesson.id || String(s.contentId) === String(selectedLesson.id) || String(s.contentItem?.id) === String(selectedLesson.id))
                    );
                    const lastQuizSubmission = quizSubmissions.length > 0 ? quizSubmissions[quizSubmissions.length - 1] : null;

                    return (
                      <InlineQuizPlayer
                        quizTitle={selectedLesson.title}
                        configJson={selectedLesson.quizConfigJson || (selectedLesson as any).configJson}
                        attemptNumber={quizSubmissions.length > 0 ? quizSubmissions.length : 1}
                        existingSubmission={lastQuizSubmission}
                        onComplete={(score: number, maxScore: number, answersJson?: string) => {
                          if (courseId) {
                            recordQuizSubmission(courseId, selectedLesson.id, score, maxScore, answersJson).catch(console.error);
                          }
                          handleToggleLessonComplete(selectedLesson.id);
                        }}
                        onSkip={() => {
                          if (nextLesson) handleOpenLessonContent(nextLesson);
                        }}
                        onNextLesson={() => {
                          if (nextLesson) handleOpenLessonContent(nextLesson);
                        }}
                      />
                    );
                  })()
                ) : selectedLesson.contentType?.toUpperCase() === "ASSIGNMENT" ? (
                  (() => {
                    const lessonAssignmentSubmission = (progressData?.submissions || []).find(
                      (s: any) =>
                        (String(s.contentId) === String(selectedLesson.id) || String(s.contentItem?.id) === String(selectedLesson.id)) &&
                        (s.submissionType === "ASSIGNMENT" || s.type === "ASSIGNMENT")
                    ) || null;

                    return (
                      <InlineAssignmentPlayer
                        assignmentTitle={selectedLesson.title}
                        contentUrl={selectedLesson.contentUrl}
                        description={selectedLesson.description}
                        configJson={selectedLesson.assignmentConfigJson || (selectedLesson as any).configJson}
                        existingSubmission={lessonAssignmentSubmission}
                        onComplete={(submissionText: string, fileUrl?: string) => {
                          if (courseId) {
                            submitAssignment(courseId, { contentId: selectedLesson.id, submissionText, fileUrl }).catch(console.error);
                          }
                          handleToggleLessonComplete(selectedLesson.id);
                        }}
                        onNextLesson={() => {
                          if (nextLesson) handleOpenLessonContent(nextLesson);
                        }}
                      />
                    );
                  })()
                ) : selectedLesson.contentType?.toUpperCase() === "FEEDBACK" || selectedLesson.contentType?.toUpperCase() === "FEEDBACK_SURVEY" || selectedLesson.contentType?.toUpperCase() === "SURVEY" ? (
                  <div className="p-6 bg-card border border-amber-500/30 rounded-2xl space-y-5 shadow-md">
                    <div className="flex items-center gap-3 border-b border-border pb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{selectedLesson.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedLesson.description || "Please share your evaluation regarding course content, practical exercises, and instructor support."}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Inline Survey Form */}
                    {(() => {
                      let authorQuestions: any[] | null = null;
                      try {
                        const raw = selectedLesson.quizConfigJson || (selectedLesson as any).configJson;
                        if (raw) {
                          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                          if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                            authorQuestions = parsed.questions;
                          }
                        }
                      } catch {}

                      const questionsToRender = authorQuestions || [
                        {
                          id: 1,
                          questionText: "How satisfied are you with the overall course content and lesson structure?",
                          questionType: "MCQ",
                          options: ["5 - Excellent", "4 - Very Good", "3 - Satisfactory", "2 - Needs Improvement", "1 - Poor"],
                          isMandatory: true,
                        },
                        {
                          id: 2,
                          questionText: "How effective were the practical exercises, quizzes, and learning materials?",
                          questionType: "MCQ",
                          options: ["Extremely Helpful", "Moderately Helpful", "Neutral", "Not Helpful"],
                          isMandatory: true,
                        },
                        {
                          id: 3,
                          questionText: "How clear and helpful were the instructor's explanations?",
                          questionType: "MCQ",
                          options: ["Very Clear", "Somewhat Clear", "Unclear"],
                          isMandatory: true,
                        },
                        {
                          id: 4,
                          questionText: "What key improvements or additional topics would you suggest for this course?",
                          questionType: "WRITTEN",
                          isMandatory: false,
                        },
                      ];

                      return (
                        <div className="space-y-4">
                          {questionsToRender.map((q: any, qIdx: number) => {
                            const ansKey = `_fb_ans_${q.id || qIdx}`;
                            const currentAns = (selectedLesson as any)[ansKey] || "";
                            const opts: string[] = q.options && Array.isArray(q.options) && q.options.length > 0
                              ? q.options
                              : q.questionType === "MCQ"
                              ? ["Excellent", "Good", "Average", "Needs Improvement"]
                              : [];

                            return (
                              <div key={q.id || qIdx} className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-2">
                                <label className="text-xs font-bold text-foreground block">
                                  {qIdx + 1}. {q.questionText} {q.isMandatory && <span className="text-rose-500">*</span>}
                                </label>

                                {q.questionType === "WRITTEN" || opts.length === 0 ? (
                                  <textarea
                                    rows={3}
                                    placeholder="Share your detailed feedback response..."
                                    value={currentAns}
                                    onChange={(e) => {
                                      (selectedLesson as any)[ansKey] = e.target.value;
                                      setCourse((prev) => (prev ? { ...prev } : prev));
                                    }}
                                    className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                  />
                                ) : (
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {opts.map((opt: string) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                          (selectedLesson as any)[ansKey] = opt;
                                          setCourse((prev) => (prev ? { ...prev } : prev));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                          currentAns === opt
                                            ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-sm"
                                            : "bg-background border-border text-foreground hover:bg-muted"
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Submit Feedback Button */}
                          <div className="pt-2 flex items-center justify-between">
                            <Button
                              type="button"
                              onClick={async () => {
                                const responseMap: Record<string, string> = {};
                                for (let i = 0; i < questionsToRender.length; i++) {
                                  const q = questionsToRender[i];
                                  const ansKey = `_fb_ans_${q.id || i}`;
                                  const val = (selectedLesson as any)[ansKey] || "";
                                  if (q.isMandatory && !val.trim()) {
                                    alert(`Please answer mandatory question #${i + 1}: "${q.questionText}"`);
                                    return;
                                  }
                                  responseMap[String(q.id || i + 1)] = val;
                                }

                                if (courseId) {
                                  await submitAssignment(courseId, {
                                    contentId: selectedLesson.id,
                                    submissionText: JSON.stringify({
                                      type: "FEEDBACK",
                                      title: selectedLesson.title,
                                      responses: responseMap,
                                      questions: questionsToRender.map((q: any) => ({ id: q.id, questionText: q.questionText })),
                                    }),
                                  }).catch(console.error);
                                }
                                handleToggleLessonComplete(selectedLesson.id);
                                alert("Thank you! Your feedback survey response has been saved.");
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs gap-2 px-6 h-10 shadow cursor-pointer"
                            >
                              <MessageSquare className="h-4 w-4" /> Submit Course Feedback Survey
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsFeedbackModalOpen(true)}
                              className="text-xs text-muted-foreground hover:text-foreground border-border"
                            >
                              Open Fullscreen Form
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : selectedLesson.contentType?.toUpperCase() === "SCORM" || selectedLesson.contentUrl?.includes("/storage/scorm/") ? (
                  <ScormPlayer
                    key={selectedLesson.id || selectedLesson.title}
                    title={selectedLesson.title}
                    contentUrl={selectedLesson.contentUrl}
                    onComplete={() => handleToggleLessonComplete(selectedLesson.id)}
                  />
                ) : selectedLesson.contentType?.toUpperCase() === "YOUTUBE" && selectedLesson.contentUrl ? (
                  <div className="w-full space-y-2">
                    <div className="w-full h-[480px] bg-black rounded-xl overflow-hidden border border-border shadow-md">
                      <iframe
                        src={getYouTubeEmbedUrl(selectedLesson.contentUrl)}
                        className="w-full h-full border-0"
                        title={selectedLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : selectedLesson.contentType?.toUpperCase() === "PDF" || selectedLesson.contentType?.toUpperCase() === "PPT" || selectedLesson.contentType?.toUpperCase() === "PPTX" || selectedLesson.contentType?.toUpperCase() === "ARTICLE" || (selectedLesson.contentUrl && selectedLesson.contentUrl.toLowerCase().match(/\.(pdf|ppt|pptx)$/i)) ? (
                  <InteractiveDocViewer
                    key={selectedLesson.id || selectedLesson.title}
                    title={selectedLesson.title}
                    contentType={selectedLesson.contentType}
                    contentUrl={selectedLesson.contentUrl}
                    description={selectedLesson.description}
                  />
                ) : selectedLesson.contentUrl && selectedLesson.contentUrl.trim() !== "" ? (
                  <div className="p-8 bg-card border border-border rounded-xl text-center space-y-4">
                    <ExternalLink className="h-10 w-10 text-primary mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-foreground">Content Resource</h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                        This lesson links to interactive material configured by the instructor.
                      </p>
                    </div>
                    <Button
                      onClick={() => window.open(getStorageUrl(selectedLesson.contentUrl?.trim()), "_blank", "noopener,noreferrer")}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 px-6 h-10 shadow cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" /> Launch Content Resource
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 bg-card border border-border rounded-xl text-xs text-foreground leading-relaxed whitespace-pre-line">
                    {selectedLesson.description || "No additional text content provided for this lesson."}
                  </div>
                )}

                {/* Lesson Navigation Footer */}
                <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
                  <Button
                    disabled={!prevLesson}
                    onClick={() => prevLesson && setSelectedLesson(prevLesson)}
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent text-xs"
                  >
                    &larr; Previous Lesson
                  </Button>

                  <Button
                    disabled={!nextLesson}
                    onClick={() => nextLesson && setSelectedLesson(nextLesson)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"
                  >
                    Next Lesson &rarr;
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-2xl">
                Select a lesson from the curriculum sidebar to begin.
              </div>
            )}

            {/* Bottom Tabbed Area (Overview, Resources, Submissions) */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-4 border-b border-border pb-3 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={activeTab === "overview" ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-foreground"}
                >
                  Lesson Details
                </button>
                <button
                  onClick={() => setActiveTab("submissions")}
                  className={activeTab === "submissions" ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-foreground"}
                >
                  Submissions &amp; Feedback
                </button>
              </div>

              {activeTab === "overview" ? (
                <div className="space-y-5 text-xs text-foreground">
                  {/* 1. Selected Lesson Details & Instructions */}
                  <div className="space-y-3 p-4.5 rounded-xl bg-muted/20 border border-border">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {selectedLesson?.title || "Lesson Overview"}
                      </h4>
                      {selectedLesson?.contentType && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-bold px-2 py-0.5">
                          {selectedLesson.contentType}
                        </Badge>
                      )}
                    </div>

                    {/* Lesson Instructions & Description */}
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-bold text-[11px] block">Lesson Description &amp; Instructions:</span>
                      <p className="whitespace-pre-line text-foreground leading-relaxed text-xs line-clamp-3">
                        {selectedLesson?.description || "Review the lesson materials above and complete associated exercises or assessment tasks."}
                      </p>
                    </div>

                    {/* Specific Quiz Config Breakdown */}
                    {selectedLesson?.contentType?.toUpperCase() === "QUIZ" && (() => {
                      let qConfig: any = {};
                      try {
                        const raw = selectedLesson.quizConfigJson || (selectedLesson as any).configJson;
                        if (raw) qConfig = typeof raw === "string" ? JSON.parse(raw) : raw;
                      } catch {}
                      const qCount = Array.isArray(qConfig.questions) ? qConfig.questions.length : (Array.isArray(qConfig) ? qConfig.length : 0);
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border text-[11px]">
                          <div>Questions: <strong className="text-amber-500 font-bold">{qCount}</strong></div>
                          <div>Passing Score: <strong className="text-emerald-500 font-bold">{qConfig.passingPercentage || 70}%</strong></div>
                          <div>Max Attempts: <strong className="text-foreground font-bold">{qConfig.maxAttempts === 0 ? "Unlimited" : (qConfig.maxAttempts ?? qConfig.attemptsAllowed ?? 1)}</strong></div>
                          <div>Shuffle: <strong className="text-muted-foreground">{qConfig.shuffleQuestions ? "Enabled" : "Off"}</strong></div>
                        </div>
                      );
                    })()}

                    {/* Specific Assignment Config Breakdown & Reference Files */}
                    {selectedLesson?.contentType?.toUpperCase() === "ASSIGNMENT" && (() => {
                      let aConfig: any = {};
                      try {
                        const raw = selectedLesson.assignmentConfigJson || (selectedLesson as any).configJson;
                        if (raw) aConfig = typeof raw === "string" ? JSON.parse(raw) : raw;
                      } catch {}
                      const refFiles: any[] = aConfig.questionFiles || aConfig.attachments || aConfig.files || [];
                      return (
                        <div className="space-y-3 pt-3 border-t border-border text-[11px]">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>Max Marks: <strong className="text-purple-600 dark:text-purple-400 font-bold">{aConfig.maxMarks || 50}</strong></div>
                            <div>Max Attempts: <strong className="text-foreground font-bold">{aConfig.maxAttempts === 0 ? "Unlimited" : (aConfig.maxAttempts ?? aConfig.attemptsAllowed ?? 1)}</strong></div>
                            <div>Due Date: <strong className="text-amber-500 font-bold">{aConfig.deadline || "No strict deadline"}</strong></div>
                            <div>Max Size: <strong className="text-muted-foreground">{aConfig.maxFileSizeMb || 50} MB</strong></div>
                          </div>
                          {refFiles.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-muted-foreground font-bold block">Instructor Reference Files &amp; Problem Documents:</span>
                              <div className="flex flex-wrap gap-2">
                                {refFiles.map((fileItem: any, fIdx: number) => {
                                  const fName = fileItem.name || fileItem.fileName || fileItem.title || `Attachment_${fIdx + 1}`;
                                  let rawUrl = fileItem.url || fileItem.fileUrl || fileItem.path || fileItem.link;
                                  if (!rawUrl || rawUrl === "#") {
                                    rawUrl = `/storage/uploads/${fName}`;
                                  }
                                  const targetUrl = getStorageUrl(rawUrl);

                                  return (
                                    <button
                                      key={fIdx}
                                      type="button"
                                      onClick={() => window.open(targetUrl, "_blank", "noopener,noreferrer")}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-purple-600 dark:text-purple-400 hover:underline text-[11px] font-semibold cursor-pointer"
                                    >
                                      <Paperclip className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                      <span>{fName}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 2. Full Course Overview, Identity & Learning Objectives */}
                  <div className="space-y-4 p-4.5 rounded-xl bg-card border border-border shadow-sm">
                    {/* Course Identity & Classification */}
                    <div className="space-y-2 border-b border-border pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          1. Course Identity &amp; Classification
                        </h4>
                        <Badge className="bg-[#C82333] text-white font-bold text-[10px]">
                          Code: {course?.code || `CO${course?.id}`}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                        <div className="p-2 bg-muted/20 rounded-lg border border-border">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Course Name</span>
                          <span className="font-bold text-foreground truncate block">{course?.title}</span>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-lg border border-border">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Course Code</span>
                          <span className="font-bold text-primary block">{course?.code || `CO${course?.id}`}</span>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-lg border border-border">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Business Unit</span>
                          <span className="font-bold text-foreground block">{departmentLabel}</span>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-lg border border-border">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Category</span>
                          <span className="font-bold text-foreground block">{categoryLabel}</span>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-lg border border-border">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Difficulty Level</span>
                          <span className="font-bold text-amber-500 block">{course?.level || "Beginner"}</span>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-lg border border-border">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Estimated Duration</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{displayDurationHours} Hours</span>
                        </div>
                      </div>
                    </div>

                    {/* Course Summary & Learning Objectives */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-foreground text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        2. Course Summary &amp; Learning Objectives
                      </h4>

                      {course?.shortDescription && (
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-200 text-[11px] space-y-0.5">
                          <span className="font-extrabold uppercase text-[9px] text-blue-700 dark:text-blue-400 block">Short Description</span>
                          <p className="leading-relaxed font-medium">{course.shortDescription}</p>
                        </div>
                      )}

                      {course?.description && (
                        <div className="p-3 rounded-lg bg-muted/20 border border-border text-[11px] space-y-0.5">
                          <span className="font-extrabold uppercase text-[9px] text-muted-foreground block">Detailed Description / Learning Objectives</span>
                          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{course.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {(progressData?.submissions || []).length === 0 ? (
                    <div className="p-6 bg-muted/10 border border-border rounded-xl text-center space-y-1">
                      <p className="text-muted-foreground font-medium">No quiz or assignment submissions recorded for this course yet.</p>
                      <p className="text-[11px] text-muted-foreground/70">Complete a quiz or submit an assignment above to view evaluation records here.</p>
                    </div>
                  ) : (
                    (progressData?.submissions || []).map((sub: any, idx: number) => (
                      <div key={idx} className="p-4 bg-muted/10 border border-border rounded-xl space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
                          <span className="text-foreground flex items-center gap-2">
                            <Badge className={`text-[10px] ${
                              sub.submissionType === "FEEDBACK" || sub.submissionText?.includes('"type":"FEEDBACK"')
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : "bg-primary/20 text-primary border-primary/30"
                            }`}>
                              {sub.submissionType === "FEEDBACK" || sub.submissionText?.includes('"type":"FEEDBACK"')
                                ? "FEEDBACK EVALUATION"
                                : sub.submissionType}
                            </Badge>
                            <span>Attempt #{sub.attemptNumber || 1}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ""}
                            </span>
                            <Badge className={`text-[10px] uppercase font-bold ${
                              sub.status === "GRADED" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            }`}>
                              {sub.status}
                            </Badge>
                          </div>
                        </div>

                        {!(sub.submissionType === "FEEDBACK" || sub.submissionText?.includes('"type":"FEEDBACK"')) && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-foreground text-[11px] pt-1">
                            <div>Score: <strong className="text-emerald-500 font-bold">{sub.score} / {sub.maxScore || 100}</strong></div>
                            <div>Percentage: <strong className="text-foreground font-bold">{sub.percentage || 0}%</strong></div>
                            <div>Grade: <strong className="text-amber-500 font-bold">{sub.grade || "N/A"}</strong></div>
                          </div>
                        )}

                        {sub.submissionText && (() => {
                          let isFeedback = false;
                          let fbData: any = null;
                          if (typeof sub.submissionText === "string" && sub.submissionText.trim().startsWith("{")) {
                            try {
                              fbData = JSON.parse(sub.submissionText);
                              if (fbData && (fbData.type === "FEEDBACK" || fbData.responses)) {
                                isFeedback = true;
                              }
                            } catch {}
                          }

                          if (isFeedback && fbData) {
                            return (
                              <div className="text-foreground bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-[11px] space-y-2">
                                <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 font-bold text-amber-600 dark:text-amber-400">
                                  <span>Learner Feedback Evaluation: {fbData.title || "Course Survey"}</span>
                                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] uppercase">
                                    Survey Response Submitted
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  {Object.entries(fbData.responses || {}).map(([qKey, ansVal], rIdx) => {
                                    const getPrompt = (kStr: string, idx: number) => {
                                      if (fbData?.questions && Array.isArray(fbData.questions)) {
                                        const f = fbData.questions.find((q: any) => String(q.id) === String(kStr));
                                        if (f?.questionText) return f.questionText;
                                        if (fbData.questions[idx]?.questionText) return fbData.questions[idx].questionText;
                                      }
                                      const defaults: Record<string, string> = {
                                        "1": "How satisfied are you with the course content and instructor explanations?",
                                        "2": "How well did the practical exercises help reinforce your learning?",
                                        "3": "What suggestions do you have for improving this course module?",
                                        "4": "Overall Course & Instructor Support Rating",
                                        "5": "Additional Instructor & Material Review Notes",
                                      };
                                      return defaults[kStr] || `Evaluation Prompt #${idx + 1}`;
                                    };
                                    return (
                                      <div key={rIdx} className="flex flex-col gap-1 p-2 rounded bg-card border border-border">
                                        <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                          Q#{rIdx + 1}: {getPrompt(qKey, rIdx)}
                                        </span>
                                        <span className="text-foreground font-semibold text-xs">{String(ansVal)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="text-foreground bg-card p-2.5 rounded-lg border border-border text-[11px]">
                              <span className="text-muted-foreground font-bold block mb-0.5">Submitted Solution / Response:</span>
                              {sub.submissionText}
                            </div>
                          );
                        })()}

                        {sub.fileUrl && (
                          <div className="text-purple-600 dark:text-purple-400 text-[11px] flex items-center gap-1.5">
                            <Paperclip className="h-3.5 w-3.5 text-purple-500" />
                            <span>Attached Solution Artifact:</span>
                            <a href={getStorageUrl(sub.fileUrl)} target="_blank" rel="noreferrer" className="underline hover:text-purple-700 font-semibold">{sub.fileUrl}</a>
                          </div>
                        )}

                        {sub.feedback && (
                          <div className="text-amber-600 dark:text-amber-400 pt-2 border-t border-border text-[11px]">
                            <strong className="text-amber-500 block font-bold">Teacher / Evaluator Feedback ({sub.gradedBy || "Instructor"}):</strong>
                            <p className="mt-0.5 italic text-foreground">"{sub.feedback}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Collapsible Curriculum Sidebar */}
        <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-border font-bold text-xs text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Course Content
            </span>
            <span className="text-muted-foreground font-mono text-[11px]">{totalContentsCount} items</span>
          </div>

          <div className="divide-y divide-border flex-1">
            {modules.map((mod, idx) => (
              <div key={mod.id} className="bg-card">
                <div
                  onClick={() => toggleModule(mod.id)}
                  className="px-4 py-3 bg-muted/30 hover:bg-muted/60 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    {expandedModules.includes(mod.id) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="truncate max-w-[130px]">Section {idx + 1}: {mod.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEnrolled && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkModuleComplete(mod);
                        }}
                        className="h-6 px-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {mod.lessons.length > 0 && mod.lessons.every((l) => completedLessonIds.includes(l.id))
                          ? "Done"
                          : "Mark Section"}
                      </Button>
                    )}
                    <span className="text-[10px] text-muted-foreground font-semibold">{mod.lessons.length}</span>
                  </div>
                </div>

                {expandedModules.includes(mod.id) && (
                  <div className="divide-y divide-border">
                    {mod.lessons.map((les) => {
                      const isCompleted = completedLessonIds.includes(les.id);
                      const isSelected = selectedLesson?.id === les.id;

                      return (
                        <div
                          key={les.id}
                          onClick={() => handleOpenLessonContent(les)}
                          className={
                            isSelected
                              ? "px-4 py-3 bg-primary/10 border-l-4 border-primary flex items-center justify-between text-xs cursor-pointer transition-colors"
                              : "px-4 py-3 hover:bg-muted/40 flex items-center justify-between text-xs cursor-pointer transition-colors"
                          }
                        >
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLessonComplete(les.id);
                              }}
                              className="p-0.5 rounded-full hover:bg-muted/80 transition-transform cursor-pointer shrink-0"
                              title={isCompleted ? "Click to mark as uncompleted" : "Click to mark as completed"}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 hover:scale-110 transition-transform" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground hover:text-emerald-500 hover:scale-110 transition-transform" />
                              )}
                            </button>
                            <span className={isSelected ? "font-bold text-primary" : "text-foreground font-medium"}>
                              {les.title}
                            </span>
                            {les.contentType === "PPT" ? (
                              <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-1.5 py-0">PPT</Badge>
                            ) : les.contentType === "PDF" ? (
                              <Badge className="bg-red-500 text-white font-extrabold text-[9px] px-1.5 py-0">PDF</Badge>
                            ) : les.contentType === "SCORM" ? (
                              <Badge className="bg-violet-600 text-white font-extrabold text-[9px] px-1.5 py-0">SCORM</Badge>
                            ) : les.contentType === "YOUTUBE" ? (
                              <Badge className="bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0">YouTube</Badge>
                            ) : les.contentType === "QUIZ" ? (
                              <Badge className="bg-amber-600 text-white font-extrabold text-[9px] px-1.5 py-0">Quiz</Badge>
                            ) : les.contentType === "ASSIGNMENT" ? (
                              <Badge className="bg-purple-600 text-white font-extrabold text-[9px] px-1.5 py-0">Assignment</Badge>
                            ) : les.contentType === "FEEDBACK" ? (
                              <Badge className="bg-amber-600 text-white font-extrabold text-[9px] px-1.5 py-0">Feedback</Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground font-bold text-[9px] px-1.5 py-0">{les.contentType}</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* 3. MODALS (Quiz, Assignment, Feedback, Certificate) */}
      {selectedLesson?.contentType === "QUIZ" && isQuizModalOpen && courseId && (
        <LearnerQuizModal
          open={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          courseId={courseId}
          contentId={selectedLesson.id}
          quizTitle={selectedLesson.title}
          configJson={selectedLesson.quizConfigJson || (selectedLesson as any).configJson}
          onSuccess={() => {
            handleToggleLessonComplete(selectedLesson.id);
            loadCourseAndProgress();
          }}
        />
      )}

      {isFeedbackModalOpen && courseId && (
        <LearnerFeedbackModal
          open={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          courseId={courseId}
          contentId={selectedLesson?.id || null}
          feedbackTitle={selectedLesson?.title || "Course Evaluation & Feedback Form"}
          description={selectedLesson?.description || "Please share your review regarding course structure, content clarity, and instructor support."}
          questions={(() => {
            if (!selectedLesson) return undefined;
            try {
              const raw = selectedLesson.quizConfigJson || (selectedLesson as any).configJson;
              if (raw) {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                if (Array.isArray(parsed.questions)) return parsed.questions;
              }
            } catch {}
            return undefined;
          })()}
          onSuccess={() => {
            if (selectedLesson?.id) handleToggleLessonComplete(selectedLesson.id);
            loadCourseAndProgress();
            setIsFeedbackModalOpen(false);
          }}
        />
      )}

      {selectedLesson?.contentType === "ASSIGNMENT" && isAssignmentModalOpen && courseId && (
        <LearnerAssignmentModal
          open={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          courseId={courseId}
          contentId={selectedLesson.id}
          assignmentTitle={selectedLesson.title}
          instructions={selectedLesson.description}
          configJson={selectedLesson.assignmentConfigJson || (selectedLesson as any).configJson}
          existingSubmission={latestSubmission}
          onSuccess={() => {
            handleToggleLessonComplete(selectedLesson.id);
            loadCourseAndProgress();
          }}
        />
      )}

      {isCertModalOpen && (
        <LearnerCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          certificate={(progressData?.certificate as any) || null}
          fallbackCourseTitle={course?.title || "Course Completion Certificate"}
          fallbackRecipientName={user ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() || user.username : "Enrolled Learner"}
        />
      )}

      {/* Guest Restriction Notice Modal */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Guest Preview Only
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {guestModalLessonTitle
                  ? `The activity '${guestModalLessonTitle}' is locked in Guest Preview mode.`
                  : "Learning content, quizzes, assignments, and certificates are locked in Guest Preview mode."}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                To watch full video materials, attempt quizzes, submit assignments, and track progress, please log in with an enrolled learner account.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGuestModalOpen(false)}
                className="w-1/2 text-xs font-semibold"
              >
                Continue Preview
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/login")}
                className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
              >
                Sign In as Learner
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
