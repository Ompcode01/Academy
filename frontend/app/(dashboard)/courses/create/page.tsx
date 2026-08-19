"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WizardStepper from "@/components/courses/wizard/WizardStepper";
import BasicInfoForm, { BasicInfoData } from "@/components/courses/wizard/BasicInfoForm";
import ModulesForm from "@/components/courses/wizard/ModulesForm";
import AssessmentsForm from "@/components/courses/wizard/AssessmentsForm";
import EnrollmentForm, { EnrollmentRuleData } from "@/components/courses/wizard/EnrollmentForm";
import CertificateForm, { CertificateRuleData } from "@/components/courses/wizard/CertificateForm";
import FeedbackStepForm, { FeedbackRuleData } from "@/components/courses/wizard/FeedbackStepForm";
import ReviewPublishForm from "@/components/courses/wizard/ReviewPublishForm";
import { getCourseById, createCourse, updateCourse } from "@/services/api/course.service";
import { buildCoursePayload, hasDraftWorthSaving } from "@/lib/courseWizardPayload";
import { useAuthStore } from "@/store/auth.store";
import { getBaseURL } from "@/services/api/auth.service";
import { ROLES } from "@/lib/rbac";
import toast from "react-hot-toast";
import { getCourseDisplayTitle, generateAutoCourseCode } from "@/lib/courseTitleHelper";
import HarbingerConfirmModal from "@/components/common/HarbingerConfirmModal";

const wizardSteps = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Curriculum & Content" },
  { number: 3, label: "Assessments" },
  { number: 4, label: "Enrollment" },
  { number: 5, label: "Course Feedback" },
  { number: 6, label: "Certificate" },
  { number: 7, label: "Review & Publish" },
];

function CreateCourseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState(1);

  // The course row this wizard writes to. It starts as the ?id= being edited,
  // but a brand-new course also acquires one the moment its first draft is
  // autosaved, so every later save updates that same row instead of piling up
  // duplicate drafts.
  const [draftId, setDraftId] = useState<string | null>(courseId);

  // Only unfinished work is autosaved as a draft. Re-editing an already
  // published course must never silently demote it back to DRAFT, so the loaded
  // status decides whether autosave is allowed at all.
  const [isDraftCourse, setIsDraftCourse] = useState(!courseId);

  // Persistent Wizard State Container
  const [wizardState, setWizardState] = useState<{
    basicInfo: BasicInfoData;
    sections: any[];
    enrollment: EnrollmentRuleData;
    feedback: FeedbackRuleData;
    certificate: CertificateRuleData;
  }>({
    basicInfo: {
      title: "",
      courseCode: "",
      departmentId: "",
      level: "Beginner",
      shortDescription: "",
      language: "English",
      duration: undefined,
      description: "",
      categoryId: "",
    },
    sections: [],
    enrollment: {
      selfEnrollment: true,
      adminEnrollment: false,
      enrollmentType: "SELF",
      departmentAccess: "ALL",
      enrolledUsersList: [],
    },
    feedback: {
      enableFeedback: true,
      requireFeedbackForCertificate: true,
      feedbackTitle: "End-of-Course Feedback & Evaluation Survey",
      description: "Please share your review regarding course structure, content clarity, and instructor support.",
      questions: [
        {
          id: 1,
          questionText: "How satisfied are you with the course content and instructor explanations?",
          questionType: "MCQ",
          options: ["Excellent", "Good", "Average", "Needs Improvement"],
          isMandatory: true,
        },
        {
          id: 2,
          questionText: "How well did the practical exercises help reinforce your learning?",
          questionType: "MCQ",
          options: ["Extremely Helpful", "Moderately Helpful", "Neutral", "Not Helpful"],
          isMandatory: true,
        },
        {
          id: 3,
          questionText: "What suggestions do you have for improving this course module?",
          questionType: "WRITTEN",
          isMandatory: false,
        },
      ],
    },
    certificate: {
      enableCertificate: true,
      certificateTitle: "Certificate of Completion",
      passingThreshold: 70,
    },
  });

  const { user } = useAuthStore();
  const userRole = user?.role || ROLES.LEARNER;
  const isLearnerOrGuest = userRole === ROLES.LEARNER || userRole === ROLES.GUEST;
  const isTeacher = userRole === ROLES.TEACHER;

  useEffect(() => {
    if (isLearnerOrGuest) {
      router.replace("/courses");
    } else if (isTeacher && !courseId) {
      toast.error("Teachers cannot create new courses. You can edit your assigned courses.");
      router.replace("/courses");
    }
  }, [isLearnerOrGuest, isTeacher, courseId, router]);

  if (isLearnerOrGuest || (isTeacher && !courseId)) {
    return (
      <div className="p-12 text-center text-[#6C757D] font-bold text-sm">
        Access Denied. Redirecting to course catalog...
      </div>
    );
  }

  useEffect(() => {
    if (courseId) {
      getCourseById(Number(courseId))
        .then((res) => {
          if (res?.success && res.data) {
            const c = res.data;
            
            // Extract feedback questions from sections if present
            let extractedFbQuestions: any[] = [];
            let extractedFbTitle = "End-of-Course Feedback & Evaluation Survey";
            let extractedFbDesc = "Please share your review regarding course structure, content clarity, and instructor support.";

            if (c.sections && Array.isArray(c.sections)) {
              for (const sec of c.sections) {
                if (sec.contents && Array.isArray(sec.contents)) {
                  for (const cnt of sec.contents) {
                    if (cnt.contentType?.toUpperCase() === "FEEDBACK") {
                      extractedFbTitle = cnt.title || extractedFbTitle;
                      extractedFbDesc = cnt.description || extractedFbDesc;
                      const raw = cnt.quizConfigJson || (cnt as any).configJson;
                      if (raw) {
                        try {
                          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                          if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                            extractedFbQuestions = parsed.questions;
                          }
                        } catch (e) {}
                      }
                    }
                  }
                }
              }
            }

            // Resume an unfinished course exactly where its author left off.
            setIsDraftCourse(c.status === "DRAFT");
            if (c.status === "DRAFT" && c.draftStep) {
              setCurrentStep(Math.min(Math.max(Number(c.draftStep), 1), wizardSteps.length));
            }

            setWizardState((prev) => ({
              ...prev,
              basicInfo: {
                title: c.title || "",
                shortName: c.shortName || "",
                courseCode: c.courseCode || generateAutoCourseCode(c.title || "", c.shortName) || "",
                departmentId: c.departmentId ? String(c.departmentId) : "global",
                level: c.level || "Beginner",
                shortDescription: c.shortDescription || "",
                language: c.language || "English",
                duration: c.duration || 20,
                description: c.description || "",
                categoryId: c.categoryId ? String(c.categoryId) : "1",
              },
              sections: c.sections || [],
              enrollment: {
                selfEnrollment: !c.enrollmentType || c.enrollmentType === "SELF",
                adminEnrollment: c.enrollmentType === "ADMIN" || c.enrollmentType === "BULK",
                enrollmentType: (c.enrollmentType as any) || "SELF",
                departmentAccess: "ALL",
                enrolledUsersList: [],
              },
              feedback: {
                enableFeedback: true,
                requireFeedbackForCertificate: true,
                feedbackTitle: extractedFbTitle,
                description: extractedFbDesc,
                questions: extractedFbQuestions.length > 0 ? extractedFbQuestions : prev.feedback.questions,
              },
            }));
          }
        })
        .catch(console.error);
    } else {
      // Clean state for fresh course creation
      setWizardState({
        basicInfo: {
          title: "",
          courseCode: "",
          departmentId: "",
          level: "Beginner",
          shortDescription: "",
          language: "English",
          duration: undefined,
          description: "",
          categoryId: "",
        },
        sections: [],
        enrollment: {
          selfEnrollment: true,
          adminEnrollment: false,
          enrollmentType: "SELF",
          departmentAccess: "ALL",
          enrolledUsersList: [],
        },
        feedback: {
          enableFeedback: true,
          requireFeedbackForCertificate: true,
          feedbackTitle: "End-of-Course Feedback & Evaluation Survey",
          description: "Please share your review regarding course structure, content clarity, and instructor support.",
          questions: [
            {
              id: 1,
              questionText: "How satisfied are you with the course content and instructor explanations?",
              questionType: "MCQ",
              options: ["Excellent", "Good", "Average", "Needs Improvement"],
              isMandatory: true,
            },
            {
              id: 2,
              questionText: "How well did the practical exercises help reinforce your learning?",
              questionType: "MCQ",
              options: ["Extremely Helpful", "Moderately Helpful", "Neutral", "Not Helpful"],
              isMandatory: true,
            },
            {
              id: 3,
              questionText: "What suggestions do you have for improving this course module?",
              questionType: "WRITTEN",
              isMandatory: false,
            },
          ],
        },
        certificate: {
          enableCertificate: true,
          certificateTitle: "Certificate of Completion",
          passingThreshold: 70,
        },
      });
    }
  }, [courseId]);

  // Latest wizard state, readable from unmount / page-exit handlers that would
  // otherwise close over a stale snapshot.
  const latestRef = useRef({ wizardState, currentStep, draftId, isDraftCourse });
  useEffect(() => {
    latestRef.current = { wizardState, currentStep, draftId, isDraftCourse };
  }, [wizardState, currentStep, draftId, isDraftCourse]);

  const savingRef = useRef(false);

  /**
   * Persist the unfinished course as a DRAFT, tagged with the step it was left
   * on. Called whenever the author leaves the builder without publishing -
   * cancelling, backing out of the first step, or closing the tab - so partial
   * work survives instead of being discarded.
   */
  const saveDraft = useCallback(async (): Promise<string | null> => {
    const { wizardState: state, currentStep: step, draftId: id, isDraftCourse: draft } =
      latestRef.current;

    // Never demote a published course, never save a blank slate, and never let
    // two saves race each other into duplicate rows.
    if (!draft || savingRef.current || !hasDraftWorthSaving(state as any)) return id;

    savingRef.current = true;
    try {
      const payload = buildCoursePayload(state as any, { status: "DRAFT", draftStep: step });
      const res = id
        ? await updateCourse(Number(id), payload)
        : await createCourse(payload);

      if (res?.success) {
        const savedId = String(id || res.data?.id || "");
        if (savedId && savedId !== id) setDraftId(savedId);
        return savedId || null;
      }
      return id;
    } catch (err) {
      console.error("Draft autosave failed:", err);
      return id;
    } finally {
      savingRef.current = false;
    }
  }, []);

  // Closing or reloading the tab mid-build is just another way of abandoning
  // the course, so checkpoint it on the way out. keepalive lets the request
  // outlive the page; a normal fetch would be cancelled.
  useEffect(() => {
    const handleBeforeUnload = () => {
      const { wizardState: state, currentStep: step, draftId: id, isDraftCourse: draft } =
        latestRef.current;
      if (!draft || !hasDraftWorthSaving(state as any)) return;

      const payload = buildCoursePayload(state as any, { status: "DRAFT", draftStep: step });
      const token = useAuthStore.getState().token;
      const base = getBaseURL();
      try {
        fetch(id ? `${base}/courses/${id}` : `${base}/courses`, {
          method: id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch (_) {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const updateBasicInfo = (updated: Partial<BasicInfoData>) => {
    setWizardState((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, ...updated },
    }));
  };

  const updateEnrollment = (updated: Partial<EnrollmentRuleData>) => {
    setWizardState((prev) => ({
      ...prev,
      enrollment: { ...prev.enrollment, ...updated },
    }));
  };

  const updateFeedback = (updated: Partial<FeedbackRuleData>) => {
    setWizardState((prev) => ({
      ...prev,
      feedback: { ...prev.feedback, ...updated },
    }));
  };

  const updateCertificate = (updated: Partial<CertificateRuleData>) => {
    setWizardState((prev) => ({
      ...prev,
      certificate: { ...prev.certificate, ...updated },
    }));
  };

  const [validationModal, setValidationModal] = useState<{ open: boolean; title: string; description: string } | null>(null);

  const validateStep = (targetStep: number): boolean => {
    if (targetStep <= currentStep) return true;

    const { title, shortDescription, categoryId } = wizardState.basicInfo;
    if (!title || title.trim().length < 3) {
      setValidationModal({
        open: true,
        title: "Required Step Incomplete",
        description: "Please fill out Course Name (minimum 3 characters) in Step 1 before proceeding to the next step.",
      });
      return false;
    }
    if (!shortDescription || shortDescription.trim().length < 5) {
      setValidationModal({
        open: true,
        title: "Required Step Incomplete",
        description: "Please fill out Short Description (minimum 5 characters) in Step 1 before proceeding to the next step.",
      });
      return false;
    }
    if (!categoryId) {
      setValidationModal({
        open: true,
        title: "Required Step Incomplete",
        description: "Please select a Category in Step 1 before proceeding to the next step.",
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep + 1)) return;
    if (currentStep < wizardSteps.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Checkpoint each completed step, so an abrupt exit later (a crash, a
      // closed laptop) still leaves the course saved at the furthest point.
      latestRef.current = { ...latestRef.current, currentStep: nextStep };
      void saveDraft();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      latestRef.current = { ...latestRef.current, currentStep: prevStep };
      void saveDraft();
    } else {
      // Backing out of the first step leaves the builder entirely.
      void handleCancel();
    }
  };

  const handleCancel = async () => {
    // Cancelling abandons the course but not the work: whatever was filled in
    // is kept as a draft, resumable from this exact step.
    await saveDraft();
    router.push("/courses");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoForm
            data={wizardState.basicInfo}
            onChange={updateBasicInfo}
            onNext={handleNext}
            onCancel={handleCancel}
          />
        );
      case 2:
        const categoryMap: Record<string, string> = {
          "1": "Technical",
          "2": "Soft Skill",
          "3": "Process/Compliances",
          "4": "Leadership",
        };
        return (
          <ModulesForm
            sections={wizardState.sections}
            courseTitle={wizardState.basicInfo.title}
            shortName={wizardState.basicInfo.shortName}
            level={wizardState.basicInfo.level}
            category={categoryMap[wizardState.basicInfo.categoryId] || "Development"}
            durationHours={wizardState.basicInfo.duration || 0}
            status={draftId ? "Published" : "Draft"}
            onSectionsChange={(newSections) =>
              setWizardState((prev) => ({ ...prev, sections: newSections }))
            }
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 3:
        return (
          <AssessmentsForm
            sections={wizardState.sections}
            onSectionsChange={(newSections) =>
              setWizardState((prev) => ({ ...prev, sections: newSections }))
            }
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 4:
        return (
          <EnrollmentForm
            courseId={draftId}
            data={wizardState.enrollment}
            onChange={updateEnrollment}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 5:
        return (
          <FeedbackStepForm
            data={wizardState.feedback}
            onChange={updateFeedback}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 6:
        return (
          <CertificateForm
            data={wizardState.certificate}
            courseTitle={wizardState.basicInfo.title}
            onChange={updateCertificate}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 7:
        return (
          <ReviewPublishForm
            courseId={draftId}
            wizardData={wizardState}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {courseId
            ? `Edit Course: ${getCourseDisplayTitle(wizardState.basicInfo.title, wizardState.basicInfo.shortName) || "Course"}`
            : "Create New Course"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure basic details, curriculum, assessments, enrollment, certificate, and publish to learner dashboard.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="mb-8 overflow-x-auto rounded-xl border border-border bg-card px-6 py-4">
        <WizardStepper
          steps={wizardSteps}
          currentStep={currentStep}
          onStepClick={(targetStep) => {
            if (validateStep(targetStep)) {
              setCurrentStep(targetStep);
            }
          }}
        />
      </div>

      {/* Active Step Form Container */}
      <div className="rounded-xl border border-border bg-card p-6">
        {renderStepContent()}
      </div>

      {/* Validation Error Popup Modal (No Cancel Button, Red Warning Icon) */}
      {validationModal && (
        <HarbingerConfirmModal
          open={validationModal.open}
          onOpenChange={(open) => {
            if (!open) setValidationModal(null);
          }}
          title={validationModal.title}
          description={validationModal.description}
          confirmLabel="OK"
          showCancelButton={false}
          variant="danger"
        />
      )}
    </div>
  );
}

export default function CreateCoursePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading course builder...</div>}>
      <CreateCourseContent />
    </Suspense>
  );
}
