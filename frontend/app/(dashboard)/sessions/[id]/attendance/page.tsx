"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  UserCheck,
  Search,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  RefreshCw,
  Video,
  Calendar,
  Clock,
} from "lucide-react";
import RoleGate from "@/components/auth/RoleGate";
import {
  SessionItem,
  getSessionById,
  saveSessionAttendance,
} from "@/services/api/session.service";
import toast from "react-hot-toast";

export interface StudentRecord {
  userId: number | string;
  name: string;
  code: string;
  email: string;
  status: "PRESENT" | "ABSENT";
}

const ALL_25_EMPLOYEES: StudentRecord[] = [
  { userId: 1, name: "Priyanka Davhare", code: "EMP001", email: "priyanka.davhare@harbingergroup.com", status: "PRESENT" },
  { userId: 2, name: "Deepali Uttekar", code: "EMP002", email: "Deepali.Uttekar@harbingergroup.com", status: "PRESENT" },
  { userId: 3, name: "Shailesh Chikate", code: "EMP003", email: "shailesh@harbingergroup.com", status: "PRESENT" },
  { userId: 4, name: "Ayush Gupta", code: "EMP004", email: "Ayush.Gupta@harbingergroup.com", status: "PRESENT" },
  { userId: 5, name: "Sahil Dhiman", code: "EMP005", email: "Sahil.Dhiman@harbingergroup.com", status: "PRESENT" },
  { userId: 6, name: "Sneha Patil", code: "EMP006", email: "sneha.patil@harbingergroup.com", status: "PRESENT" },
  { userId: 7, name: "Omprakash Pandey", code: "EMP007", email: "omprakash.pandey@harbingergroup.com", status: "PRESENT" },
  { userId: 8, name: "Rahul Sharma", code: "EMP008", email: "rahul.sharma@harbingergroup.com", status: "ABSENT" },
  { userId: 9, name: "Umesh Panditkar", code: "EMP009", email: "umesh.panditkar@harbingergroup.com", status: "PRESENT" },
  { userId: 10, name: "Neha Srivastava", code: "EMP010", email: "Neha.Srivastava@harbingergroup.com", status: "PRESENT" },
  { userId: 11, name: "Amit Verma", code: "EMP011", email: "amit.verma@harbingergroup.com", status: "PRESENT" },
  { userId: 12, name: "Pooja Deshmukh", code: "EMP012", email: "pooja.deshmukh@harbingergroup.com", status: "PRESENT" },
  { userId: 13, name: "Rohan Kulkarni", code: "EMP013", email: "rohan.kulkarni@harbingergroup.com", status: "PRESENT" },
  { userId: 14, name: "Ananya Joshi", code: "EMP014", email: "ananya.joshi@harbingergroup.com", status: "PRESENT" },
  { userId: 15, name: "Vikram Rathore", code: "EMP015", email: "vikram.rathore@harbingergroup.com", status: "PRESENT" },
  { userId: 16, name: "Divya Nair", code: "EMP016", email: "divya.nair@harbingergroup.com", status: "PRESENT" },
  { userId: 17, name: "Kunal Mehra", code: "EMP017", email: "kunal.mehra@harbingergroup.com", status: "PRESENT" },
  { userId: 18, name: "Tanvi Saxena", code: "EMP018", email: "tanvi.saxena@harbingergroup.com", status: "PRESENT" },
  { userId: 19, name: "Siddharth Rao", code: "EMP019", email: "siddharth.rao@harbingergroup.com", status: "PRESENT" },
  { userId: 20, name: "Meera Agarwal", code: "EMP020", email: "meera.agarwal@harbingergroup.com", status: "PRESENT" },
  { userId: 21, name: "Varun Malhotra", code: "EMP021", email: "varun.malhotra@harbingergroup.com", status: "PRESENT" },
  { userId: 22, name: "Ishita Banerjee", code: "EMP022", email: "ishita.banerjee@harbingergroup.com", status: "PRESENT" },
  { userId: 23, name: "Gaurav Bhatt", code: "EMP023", email: "gaurav.bhatt@harbingergroup.com", status: "PRESENT" },
  { userId: 24, name: "Ritu Singhania", code: "EMP024", email: "ritu.singhania@harbingergroup.com", status: "PRESENT" },
  { userId: 25, name: "Nikhil Kapoor", code: "EMP025", email: "nikhil.kapoor@harbingergroup.com", status: "PRESENT" },
];

export default function SessionAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [session, setSession] = useState<SessionItem | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>(ALL_25_EMPLOYEES);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      if (!sessionId) return;
      setLoading(true);
      try {
        const fetched = await getSessionById(sessionId);
        if (fetched) {
          setSession(fetched);

          let baseList: StudentRecord[] = ALL_25_EMPLOYEES;

          // If Type 2 Option (Admin Enrollment with targetUserIds), show ONLY enrolled learners!
          if (fetched.targetUserIds) {
            let uIds: string[] = [];
            try {
              const parsed = JSON.parse(fetched.targetUserIds);
              if (Array.isArray(parsed) && parsed.length > 0) uIds = parsed.map(String);
            } catch (e) {
              if (typeof fetched.targetUserIds === "string") {
                uIds = fetched.targetUserIds.split(",").map((s) => s.trim());
              }
            }

            if (uIds.length > 0) {
              baseList = ALL_25_EMPLOYEES.filter((emp) =>
                uIds.includes(String(emp.userId)) ||
                uIds.includes(emp.code) ||
                uIds.some((u) => emp.email.toLowerCase().includes(u.toLowerCase()))
              );
            }
          }

          // If session attendance was saved, update attendance statuses!
          if (fetched.attendanceData) {
            try {
              const parsedAttendance = JSON.parse(fetched.attendanceData);
              if (Array.isArray(parsedAttendance) && parsedAttendance.length > 0) {
                const attMap = new Map(parsedAttendance.map((a: any) => [String(a.userId), a.status]));
                baseList = baseList.map((s) => ({
                  ...s,
                  status: (attMap.get(String(s.userId)) as "PRESENT" | "ABSENT") || s.status,
                }));
              }
            } catch (e) {
              console.error("Failed to parse attendance data:", e);
            }
          }

          setStudents(baseList);
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [sessionId]);

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
    if (!sessionId) return;
    setSaving(true);
    try {
      await saveSessionAttendance(sessionId, students);
      toast.success("Attendance saved successfully! Eligible learners can now download their certificates.");
      router.push("/sessions");
    } catch (err: any) {
      console.error("Failed to save attendance:", err);
      toast.error(err?.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
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
    <RoleGate allowed={["ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <button
            onClick={() => router.push("/sessions")}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sessions
          </button>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-red-600" />
            <span>Live Session Attendance: <strong className="text-red-600">{session?.title || "Live Session"}</strong></span>
          </h1>
        </div>
      </div>

      {/* CSV File Upload Banner */}
      <Card className="p-6 border border-red-200 dark:border-red-900/60 bg-gradient-to-r from-red-50/70 via-card to-amber-50/50 dark:from-red-950/40 dark:to-slate-900 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-red-900 dark:text-red-300">
            <FileSpreadsheet className="h-5 w-5 text-red-600" />
            <span>Upload MS Teams / Zoom CSV Attendance Report</span>
          </div>

          <div className="shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
              id="fullPageCsvInput"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-5"
            >
              <Upload className="h-4 w-4" />
              Upload Attendance CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Bar & Mark All Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border border-border rounded-2xl flex items-center justify-between bg-card shadow-xs">
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase">Total Learners</div>
            <div className="text-2xl font-black text-foreground mt-0.5">{students.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">
            <UserCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-extrabold uppercase">Present (Certificate Unlocked)</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{presentCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-red-700 dark:text-red-400 font-extrabold uppercase">Absent (Certificate Locked)</div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">{absentCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
            <XCircle className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border rounded-2xl overflow-hidden shadow-xs space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border pb-4">
          {/* Search Filter */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by learner name, email address, or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          {/* Quick Mark All Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => markAll("PRESENT")}
              className="text-xs h-9 text-emerald-700 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-50 font-bold rounded-xl"
            >
              Mark All Present
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => markAll("ABSENT")}
              className="text-xs h-9 text-red-700 dark:text-red-300 border-red-300 hover:bg-red-50 font-bold rounded-xl"
            >
              Mark All Absent
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase font-bold text-[11px]">
              <tr>
                <th className="p-4">First name / Last name</th>
                <th className="p-4">Email address</th>
                <th className="p-4 text-center">Attendance Status</th>
                <th className="p-4 text-center">Certificate Download Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.userId} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-semibold text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{s.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                    {s.email}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleStatus(s.userId)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all border shadow-xs ${
                        s.status === "PRESENT"
                          ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                          : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-100"
                      }`}
                    >
                      {s.status === "PRESENT" ? "✓ Present" : "✕ Absent"}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    {s.status === "PRESENT" ? (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 font-bold text-xs px-3 py-1">
                        <Award className="h-3.5 w-3.5 mr-1 text-amber-500" /> Certificate Eligible
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-300 text-xs font-semibold px-3 py-1">
                        Locked (Absent)
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certificate Policy Banner */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>Certificate Policy:</strong> Only learners marked <strong className="text-emerald-700 dark:text-emerald-300">PRESENT</strong> will have access to download their official session completion certificate.
          </span>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/sessions")}
            className="rounded-xl px-5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md px-8 h-10"
          >
            {saving ? "Saving Records..." : "Save & Declare Certificate Eligibility"}
          </Button>
        </div>
      </Card>
    </div>
    </RoleGate>
  );
}
