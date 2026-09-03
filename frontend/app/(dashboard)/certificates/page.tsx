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
  BookOpen,
  Video,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const [activeTab, setActiveTab] = useState<"ALL" | "COURSE" | "SESSION">("ALL");
  const [staffScope, setStaffScope] = useState<"ALL_LEARNERS" | "MY_OWN">("ALL_LEARNERS");
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
      const fetchedList = Array.isArray(data) ? data : [];
      setCertificates(fetchedList);
    } catch (err) {
      console.error("Failed to load certificates:", err);
      setCertificates([]);
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

  const isStaff = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  useEffect(() => {
    if (!isStaff && staffScope !== "MY_OWN") {
      setStaffScope("MY_OWN");
    }
  }, [isStaff, staffScope]);

  const isUserMatch = (c: IssuedCertificateData) => {
    const recipient = (c.recipientName || "").toLowerCase().trim();
    const firstName = ((user as any)?.firstName || "").toLowerCase().trim();
    const lastName = ((user as any)?.lastName || "").toLowerCase().trim();
    const fullName = `${firstName} ${lastName}`.trim() || ((user as any)?.name || "").toLowerCase().trim();
    const userEmail = ((user as any)?.officialEmail || (user as any)?.email || "").toLowerCase().trim();
    const username = (user?.username || "").toLowerCase().trim();
    const empId = user?.employeeId ? String(user.employeeId) : (user?.id ? String(user.id) : null);

    // 1. Direct employeeId / userId match
    if (empId && String(c.userId) === String(empId)) return true;

    // 2. Direct name match
    if (fullName && recipient.includes(fullName)) return true;
    if (firstName && lastName && recipient.includes(firstName) && recipient.includes(lastName)) return true;
    if (firstName && firstName.length > 2 && recipient.includes(firstName)) return true;

    // 3. Direct email match
    if (userEmail && userEmail.split("@")[0] && recipient.includes(userEmail.split("@")[0])) return true;

    // 4. Username match
    if (username && recipient.includes(username)) return true;

    return false;
  };

  const scopedCertificates = (isStaff && staffScope === "ALL_LEARNERS")
    ? certificates
    : certificates.filter(isUserMatch);

  const filteredCerts = applyDataFilters(
    scopedCertificates.map((c) => {
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

  const isSessionCert = (c: any) => {
    const code = (c.certificateCode || "").toUpperCase();
    const title = (c.courseTitle || "").toLowerCase();
    return (
      c.type === "SESSION" ||
      code.startsWith("CERT-SESS") ||
      title.includes("session") ||
      title.includes("procoder") ||
      title.includes("webinar") ||
      title.includes("workshop") ||
      title.includes("live")
    );
  };

  const courseCertsCount = filteredCerts.filter((c) => !isSessionCert(c)).length;
  const sessionCertsCount = filteredCerts.filter((c) => isSessionCert(c)).length;

  const displayedCerts = filteredCerts.filter((c) => {
    if (activeTab === "COURSE") return !isSessionCert(c);
    if (activeTab === "SESSION") return isSessionCert(c);
    return true;
  });

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

      {/* Super Admin & Admin Scope Toggle: All Learner Certificates vs My Own Certificates */}
      {isStaff && (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
          <button
            type="button"
            onClick={() => setStaffScope("ALL_LEARNERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              staffScope === "ALL_LEARNERS"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>All Learner Certificates</span>
          </button>
          <button
            type="button"
            onClick={() => setStaffScope("MY_OWN")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              staffScope === "MY_OWN"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Award className="h-4 w-4 text-amber-400" />
            <span>My Own Certificates</span>
          </button>
        </div>
      )}

      {/* Category Tabs: All | Course Certificates | Live Session Certificates */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ALL"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <Award className="h-4 w-4 text-amber-500" />
          <span>All Certificates</span>
          <Badge className="ml-1 bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900 text-[10px]">
            {filteredCerts.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("COURSE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "COURSE"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span>Course Completion Certificates</span>
          <Badge className="ml-1 bg-blue-700 text-white text-[10px]">
            {courseCertsCount}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("SESSION")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "SESSION"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <Video className="h-4 w-4 text-red-500" />
          <span>Live Session Certificates</span>
          <Badge className="ml-1 bg-red-700 text-white text-[10px]">
            {sessionCertsCount}
          </Badge>
        </button>
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
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>
              {activeTab === "ALL" && "All Issued Certificates"}
              {activeTab === "COURSE" && "Course Completion Certificates"}
              {activeTab === "SESSION" && "Live Session Certificates"}
            </span>
            <span className="text-muted-foreground font-mono font-normal">({displayedCerts.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Serial Code</th>
                <th className="px-6 py-3">Learner Name</th>
                <th className="px-6 py-3">Business Unit</th>
                <th className="px-6 py-3">Program / Course / Session Title</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {displayedCerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No certificates found for this category.
                  </td>
                </tr>
              ) : (
                displayedCerts.map((c) => {
                  const isSess = isSessionCert(c);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        {isSess ? (
                          <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 font-bold text-[10px]">
                            <Video className="h-3 w-3 mr-1 text-red-500" /> Live Session
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 font-bold text-[10px]">
                            <BookOpen className="h-3 w-3 mr-1 text-blue-500" /> Course
                          </Badge>
                        )}
                      </td>
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
                  );
                })
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
