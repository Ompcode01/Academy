"use client";

import { Button } from "@/components/ui/button";
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
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onBack}>
            &larr; Back
          </Button>
          <Button onClick={onNext} className="bg-primary text-primary-foreground">
            Save &amp; Next &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
