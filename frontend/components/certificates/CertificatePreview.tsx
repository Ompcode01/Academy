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
    : "14 August 2026";

  const isDefaultTemplateData =
    (recipientName === "Training Administrator" || recipientName === "Enrolled Learner" || !recipientName) &&
    (courseTitle === "Elevate... Go Beyond" || courseTitle === "Course Completion Certificate" || !courseTitle) &&
    formattedDate === "14 August 2026";

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-2xl p-1 sm:p-2 print:p-0 print:shadow-none text-slate-800 border border-slate-200">
      {/* Outer Certificate Aspect Ratio Box */}
      <div className="relative w-full aspect-[1.333/1] bg-white rounded-lg overflow-hidden flex items-center justify-center">
        {/* Exact Original Template Background Image */}
        <img
          src="/harbinger_certificate_template.png"
          alt="Official Harbinger Academy Certificate of Completion"
          className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
        />

        {/* If custom learner or dynamic course title is passed, overlay dynamic fields cleanly */}
        {!isDefaultTemplateData && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center text-center p-6 sm:p-12">
            {/* Top Empty Spacer for Logo & Title on PNG */}
            <div className="h-[38%]" />

            {/* Dynamic Recipient Name Overlay */}
            <div className="w-full flex items-center justify-center h-[14%]">
              <span className="bg-white/95 px-6 py-1 rounded-md text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#0082CB] font-sans tracking-tight shadow-sm border border-sky-100">
                {recipientName}
              </span>
            </div>

            {/* Middle Spacer */}
            <div className="h-[5%]" />

            {/* Dynamic Course Title & Date Overlay */}
            <div className="w-full flex flex-col items-center justify-center space-y-1 h-[22%]">
              <span className="bg-white/95 px-6 py-0.5 rounded-md text-base sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] font-sans shadow-sm border border-slate-100">
                {courseTitle}
              </span>
              <span className="bg-white/90 px-4 py-0.5 rounded text-xs sm:text-base text-slate-700 font-sans font-medium">
                course on <strong className="font-semibold text-slate-900">{formattedDate}</strong>
              </span>
            </div>

            {/* Bottom Footer Verification Code */}
            <div className="w-full flex items-end justify-between px-4 pb-1">
              <div className="bg-white/90 px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 font-bold border border-slate-200">
                {certificateCode}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
