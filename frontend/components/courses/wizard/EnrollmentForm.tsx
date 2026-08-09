"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Download,
  Search,
  Lock,
  UserPlus,
  ArrowRight,
  FileCheck,
  Trash2,
} from "lucide-react";
import {
  adminEnrollUser,
  bulkEnrollUsers,
  verifyUser,
  verifyBulkFile,
} from "@/services/api/course.service";

export interface EnrollmentRuleData {
  selfEnrollment: boolean;
  adminEnrollment: boolean;
  enrollmentType?: "SELF" | "ADMIN" | "BULK";
  departmentAccess: string;
  enrolledUsersList?: any[];
  teacherIds?: string[];
}

interface EnrollmentFormProps {
  data: EnrollmentRuleData;
  onChange: (updated: Partial<EnrollmentRuleData>) => void;
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
  courseId?: string | number | null;
}

interface BulkResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  enrolledUsers: any[];
  failedUsers: { identifier: string; reason: string }[];
}

export default function EnrollmentForm({
  data,
  onChange,
  onNext,
  onBack,
  onCancel,
  courseId,
}: EnrollmentFormProps) {
  const { user } = useAuthStore();
  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Selected Enrollment Type: SELF | ADMIN | BULK
  const activeType = data.enrollmentType || "SELF";
  const queuedUsers = data.enrolledUsersList || [];

  // Admin Single User State
  const [singleUser, setSingleUser] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleMessage, setSingleMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bulk Excel Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Teacher Username Input State
  const [teacherInput, setTeacherInput] = useState("");
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherMessage, setTeacherMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAddTeacher = async () => {
    if (!teacherInput.trim()) return;
    setTeacherLoading(true);
    setTeacherMessage(null);

    try {
      const res = await verifyUser(teacherInput.trim());
      if (res?.success && res.data) {
        const found = res.data;
        const teacherIdStr = String(found.id);
        const current = data.teacherIds || ["4"];
        if (!current.includes(teacherIdStr)) {
          onChange({ teacherIds: [...current, teacherIdStr] });
          setTeacherMessage({
            type: "success",
            text: `Added Teacher: ${found.name} (${found.employeeCode || found.username})`,
          });
          setTeacherInput("");
        } else {
          setTeacherMessage({ type: "error", text: `${found.name} is already assigned as a teacher.` });
        }
      }
    } catch (err: any) {
      setTeacherMessage({
        type: "error",
        text: err?.response?.data?.message || `User '${teacherInput}' not found as an active employee/teacher.`,
      });
    } finally {
      setTeacherLoading(false);
    }
  };

  const setType = (type: "SELF" | "ADMIN" | "BULK") => {
    onChange({
      enrollmentType: type,
      selfEnrollment: type === "SELF",
      adminEnrollment: type === "ADMIN" || type === "BULK",
    });
  };

  // 1. Single User Enrolment Handler (Works in BOTH New Creation & Edit Mode)
  const handleSingleUserEnroll = async () => {
    if (!singleUser.trim()) return;

    try {
      setSingleLoading(true);
      setSingleMessage(null);

      if (courseId) {
        // Direct enrollment for existing course
        const res = await adminEnrollUser(Number(courseId), singleUser.trim());
        if (res?.success) {
          setSingleMessage({
            type: "success",
            text: res.message || `User '${singleUser}' successfully enrolled into course!`,
          });
          const newUser = res.data?.user;
          if (newUser) {
            const updated = [...queuedUsers.filter((u) => u.userId !== newUser.userId), newUser];
            onChange({ enrolledUsersList: updated });
          }
          setSingleUser("");
        } else {
          setSingleMessage({
            type: "error",
            text: res?.message || `User '${singleUser}' could not be enrolled.`,
          });
        }
      } else {
        // Verify user in DB for new course draft
        const res = await verifyUser(singleUser.trim());
        if (res?.success && res.data) {
          const verifiedUser = res.data;
          const exists = queuedUsers.some((u) => u.userId === verifiedUser.userId);
          if (exists) {
            setSingleMessage({
              type: "success",
              text: `User '${verifiedUser.name}' (${verifiedUser.username}) is already in the enrolment list.`,
            });
          } else {
            const updated = [...queuedUsers, verifiedUser];
            onChange({ enrolledUsersList: updated });
            setSingleMessage({
              type: "success",
              text: `User '${verifiedUser.name}' (${verifiedUser.username}) verified & added! (Will be enrolled on Publish)`,
            });
          }
          setSingleUser("");
        } else {
          setSingleMessage({
            type: "error",
            text: res?.message || `User '${singleUser}' not found in system database.`,
          });
        }
      }
    } catch (err: any) {
      setSingleMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Failed to verify/enroll user. Verify database existence.",
      });
    } finally {
      setSingleLoading(false);
    }
  };

  // Remove queued user
  const handleRemoveUser = (userId: string) => {
    const updated = queuedUsers.filter((u) => u.userId !== userId);
    onChange({ enrolledUsersList: updated });
  };

  // 2. Excel File Select Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setBulkResult(null);
      setBulkError(null);
    }
  };

  // 3. Bulk Upload Handler (Works in BOTH New Creation & Edit Mode)
  const handleBulkEnroll = async () => {
    if (!selectedFile) return;

    try {
      setBulkLoading(true);
      setBulkError(null);

      let res;
      if (courseId) {
        res = await bulkEnrollUsers(Number(courseId), selectedFile);
      } else {
        res = await verifyBulkFile(selectedFile);
      }

      if (res?.success && res?.data) {
        const dataRes: BulkResult = res.data;
        setBulkResult(dataRes);

        // Queue valid users
        if (dataRes.enrolledUsers && dataRes.enrolledUsers.length > 0) {
          const mergedMap = new Map();
          queuedUsers.forEach((u) => mergedMap.set(u.userId, u));
          dataRes.enrolledUsers.forEach((u) => mergedMap.set(u.userId, u));
          const updated = Array.from(mergedMap.values());
          onChange({ enrolledUsersList: updated });
        }
      } else {
        setBulkError(res?.message || "Failed to process bulk enrollment file.");
      }
    } catch (err: any) {
      setBulkError(err?.response?.data?.message || err?.message || "Failed to parse Excel file and process enrollments.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Download Sample Excel Template
  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Username\npriyanka\nomprakash\nrahul\nsneha\ninvalid_emp_99\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bulk_enrollment_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider mb-1">
          Step 4: Access &amp; Enrolment Strategy
        </div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Enrolment Configuration &amp; User Assignment
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Select enrolment model: Self-Enrolment, Direct Admin Enrolment, or Group/Bulk Excel Upload. You can assign users directly now before publishing!
        </p>
      </div>

      {/* Teacher Lock Restriction Alert */}
      {isTeacher && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Enrollment &amp; Learner Access Restricted</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Enrollment configuration and learner assignment are managed exclusively by Admin and Super Admin. As a Teacher, you cannot modify enrollment models, add learners, or remove learners from this course.
          </p>
        </div>
      )}

      <div className={isTeacher ? "pointer-events-none opacity-60 select-none" : ""}>
        {/* 3 Enrolment Types Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Type 1: Self Enrolment */}
        <div
          onClick={() => setType("SELF")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
            activeType === "SELF"
              ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/20"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <UserCheck className="h-5 w-5" />
              </div>
              {activeType === "SELF" && (
                <span className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  Active Type 1
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">1) Self Enrolment</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Eligible learners can view course in catalog / Recently Added section and click "Enroll" themselves.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Open Catalog Enrolment
          </div>
        </div>

        {/* Type 2: Admin Direct Enrolment */}
        <div
          onClick={() => setType("ADMIN")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
            activeType === "ADMIN"
              ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/20"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              {activeType === "ADMIN" && (
                <span className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  Active Type 2
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">2) Admin Direct Enroll</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Super Admin or Dept Admin directly enrolls specific employees one by one using Email or Username.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-blue-600 font-semibold">
            <span className="flex items-center"><UserPlus className="h-3.5 w-3.5 mr-1" /> Direct Single Assignment</span>
            {queuedUsers.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {queuedUsers.length} Users
              </span>
            )}
          </div>
        </div>

        {/* Type 3: Group / Bulk Enrolment */}
        <div
          onClick={() => setType("BULK")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
            activeType === "BULK"
              ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/20"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              {activeType === "BULK" && (
                <span className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  Active Type 3
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">3) Group / Bulk Enrolment</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Upload Excel file containing employee usernames/emails. Auto-verifies DB &amp; reports success vs invalid users.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-purple-600 font-semibold">
            <span className="flex items-center"><Upload className="h-3.5 w-3.5 mr-1" /> Batch Excel Verification</span>
            {queuedUsers.length > 0 && (
              <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {queuedUsers.length} Enrolled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED INTERACTIVE SECTION BASED ON SELECTED ENROLMENT TYPE */}

      {/* Option 1 Detail: Self Enrolment */}
      {activeType === "SELF" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Option 1: Self Enrolment Workflow Enabled</h4>
              <p className="text-xs text-muted-foreground">
                Learners within eligible department scopes can self-enroll into this course anytime from catalog or Recently Added programs.
              </p>
            </div>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Automatic Learner Registration
            </div>
            <p className="text-xs text-muted-foreground">
              When an eligible employee clicks "Enroll Now", an enrollment record is created with status <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">IN_PROGRESS</code> in the database, granting instant access to course modules.
            </p>
          </div>
        </div>
      )}

      {/* Option 2 Detail: Admin Direct Enrolment */}
      {activeType === "ADMIN" && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Option 2: Admin Single Employee Direct Enrolment</h4>
              <p className="text-xs text-muted-foreground">
                Add employees one-at-a-time using official Email address or Username.
              </p>
            </div>
          </div>

          <div className="bg-background rounded-xl p-5 border border-border space-y-4 shadow-sm">
            <Label className="text-xs font-bold text-foreground">Employee Email or Username</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. priyanka, omprakash@company.com, or EMP001"
                  value={singleUser}
                  onChange={(e) => setSingleUser(e.target.value)}
                  className="pl-9 h-10 text-xs bg-background"
                />
              </div>
              <Button
                disabled={singleLoading || !singleUser.trim()}
                onClick={handleSingleUserEnroll}
                className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 gap-2 text-xs font-bold shrink-0"
              >
                {singleLoading ? "Verifying DB..." : "Verify & Enroll"}
              </Button>
            </div>

            {singleMessage && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  singleMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                {singleMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                {singleMessage.text}
              </div>
            )}
          </div>

          {/* Enrolled/Queued Users Table */}
          {queuedUsers.length > 0 && (
            <div className="bg-background rounded-xl border border-border p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h5 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Assigned Employees ({queuedUsers.length})
                </h5>
                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                  Enrolled on Publish
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {queuedUsers.map((u, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20 border border-border">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{u.name}</span>
                      <span className="text-muted-foreground font-mono text-[11px]">({u.username})</span>
                      <span className="text-[10px] text-muted-foreground">{u.email}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(u.userId)}
                      className="text-destructive hover:text-destructive/80 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Option 3 Detail: Group or Bulk Enrolment (Excel Upload + Failure Breakdown) */}
      {activeType === "BULK" && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Option 3: Group / Bulk Enrolment via Excel File</h4>
                <p className="text-xs text-muted-foreground">
                  Batch enroll 100+ employees. System parses rows, checks DB validity, and reports exact enrolment results.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={downloadSampleTemplate}
              className="gap-2 text-xs font-bold border-purple-500/30 hover:bg-purple-500/10 text-purple-600 shrink-0 self-start sm:self-center"
            >
              <Download className="h-3.5 w-3.5" /> Sample Template (.csv)
            </Button>
          </div>

          {/* Upload Drop Zone */}
          <div className="bg-background rounded-xl p-6 border-2 border-dashed border-purple-500/30 text-center space-y-3 shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Upload Excel File (.xlsx, .xls, .csv)</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Must contain a list of employee usernames or emails in column 1.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <input
                type="file"
                id="excel-file-input"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="excel-file-input"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-2"
              >
                <FileCheck className="h-4 w-4" />
                {selectedFile ? selectedFile.name : "Choose File"}
              </label>

              {selectedFile && (
                <Button
                  disabled={bulkLoading}
                  onClick={handleBulkEnroll}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 px-5"
                >
                  {bulkLoading ? "Validating DB..." : "Process & Verify Excel"}
                </Button>
              )}
            </div>
          </div>

          {bulkError && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              {bulkError}
            </div>
          )}

          {/* Verification Results Summary Card */}
          {bulkResult && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  Bulk Enrolment Processing Summary
                </h5>
                <span className="text-xs font-bold text-muted-foreground">
                  Total Processed: {bulkResult.totalProcessed}
                </span>
              </div>

              {/* Summary Stats Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-600">Valid &amp; Ready to Enroll</span>
                    <p className="text-xl font-extrabold text-emerald-600">{bulkResult.successCount}</p>
                  </div>
                  <CheckCircle2 className="h-7 w-7 text-emerald-500/50" />
                </div>

                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-destructive">Failed / Invalid Users</span>
                    <p className="text-xl font-extrabold text-destructive">{bulkResult.failedCount}</p>
                  </div>
                  <XCircle className="h-7 w-7 text-destructive/50" />
                </div>
              </div>

              {/* Detailed Breakdown of Failed Users */}
              {bulkResult.failedCount > 0 ? (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Failed Enrolments &amp; Invalid Usernames Breakdown ({bulkResult.failedCount}):
                  </Label>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-1.5">
                    {bulkResult.failedUsers.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-background border border-border"
                      >
                        <span className="font-mono font-bold text-foreground">{item.identifier}</span>
                        <span className="text-destructive font-semibold text-[11px]">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  All {bulkResult.totalProcessed} employees verified in database! They will be automatically enrolled on Publish.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Teacher Assignment Section (Dynamic Username Input) */}
      <div className="space-y-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-foreground">
              Assign Teachers for Review &amp; Assignment Grading
            </h3>
          </div>
          <span className="text-[11px] font-bold bg-indigo-500/10 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Dynamic Teacher Assignment
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Enter any instructor's username, official email, or employee code to add them as an assigned teacher for this course. Assigned teachers can grade student assignments, review submissions, and manage course progress.
        </p>

        {/* Username Search & Add Input Box */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <UserCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter teacher username, email, or employee code (e.g. sneha, EMP004, priyanka)..."
              value={teacherInput}
              onChange={(e) => setTeacherInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTeacher();
                }
              }}
              className="pl-9 h-10 text-xs bg-background"
            />
          </div>
          <Button
            type="button"
            onClick={handleAddTeacher}
            disabled={teacherLoading || !teacherInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-4"
          >
            {teacherLoading ? "Verifying..." : "+ Add Teacher"}
          </Button>
        </div>

        {teacherMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              teacherMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
            }`}
          >
            {teacherMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {teacherMessage.text}
          </div>
        )}

        {/* Assigned Teachers List */}
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-bold text-foreground">
            Assigned Teachers ({(data.teacherIds || ["4"]).length})
          </Label>

          {(data.teacherIds || ["4"]).length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No teachers assigned yet. Enter a username above to assign teachers.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(data.teacherIds || ["4"]).map((idStr) => {
                const knownTeachers: Record<string, { name: string; code: string }> = {
                  "4": { name: "Sneha Patil", code: "EMP004" },
                  "2": { name: "Omprakash Pandey", code: "EMP002" },
                  "1": { name: "Priyanka Davhare", code: "EMP001" },
                };
                const info = knownTeachers[idStr] || { name: `Teacher #${idStr}`, code: `ID:${idStr}` };

                return (
                  <div
                    key={idStr}
                    className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-full text-xs shadow-sm"
                  >
                    <span>{info.name} ({info.code})</span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = data.teacherIds || ["4"];
                        onChange({ teacherIds: current.filter((id) => id !== idStr) });
                      }}
                      className="h-4 w-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-[10px] text-white"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="pt-2 border-t border-indigo-500/20 flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-semibold">Quick Add Instructors:</span>
          {[
            { id: "4", name: "Sneha Patil (EMP004)" },
            { id: "2", name: "Omprakash Pandey (EMP002)" },
            { id: "1", name: "Priyanka Davhare (EMP001)" },
          ].map((item) => {
            const isAdded = (data.teacherIds || ["4"]).includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const current = data.teacherIds || ["4"];
                  const next = isAdded
                    ? current.filter((id) => id !== item.id)
                    : [...current, item.id];
                  onChange({ teacherIds: next });
                }}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                  isAdded
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-background text-foreground border-border hover:border-indigo-400"
                }`}
              >
                {isAdded ? `✓ ${item.name}` : `+ ${item.name}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Department Scoping Banner */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Target Department Eligibility
          </h3>
          {isAdmin && (
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
              <Lock className="h-3 w-3" /> Admin Restricted Access
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Target Department Scope</Label>
          <select
            disabled={isAdmin}
            value={data.departmentAccess || "ALL"}
            onChange={(e) => onChange({ departmentAccess: e.target.value })}
            className="w-full h-10 px-3 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSuperAdmin && <option value="ALL">Global (All Organizational Departments)</option>}
            <option value="ENG">Engineering (ENG)</option>
            <option value="HR">Human Resources (HR)</option>
            <option value="MGT">Management (MGT)</option>
          </select>
          <p className="text-[11px] text-muted-foreground">
            {isAdmin
              ? "As an Admin, this course is automatically scoped to your assigned department."
              : "As Super Admin, selecting Global opens course visibility to all departments."}
          </p>
        </div>
      </div>
      </div>

      {/* Stepper Footer */}
      <div className="flex items-center justify-between border-t border-border pt-5">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onBack}>
            &larr; Back
          </Button>
          <Button onClick={onNext} className="bg-primary text-primary-foreground gap-2">
            Save &amp; Next <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
