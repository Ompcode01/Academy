"use client";

import { X, Printer, Award, ShieldCheck, FileText } from "lucide-react";
import CertificatePreview from "./CertificatePreview";
import { IssuedCertificateData } from "@/services/api/certificate.service";

interface LearnerCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: IssuedCertificateData | null;
}

export default function LearnerCertificateModal({
  isOpen,
  onClose,
  certificate,
}: LearnerCertificateModalProps) {
  if (!isOpen || !certificate) return null;

  let template: any = {};
  if (certificate.templateSnapshot) {
    try {
      template = JSON.parse(certificate.templateSnapshot);
    } catch (e) {
      console.error(e);
    }
  }

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Official Course Completion Certificate
            </h2>
          </div>

          {/* OFFICIAL HIGH-RES PDF DOWNLOAD ACTION */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
              title="Download official PDF certificate"
            >
              <Printer className="h-4 w-4" /> Download / Print PDF Certificate
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="p-6 bg-slate-100 dark:bg-slate-950 max-h-[80vh] overflow-y-auto print:p-0 print:bg-white">
          <div id="certificate-preview-container">
            <CertificatePreview
              logoUrl={template.logoUrl}
              headerTitle={template.headerTitle || "CERTIFICATE"}
              headerSubtitle={template.headerSubtitle || "OF ACHIEVEMENT"}
              certifyText={template.certifyText || "This is to certify that"}
              recipientName={certificate.recipientName}
              completionText={template.completionText || "has successfully completed and passed the course"}
              courseTitle={certificate.courseTitle}
              signatoryName={template.signatoryName || "Richard Wilson"}
              signatoryTitle={template.signatoryTitle || "Authorized Director"}
              signatureUrl={template.signatureUrl}
              completionDate={certificate.issuedAt}
              certificateCode={certificate.certificateCode}
              primaryColor={template.primaryColor || "#d97706"}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 flex items-center justify-between print:hidden">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Serial Code: <strong className="font-mono text-slate-800 dark:text-slate-200">{certificate.certificateCode}</strong>
          </span>
          
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" /> Save Official PDF Document
          </button>
        </div>
      </div>
    </div>
  );
}
