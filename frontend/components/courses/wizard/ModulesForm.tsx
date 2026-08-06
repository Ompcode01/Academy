"use client";

import { Button } from "@/components/ui/button";
import CurriculumBuilderView, { SectionItem } from "../builder/CurriculumBuilderView";

interface ModulesFormProps {
  sections?: SectionItem[];
  onSectionsChange?: (sections: SectionItem[]) => void;
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function ModulesForm({
  sections,
  onSectionsChange,
  onNext,
  onBack,
  onCancel,
}: ModulesFormProps) {
  return (
    <div className="space-y-6">
      <CurriculumBuilderView
        sections={sections}
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
