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

export interface StudentRecord {
  userId: number | string;
  name: string;
  code: string;
  email: string;
  status: "PRESENT" | "ABSENT";
}

const DEFAULT_EMPLOYEES: StudentRecord[] = [
  { userId: 1, name: "Priyanka Davhare", code: "EMP001", email: "priyanka.davhare@harbingergroup.com", status: "PRESENT" },
  { userId: 2, name: "Deepali Uttekar", code: "EMP002", email: "Deepali.Uttekar@harbingergroup.com", status: "PRESENT" },
  { userId: 3, name: "Shailesh Chikate", code: "EMP003", email: "shailesh@harbingergroup.com", status: "PRESENT" },
  { userId: 4, name: "Ayush Gupta", code: "EMP004", email: "Ayush.Gupta@harbingergroup.com", status: "PRESENT" },
  { userId: 5, name: "Sahil Dhiman", code: "EMP005", email: "Sahil.Dhiman@harbingergroup.com", status: "PRESENT" },
  { userId: 6, name: "Sneha Patil", code: "EMP006", email: "sneha.patil@harbingergroup.com", status: "PRESENT" },
  { userId: 7, name: "Omprakash Pandey", code: "EMP007", email: "omprakash.pandey@harbingergroup.com", status: "PRESENT" },
  { userId: 8, name: "Rahul Sharma", code: "EMP008", email: "rahul.sharma@harbingergroup.com", status: "ABSENT" },
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
    if (session?.attendanceData) {
      try {
        const parsed = JSON.parse(session.attendanceData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStudents(parsed);
        }
      } catch (err) {
        console.error("Failed to parse attendance data:", err);
      }
    } else {
      setStudents(DEFAULT_EMPLOYEES);
    }
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

  // CSV Attendance Report Upload Handler (MS Teams / Zoom format support)
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Extract all emails using regex
      const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const emailSet = new Set(emailMatches.map((em) => em.toLowerCase()));

      if (emailSet.size === 0) {
        toast.error("No valid email addresses found in uploaded CSV file.");
        return;
      }

      let matchedCount = 0;
      setStudents((prev) =>
        prev.map((student) => {
          const studentEmail = (student.email || "").toLowerCase();
          const studentNameClean = student.name.toLowerCase().replace(/\s+/g, "");

          let isPresent = false;
          if (studentEmail && emailSet.has(studentEmail)) {
            isPresent = true;
          } else {
            // Check if any extracted email contains student name snippet
            for (const em of Array.from(emailSet)) {
              if (em.includes(studentNameClean) || studentNameClean.includes(em.split("@")[0].replace(".", ""))) {
                isPresent = true;
                break;
              }
            }
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
