"use client";

import { useState, useEffect } from "react";
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
  Archive,
} from "lucide-react";
import AddSectionModal from "./AddSectionModal";
import ContentTypePickerModal, { ContentTypeKey } from "./ContentTypePickerModal";
import AddContentModal from "./AddContentModal";
import QuizBuilderModal from "./QuizBuilderModal";
import AssignmentBuilderModal from "./AssignmentBuilderModal";
import FeedbackBuilderModal from "./FeedbackBuilderModal";
import AdminSubmissionsReview from "./AdminSubmissionsReview";
import CoursePreviewModal from "./CoursePreviewModal";

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
  quizConfigJson?: string;
  assignmentConfigJson?: string;
}

interface CurriculumBuilderViewProps {
  courseTitle?: string;
  level?: string;
  category?: string;
  durationHours?: number;
  status?: "Draft" | "Published";
  sections?: SectionItem[];
  onSectionsChange?: (sections: SectionItem[]) => void;
}

export default function CurriculumBuilderView({
  courseTitle = "New Course",
  level = "Beginner",
  category = "Development",
  durationHours = 0,
  status = "Draft",
  sections: initialSections = [],
  onSectionsChange,
}: CurriculumBuilderViewProps) {
  const [sections, setSectionsState] = useState<SectionItem[]>(initialSections);

  useEffect(() => {
    if (initialSections && initialSections.length > 0) {
      setSectionsState(initialSections);
    }
  }, [initialSections]);

  // Modal States
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<ContentTypeKey | null>(null);
  const [addContentOpen, setAddContentOpen] = useState(false);
  const [quizBuilderOpen, setQuizBuilderOpen] = useState(false);
  const [assignmentBuilderOpen, setAssignmentBuilderOpen] = useState(false);
  const [feedbackBuilderOpen, setFeedbackBuilderOpen] = useState(false);
  const [submissionsReviewOpen, setSubmissionsReviewOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const updateSections = (updater: (prev: SectionItem[]) => SectionItem[]) => {
    setSectionsState((prev) => {
      const next = updater(prev);
      Promise.resolve().then(() => {
        if (onSectionsChange) {
          onSectionsChange(next);
        }
      });
      return next;
    });
  };

  const toggleSection = (id: number) => {
    updateSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s))
    );
  };

  const handleSaveSection = (title: string, description: string) => {
    if (editingSection) {
      updateSections((prev) =>
        prev.map((s) => (s.id === editingSection.id ? { ...s, title, description } : s))
      );
      setEditingSection(null);
    } else {
      const newSec: SectionItem = {
        id: Date.now(),
        title: title.startsWith("Section") ? title : `Section ${sections.length + 1}: ${title}`,
        description,
        expanded: true,
        contents: [],
      };
      updateSections((prev) => [...prev, newSec]);
    }
  };

  const handleDeleteSection = (secId: number) => {
    updateSections((prev) => prev.filter((s) => s.id !== secId));
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
    } else if (type === "FEEDBACK") {
      setFeedbackBuilderOpen(true);
    } else {
      setAddContentOpen(true);
    }
  };

  const [editingItem, setEditingItem] = useState<{ secId: number; item: ContentItem } | null>(null);

  const handleEditContent = (secId: number, item: ContentItem) => {
    setActiveSectionId(secId);
    setEditingItem({ secId, item });
    if (item.contentType === "QUIZ") {
      setQuizBuilderOpen(true);
    } else if (item.contentType === "ASSIGNMENT") {
      setAssignmentBuilderOpen(true);
    } else if (item.contentType === "FEEDBACK") {
      setFeedbackBuilderOpen(true);
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
    if (editingItem) {
      updateSections((prev) =>
        prev.map((s) =>
          s.id === activeSectionId
            ? {
                ...s,
                contents: s.contents.map((c) =>
                  c.id === editingItem.item.id
                    ? {
                        ...c,
                        title: data.title,
                        contentType: data.contentType as ContentTypeKey,
                        contentUrl: data.contentUrl,
                        description: data.description,
                        fileSize: data.fileSize,
                        duration: data.duration,
                      }
                    : c
                ),
              }
            : s
        )
      );
    } else {
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
      updateSections((prev) =>
        prev.map((s) =>
          s.id === activeSectionId
            ? { ...s, contents: [...s.contents, newItem] }
            : s
        )
      );
    }
    setEditingItem(null);
  };

  const handleSaveQuiz = (quizData: any) => {
    if (!activeSectionId) return;
    const quizConfigJson = JSON.stringify(quizData);
    if (editingItem) {
      updateSections((prev) =>
        prev.map((s) =>
          s.id === activeSectionId
            ? {
                ...s,
                contents: s.contents.map((c) =>
                  c.id === editingItem.item.id
                    ? {
                        ...c,
                        title: quizData.title,
                        questionsCount: quizData.questions ? quizData.questions.length : 0,
                        maxMarks: quizData.totalMarks || 100,
                        duration: quizData.durationMinutes || 15,
                        quizConfigJson,
                      }
                    : c
                ),
              }
            : s
        )
      );
    } else {
      const newItem: ContentItem = {
        id: Date.now(),
        title: quizData.title,
        contentType: "QUIZ",
        questionsCount: quizData.questions ? quizData.questions.length : 0,
        maxMarks: quizData.totalMarks || 100,
        duration: quizData.durationMinutes || 15,
        quizConfigJson,
        status: "Published",
      };
      updateSections((prev) =>
        prev.map((s) =>
          s.id === activeSectionId
            ? { ...s, contents: [...s.contents, newItem] }
            : s
        )
      );
    }
    setEditingItem(null);
  };

  const handleSaveAssignment = (assignmentData: any) => {
    if (!activeSectionId) return;
    const assignmentConfigJson = JSON.stringify(assignmentData);
    if (editingItem) {
      updateSections((prev) =>
        prev.map((s) =>
          s.id === activeSectionId
            ? {
                ...s,
                contents: s.contents.map((c) =>
                  c.id === editingItem.item.id
                    ? {
                        ...c,
                        title: assignmentData.title,
                        description: assignmentData.instructions || assignmentData.description,
                        dueDate: assignmentData.deadline,
                        maxMarks: assignmentData.maxMarks || 100,
                        assignmentConfigJson,
                      }
                    : c
                ),
              }
            : s
        )
      );
    } else {
      const newItem: ContentItem = {
        id: Date.now(),
        title: assignmentData.title,
        contentType: "ASSIGNMENT",
        description: assignmentData.instructions || assignmentData.description,
        dueDate: assignmentData.deadline,
        maxMarks: assignmentData.maxMarks || 100,
        assignmentConfigJson,
        status: "Draft",
      };
      updateSections((prev) =>
        prev.map((s) =>
          s.id === activeSectionId
            ? { ...s, contents: [...s.contents, newItem] }
            : s
        )
      );
    }
    setEditingItem(null);
  };

  const handleSaveFeedback = (feedbackData: any) => {
    if (!activeSectionId) return;
    const feedbackConfigJson = JSON.stringify(feedbackData);
    if (editingItem) {
      updateSections((prev) =>
        prev.map((s) =>
          s.id === activeSectionId
            ? {
                ...s,
                contents: s.contents.map((c) =>
                  c.id === editingItem.item.id
                    ? {
                        ...c,
                        title: feedbackData.title,
                        description: feedbackData.description,
                        questionsCount: feedbackData.questions ? feedbackData.questions.length : 0,
                        quizConfigJson: feedbackConfigJson,
                      }
                    : c
                ),
              }
            : s
        )
      );
    } else {
      const newItem: ContentItem = {
        id: Date.now(),
        title: feedbackData.title,
        contentType: "FEEDBACK",
        questionsCount: feedbackData.questions ? feedbackData.questions.length : 0,
        description: feedbackData.description,
        quizConfigJson: feedbackConfigJson,
        status: "Published",
      };
      updateSections((prev) =>
        prev.map((s) =>
          s.id === activeSectionId
            ? { ...s, contents: [...s.contents, newItem] }
            : s
        )
      );
    }
    setEditingItem(null);
  };

  const handleDeleteContent = (secId: number, contentId: number) => {
    updateSections((prev) =>
      prev.map((s) =>
        s.id === secId
          ? { ...s, contents: s.contents.filter((c) => c.id !== contentId) }
          : s
      )
    );
  };

  const getContentIcon = (type: ContentTypeKey) => {
    switch (type) {
      case "SCORM":
        return <Archive className="h-4 w-4 text-violet-500" />;
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
          <Button
            onClick={() => setAddSectionOpen(true)}
            size="sm"
            className="gap-2 bg-primary text-primary-foreground font-bold"
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
                    onClick={() => {
                      setEditingSection(section);
                      setAddSectionOpen(true);
                    }}
                    className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10 transition-colors"
                    title="Edit Section Title & Description"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-500/10 transition-colors"
                    title="Delete Section"
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
                            <button
                              onClick={() => handleEditContent(section.id, item)}
                              className="text-primary hover:text-primary/80 text-xs font-semibold px-1.5 py-0.5 rounded hover:bg-primary/10"
                              title="Edit item details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
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
        initialTitle={editingSection?.title}
        initialDescription={editingSection?.description}
        isEditing={Boolean(editingSection)}
        onOpenChange={(op) => {
          setAddSectionOpen(op);
          if (!op) setEditingSection(null);
        }}
        onSaveSection={handleSaveSection}
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
        initialData={editingItem?.item?.quizConfigJson ? (typeof editingItem.item.quizConfigJson === "string" ? JSON.parse(editingItem.item.quizConfigJson) : editingItem.item.quizConfigJson) : editingItem?.item}
        onSaveQuiz={handleSaveQuiz}
      />

      <AssignmentBuilderModal
        open={assignmentBuilderOpen}
        onOpenChange={setAssignmentBuilderOpen}
        initialData={editingItem?.item?.assignmentConfigJson ? (typeof editingItem.item.assignmentConfigJson === "string" ? JSON.parse(editingItem.item.assignmentConfigJson) : editingItem.item.assignmentConfigJson) : editingItem?.item}
        onSaveAssignment={handleSaveAssignment}
      />

      <FeedbackBuilderModal
        open={feedbackBuilderOpen}
        onOpenChange={setFeedbackBuilderOpen}
        initialData={editingItem?.item?.quizConfigJson ? (typeof editingItem.item.quizConfigJson === "string" ? JSON.parse(editingItem.item.quizConfigJson) : editingItem.item.quizConfigJson) : editingItem?.item}
        onSaveFeedback={handleSaveFeedback}
      />

      <AdminSubmissionsReview
        open={submissionsReviewOpen}
        onOpenChange={setSubmissionsReviewOpen}
        assignmentTitle="Java Mini Project"
        maxMarks={50}
      />

      <CoursePreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        courseTitle={courseTitle}
        level={level}
        category={category}
        durationHours={durationHours}
        sections={sections}
      />
    </div>
  );
}
