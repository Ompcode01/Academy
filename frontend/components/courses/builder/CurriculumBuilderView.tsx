"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Video,
  GraduationCap,
  FileText,
  Presentation,
  FileCode,
  FileCheck,
  HelpCircle,
  Link as LinkIcon,
  Sparkles,
  Award,
  Eye,
  Clock,
  BookOpen,
} from "lucide-react";
import AddSectionModal from "./AddSectionModal";
import ContentTypePickerModal, { ContentTypeKey } from "./ContentTypePickerModal";
import AddContentModal from "./AddContentModal";
import QuizBuilderModal from "./QuizBuilderModal";
import AssignmentBuilderModal from "./AssignmentBuilderModal";
import AdminSubmissionsReview from "./AdminSubmissionsReview";

export interface SectionItem {
  id: number;
  title: string;
  description?: string;
  expanded: boolean;
  contents: ContentItem[];
}

export interface ContentItem {
  id: number;
  title: string;
  contentType: ContentTypeKey;
  contentUrl?: string;
  description?: string;
  fileSize?: string;
  duration?: number;
  dueDate?: string;
  maxMarks?: number;
  questionsCount?: number;
  status?: "Draft" | "Published";
}

interface CurriculumBuilderViewProps {
  courseTitle?: string;
  level?: string;
  category?: string;
  durationHours?: number;
  status?: "Draft" | "Published";
}

export default function CurriculumBuilderView({
  courseTitle = "New Course",
  level = "Beginner",
  category = "Development",
  durationHours = 0,
  status = "Draft",
}: CurriculumBuilderViewProps) {
  const [sections, setSections] = useState<SectionItem[]>([]);

  // Modal States
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<ContentTypeKey | null>(null);
  const [addContentOpen, setAddContentOpen] = useState(false);
  const [quizBuilderOpen, setQuizBuilderOpen] = useState(false);
  const [assignmentBuilderOpen, setAssignmentBuilderOpen] = useState(false);
  const [submissionsReviewOpen, setSubmissionsReviewOpen] = useState(false);

  const toggleSection = (id: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s))
    );
  };

  const handleAddSection = (title: string, description: string) => {
    const newSec: SectionItem = {
      id: Date.now(),
      title: `Section ${sections.length + 1}: ${title}`,
      description,
      expanded: true,
      contents: [],
    };
    setSections((prev) => [...prev, newSec]);
  };

  const handleDeleteSection = (secId: number) => {
    setSections((prev) => prev.filter((s) => s.id !== secId));
  };

  const handleOpenPicker = (secId: number) => {
    setActiveSectionId(secId);
    setPickerOpen(true);
  };

  const handleSelectContentType = (type: ContentTypeKey) => {
    setSelectedContentType(type);
    if (type === "QUIZ") {
      setQuizBuilderOpen(true);
    } else if (type === "ASSIGNMENT") {
      setAssignmentBuilderOpen(true);
    } else {
      setAddContentOpen(true);
    }
  };

  const handleSaveGeneralContent = (data: {
    title: string;
    contentType: string;
    contentUrl?: string;
    description?: string;
    fileSize?: string;
    duration?: number;
  }) => {
    if (!activeSectionId) return;
    const newItem: ContentItem = {
      id: Date.now(),
      title: data.title,
      contentType: data.contentType as ContentTypeKey,
      contentUrl: data.contentUrl,
      description: data.description,
      fileSize: data.fileSize,
      duration: data.duration,
      status: "Published",
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSectionId
          ? { ...s, contents: [...s.contents, newItem] }
          : s
      )
    );
  };

  const handleSaveQuiz = (quizData: any) => {
    if (!activeSectionId) return;
    const newItem: ContentItem = {
      id: Date.now(),
      title: quizData.title,
      contentType: "QUIZ",
      questionsCount: quizData.questions.length,
      maxMarks: quizData.totalMarks,
      duration: quizData.durationMinutes,
      status: "Published",
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSectionId
          ? { ...s, contents: [...s.contents, newItem] }
          : s
      )
    );
  };

  const handleSaveAssignment = (assignmentData: any) => {
    if (!activeSectionId) return;
    const newItem: ContentItem = {
      id: Date.now(),
      title: assignmentData.title,
      contentType: "ASSIGNMENT",
      dueDate: assignmentData.deadline,
      maxMarks: assignmentData.maxMarks,
      status: "Draft",
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSectionId
          ? { ...s, contents: [...s.contents, newItem] }
          : s
      )
    );
  };

  const handleDeleteContent = (secId: number, contentId: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === secId
          ? { ...s, contents: s.contents.filter((c) => c.id !== contentId) }
          : s
      )
    );
  };

  const getContentIcon = (type: ContentTypeKey) => {
    switch (type) {
      case "YOUTUBE":
        return <Video className="h-4 w-4 text-red-500" />;
      case "UDEMY":
        return <GraduationCap className="h-4 w-4 text-purple-500" />;
      case "PDF":
      case "PPT":
      case "ARTICLE":
        return <FileText className="h-4 w-4 text-rose-500" />;
      case "ASSIGNMENT":
        return <FileCheck className="h-4 w-4 text-blue-500" />;
      case "QUIZ":
        return <HelpCircle className="h-4 w-4 text-indigo-500" />;
      default:
        return <LinkIcon className="h-4 w-4 text-cyan-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">{courseTitle}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                  status === "Published"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
              <span>Level: <strong>{level}</strong></span>
              <span>•</span>
              <span>Category: <strong>{category}</strong></span>
              <span>•</span>
              <span>Duration: <strong>{durationHours} Hours</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Eye className="h-4 w-4" /> Preview Course
          </Button>
          <Button
            onClick={() => setAddSectionOpen(true)}
            size="sm"
            className="gap-2 bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add Section
          </Button>
        </div>
      </div>

      {/* Main Grid: Builder + Curriculum Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sections List */}
        <div className="lg:col-span-3 space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-sm"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between p-4 bg-muted/20 border-b border-border">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    {section.expanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground mr-2">
                    {section.contents.length} items
                  </span>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Section Content Items */}
              {section.expanded && (
                <div className="p-4 space-y-3">
                  {section.contents.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-border rounded-xl">
                      <p className="text-xs text-muted-foreground">No content added yet!</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        Add videos, PDFs, articles, quizzes, or assignments.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {section.contents.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 hover:border-primary/40 transition-all text-xs"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="p-2 rounded-lg bg-card border border-border">
                              {getContentIcon(item.contentType)}
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-foreground block truncate">
                                {item.title}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                {item.duration && <span>{item.duration} Min</span>}
                                {item.fileSize && <span>{item.fileSize}</span>}
                                {item.questionsCount && (
                                  <span>{item.questionsCount} Questions • {item.maxMarks} Marks</span>
                                )}
                                {item.dueDate && (
                                  <span>Due: {item.dueDate} • Max Marks: {item.maxMarks}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.contentType === "ASSIGNMENT" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSubmissionsReviewOpen(true)}
                                className="h-7 text-[11px] gap-1 text-blue-500 border-blue-500/30"
                              >
                                Review Submissions
                              </Button>
                            )}
                            <button
                              onClick={() => handleDeleteContent(section.id, item.id)}
                              className="text-red-500 hover:text-red-600 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Content Button */}
                  <Button
                    onClick={() => handleOpenPicker(section.id)}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-dashed text-xs text-primary border-primary/40 hover:bg-primary/5 py-2.5"
                  >
                    <Plus className="h-4 w-4" /> + Add Content / Lecture
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Add Section Button */}
          <Button
            onClick={() => setAddSectionOpen(true)}
            variant="outline"
            className="w-full py-6 border-dashed border-2 gap-2 text-sm font-bold text-primary border-primary/40 hover:bg-primary/5"
          >
            <Plus className="h-5 w-5" /> + Add Section
          </Button>
        </div>

        {/* Sidebar Tips */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Curriculum Tips
            </h4>
            <ul className="text-xs text-muted-foreground space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                Create structured sections to organize learning paths effectively.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                Combine videos, PDFs, interactive quizzes, and coding assignments.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                Add MCQ, Short Answer, or True/False questions in Quizzes.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                Configure file types and max file sizes for assignment submissions.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddSectionModal
        open={addSectionOpen}
        onOpenChange={setAddSectionOpen}
        onAddSection={handleAddSection}
      />

      <ContentTypePickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelectType={handleSelectContentType}
      />

      <AddContentModal
        open={addContentOpen}
        type={selectedContentType}
        onOpenChange={setAddContentOpen}
        onSaveContent={handleSaveGeneralContent}
      />

      <QuizBuilderModal
        open={quizBuilderOpen}
        onOpenChange={setQuizBuilderOpen}
        onSaveQuiz={handleSaveQuiz}
      />

      <AssignmentBuilderModal
        open={assignmentBuilderOpen}
        onOpenChange={setAssignmentBuilderOpen}
        onSaveAssignment={handleSaveAssignment}
      />

      <AdminSubmissionsReview
        open={submissionsReviewOpen}
        onOpenChange={setSubmissionsReviewOpen}
        assignmentTitle="Java Mini Project"
        maxMarks={50}
      />
    </div>
  );
}
