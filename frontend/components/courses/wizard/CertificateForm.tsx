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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Editor Controls */}
          <div className="lg:col-span-5 space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
            {/* Editor Sub-nav Tabs */}
            <div className="flex border-b border-border text-xs font-bold gap-4 pb-2">
              <button
                type="button"
                onClick={() => setActiveSubTab("text")}
                className={`flex items-center gap-1.5 pb-2 transition-colors border-b-2 ${
                  activeSubTab === "text"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" /> Text Content
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("branding")}
                className={`flex items-center gap-1.5 pb-2 transition-colors border-b-2 ${
                  activeSubTab === "branding"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Palette className="h-4 w-4" /> Branding &amp; Color
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("signatory")}
                className={`flex items-center gap-1.5 pb-2 transition-colors border-b-2 ${
                  activeSubTab === "signatory"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sliders className="h-4 w-4" /> Signatory &amp; Rules
              </button>
            </div>

            {/* TAB 1: TEXT CONTENT */}
            {activeSubTab === "text" && (
              <div className="space-y-4 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Header Main Title</Label>
                  <Input
                    value={data.certificateTitle || "CERTIFICATE"}
                    onChange={(e) => onChange({ certificateTitle: e.target.value })}
                    placeholder="e.g. CERTIFICATE"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Header Subtitle Banner</Label>
                  <Input
                    value={data.headerSubtitle ?? "OF ACHIEVEMENT"}
                    onChange={(e) => onChange({ headerSubtitle: e.target.value })}
                    placeholder="e.g. OF ACHIEVEMENT"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Certify Opening Text</Label>
                  <Input
                    value={data.certifyText ?? "This is to certify that"}
                    onChange={(e) => onChange({ certifyText: e.target.value })}
                    placeholder="e.g. This is to certify that"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Completion Statement Text</Label>
                  <Input
                    value={data.completionText ?? "has successfully completed and passed the course"}
                    onChange={(e) => onChange({ completionText: e.target.value })}
                    placeholder="e.g. has successfully completed and passed the course"
                    className="mt-1"
                  />
                </div>

                <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground border border-border">
                  <span className="font-bold text-foreground">Dynamic Course Title: </span>
                  <span className="text-primary font-semibold">{courseTitle || "Not set yet"}</span>
                  <p className="mt-1">
                    This course title is automatically extracted from Step 1 and rendered on the certificate.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: BRANDING & COLORS */}
            {activeSubTab === "branding" && (
              <div className="space-y-4 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Company Logo Option</Label>
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    Default uses the official <b>Harbinger Group</b> logo. Provide a URL to customize.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={data.logoUrl || ""}
                      onChange={(e) => onChange({ logoUrl: e.target.value || null })}
                      placeholder="Leave blank for Harbinger Group logo"
                    />
                    {data.logoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onChange({ logoUrl: null })}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Theme Primary Color</Label>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {[
                      { name: "Gold Classic", color: "#d97706" },
                      { name: "Navy Corporate", color: "#1e3a8a" },
                      { name: "Emerald Academic", color: "#059669" },
                      { name: "Royal Purple", color: "#7c3aed" },
                      { name: "Crimson Red", color: "#dc2626" },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => onChange({ primaryColor: c.color })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                          (data.primaryColor || "#d97706") === c.color
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SIGNATORY & RULES */}
            {activeSubTab === "signatory" && (
              <div className="space-y-4 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Signatory Name</Label>
                  <Input
                    value={data.signatoryName ?? "Richard Wilson"}
                    onChange={(e) => onChange({ signatoryName: e.target.value })}
                    placeholder="e.g. Richard Wilson"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Signatory Title</Label>
                  <Input
                    value={data.signatoryTitle ?? "Authorized Director"}
                    onChange={(e) => onChange({ signatoryTitle: e.target.value })}
                    placeholder="e.g. Authorized Director"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Custom Signature Image URL (Optional)</Label>
                  <Input
                    value={data.signatureUrl || ""}
                    onChange={(e) => onChange({ signatureUrl: e.target.value || null })}
                    placeholder="Leave blank for signature typography"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Certificate Issue Date (Optional)</Label>
                  <Input
                    value={data.customDate || ""}
                    onChange={(e) => onChange({ customDate: e.target.value || null })}
                    placeholder="e.g. August 4, 2026 (Leave blank for completion date)"
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Custom date text displayed on the certificate baseline.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Completion Score Threshold (%)</Label>
                  <Input
                    type="number"
                    value={data.passingThreshold}
                    onChange={(e) => onChange({ passingThreshold: Number(e.target.value) })}
                    min={0}
                    max={100}
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Minimum assessment score required for automatic certificate generation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Interactive Certificate Preview */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
              <span>LIVE CERTIFICATE PREVIEW</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                Updates in Real-Time
              </span>
            </div>

            {/* Render Certificate Preview Component */}
            <div className="transform transition-transform">
              <CertificatePreview
                logoUrl={data.logoUrl}
                headerTitle={data.certificateTitle || "CERTIFICATE"}
                headerSubtitle={data.headerSubtitle || "OF ACHIEVEMENT"}
                certifyText={data.certifyText || "This is to certify that"}
                recipientName="Mr. John Doe"
                completionText={data.completionText || "has successfully completed and passed the course"}
                courseTitle={courseTitle || "Learn Python: The Complete Python Programming Course"}
                signatoryName={data.signatoryName || "Richard Wilson"}
                signatoryTitle={data.signatoryTitle || "Authorized Director"}
                signatureUrl={data.signatureUrl}
                customDate={data.customDate}
                primaryColor={data.primaryColor || "#d97706"}
                certificateCode="HARB-2026-X892A"
              />
            </div>
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
