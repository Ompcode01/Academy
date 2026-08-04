"use client";

import HarbingerLogo from "./HarbingerLogo";

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
  logoUrl,
  headerTitle = "CERTIFICATE",
  headerSubtitle = "OF ACHIEVEMENT",
  certifyText = "This is to certify that",
  recipientName = "Mr. John Doe",
  completionText = "has successfully completed and passed the course",
  courseTitle = "Learn Python: The Complete Python Programming Course",
  signatoryName = "Richard Wilson",
  signatoryTitle = "Authorized Director",
  signatureUrl,
  customDate,
  completionDate,
  certificateCode = "HARB-2026-X892A",
  primaryColor = "#d97706",
  borderStyle = "GOLD_DOUBLE_ORNATE",
}: CertificateData) {
  const formattedDate = customDate
    ? customDate
    : completionDate
    ? new Date(completionDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-lg p-2 sm:p-4 print:p-0 print:shadow-none font-serif text-slate-800 border border-slate-200">
      {/* Outer Ornate Double Gold Border */}
      <div
        className="relative p-2 sm:p-4 border-2 sm:border-4 rounded-sm transition-all"
        style={{ borderColor: primaryColor }}
      >
        {/* Inner Parallel Border Line */}
        <div
          className="relative p-3 sm:p-6 border sm:border-2 rounded-sm text-center flex flex-col items-center justify-between aspect-[1.414/1] w-full bg-[#FAF9F6] overflow-hidden"
          style={{ borderColor: primaryColor }}
        >
          {/* Top Left Corner Ornament */}
          <div className="absolute top-1 left-1 flex items-center gap-0.5">
            <div className="w-2.5 h-2.5 border border-amber-600 bg-amber-500/20" style={{ borderColor: primaryColor }} />
            <div className="w-1.5 h-1.5 bg-amber-600" style={{ backgroundColor: primaryColor }} />
          </div>

          {/* Top Right Corner Ornament */}
          <div className="absolute top-1 right-1 flex items-center gap-0.5">
            <div className="w-1.5 h-1.5 bg-amber-600" style={{ backgroundColor: primaryColor }} />
            <div className="w-2.5 h-2.5 border border-amber-600 bg-amber-500/20" style={{ borderColor: primaryColor }} />
          </div>

          {/* Bottom Left Corner Ornament */}
          <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
            <div className="w-2.5 h-2.5 border border-amber-600 bg-amber-500/20" style={{ borderColor: primaryColor }} />
            <div className="w-1.5 h-1.5 bg-amber-600" style={{ backgroundColor: primaryColor }} />
          </div>

          {/* Bottom Right Corner Ornament */}
          <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
            <div className="w-1.5 h-1.5 bg-amber-600" style={{ backgroundColor: primaryColor }} />
            <div className="w-2.5 h-2.5 border border-amber-600 bg-amber-500/20" style={{ borderColor: primaryColor }} />
          </div>

          {/* Header Section */}
          <div className="w-full flex flex-col items-center pt-1">
            {/* Logo */}
            <div className="mb-2 transform scale-90 sm:scale-100 origin-top">
              <HarbingerLogo height={38} customLogoUrl={logoUrl} />
            </div>

            {/* Title */}
            <h1
              className="text-lg sm:text-2xl font-extrabold uppercase tracking-widest font-sans leading-tight"
              style={{ color: "#1e293b" }}
            >
              {headerTitle}
            </h1>
            <div className="flex items-center justify-center gap-2 my-1 w-full max-w-xs">
              <div className="h-[1px] bg-slate-400 flex-1" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 font-sans">
                {headerSubtitle}
              </span>
              <div className="h-[1px] bg-slate-400 flex-1" />
            </div>
          </div>

          {/* Recipient Certification Section */}
          <div className="my-2 space-y-1.5 max-w-xl text-center">
            <p className="text-[11px] sm:text-xs text-slate-600 italic font-sans">
              {certifyText}
            </p>
            <h2 className="text-base sm:text-2xl font-extrabold text-slate-900 font-sans border-b border-slate-300 pb-0.5 inline-block px-4 sm:px-6">
              {recipientName}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-600 font-sans">
              {completionText}
            </p>

            {/* Dynamic Course Title */}
            <h3
              className="text-xs sm:text-base font-bold font-sans mt-1 px-3 py-1 rounded inline-block max-w-full truncate"
              style={{ color: "#0f172a" }}
            >
              {courseTitle || "Course Title Placeholder"}
            </h3>
          </div>

          {/* Footer Line: Date & Signature Baseline */}
          <div className="w-full flex items-end justify-between pt-2 sm:pt-4 pb-1 font-sans px-2 sm:px-6">
            {/* Date Left */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-700 pb-0.5">
                {formattedDate}
              </span>
              <div className="w-24 sm:w-32 border-b border-slate-400" />
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                Date
              </span>
            </div>

            {/* Verification Code Center */}
            <div className="hidden sm:flex flex-col items-center text-[9px] text-slate-400">
              <span className="font-mono">{certificateCode}</span>
              <span>Verifiable Credential</span>
            </div>

            {/* Signature Right */}
            <div className="flex flex-col items-center">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Signature"
                  className="h-6 sm:h-8 object-contain mb-0.5"
                />
              ) : (
                <span
                  className="text-base sm:text-xl font-serif italic text-slate-800 pb-0.5 select-none"
                  style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
                >
                  {signatoryName}
                </span>
              )}
              <div className="w-24 sm:w-32 border-b border-slate-400" />
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                Signature ({signatoryTitle})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
