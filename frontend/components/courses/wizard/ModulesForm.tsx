"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CurriculumBuilderView, { SectionItem } from "../builder/CurriculumBuilderView";

interface ModulesFormProps {
  sections?: SectionItem[];
  courseTitle?: string;
  shortName?: string;
  level?: string;
  category?: string;
  durationHours?: number;
  status?: "Draft" | "Published";
  onSectionsChange?: (sections: SectionItem[]) => void;
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ModulesForm({
  sections,
  courseTitle,
  shortName,
  level,
  category,
  durationHours,
  status,
  onSectionsChange,
  onNext,
  onBack,
  onCancel,
}: ModulesFormProps) {
  return (
    <div className="space-y-6">
      <CurriculumBuilderView
        sections={sections}
        courseTitle={courseTitle}
        shortName={shortName}
        level={level}
        category={category}
        durationHours={durationHours}
        status={status}
        onSectionsChange={onSectionsChange}
      />

      {/* Stepper Control Footer */}
      <div className="flex items-center justify-between border-t border-border pt-5">
        <Button variant="outline" onClick={onCancel} className="gap-2 text-xs font-semibold cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onBack} className="gap-1.5 text-xs font-semibold cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Previous Step
          </Button>
          <Button onClick={onNext} className="bg-primary text-primary-foreground font-bold text-xs cursor-pointer">
            Save &amp; Next &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
