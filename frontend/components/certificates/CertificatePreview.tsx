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
}

export default function CertificatePreview({
  recipientName = "Training Administrator",
  courseTitle = "Elevate... Go Beyond",
  customDate,
  completionDate,
  certificateCode = "HARB-2026-X892A",
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

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-2xl p-1 sm:p-2 print:p-0 print:shadow-none text-slate-800 border border-slate-200">
      {/* Outer Certificate Aspect Ratio Box */}
      <div className="relative w-full aspect-[1.333/1] bg-white rounded-lg overflow-hidden flex items-center justify-center select-none">
        
        {/* Exact User Template Background Image (Contains exact border, logos, CERTIFICATE OF COMPLETION heading & certify lines) */}
        <img
          src="/harbinger_certificate_template.png?v=4"
          alt="Official Harbinger Academy Certificate of Completion"
          className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
        />

        {/* Dynamic Field Overlays (Positioned seamlessly over cleared placeholder areas) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center text-center p-4 sm:p-8">
          
          {/* Dynamic Recipient Name (Exact font size and position of Training Administrator) */}
          <div className="absolute top-[53%] w-[80%] flex items-center justify-center">
            <span className="text-base sm:text-2xl md:text-3xl font-extrabold text-[#0082CB] font-sans tracking-tight leading-none">
              {recipientName}
            </span>
          </div>

          {/* Dynamic Course Title (Exact font size and position of Elevate... Go Beyond) */}
          <div className="absolute top-[69%] w-[80%] flex items-center justify-center">
            <span className="text-xs sm:text-base md:text-xl font-extrabold text-[#1E293B] font-sans tracking-tight leading-tight">
              {courseTitle}
            </span>
          </div>

          {/* Dynamic Course Completion Date Line (Exact font size and position of course on 14 August 2026) */}
          <div className="absolute top-[75.8%] w-[80%] flex items-center justify-center">
            <span className="text-[10px] sm:text-xs md:text-sm text-[#334155] font-sans font-medium">
              course on <strong className="font-semibold text-slate-900">{formattedDate}</strong>
            </span>
          </div>

          {/* Bottom Left Serial Code */}
          <div className="absolute bottom-[5.5%] left-[5.5%]">
            <span className="text-[9px] sm:text-[11px] font-mono text-slate-600 font-bold bg-white/90 px-2 py-0.5 rounded border border-slate-300/80 shadow-2xs">
              {certificateCode}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
