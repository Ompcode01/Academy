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
import { MessageSquare } from "lucide-react";

interface CoursePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle?: string;
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
  level = "Beginner",
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
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span className="flex items-center gap-1.5 font-medium text-violet-600 dark:text-violet-400">
                          <Archive className="h-4 w-4" /> Interactive SCORM Content
                        </span>
                        {selectedLesson.contentUrl && (
                          <button
                            onClick={() => window.open(getStorageUrl(selectedLesson.contentUrl?.trim()), "_blank")}
                            className="hover:underline flex items-center gap-1 text-xs text-primary font-medium"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Fullscreen
                          </button>
                        )}
                      </div>
                      <div className="w-full h-[380px] bg-card rounded-xl border border-border shadow-inner overflow-hidden relative">
                        <iframe
                          src={getStorageUrl(selectedLesson.contentUrl)}
                          className="w-full h-full border-0"
                          title={selectedLesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : selectedLesson.contentType === "YOUTUBE" && selectedLesson.contentUrl ? (
                    <div className="w-full h-[360px] bg-black rounded-xl overflow-hidden border border-border shadow-lg">
                      <iframe
                        src={
                          selectedLesson.contentUrl.includes("watch?v=")
                            ? selectedLesson.contentUrl.replace("watch?v=", "embed/")
                            : selectedLesson.contentUrl.includes("youtu.be/")
                            ? selectedLesson.contentUrl.replace("youtu.be/", "www.youtube.com/embed/")
                            : selectedLesson.contentUrl
                        }
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
                      description={selectedLesson.description}
                      configJson={(selectedLesson as any).assignmentConfigJson || (selectedLesson as any).configJson}
                      isPreview={true}
                      onNextLesson={() => {
                        if (nextLesson) setSelectedLesson(nextLesson);
                      }}
                    />
                  ) : selectedLesson.contentType?.toUpperCase() === "FEEDBACK" ? (
                    <div className="p-8 bg-card border border-amber-500/30 rounded-2xl text-center space-y-4 my-auto shadow-md">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <MessageSquare className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{selectedLesson.title}</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
                          {selectedLesson.description || "Please share your review regarding course structure, content clarity, and instructor support."}
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsFeedbackModalOpen(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-2 px-6 h-10 shadow cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4" /> Launch Interactive Survey Preview
                      </Button>
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
                    <strong className="text-foreground block mb-1">Description:</strong>
                    {selectedLesson.description}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
                <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">No Lesson Selected</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a section or lecture from the right curriculum menu to preview.
                  </p>
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
      {selectedLesson?.contentType?.toUpperCase() === "FEEDBACK" && isFeedbackModalOpen && (
        <LearnerFeedbackModal
          open={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          courseId={1}
          contentId={selectedLesson.id}
          feedbackTitle={selectedLesson.title}
          description={selectedLesson.description}
          questions={(() => {
            try {
              const raw = (selectedLesson as any).quizConfigJson || (selectedLesson as any).configJson;
              if (raw) {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                if (Array.isArray(parsed.questions) && parsed.questions.length > 0) return parsed.questions;
              }
            } catch {}
            return undefined;
          })()}
          onSuccess={() => {
            setIsFeedbackModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
