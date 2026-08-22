"use client";

import React from "react";

export interface CertificateData {
  logoUrl?: string | null;
  headerTitle?: string;
  headerSubtitle?: string;
  certifyText?: string;
  recipientName?: string;
  completionText?: string;
  courseTitle?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureUrl?: string | null;
  customDate?: string | null;
  completionDate?: string;
  certificateCode?: string;
  primaryColor?: string;
  borderStyle?: string;
  templateId?: "classic" | "modern" | string;
}

export default function CertificatePreview({
  recipientName = "Training Administrator",
  courseTitle = "Elevate... Go Beyond",
  customDate,
  completionDate,
  certificateCode = "HARB-2026-X892A",
  templateId = "classic",
}: CertificateData) {
  const formattedDate = customDate
    ? customDate
    : completionDate
    ? new Date(completionDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const isModern = templateId === "modern";

  const getCourseTitleClasses = (title: string) => {
    const len = title.trim().length;
    if (len > 80) {
      return "text-[9px] sm:text-xs md:text-sm leading-snug line-clamp-2 font-bold tracking-normal max-w-[92%]";
    }
    if (len > 45) {
      return "text-[11px] sm:text-sm md:text-base leading-snug line-clamp-2 font-extrabold tracking-tight max-w-[92%]";
    }
    return "text-xs sm:text-base md:text-xl leading-tight font-extrabold tracking-tight max-w-[92%]";
  };

  const getRecipientNameClasses = (name: string) => {
    const len = name.trim().length;
    if (len > 35) {
      return "text-xs sm:text-lg md:text-xl font-extrabold tracking-tight leading-none px-2 truncate max-w-full";
    }
    if (len > 22) {
      return "text-sm sm:text-xl md:text-2xl font-extrabold tracking-tight leading-none px-2 truncate max-w-full";
    }
    return "text-base sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-none px-2 truncate max-w-full";
  };

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-2xl p-1 sm:p-2 print:p-0 print:shadow-none text-slate-800 border border-slate-200">
      {/* Outer Certificate Aspect Ratio Box */}
      <div className="relative w-full aspect-[1.333/1] bg-white rounded-lg overflow-hidden flex items-center justify-center select-none">
        
        {/* Background Image according to selected Template */}
        <img
          src={isModern ? "/harbinger_certificate_template.png?v=4" : "/classic_border_clean.png?v=1"}
          alt={isModern ? "Modern Wave Certificate Template" : "Classic Ornamental Border Certificate Template"}
          className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
        />

        {/* Dynamic Field Overlays */}
        {isModern ? (
          /* Template 2: Modern Wave Ribbon & Medallion Template */
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center text-center p-4 sm:p-8">
            {/* Title Block: CERTIFICATE OF COMPLETION */}
            <div className="absolute top-[26%] left-[39%] w-[54%] flex flex-col items-center justify-center">
              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#0F2849] font-sans tracking-wide leading-none">
                CERTIFICATE
              </h2>
              <span className="text-xs sm:text-base md:text-lg font-medium text-[#0F2849] font-sans tracking-widest mt-1">
                OF COMPLETION
              </span>
            </div>

            {/* Certify Subtitle Line */}
            <div className="absolute top-[46%] left-[39%] w-[54%] flex items-center justify-center">
              <span className="text-[10px] sm:text-xs md:text-sm text-[#0F2849] font-sans font-bold">
                This is to certify that Ms./Mr.
              </span>
            </div>

            {/* Dynamic Recipient Name + Accent Line */}
            <div className="absolute top-[52.5%] left-[39%] w-[54%] flex flex-col items-center justify-center">
              <span className={`text-[#0088D4] font-sans ${getRecipientNameClasses(recipientName)}`}>
                {recipientName}
              </span>
              <div className="w-[75%] h-[1.5px] bg-[#0088D4]/60 mt-1.5 rounded-full" />
            </div>

            {/* Completion Statement */}
            <div className="absolute top-[66.5%] left-[39%] w-[54%] flex items-center justify-center">
              <span className="text-[10px] sm:text-xs md:text-sm text-[#334155] font-sans font-medium">
                has successfully completed
              </span>
            </div>

            {/* Dynamic Course Title */}
            <div className="absolute top-[71.5%] left-[39%] w-[54%] min-h-[8%] flex items-center justify-center px-2">
              <span className={`text-[#0F2849] font-sans text-center ${getCourseTitleClasses(courseTitle)}`}>
                {courseTitle}
              </span>
            </div>

            {/* Dynamic Course Completion Date Line */}
            <div className="absolute top-[82%] left-[39%] w-[54%] flex items-center justify-center">
              <span className="text-[10px] sm:text-xs md:text-sm text-[#334155] font-sans font-medium">
                course on <strong className="font-semibold text-[#0F2849]">{formattedDate}</strong>
              </span>
            </div>

            {/* Bottom Left Serial Code */}
            <div className="absolute bottom-[5.5%] left-[5.5%]">
              <span className="text-[9px] sm:text-[11px] font-mono text-slate-600 font-bold bg-white/90 px-2 py-0.5 rounded border border-slate-300/80 shadow-2xs">
                {certificateCode}
              </span>
            </div>
          </div>
        ) : (
          /* Template 1: Classic Ornamental Border Template */
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center text-center p-4 sm:p-8">
            {/* Dynamic Recipient Name */}
            <div className="absolute top-[54%] w-[82%] flex items-center justify-center">
              <span className={`text-[#0072CE] font-sans ${getRecipientNameClasses(recipientName)}`}>
                {recipientName}
              </span>
            </div>

            {/* Dynamic Course Title */}
            <div className="absolute top-[68.5%] w-[82%] min-h-[8%] flex items-center justify-center px-2">
              <span className={`text-[#1E293B] font-sans text-center ${getCourseTitleClasses(courseTitle)}`}>
                {courseTitle}
              </span>
            </div>

            {/* Dynamic Course Completion Date Line */}
            <div className="absolute top-[80.5%] w-[82%] flex items-center justify-center">
              <span className="text-[10px] sm:text-xs md:text-sm text-[#334155] font-sans font-medium">
                course on <strong className="font-semibold text-slate-900">{formattedDate}</strong>
              </span>
            </div>

            {/* Bottom Left Serial Code */}
            <div className="absolute bottom-[5.5%] left-[6.5%]">
              <span className="text-[9px] sm:text-[11px] font-mono text-slate-600 font-bold bg-white/90 px-2 py-0.5 rounded border border-slate-300/80 shadow-2xs">
                {certificateCode}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
