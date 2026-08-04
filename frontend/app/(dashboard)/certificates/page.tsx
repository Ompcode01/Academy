"use client";

import { useState, useEffect } from "react";
import {
  Award,
  Search,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Printer,
  Eye,
  Sliders,
  FileCheck,
} from "lucide-react";
import {
  getAllCertificates,
  verifyCertificateCode,
  IssuedCertificateData,
} from "@/services/api/certificate.service";
import CertificatePreview from "@/components/certificates/CertificatePreview";
import LearnerCertificateModal from "@/components/certificates/LearnerCertificateModal";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<IssuedCertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<IssuedCertificateData | null>(null);
  const [verifyError, setVerifyError] = useState("");

  // Modal State
  const [selectedCert, setSelectedCert] = useState<IssuedCertificateData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllCertificates();
      setCertificates(data);
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;
    setVerifyError("");
    setVerifyResult(null);

    try {
      const result = await verifyCertificateCode(verifyInput.trim());
      if (result) {
        setVerifyResult(result);
      } else {
        setVerifyError("No certificate found matching code: " + verifyInput);
      }
    } catch (err) {
      setVerifyError("Invalid certificate code or server error.");
    }
  };

  const filteredCerts = certificates.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.recipientName.toLowerCase().includes(q) ||
      c.courseTitle.toLowerCase().includes(q) ||
      c.certificateCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Certificate Management &amp; Verifications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage global certificate templates, audit issued credentials, and verify certificate codes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top Banner & Verification Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Card */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Verify Certificate Credential
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Enter a unique certificate serial number (e.g. <code>HARB-2026-X892A</code>) to verify authenticity.
          </p>

          <form onSubmit={handleVerify} className="flex gap-2">
            <input
              type="text"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              placeholder="Enter Certificate Code..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow"
            >
              Verify
            </button>
          </form>

          {verifyError && (
            <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              {verifyError}
            </div>
          )}

          {verifyResult && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Authentic Credential
                </span>
                <span className="font-mono">{verifyResult.certificateCode}</span>
              </div>
              <p><b>Recipient:</b> {verifyResult.recipientName}</p>
              <p><b>Course:</b> {verifyResult.courseTitle}</p>
              <p><b>Issued On:</b> {new Date(verifyResult.issuedAt).toLocaleDateString()}</p>
              <button
                onClick={() => {
                  setSelectedCert(verifyResult);
                  setIsModalOpen(true);
                }}
                className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" /> View Certificate Preview
              </button>
            </div>
          )}
        </div>

        {/* Global Statistics Card */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-6 text-white shadow-xl flex flex-col justify-between">
          <div>
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
              Academy Credential System
            </span>
            <h2 className="text-xl font-bold mt-3">Verifiable Certificate Management</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              Certificates are automatically styled using the <b>Harbinger Group</b> double gold border design template and dynamically issued upon course completion.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-700/60 pt-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Issued Certificates</span>
              <span className="text-2xl font-extrabold text-white mt-0.5 block">{certificates.length}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Dynamic Extraction</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-0.5 block">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issued Certificates Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Issued Certificates Records ({filteredCerts.length})
          </h3>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by learner, course, or serial..."
              className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3">Serial Code</th>
                <th className="px-6 py-3">Learner Name</th>
                <th className="px-6 py-3">Course Title</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No issued certificates found. Certificates will appear here when learners complete courses.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {c.certificateCode}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {c.recipientName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {c.courseTitle}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(c.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCert(c);
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-100 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View / Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Learner Certificate Modal */}
      <LearnerCertificateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certificate={selectedCert}
      />
    </div>
  );
}
