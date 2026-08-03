"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, CheckCircle2, Shield, GraduationCap } from "lucide-react";

export interface CertificateRuleData {
  enableCertificate: boolean;
  certificateTitle: string;
  passingThreshold: number;
}

interface CertificateFormProps {
  data: CertificateRuleData;
  onChange: (updated: Partial<CertificateRuleData>) => void;
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function CertificateForm({
  data,
  onChange,
  onNext,
  onBack,
  onCancel,
}: CertificateFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Certificate Configuration
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Configure automated completion certificates issued to learners upon finishing the course.
        </p>
      </div>

      {/* Enable Toggle */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.enableCertificate}
            onChange={(e) => onChange({ enableCertificate: e.target.checked })}
            className="h-4 w-4 mt-1 rounded text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-bold text-foreground flex items-center gap-2">
              Issue Automated Completion Certificate
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically generate a verifiable PDF certificate when a learner meets completion criteria.
            </p>
          </div>
        </label>
      </div>

      {data.enableCertificate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Certificate Fields */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              Certificate Details
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Certificate Title</Label>
              <Input
                value={data.certificateTitle}
                onChange={(e) => onChange({ certificateTitle: e.target.value })}
                placeholder="e.g. Certificate of Completion"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Completion Score Threshold (%)</Label>
              <Input
                type="number"
                value={data.passingThreshold}
                onChange={(e) => onChange({ passingThreshold: Number(e.target.value) })}
                min={0}
                max={100}
              />
              <p className="text-[11px] text-muted-foreground">
                Minimum overall assessment score percentage required to issue the certificate.
              </p>
            </div>
          </div>

          {/* Certificate Live Preview Card */}
          <div className="rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-6 flex flex-col items-center text-center space-y-3 relative">
            <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
              <GraduationCap className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600 block">
                Harbinger Academy LMS
              </span>
              <h4 className="text-base font-extrabold text-foreground mt-1">
                {data.certificateTitle || "Certificate of Completion"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                This is to certify that <strong className="text-foreground">[Learner Name]</strong> has successfully completed all required modules and assessments for:
              </p>
              <p className="text-xs font-bold text-primary mt-2">
                Java Programming &amp; Secure Coding
              </p>
            </div>
            <div className="pt-2 text-[10px] text-muted-foreground flex items-center gap-2 border-t border-amber-500/20 w-full justify-center">
              <Shield className="h-3.5 w-3.5 text-amber-500" /> Verifiable Certificate • ID: ACAD-CERT-2026
            </div>
          </div>
        </div>
      )}

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
            Save &amp; Ready for Review &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
