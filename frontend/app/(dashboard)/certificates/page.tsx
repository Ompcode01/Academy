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
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/lib/rbac";
import { formatCourseTitle } from "@/lib/utils";

import DataFilterToolbar, { SortOption, applyDataFilters } from "@/components/common/DataFilterToolbar";

export default function CertificatesPage() {
  const { user } = useAuthStore();
  const userRole = user?.role || ROLES.GUEST;

  const [certificates, setCertificates] = useState<IssuedCertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortValue, setSortValue] = useState<SortOption>("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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

  const filteredCerts = applyDataFilters(
    certificates.map((c) => {
      const buName = c.departmentName || (c as any).user?.department?.departmentName || (c as any).user?.departmentName || "Business Unit";
      return {
        ...c,
        departmentName: buName,
        businessUnit: buName,
        issuedDate: c.issuedAt,
      };
    }),
    {
      searchQuery,
      searchFields: ["recipientName", "departmentName", "businessUnit", "courseTitle", "certificateCode"],
      sortValue,
      titleField: "recipientName",
      dateField: "issuedDate",
      startDate,
      endDate,
    }
  );

  const getPageTitle = () => {
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN) {
      return "Certificate Management & Verifications";
    }
    if (userRole === ROLES.GUEST) {
      return "Guest Preview — Certificates";
    }
    return "My Earned Certificates";
  };

  const getPageSubtitle = () => {
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN) {
      return "Audit and verify all course completion certificates issued to learners.";
    }
    if (userRole === ROLES.GUEST) {
      return "Guest Preview Mode: Guest accounts do not complete courses or earn certificates.";
    }
    return "View, download, and print your official course completion certificates.";
  };

  return (
    <div className="p-6 space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            {getPageTitle()}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {getPageSubtitle()}
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

      {/* Universal Filter & Sorting Toolbar for Certificates */}
      <DataFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search certificates by learner, business unit, course, or serial code..."
        sortValue={sortValue}
        onSortChange={setSortValue}
        sortOptions={[
          { label: "Learner Name (A-Z)", value: "a_z" },
          { label: "Learner Name (Z-A)", value: "z_a" },
          { label: "Issued Date (Newest)", value: "newest" },
          { label: "Issued Date (Oldest)", value: "oldest" },
        ]}
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start || "");
          setEndDate(end || "");
        }}
        onResetAll={() => {
          setSearchQuery("");
          setSortValue("newest");
          setStartDate("");
          setEndDate("");
        }}
      />

      {/* Issued Certificates Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Issued Certificates Records ({filteredCerts.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3">Serial Code</th>
                <th className="px-6 py-3">Learner Name</th>
                <th className="px-6 py-3">Business Unit</th>
                <th className="px-6 py-3">Course Title</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
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
                      {c.departmentName || (c as any).user?.department?.departmentName || (c as any).user?.departmentName || "Business Unit"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200" title={c.courseTitle}>
                      {formatCourseTitle(c.courseTitle)}
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
