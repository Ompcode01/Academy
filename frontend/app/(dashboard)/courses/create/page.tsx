"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WizardStepper from "@/components/courses/wizard/WizardStepper";
import BasicInfoForm, { BasicInfoData } from "@/components/courses/wizard/BasicInfoForm";
import ModulesForm from "@/components/courses/wizard/ModulesForm";
import AssessmentsForm from "@/components/courses/wizard/AssessmentsForm";
import EnrollmentForm, { EnrollmentRuleData } from "@/components/courses/wizard/EnrollmentForm";
import CertificateForm, { CertificateRuleData } from "@/components/courses/wizard/CertificateForm";
import ReviewPublishForm from "@/components/courses/wizard/ReviewPublishForm";
import { getCourseById } from "@/services/api/course.service";

const wizardSteps = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Curriculum & Content" },
  { number: 3, label: "Assessments" },
  { number: 4, label: "Enrollment" },
  { number: 5, label: "Certificate" },
  { number: 6, label: "Review & Publish" },
];

function CreateCourseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState(1);

  // Persistent Wizard State Container
  const [wizardState, setWizardState] = useState<{
    basicInfo: BasicInfoData;
    sections: any[];
    enrollment: EnrollmentRuleData;
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
      adminEnrollment: true,
      departmentAccess: "ALL",
    },
    certificate: {
      enableCertificate: true,
      certificateTitle: "Certificate of Completion",
      passingThreshold: 70,
    },
  });

  useEffect(() => {
    if (courseId) {
      getCourseById(Number(courseId))
        .then((res) => {
          if (res?.success && res.data) {
            const c = res.data;
            setWizardState((prev) => ({
              ...prev,
              basicInfo: {
                title: c.title || "",
                courseCode: `DPU-COURSE-${c.id}`,
                departmentId: c.departmentId ? String(c.departmentId) : "global",
                level: c.level || "Beginner",
                shortDescription: c.shortDescription || "",
                language: c.language || "English",
                duration: c.duration || 20,
                description: c.description || "",
                categoryId: c.categoryId ? String(c.categoryId) : "1",
              },
              sections: c.sections || [],
            }));
          }
        })
        .catch(console.error);
    }
  }, [courseId]);

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

  const updateCertificate = (updated: Partial<CertificateRuleData>) => {
    setWizardState((prev) => ({
      ...prev,
      certificate: { ...prev.certificate, ...updated },
    }));
  };

  const handleNext = () => {
    if (currentStep < wizardSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
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
        return (
          <ModulesForm
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 3:
        return (
          <AssessmentsForm
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 4:
        return (
          <EnrollmentForm
            courseId={courseId}
            data={wizardState.enrollment}
            onChange={updateEnrollment}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 5:
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
      case 6:
        return (
          <ReviewPublishForm
            courseId={courseId}
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
          {courseId ? `Edit Course: ${wizardState.basicInfo.title || "Course"}` : "Create New Course"}
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
          onStepClick={setCurrentStep}
        />
      </div>

      {/* Active Step Form Container */}
      <div className="rounded-xl border border-border bg-card p-6">
        {renderStepContent()}
      </div>
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
