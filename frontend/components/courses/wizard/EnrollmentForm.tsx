"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Users, ShieldCheck, UserCheck, Lock } from "lucide-react";

export interface EnrollmentRuleData {
  selfEnrollment: boolean;
  adminEnrollment: boolean;
  departmentAccess: string;
}

interface EnrollmentFormProps {
  data: EnrollmentRuleData;
  onChange: (updated: Partial<EnrollmentRuleData>) => void;
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function EnrollmentForm({
  data,
  onChange,
  onNext,
  onBack,
  onCancel,
}: EnrollmentFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Enrollment &amp; Eligibility Configuration
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Configure how learners can enroll in this course and who is eligible to access it.
        </p>
      </div>

      {/* Enrollment Methods */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
          Allowed Enrollment Methods
        </h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={data.selfEnrollment}
              onChange={(e) => onChange({ selfEnrollment: e.target.checked })}
              className="h-4 w-4 mt-0.5 rounded text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                Enable Self-Enrollment
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Learners can browse the catalog and enroll themselves if they meet prerequisites.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={data.adminEnrollment}
              onChange={(e) => onChange({ adminEnrollment: e.target.checked })}
              className="h-4 w-4 mt-0.5 rounded text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Admin &amp; Manager Enrollment
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Super Admins and Department Managers can directly assign learners into this course.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Department Eligibility */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
          Department Eligibility &amp; Target Audience
        </h3>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Target Department Access</Label>
          <select
            value={data.departmentAccess}
            onChange={(e) => onChange({ departmentAccess: e.target.value })}
            className="w-full h-10 px-3 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Global (All Organizational Departments)</option>
            <option value="ENG">Engineering (ENG)</option>
            <option value="HR">Human Resources (HR)</option>
            <option value="MGT">Management (MGT)</option>
          </select>
          <p className="text-[11px] text-muted-foreground">
            Restricts visibility in the learner course directory based on organizational department.
          </p>
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
          <Button onClick={onNext} className="bg-primary text-primary-foreground">
            Save &amp; Next &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
