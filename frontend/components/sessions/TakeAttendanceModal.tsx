"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  UserCheck,
  Search,
  Upload,
  FileSpreadsheet,
  Award,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { SessionItem, saveSessionAttendance } from "@/services/api/session.service";
import toast from "react-hot-toast";

import { getEmployees } from "@/services/api/org.service";

export interface StudentRecord {
  userId: number | string;
  name: string;
  code: string;
  email: string;
  status: "PRESENT" | "ABSENT";
}

const DEFAULT_EMPLOYEES: StudentRecord[] = [
  { userId: 1, name: "Priyanka Davhare", code: "EMP001", email: "priyanka.davhare@company.com", status: "ABSENT" },
  { userId: 2, name: "Omprakash Pandey", code: "EMP002", email: "omprakash.pandey@company.com", status: "ABSENT" },
  { userId: 3, name: "Rahul Sharma", code: "EMP003", email: "rahul.sharma@company.com", status: "ABSENT" },
  { userId: 4, name: "Sneha Patil", code: "EMP004", email: "sneha.patil@company.com", status: "ABSENT" },
  { userId: 5, name: "Guest Visitor", code: "EMP005", email: "guest.visitor@company.com", status: "ABSENT" },
  { userId: 6, name: "Siddharth Savant", code: "EMP006", email: "siddharth.savant@company.com", status: "ABSENT" },
  { userId: 7, name: "Parth Honkalse", code: "EMP007", email: "parth.honkalse@company.com", status: "ABSENT" },
  { userId: 8, name: "Anuja Thorat", code: "EMP008", email: "anuja.thorat@company.com", status: "ABSENT" },
  { userId: 9, name: "Diya Yadav", code: "EMP009", email: "diya.yadav@company.com", status: "ABSENT" },
  { userId: 10, name: "Tushar Dayma", code: "EMP010", email: "tushar.dayma@company.com", status: "ABSENT" },
  { userId: 11, name: "Mohit Gahlot", code: "EMP011", email: "mohit.gahlot@company.com", status: "ABSENT" },
  { userId: 12, name: "Neelkanth Aher", code: "EMP012", email: "neelkanth.aher@company.com", status: "ABSENT" },
  { userId: 13, name: "Siddharth Kshirsagar", code: "EMP013", email: "siddharth.kshirsagar@company.com", status: "ABSENT" },
  { userId: 14, name: "Karan Krishna", code: "EMP014", email: "karan.krishna@company.com", status: "ABSENT" },
  { userId: 15, name: "Deepali Deshmukh", code: "EMP015", email: "deepali.deshmukh@company.com", status: "ABSENT" },
  { userId: 16, name: "Rohan Joshi", code: "EMP016", email: "rohan.joshi@company.com", status: "ABSENT" },
  { userId: 17, name: "Pooja Sharma", code: "EMP017", email: "pooja.sharma@company.com", status: "ABSENT" },
  { userId: 18, name: "Aditya Shinde", code: "EMP018", email: "aditya.shinde@company.com", status: "ABSENT" },
  { userId: 19, name: "Neha Gupta", code: "EMP019", email: "neha.gupta@company.com", status: "ABSENT" },
  { userId: 20, name: "Amit Verma", code: "EMP020", email: "amit.verma@company.com", status: "ABSENT" },
  { userId: 21, name: "Aarav Verma", code: "EMP021", email: "aarav.verma@company.com", status: "ABSENT" },
  { userId: 22, name: "Diya Kulkarni", code: "EMP022", email: "diya.kulkarni@company.com", status: "ABSENT" },
  { userId: 23, name: "Rohan Mehta", code: "EMP023", email: "rohan.mehta@company.com", status: "ABSENT" },
  { userId: 24, name: "Ananya Singh", code: "EMP024", email: "ananya.singh@company.com", status: "ABSENT" },
  { userId: 25, name: "Vikram Nair", code: "EMP025", email: "vikram.nair@company.com", status: "ABSENT" },
];

interface TakeAttendanceModalProps {
  session: SessionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TakeAttendanceModal({ session, isOpen, onClose, onSuccess }: TakeAttendanceModalProps) {
  const [students, setStudents] = useState<StudentRecord[]>(DEFAULT_EMPLOYEES);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSessionAttendance() {
      if (!session) return;
      if (session.attendanceData) {
        try {
          const parsed = JSON.parse(session.attendanceData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStudents(parsed);
            return;
          }
        } catch (err) {
          console.error("Failed to parse attendance data:", err);
        }
      }

      try {
        const res = await getEmployees();
        const rawEmps = Array.isArray(res) ? res : res?.data || [];
        if (Array.isArray(rawEmps) && rawEmps.length > 0) {
          let list: StudentRecord[] = rawEmps.map((emp: any, idx: number) => ({
            userId: emp.id || idx + 1,
            name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || `User #${emp.id}`,
            code: emp.employeeCode || `EMP${String(idx + 1).padStart(3, "0")}`,
            email: emp.officialEmail || `user${emp.id}@company.com`,
            deptId: emp.departmentId ? String(emp.departmentId) : undefined,
            status: "ABSENT",
          }));

          // Filter by Admin Enrollment (Selected Users)
          if (session.targetUserIds) {
            let uIds: string[] = [];
            try {
              const parsed = JSON.parse(session.targetUserIds);
              if (Array.isArray(parsed) && parsed.length > 0) uIds = parsed.map(String);
            } catch (e) {
              if (typeof session.targetUserIds === "string") {
                uIds = session.targetUserIds.split(",").map((s) => s.trim());
              }
            }
            if (uIds.length > 0) {
              list = list.filter((emp) =>
                uIds.includes(String(emp.userId)) ||
                uIds.includes(emp.code) ||
                uIds.some((u) => emp.email.toLowerCase().includes(u.toLowerCase()))
              );
            }
          } 
          // Filter by Department Scope
          else if (session.departmentId || session.enrollmentType === "DEPARTMENT") {
            const targetDeptId = session.departmentId ? String(session.departmentId) : null;
            if (targetDeptId) {
              list = list.filter((emp: any) => String(emp.deptId) === targetDeptId);
            }
          }

          setStudents(list);
          return;
        }
      } catch (e) {
        console.warn("Failed to fetch live employees for attendance, using defaults", e);
      }

      setStudents(DEFAULT_EMPLOYEES);
    }

    loadSessionAttendance();
  }, [session]);

  if (!session) return null;

  const toggleStatus = (userId: number | string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.userId === userId
          ? { ...s, status: s.status === "PRESENT" ? "ABSENT" : "PRESENT" }
          : s
      )
    );
  };

  const markAll = (status: "PRESENT" | "ABSENT") => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  // CSV Attendance Report Upload Handler (MS Teams / Zoom / Excel format support)
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lowerText = text.toLowerCase();

      let matchedCount = 0;
      setStudents((prev) =>
        prev.map((student) => {
          const studentEmail = (student.email || "").toLowerCase();
          const studentName = student.name.toLowerCase();
          const firstName = studentName.split(" ")[0];
          const studentCode = (student.code || "").toLowerCase();

          let isPresent = false;
          if (studentEmail && lowerText.includes(studentEmail)) {
            isPresent = true;
          } else if (studentCode && lowerText.includes(studentCode)) {
            isPresent = true;
          } else if (studentName && lowerText.includes(studentName)) {
            isPresent = true;
          } else if (firstName && firstName.length > 2 && lowerText.includes(firstName)) {
            isPresent = true;
          }

          if (isPresent) matchedCount++;
          return {
            ...student,
            status: isPresent ? "PRESENT" : "ABSENT",
          };
        })
      );

      toast.success(`Attendance CSV Processed! ${matchedCount} employee(s) verified & marked PRESENT.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsText(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveSessionAttendance(session.id, students);
      toast.success(`Attendance saved! Eligible learners can now download their certificates.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save attendance:", err);
      toast.error(err?.response?.data?.message || "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.code && s.code.toLowerCase().includes(search.toLowerCase()))
  );

  const presentCount = students.filter((s) => s.status === "PRESENT").length;
  const absentCount = students.filter((s) => s.status === "ABSENT").length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row items-center justify-between border-b border-slate-800">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <UserCheck className="h-5 w-5 text-red-500" />
              <span>Session Attendance &amp; Certificate Eligibility</span>
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Session: <strong className="text-white">{session.title}</strong> ({session.eventTime || "Scheduled"})
            </p>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* CSV File Upload Banner */}
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-extrabold text-red-900 dark:text-red-300">
                <FileSpreadsheet className="h-4 w-4 text-red-600" />
                <span>Upload MS Teams / Zoom CSV Attendance Report</span>
              </div>
              <p className="text-[11px] text-red-700 dark:text-red-400">
                Upload your meeting attendance CSV (containing participant Email IDs). System will auto-verify attendees &amp; unlock certificates.
              </p>
            </div>

            <div className="shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csvAttendanceInput"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs gap-2 h-9 px-4"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload CSV Attendance
              </Button>
            </div>
          </div>

          {/* Quick Stats & Mark All Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Present ({presentCount})
              </span>
              <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" /> Absent ({absentCount})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => markAll("PRESENT")}
                className="text-xs h-8 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-300 hover:bg-emerald-50"
              >
                Mark All Present
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => markAll("ABSENT")}
                className="text-xs h-8 text-red-700 dark:text-red-300 font-bold border-red-300 hover:bg-red-50"
              >
                Mark All Absent
              </Button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by learner name, email ID, or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
            />
          </div>

          {/* Students List Table */}
          <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">First name / Last name</th>
                  <th className="p-3">Email address</th>
                  <th className="p-3 text-center">Attendance Status</th>
                  <th className="p-3 text-center">Certificate Download Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((s) => (
                  <tr key={s.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center font-bold text-xs uppercase">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div>{s.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{s.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {s.email}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleStatus(s.userId)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border ${
                          s.status === "PRESENT"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-300 dark:border-red-800"
                        }`}
                      >
                        {s.status === "PRESENT" ? "✓ Present" : "✕ Absent"}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      {s.status === "PRESENT" ? (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 font-bold text-[10px]">
                          <Award className="h-3 w-3 mr-1 text-amber-500" /> Certificate Eligible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-300 text-[10px] font-semibold">
                          Locked (Absent)
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Certificate Download Rule Banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Certificate Policy:</strong> Only learners marked <strong className="text-emerald-700 dark:text-emerald-300">PRESENT</strong> will have access to download their official session completion certificate.
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md px-6"
            >
              {loading ? "Saving..." : "Save & Declare Certificate Eligibility"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
