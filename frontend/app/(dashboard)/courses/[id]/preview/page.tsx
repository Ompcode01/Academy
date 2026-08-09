"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Tv,
  Layers,
  User,
  ShieldCheck,
  Check,
  RefreshCw,
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
  const router = useRouter();
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
        `Certificate Locked (${progressPercent}% Completed) — Please complete 100% of all course sections and lessons to unlock your official certificate.`
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

    if (lesson.contentType === "QUIZ") {
      setIsQuizModalOpen(true);
    } else if (lesson.contentType === "ASSIGNMENT") {
      setIsAssignmentModalOpen(true);
    } else if (lesson.contentUrl && lesson.contentUrl.trim() !== "") {
      window.open(lesson.contentUrl.trim(), "_blank", "noopener,noreferrer");
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
  const isCourseFullyCompleted = progressPercent >= 100 || Boolean(progressData?.certificate);

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
                  <span>Department: <strong className="text-white font-semibold">{course.creatorInfo?.creatorDepartment || departmentLabel}</strong></span>
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
                        <span className="text-primary font-bold">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2 bg-muted" />
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
            
            {/* Learning Outcomes / Description */}
            <div className="bg-background rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> About This Course
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {course.description || course.shortDescription || "This course provides comprehensive modular instruction configured by organization experts to ensure practical skill mastery and compliance."}
              </p>
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
                                ) : completedLessonIds.includes(lesson.id) ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* 1. Player Top Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setViewMode("overview")}
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Overview
          </Button>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="text-slate-400 truncate max-w-xs">{course.title}</span>
            {selectedLesson && (
              <>
                <span>&rsaquo;</span>
                <span className="text-white font-bold truncate max-w-xs">{selectedLesson.title}</span>
              </>
            )}
          </div>
        </div>

        {/* Header Progress & Certificate Action */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall Progress</div>
              <div className="text-xs font-extrabold text-white">{progressPercent}% Completed</div>
            </div>
            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <Button
            onClick={handleCertificateClick}
            size="sm"
            className={
              isCourseFullyCompleted
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-1.5 shadow animate-pulse"
                : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs gap-1.5 cursor-pointer"
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
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
          
          {/* Main Content Player Card */}
          <div className="p-6 max-w-5xl mx-auto w-full space-y-6 flex-1">
            
            {selectedLesson ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
                
                {/* Content Header Title & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary/20 text-primary border border-primary/30 font-bold text-[10px]">
                        {selectedLesson.contentType}
                      </Badge>
                      {selectedLesson.isMandatory && (
                        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                          Mandatory
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedLesson.title}</h2>
                  </div>

                  {/* Mark as Complete Toggle */}
                  <Button
                    onClick={() => handleToggleLessonComplete(selectedLesson.id)}
                    variant={isSelectedLessonCompleted ? "outline" : "default"}
                    className={
                      isSelectedLessonCompleted
                        ? "border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs gap-2"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2"
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isSelectedLessonCompleted ? "Completed" : "Mark as Completed"}
                  </Button>
                </div>

                {/* Lesson Media / Viewport Handler */}
                {selectedLesson.contentType === "QUIZ" ? (
                  <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-4">
                    <HelpCircle className="h-12 w-12 text-amber-500 mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-white">Course Quiz Assessment</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        Test your knowledge on this module. Complete objective and subjective questions.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsQuizModalOpen(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-2 px-6 h-10 shadow"
                    >
                      <Sparkles className="h-4 w-4" /> Launch Quiz
                    </Button>
                  </div>
                ) : selectedLesson.contentType === "ASSIGNMENT" ? (
                  <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-4">
                    <FileCheck2 className="h-12 w-12 text-purple-400 mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-white">Practical Assignment Submission</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        Submit written response or work artifacts for teacher evaluation and grading.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsAssignmentModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs gap-2 px-6 h-10 shadow"
                    >
                      <FileCheck2 className="h-4 w-4" /> Open Assignment Workspace
                    </Button>
                  </div>
                ) : selectedLesson.contentUrl && selectedLesson.contentUrl.trim() !== "" ? (
                  <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-4">
                    <ExternalLink className="h-10 w-10 text-primary mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-white">External Content Resource</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        This lesson links to external interactive material configured by instructor.
                      </p>
                    </div>
                    <Button
                      onClick={() => window.open(selectedLesson.contentUrl?.trim(), "_blank", "noopener,noreferrer")}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 px-6 h-10 shadow"
                    >
                      <ExternalLink className="h-4 w-4" /> Launch Resource Link
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedLesson.description || "No additional text content provided for this lesson."}
                  </div>
                )}

                {/* Lesson Navigation Footer */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
                  <Button
                    disabled={!prevLesson}
                    onClick={() => prevLesson && setSelectedLesson(prevLesson)}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
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
              <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
                Select a lesson from the curriculum sidebar to begin.
              </div>
            )}

            {/* Bottom Tabbed Area (Overview, Resources, Submissions) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-3 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={activeTab === "overview" ? "text-primary border-b-2 border-primary pb-1" : "text-slate-400 hover:text-white"}
                >
                  Lesson Details
                </button>
                <button
                  onClick={() => setActiveTab("submissions")}
                  className={activeTab === "submissions" ? "text-primary border-b-2 border-primary pb-1" : "text-slate-400 hover:text-white"}
                >
                  Submissions &amp; Feedback
                </button>
              </div>

              {activeTab === "overview" ? (
                <div className="text-xs text-slate-300 leading-relaxed">
                  {selectedLesson?.description || "Review lesson contents and complete associated activities."}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {(progressData?.submissions || []).length === 0 ? (
                    <p className="text-slate-400">No submissions recorded for this course yet.</p>
                  ) : (
                    (progressData?.submissions || []).map((sub: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-white">{sub.submissionType} Submission</span>
                          <Badge className="text-[10px] uppercase font-bold">{sub.status}</Badge>
                        </div>
                        {sub.score !== undefined && (
                          <div className="text-slate-400">Score: <strong className="text-emerald-400">{sub.score} / {sub.maxScore || 100}</strong></div>
                        )}
                        {sub.feedback && (
                          <div className="text-amber-300 pt-1 border-t border-slate-800">
                            Teacher Feedback: "{sub.feedback}"
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
        <aside className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-800 font-bold text-xs text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Course Content
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{totalContentsCount} items</span>
          </div>

          <div className="divide-y divide-slate-800 flex-1">
            {modules.map((mod, idx) => (
              <div key={mod.id} className="bg-slate-900">
                <div
                  onClick={() => toggleModule(mod.id)}
                  className="px-4 py-3 bg-slate-950/60 hover:bg-slate-800/60 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    {expandedModules.includes(mod.id) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
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
                        className="h-6 px-2 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {mod.lessons.length > 0 && mod.lessons.every((l) => completedLessonIds.includes(l.id))
                          ? "Done"
                          : "Mark Section"}
                      </Button>
                    )}
                    <span className="text-[10px] text-slate-400 font-semibold">{mod.lessons.length}</span>
                  </div>
                </div>

                {expandedModules.includes(mod.id) && (
                  <div className="divide-y divide-slate-800/40">
                    {mod.lessons.map((les) => {
                      const isCompleted = completedLessonIds.includes(les.id);
                      const isSelected = selectedLesson?.id === les.id;

                      return (
                        <div
                          key={les.id}
                          onClick={() => handleOpenLessonContent(les)}
                          className={
                            isSelected
                              ? "px-4 py-3 bg-primary/20 border-l-4 border-primary flex items-center justify-between text-xs cursor-pointer transition-colors"
                              : "px-4 py-3 hover:bg-slate-800/40 flex items-center justify-between text-xs cursor-pointer transition-colors"
                          }
                        >
                          <div className="flex items-center gap-2.5">
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            ) : les.contentType === "QUIZ" ? (
                              <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
                            ) : les.contentType === "ASSIGNMENT" ? (
                              <FileCheck2 className="h-4 w-4 text-purple-400 shrink-0" />
                            ) : (
                              <Play className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                            <span className={isSelected ? "font-bold text-white" : "text-slate-300 font-medium"}>
                              {les.title}
                            </span>
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

      {/* 3. MODALS (Quiz, Assignment, Certificate) */}
      {selectedLesson?.contentType === "QUIZ" && isQuizModalOpen && courseId && (
        <LearnerQuizModal
          open={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          courseId={courseId}
          contentId={selectedLesson.id}
          quizTitle={selectedLesson.title}
          onSuccess={() => {
            handleToggleLessonComplete(selectedLesson.id);
            loadCourseAndProgress();
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
