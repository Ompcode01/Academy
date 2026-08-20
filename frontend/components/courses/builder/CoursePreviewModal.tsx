"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  BookOpen,
  Layers,
  HelpCircle,
  FileCheck2,
  ExternalLink,
  Archive,
  Video,
  FileText,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { SectionItem, ContentItem } from "./CurriculumBuilderView";
import { getStorageUrl } from "@/services/api/course.service";
import InteractiveDocViewer from "@/components/courses/player/InteractiveDocViewer";
import InlineQuizPlayer from "@/components/courses/player/InlineQuizPlayer";
import InlineAssignmentPlayer from "@/components/courses/player/InlineAssignmentPlayer";
import LearnerFeedbackModal from "@/components/courses/learner/LearnerFeedbackModal";
import ScormPlayer from "@/components/courses/player/ScormPlayer";
import { MessageSquare } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/lib/utils";

interface CoursePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle?: string;
  courseCode?: string;
  department?: string;
  shortDescription?: string;
  description?: string;
  level?: string;
  category?: string;
  durationHours?: number;
  sections?: SectionItem[];
  enrollment?: any;
  certificate?: any;
  feedback?: any;
}

export default function CoursePreviewModal({
  open,
  onOpenChange,
  courseTitle = "Untitled Course",
  courseCode = "CO12",
  department = "Global",
  shortDescription = "",
  description = "",
  level = "Beginner",
  category = "General",
  durationHours = 0,
  sections = [],
  feedback,
}: CoursePreviewModalProps) {
  const [selectedLesson, setSelectedLesson] = useState<ContentItem | null>(null);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const displaySections = useMemo(() => {
    const rawSections = sections || [];
    const fbQuestions = feedback?.questions || [];
    const feedbackConfigJson = JSON.stringify({
      title: feedback?.feedbackTitle || "End-of-Course Feedback & Evaluation Survey",
      description: feedback?.description || "",
      questions: fbQuestions,
    });

    const hasFeedback = rawSections.some((s) => (s.contents || []).some((c) => c.contentType === "FEEDBACK"));
    if (hasFeedback) {
      return rawSections.map((sec) => ({
        ...sec,
        contents: (sec.contents || []).map((cnt) => {
          if (cnt.contentType === "FEEDBACK" && fbQuestions.length > 0) {
            return {
              ...cnt,
              quizConfigJson: cnt.quizConfigJson || feedbackConfigJson,
            };
          }
          return cnt;
        }),
      }));
    }

    const feedbackSec: SectionItem = {
      id: 999999,
      title: "Course Feedback & Evaluation",
      description: "Evaluation survey configured by instructor.",
      expanded: true,
      contents: [
        {
          id: 999999,
          title: feedback?.feedbackTitle || "End-of-Course Feedback Survey",
          contentType: "FEEDBACK",
          description: feedback?.description || "Please share your review regarding course structure, content clarity, and instructor support.",
          quizConfigJson: feedbackConfigJson,
          status: "Published",
        },
      ],
    };
    return [...rawSections, feedbackSec];
  }, [sections, feedback]);

  useEffect(() => {
    if (displaySections && displaySections.length > 0) {
      const allSecIds = displaySections.map((s) => s.id);
      setExpandedSections(allSecIds);
      if (displaySections[0]?.contents && displaySections[0].contents.length > 0) {
        setSelectedLesson(displaySections[0].contents[0]);
      } else {
        setSelectedLesson(null);
      }
    } else {
      setSelectedLesson(null);
      setExpandedSections([]);
    }
  }, [displaySections, open]);

  const getFeedbackQuestions = (lesson: any) => {
    if (!lesson) return [];
    const raw = lesson.quizConfigJson || lesson.configJson;
    if (raw) {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return parsed.questions;
        }
      } catch {}
    }
    if (Array.isArray(lesson.questions) && lesson.questions.length > 0) {
      return lesson.questions;
    }
    if (Array.isArray(feedback?.questions) && feedback.questions.length > 0) {
      return feedback.questions;
    }
    return [];
  };

  const toggleSection = (secId: number) => {
    setExpandedSections((prev) =>
      prev.includes(secId) ? prev.filter((id) => id !== secId) : [...prev, secId]
    );
  };

  const totalContentCount = displaySections.reduce(
    (acc, s) => acc + (s.contents?.length || 0),
    0
  );

  const allLessonsFlat = displaySections.flatMap((s) => s.contents || []);
  const currentIdx = selectedLesson
    ? allLessonsFlat.findIndex((l) => (l.id && selectedLesson.id ? l.id === selectedLesson.id : l.title === selectedLesson.title))
    : -1;
  const nextLesson = currentIdx !== -1 && currentIdx < allLessonsFlat.length - 1 ? allLessonsFlat[currentIdx + 1] : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-background text-foreground flex flex-col overflow-hidden select-none">
      {/* Modal Header */}
      <header className="h-14 px-6 border-b border-border bg-card/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Course Preview Mode: {courseTitle}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {sections.length} Sections • {totalContentCount} Lectures • {level} Level
              {durationHours > 0 ? ` • ${durationHours} Hours` : ""}
            </p>
          </div>
        </div>

        <Button
          onClick={() => onOpenChange(false)}
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-bold border-border text-foreground hover:bg-muted cursor-pointer"
        >
          <X className="h-4 w-4" /> Close Preview
        </Button>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-background">
          
          {/* Left Column: Player & Viewport (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col p-5 overflow-y-auto bg-muted/10 border-b lg:border-b-0 lg:border-r border-border">
            {selectedLesson ? (
              <div className="flex-1 flex flex-col space-y-4">
                
                {/* Lesson Title Header */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase bg-primary/10 text-primary border-primary/20">
                        {selectedLesson.contentType}
                      </Badge>
                      {selectedLesson.duration && (
                        <span className="text-xs text-muted-foreground">
                          {selectedLesson.duration} Mins
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {selectedLesson.title}
                    </h3>
                  </div>
                </div>

                {/* Content Viewport Player */}
                <div className="flex-1 flex flex-col justify-center min-h-[360px]">
                  {selectedLesson.contentType === "SCORM" || selectedLesson.contentUrl?.includes("/storage/scorm/") ? (
                    <ScormPlayer
                      key={selectedLesson.id || selectedLesson.title}
                      title={selectedLesson.title}
                      contentUrl={selectedLesson.contentUrl}
                      height="380px"
                      isPreview={true}
                    />
                  ) : selectedLesson.contentType === "YOUTUBE" && selectedLesson.contentUrl ? (
                    <div className="w-full h-[360px] bg-black rounded-xl overflow-hidden border border-border shadow-lg">
                      <iframe
                        src={getYouTubeEmbedUrl(selectedLesson.contentUrl)}
                        className="w-full h-full border-0"
                        title={selectedLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : selectedLesson.contentType?.toUpperCase() === "PDF" || selectedLesson.contentType?.toUpperCase() === "PPT" || selectedLesson.contentType?.toUpperCase() === "PPTX" || (selectedLesson.contentUrl && selectedLesson.contentUrl.toLowerCase().match(/\.(pdf|ppt|pptx)$/i)) ? (
                    <InteractiveDocViewer
                      key={selectedLesson.id || selectedLesson.title}
                      title={selectedLesson.title}
                      contentType={selectedLesson.contentType}
                      contentUrl={selectedLesson.contentUrl}
                      description={selectedLesson.description}
                    />
                  ) : selectedLesson.contentType?.toUpperCase() === "QUIZ" ? (
                    <InlineQuizPlayer
                      quizTitle={selectedLesson.title}
                      configJson={(selectedLesson as any).quizConfigJson || (selectedLesson as any).configJson}
                      isPreview={true}
                      onSkip={() => {
                        if (nextLesson) setSelectedLesson(nextLesson);
                      }}
                      onNextLesson={() => {
                        if (nextLesson) setSelectedLesson(nextLesson);
                      }}
                    />
                  ) : selectedLesson.contentType?.toUpperCase() === "ASSIGNMENT" ? (
                    <InlineAssignmentPlayer
                      assignmentTitle={selectedLesson.title}
                      contentUrl={selectedLesson.contentUrl}
                      description={selectedLesson.description}
                      configJson={(selectedLesson as any).assignmentConfigJson || (selectedLesson as any).configJson}
                      isPreview={true}
                      onNextLesson={() => {
                        if (nextLesson) setSelectedLesson(nextLesson);
                      }}
                    />
                  ) : selectedLesson.contentType?.toUpperCase() === "FEEDBACK" || selectedLesson.contentType?.toUpperCase() === "FEEDBACK_SURVEY" || selectedLesson.contentType?.toUpperCase() === "SURVEY" ? (
                    <div className="p-6 bg-card border border-amber-500/30 rounded-2xl space-y-5 shadow-md my-auto">
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

                      {/* Interactive Inline Survey Form Preview */}
                      <div className="space-y-3.5 text-xs text-left max-h-[350px] overflow-y-auto pr-1">
                        {(() => {
                          const questionsToRender = getFeedbackQuestions(selectedLesson);
                          if (questionsToRender.length === 0) {
                            return (
                              <div className="p-4 rounded-xl bg-muted/20 border border-border text-center text-muted-foreground text-xs">
                                No questions configured yet for this feedback survey.
                              </div>
                            );
                          }

                          return questionsToRender.map((q: any, qIdx: number) => {
                            const opts: string[] = q.options && Array.isArray(q.options) && q.options.length > 0
                              ? q.options
                              : q.questionType === "MCQ"
                                ? ["Excellent", "Good", "Average", "Needs Improvement"]
                                : [];

                            return (
                              <div key={q.id || qIdx} className="p-3 rounded-xl bg-muted/20 border border-border space-y-1.5">
                                <span className="font-bold text-foreground block">
                                  {qIdx + 1}. {q.questionText} {q.isMandatory && <span className="text-rose-500">*</span>}
                                </span>

                                {q.questionType === "WRITTEN" || opts.length === 0 ? (
                                  <div className="p-2.5 rounded-lg border border-border bg-background text-[11px] text-muted-foreground italic">
                                    Written Response Answer Box
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {opts.map((opt: string, i: number) => (
                                      <span key={i} className="px-2.5 py-1 rounded bg-background border border-border text-[11px] font-medium text-foreground">
                                        {opt}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}

                        <div className="pt-2 flex items-center justify-between">
                          <Button
                            type="button"
                            onClick={() => setIsFeedbackModalOpen(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs gap-2 px-5 h-9 shadow cursor-pointer"
                          >
                            <MessageSquare className="h-4 w-4" /> Open Full Interactive Survey Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : selectedLesson.contentUrl && selectedLesson.contentUrl.trim() !== "" ? (
                    <div className="p-8 bg-card border border-border rounded-xl text-center space-y-4 my-auto shadow-sm">
                      <ExternalLink className="h-10 w-10 text-primary mx-auto" />
                      <h4 className="text-base font-bold text-foreground">Resource Document / Link</h4>
                      <Button
                        onClick={() => window.open(getStorageUrl(selectedLesson.contentUrl), "_blank")}
                        className="bg-primary text-primary-foreground font-bold text-xs gap-2 px-5 shadow cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4" /> Open Document
                      </Button>
                    </div>
                  ) : (
                    <div className="p-6 bg-card border border-border rounded-xl text-xs text-foreground leading-relaxed my-auto whitespace-pre-line shadow-sm">
                      {selectedLesson.description || "No additional text details provided for this lecture."}
                    </div>
                  )}
                </div>

                {/* Lesson Description */}
                {selectedLesson.description && (
                  <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                    <strong className="text-foreground block mb-1">Lesson Instructions:</strong>
                    {selectedLesson.description}
                  </div>
                )}

                {/* Course Identity & Learning Objectives Card */}
                <div className="pt-4 border-t border-border space-y-4">
                  {/* 1. Course Identity & Classification */}
                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
                    <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      1. Course Identity &amp; Classification
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                      <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Course Name</span>
                        <span className="font-extrabold text-foreground truncate block">{courseTitle}</span>
                      </div>
                      <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Course Code</span>
                        <span className="font-extrabold text-primary block">{courseCode}</span>
                      </div>
                      <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Business Unit</span>
                        <span className="font-extrabold text-foreground block">{department}</span>
                      </div>
                      <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Category</span>
                        <span className="font-extrabold text-foreground block">{category}</span>
                      </div>
                      <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Difficulty Level</span>
                        <span className="font-extrabold text-amber-500 block">{level}</span>
                      </div>
                      <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Estimated Duration</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">{durationHours} Hours</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Course Summary & Learning Objectives */}
                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
                    <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      2. Course Summary &amp; Learning Objectives
                    </h4>
                    {shortDescription && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-200 text-[11px] space-y-0.5">
                        <span className="font-extrabold uppercase text-[9px] text-blue-700 dark:text-blue-400 block">Short Description</span>
                        <p className="leading-relaxed font-medium">{shortDescription}</p>
                      </div>
                    )}
                    {description && (
                      <div className="p-3 rounded-lg bg-muted/20 border border-border text-[11px] space-y-0.5">
                        <span className="font-extrabold uppercase text-[9px] text-muted-foreground block">Detailed Description / Learning Objectives</span>
                        <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
                <div className="text-center text-muted-foreground space-y-2 py-4 border-b border-border">
                  <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <h4 className="text-sm font-bold text-foreground">Course Identity &amp; Overview</h4>
                  <p className="text-xs text-muted-foreground">
                    Select a section or lecture from the right curriculum menu to preview specific content.
                  </p>
                </div>

                {/* 1. Course Identity & Classification */}
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    1. Course Identity &amp; Classification
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Course Name</span>
                      <span className="font-extrabold text-foreground truncate block">{courseTitle}</span>
                    </div>
                    <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Course Code</span>
                      <span className="font-extrabold text-primary block">{courseCode}</span>
                    </div>
                    <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Business Unit</span>
                      <span className="font-extrabold text-foreground block">{department}</span>
                    </div>
                    <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Category</span>
                      <span className="font-extrabold text-foreground block">{category}</span>
                    </div>
                    <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Difficulty Level</span>
                      <span className="font-extrabold text-amber-500 block">{level}</span>
                    </div>
                    <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Estimated Duration</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">{durationHours} Hours</span>
                    </div>
                  </div>
                </div>

                {/* 2. Course Summary & Learning Objectives */}
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    2. Course Summary &amp; Learning Objectives
                  </h4>
                  {shortDescription && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-200 text-[11px] space-y-0.5">
                      <span className="font-extrabold uppercase text-[9px] text-blue-700 dark:text-blue-400 block">Short Description</span>
                      <p className="leading-relaxed font-medium">{shortDescription}</p>
                    </div>
                  )}
                  {description && (
                    <div className="p-3 rounded-lg bg-muted/20 border border-border text-[11px] space-y-0.5">
                      <span className="font-extrabold uppercase text-[9px] text-muted-foreground block">Detailed Description / Learning Objectives</span>
                      <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Curriculum Navigation (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col p-4 bg-muted/20 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Course Curriculum
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">
                {displaySections.length} Sections
              </span>
            </div>

            {displaySections.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                No sections added yet. Add sections in the curriculum step to preview.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto pr-1">
                {displaySections.map((section, sIdx) => (
                  <div
                    key={section.id}
                    className="border border-border rounded-xl overflow-hidden bg-card shadow-sm"
                  >
                    <div
                      onClick={() => toggleSection(section.id)}
                      className="px-3.5 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-foreground truncate">
                        {expandedSections.includes(section.id) ? (
                          <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">
                          Section {sIdx + 1}: {section.title.replace(/^Section \d+:\s*/, "")}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                        {section.contents?.length || 0} items
                      </span>
                    </div>

                    {expandedSections.includes(section.id) && (
                      <div className="divide-y divide-border/60">
                        {section.contents?.map((cnt) => {
                          const isSelected = selectedLesson?.id === cnt.id;
                          return (
                            <div
                              key={cnt.id}
                              onClick={() => setSelectedLesson(cnt)}
                              className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/10 text-primary font-bold border-l-4 border-primary"
                                  : "text-foreground hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {cnt.contentType === "SCORM" ? (
                                  <Archive className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                ) : cnt.contentType === "YOUTUBE" ? (
                                  <Video className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                ) : cnt.contentType === "QUIZ" ? (
                                  <HelpCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                ) : cnt.contentType === "ASSIGNMENT" ? (
                                  <FileCheck2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                )}
                                <span className="truncate text-[11px]">{cnt.title}</span>
                              </div>

                              {cnt.contentType === "PPT" ? (
                                <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-1.5 py-0">PPT</Badge>
                              ) : cnt.contentType === "PDF" ? (
                                <Badge className="bg-red-500 text-white font-extrabold text-[9px] px-1.5 py-0">PDF</Badge>
                              ) : cnt.contentType === "SCORM" ? (
                                <Badge className="bg-violet-600 text-white font-extrabold text-[9px] px-1.5 py-0">SCORM</Badge>
                              ) : cnt.contentType === "YOUTUBE" ? (
                                <Badge className="bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0">YouTube</Badge>
                              ) : cnt.contentType === "QUIZ" ? (
                                <Badge className="bg-amber-600 text-white font-extrabold text-[9px] px-1.5 py-0">Quiz</Badge>
                              ) : cnt.contentType === "ASSIGNMENT" ? (
                                <Badge className="bg-purple-600 text-white font-extrabold text-[9px] px-1.5 py-0">Assignment</Badge>
                              ) : (
                                <Badge className="bg-slate-700 text-slate-200 font-bold text-[9px] px-1.5 py-0">{cnt.contentType}</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Modal Footer */}
      <div className="px-6 py-3 border-t border-border bg-card flex items-center justify-end shrink-0">
        <Button
          onClick={() => onOpenChange(false)}
          variant="outline"
          size="sm"
          className="text-xs font-semibold cursor-pointer"
        >
          Close Preview
        </Button>
      </div>

      {/* Interactive Feedback Survey Preview Modal */}
      {isFeedbackModalOpen && (
        <LearnerFeedbackModal
          open={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          courseId={1}
          contentId={selectedLesson?.id || null}
          feedbackTitle={selectedLesson?.title || "Course Evaluation & Feedback Form"}
          description={selectedLesson?.description || "Please share your review regarding course structure, content clarity, and instructor support."}
          questions={getFeedbackQuestions(selectedLesson)}
          onSuccess={() => {
            setIsFeedbackModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
