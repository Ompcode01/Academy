"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WizardStepper from "@/components/courses/wizard/WizardStepper";
import BasicInfoForm from "@/components/courses/wizard/BasicInfoForm";
import ModulesForm from "@/components/courses/wizard/ModulesForm";
import AssessmentsForm from "@/components/courses/wizard/AssessmentsForm";

const wizardSteps = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Modules" },
  { number: 3, label: "Lessons" },
  { number: 4, label: "Content" },
  { number: 5, label: "Assessments" },
  { number: 6, label: "Resources" },
  { number: 7, label: "Enrollment" },
  { number: 8, label: "Certificate" },
  { number: 9, label: "Review" },
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

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
        return <BasicInfoForm onNext={handleNext} onCancel={handleCancel} />;
      case 2:
      case 3:
        return (
          <ModulesForm
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 5:
        return (
          <AssessmentsForm
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-lg font-semibold text-foreground">
                {wizardSteps[currentStep - 1]?.label}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                This step is coming soon.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={handleBack}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Save &amp; Next
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Create New Course
        </h1>
      </div>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto rounded-xl border border-border bg-card px-6 py-4">
        <WizardStepper
          steps={wizardSteps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {renderStepContent()}
      </div>
    </div>
  );
}
