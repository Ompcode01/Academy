"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Sparkles, Sliders, Palette, FileText, Image as ImageIcon } from "lucide-react";
import CertificatePreview from "@/components/certificates/CertificatePreview";

export interface CertificateRuleData {
  enableCertificate: boolean;
  certificateTitle: string;
  headerSubtitle?: string;
  certifyText?: string;
  completionText?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureUrl?: string | null;
  logoUrl?: string | null;
  customDate?: string | null;
  primaryColor?: string;
  passingThreshold: number;
}

interface CertificateFormProps {
  data: CertificateRuleData;
  courseTitle?: string;
  onChange: (updated: Partial<CertificateRuleData>) => void;
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function CertificateForm({
  data,
  courseTitle = "Learn Python: The Complete Python Programming Course",
  onChange,
  onNext,
  onBack,
  onCancel,
}: CertificateFormProps) {
  const [activeSubTab, setActiveSubTab] = useState<"text" | "branding" | "signatory">("text");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Editable Certificate Template &amp; Management
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Customize all certificate content, company logo, signatures, and theme. Course title is dynamically extracted from Step 1.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-500/30">
            Dynamic Template Engine
          </span>
        </div>
      </div>

      {/* Enable Toggle Banner */}
      <div className="rounded-xl border border-border bg-card p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.enableCertificate}
            onChange={(e) => onChange({ enableCertificate: e.target.checked })}
            className="h-4 w-4 mt-1 rounded text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-bold text-foreground flex items-center gap-2">
              Issue Automated Verifiable Certificate
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically issue this customized certificate to learners who finish the course and score at or above the threshold.
            </p>
          </div>
        </label>
      </div>

      {data.enableCertificate && (
        <div className="space-y-4">
          {/* Certificate Preview Only */}
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
            <span>LIVE CERTIFICATE PREVIEW</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              Standard Issue Template
            </span>
          </div>

          {/* Render Certificate Preview Component */}
          <div className="transform transition-transform max-w-4xl mx-auto">
            <CertificatePreview
              logoUrl={data.logoUrl}
              headerTitle={data.certificateTitle || "CERTIFICATE OF COMPLETION"}
              certifyText={data.certifyText || "This is to certify that Ms./Mr."}
              recipientName="Training Administrator"
              completionText={data.completionText || "has successfully completed"}
              courseTitle={courseTitle || "Elevate... Go Beyond"}
              customDate={data.customDate}
              certificateCode="HARB-2026-X892A"
            />
          </div>
        </div>
      )}

      {/* Stepper Footer Controls */}
      <div className="flex items-center justify-between border-t border-border pt-5">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onBack}>
            &larr; Back
          </Button>
          <Button onClick={onNext} className="bg-primary text-primary-foreground font-bold px-6">
            Save &amp; Ready for Review &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
