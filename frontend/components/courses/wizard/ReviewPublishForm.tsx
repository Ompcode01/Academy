"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCourse, updateCourse } from "@/services/api/course.service";
import { saveCertificateTemplate } from "@/services/api/certificate.service";
import {
  CheckCircle2,
  BookOpen,
  Layers,
  FileCheck,
  Award,
  Users,
  Eye,
  Rocket,
  Globe,
  Lock,
  MessageSquare,
} from "lucide-react";
import CoursePreviewModal from "../builder/CoursePreviewModal";

interface ReviewPublishFormProps {
  courseId?: string | null;
  wizardData: {
    basicInfo: {
      title: string;
      courseCode: string;
      departmentId: string;
      level: string;
      shortDescription: string;
      language: string;
      duration?: number;
      description: string;
      categoryId: string;
    };
    sections: any[];
    enrollment: {
      selfEnrollment: boolean;
      adminEnrollment: boolean;
      departmentAccess: string;
    };
    certificate: {
      enableCertificate: boolean;
      certificateTitle: string;
      passingThreshold: number;
    };
  };
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ReviewPublishForm({
  courseId,
  wizardData,
  onBack,
  onCancel,
}: ReviewPublishFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [loading, setLoading] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const { basicInfo, sections, enrollment, certificate } = wizardData;

  const totalContentCount = sections.reduce(
    (acc, s) => acc + (s.contents?.length || 0),
    0
  );

  const handlePublish = async () => {
    try {
      setLoading(true);
      const selectedType = (enrollment as any).enrollmentType || "SELF";
      const enrolledUserIdsPayload =
        selectedType === "SELF"
          ? []
          : ((enrollment as any).enrolledUsersList || []).map((u: any) => String(u.userId));

      // Prepare sections array ensuring feedback item incorporates Step 5 questions
      let processedSections = JSON.parse(JSON.stringify(sections || []));
      const fbData = (wizardData as any).feedback;
      if (fbData && fbData.enableFeedback !== false) {
        const feedbackConfigJson = JSON.stringify({
          title: fbData.feedbackTitle || "End-of-Course Feedback & Evaluation Survey",
          description: fbData.description || "",
          questions: fbData.questions || [],
        });

        let foundFb = false;
        for (const sec of processedSections) {
          if (sec.contents && Array.isArray(sec.contents)) {
            for (const cnt of sec.contents) {
              if (cnt.contentType?.toUpperCase() === "FEEDBACK") {
                cnt.title = fbData.feedbackTitle || cnt.title;
                cnt.description = fbData.description || cnt.description;
                
                let effectiveQuestions: any[] = fbData.questions || [];
                if (cnt.quizConfigJson) {
                  try {
                    const parsedCntConfig = typeof cnt.quizConfigJson === "string" ? JSON.parse(cnt.quizConfigJson) : cnt.quizConfigJson;
                    if (Array.isArray(parsedCntConfig.questions) && parsedCntConfig.questions.length > 0) {
                      if (effectiveQuestions.length === 0) {
                        effectiveQuestions = parsedCntConfig.questions;
                      }
                    }
                  } catch (e) {}
                }

                cnt.quizConfigJson = JSON.stringify({
                  title: fbData.feedbackTitle || cnt.title || "End-of-Course Feedback & Evaluation Survey",
                  description: fbData.description || cnt.description || "",
                  questions: effectiveQuestions,
                });
                foundFb = true;
              }
            }
          }
        }

        if (!foundFb) {
          processedSections.push({
            title: "Course Feedback & Evaluation",
            description: "End-of-course survey evaluation.",
            contents: [
              {
                title: fbData.feedbackTitle || "End-of-Course Feedback Survey",
                contentType: "FEEDBACK",
                description: fbData.description || "Please share your review regarding course structure, content clarity, and instructor support.",
                quizConfigJson: feedbackConfigJson,
                isMandatory: Boolean(fbData.requireFeedbackForCertificate),
              },
            ],
          });
        }
      }

      const payload = {
        title: basicInfo.title || "Java Programming",
        shortDescription: basicInfo.shortDescription || "Core Java fundamentals and secure development practices.",
        description: basicInfo.description,
        categoryId: basicInfo.categoryId ? Number(basicInfo.categoryId) : 1,
        departmentId: basicInfo.departmentId && basicInfo.departmentId !== "global" ? Number(basicInfo.departmentId) : null,
        thumbnail: (basicInfo as any).thumbnailUrl || (basicInfo as any).thumbnail || undefined,
        level: basicInfo.level || "Beginner",
        language: basicInfo.language || "English",
        duration: basicInfo.duration || 20,
        status: status,
        enrollmentType: selectedType,
        enrolledUserIds: enrolledUserIdsPayload,
        teacherIds: (enrollment as any).teacherIds || ["4"],
        sections: processedSections,
      };

      let res;
      if (courseId) {
        res = await updateCourse(Number(courseId), payload);
      } else {
        res = await createCourse(payload);
      }

      if (res?.success) {
        const targetCourseId = Number(courseId) || Number(res.data?.id);
        if (targetCourseId && certificate) {
          try {
            await saveCertificateTemplate(targetCourseId, {
              templateName: "Harbinger Classic Gold",
              headerTitle: certificate.certificateTitle || "CERTIFICATE",
              headerSubtitle: (certificate as any).headerSubtitle || "OF ACHIEVEMENT",
              certifyText: (certificate as any).certifyText || "This is to certify that",
              completionText: (certificate as any).completionText || "has successfully completed and passed the course",
              signatoryName: (certificate as any).signatoryName || "Richard Wilson",
              signatoryTitle: (certificate as any).signatoryTitle || "Authorized Director",
              signatureUrl: (certificate as any).signatureUrl || null,
              logoUrl: (certificate as any).logoUrl || null,
              customDate: (certificate as any).customDate || null,
              primaryColor: (certificate as any).primaryColor || "#d97706",
              enableCertificate: certificate.enableCertificate,
              passingThreshold: certificate.passingThreshold || 70,
            });
          } catch (certErr) {
            console.error("Certificate template save warning:", certErr);
          }
        }

        alert(
          status === "PUBLISHED"
            ? "🚀 Course successfully PUBLISHED! It is now live for learners on their dashboard with verifiable certificate configuration."
            : "💾 Course saved as DRAFT."
        );
        router.push("/courses");
      } else {
        alert(res?.message || "Failed to save course.");
      }
    } catch (err: any) {
      console.error("Publishing error:", err);
      alert(err?.response?.data?.message || "An error occurred while saving the course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Review &amp; Publish Course
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Review all course details, curriculum structure, and accessibility rules before publishing.
          </p>
        </div>

        <Button
          onClick={() => setPreviewModalOpen(true)}
          variant="outline"
          className="gap-2 text-xs border-primary/40 text-primary hover:bg-primary/10 font-bold shrink-0 cursor-pointer"
        >
          <Eye className="h-4 w-4" />
          Preview Course Player
        </Button>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Basic Information */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Basic Information
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {basicInfo.level || "Beginner"}
            </Badge>
          </div>
          <p className="text-sm font-bold text-foreground">{basicInfo.title || "Java Programming"}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {basicInfo.shortDescription || "Core Java fundamentals and secure coding."}
          </p>
          <div className="pt-2 text-xs text-muted-foreground flex flex-wrap gap-4">
            <span>Duration: <strong>{basicInfo.duration || 20} Hours</strong></span>
            <span>Language: <strong>{basicInfo.language || "English"}</strong></span>
          </div>
        </div>

        {/* Card 2: Curriculum Structure */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Curriculum Summary
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {sections.length} Sections
            </Badge>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Curriculum Sections:</span>
              <span className="font-bold text-foreground">{sections.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Lectures &amp; Activities:</span>
              <span className="font-bold text-foreground">{totalContentCount} Items</span>
            </div>
          </div>
        </div>

        {/* Card 3: Enrollment Rules */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Enrollment Rules
            </h3>
          </div>
          <div className="space-y-1 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Self-Enrollment: <strong>{enrollment.selfEnrollment ? "Enabled" : "Disabled"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Admin Assignment: <strong>{enrollment.adminEnrollment ? "Enabled" : "Disabled"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-blue-500" />
              <span>Business Unit Access: <strong>{enrollment.departmentAccess}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 4: Certificate */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Completion Certificate
            </h3>
          </div>
          <div className="space-y-1 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
              <span>Certificate Status: <strong>{certificate.enableCertificate ? "Enabled" : "Disabled"}</strong></span>
            </div>
            {certificate.enableCertificate && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Passing Threshold:</span>
                <strong className="text-foreground">{certificate.passingThreshold}% Score</strong>
              </div>
            )}
          </div>
        </div>

        {/* Card 5: Course Feedback & Evaluation */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2 md:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" /> Course Feedback &amp; Evaluation Survey
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {(wizardData as any).feedback?.enableFeedback !== false ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="space-y-1 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
              <span>Survey Status: <strong>{(wizardData as any).feedback?.enableFeedback !== false ? "Active & Configured" : "Disabled"}</strong></span>
            </div>
            {(wizardData as any).feedback?.enableFeedback !== false && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-muted-foreground">
                <div>Title: <strong className="text-foreground">{(wizardData as any).feedback?.feedbackTitle || "End-of-Course Feedback Survey"}</strong></div>
                <div>Questions: <strong className="text-foreground">{((wizardData as any).feedback?.questions || []).length || 3} Survey Items</strong></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lifecycle Status Selection */}
      <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="text-sm font-bold text-foreground">
          Select Course Status &amp; Visibility
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            onClick={() => setStatus("DRAFT")}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              status === "DRAFT"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-muted/20 hover:bg-muted/40"
            }`}
          >
            <input
              type="radio"
              name="courseStatus"
              checked={status === "DRAFT"}
              onChange={() => setStatus("DRAFT")}
              className="h-4 w-4 mt-1 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" /> Save as Draft
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Hidden from catalog directory. Admins can edit and publish later.
              </p>
            </div>
          </label>

          <label
            onClick={() => setStatus("PUBLISHED")}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              status === "PUBLISHED"
                ? "border-emerald-500 bg-emerald-500/5 shadow-sm"
                : "border-border bg-muted/20 hover:bg-muted/40"
            }`}
          >
            <input
              type="radio"
              name="courseStatus"
              checked={status === "PUBLISHED"}
              onChange={() => setStatus("PUBLISHED")}
              className="h-4 w-4 mt-1 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-500" /> Publish Course (Live)
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Immediately live &amp; visible to learners on their dashboard and catalog.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Stepper Footer */}
      <div className="flex items-center justify-between border-t border-border pt-5">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onBack}>
            &larr; Back
          </Button>
          <Button
            onClick={handlePublish}
            disabled={loading}
            className={`gap-2 font-bold text-white ${
              status === "PUBLISHED"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            <Rocket className="h-4 w-4" />
            {loading
              ? "Saving..."
              : status === "PUBLISHED"
              ? "Publish & Launch Course"
              : "Save as Draft"}
          </Button>
        </div>
      </div>

      {/* Interactive Course Preview Modal */}
      <CoursePreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        courseTitle={basicInfo.title}
        courseCode={basicInfo.courseCode || (basicInfo as any).code || "CO12"}
        department={(basicInfo as any).department || "Global"}
        category={(basicInfo as any).category || "General"}
        shortDescription={basicInfo.shortDescription}
        description={basicInfo.description}
        level={basicInfo.level}
        durationHours={basicInfo.duration}
        sections={sections}
        enrollment={enrollment}
        certificate={certificate}
        feedback={(wizardData as any).feedback}
      />
    </div>
  );
}
