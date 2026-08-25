"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Sparkles, CheckCircle2, Ban, ShieldCheck, ArrowLeft } from "lucide-react";
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
  templateId?: "classic" | "modern" | "none" | string;
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
  // Determine active option
  const isNoneActive = !data.enableCertificate || data.templateId === "none";
  const isModernActive = data.enableCertificate && data.templateId === "modern";
  const isClassicActive = data.enableCertificate && !isModernActive && !isNoneActive;

  const getSelectedLabel = () => {
    if (isNoneActive) return "Option 3: No Certificate Required";
    if (isModernActive) return "Template 2: Modern Wave & Ribbon";
    return "Template 1: Classic Ornamental Border";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Certificate Setup &amp; Options
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Select one of the 3 certificate options for this course. Your active selection is highlighted below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-500/30">
            {getSelectedLabel()}
          </span>
        </div>
      </div>

      {/* 3 Certificate Option Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Select Certificate Option:
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Template 1 - Classic Ornamental Border */}
          <div
            onClick={() => onChange({ enableCertificate: true, templateId: "classic" })}
            className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer select-none space-y-3 ${
              isClassicActive
                ? "border-[#C82333] bg-[#C82333]/5 ring-4 ring-[#C82333]/15 shadow-md"
                : "border-border hover:border-muted-foreground/30 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                  isClassicActive ? "bg-[#C82333] text-white" : "bg-amber-500/10 text-amber-600"
                }`}>
                  <Award className="h-4 w-4" />
                </div>
                <span className="text-xs font-extrabold text-foreground">Template 1</span>
              </div>
              {isClassicActive ? (
                <span className="px-2 py-0.5 rounded-full bg-[#C82333] text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="h-3 w-3" /> Selected
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-muted-foreground">Click to select</span>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-foreground">Classic Ornamental Border</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Official Harbinger Academy ornate frame certificate layout.
              </p>
            </div>
          </div>

          {/* Card 2: Template 2 - Modern Wave & Ribbon */}
          <div
            onClick={() => onChange({ enableCertificate: true, templateId: "modern" })}
            className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer select-none space-y-3 ${
              isModernActive
                ? "border-[#C82333] bg-[#C82333]/5 ring-4 ring-[#C82333]/15 shadow-md"
                : "border-border hover:border-muted-foreground/30 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                  isModernActive ? "bg-[#C82333] text-white" : "bg-blue-500/10 text-blue-600"
                }`}>
                  <Award className="h-4 w-4" />
                </div>
                <span className="text-xs font-extrabold text-foreground">Template 2</span>
              </div>
              {isModernActive ? (
                <span className="px-2 py-0.5 rounded-full bg-[#C82333] text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="h-3 w-3" /> Selected
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-muted-foreground">Click to select</span>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-foreground">Modern Wave &amp; Ribbon (CapDev)</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                CapDev modern wave design with red ribbon medallion badge.
              </p>
            </div>
          </div>

          {/* Card 3: No Certificate Required */}
          <div
            onClick={() => onChange({ enableCertificate: false, templateId: "none" })}
            className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer select-none space-y-3 ${
              isNoneActive
                ? "border-slate-600 bg-slate-100 dark:bg-slate-800 ring-4 ring-slate-400/20 shadow-md"
                : "border-border hover:border-muted-foreground/30 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                  isNoneActive ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  <Ban className="h-4 w-4" />
                </div>
                <span className="text-xs font-extrabold text-foreground">Option 3</span>
              </div>
              {isNoneActive ? (
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="h-3 w-3" /> Selected
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-muted-foreground">Click to select</span>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-foreground">No Certificate Required</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Disable certificate generation for this course.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview / No Certificate Info Box */}
      {data.enableCertificate && !isNoneActive ? (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
            <span>LIVE CERTIFICATE PREVIEW</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              {isModernActive ? "Template 2: Modern Wave & Ribbon" : "Template 1: Classic Ornamental Border"}
            </span>
          </div>

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
              templateId={data.templateId || "classic"}
            />
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
            <Ban className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No Certificate Will Be Issued</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Learners completing this course will not receive an automated certificate. You can change this setting anytime by selecting Template 1 or Template 2 above.
          </p>
        </div>
      )}

      {/* Stepper Footer Controls */}
      <div className="flex items-center justify-between border-t border-border pt-5">
        <Button variant="outline" onClick={onCancel} className="gap-2 text-xs font-semibold cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onBack} className="gap-1.5 text-xs font-semibold cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Previous Step
          </Button>
          <Button onClick={onNext} className="bg-primary text-primary-foreground font-bold text-xs px-6 cursor-pointer">
            Save &amp; Ready for Review &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
