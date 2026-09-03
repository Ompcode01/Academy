"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Users,
  Award,
  CheckCircle2,
  Repeat,
  Link2,
  Sparkles,
} from "lucide-react";
import { createSession, updateSession, getSessionById } from "@/services/api/session.service";
import EnrollmentForm, { EnrollmentRuleData } from "@/components/courses/wizard/EnrollmentForm";
import CertificateForm, { CertificateRuleData } from "@/components/courses/wizard/CertificateForm";
import toast from "react-hot-toast";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEARS = ["2026", "2027", "2028"];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function CreateSessionPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State: Session Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState("2");
  const [month, setMonth] = useState("September");
  const [year, setYear] = useState("2026");

  const [fromHour, setFromHour] = useState("09");
  const [fromMinute, setFromMinute] = useState("00");
  const [fromAmpm, setFromAmpm] = useState<"AM" | "PM">("AM");

  const [toHour, setToHour] = useState("10");
  const [toMinute, setToMinute] = useState("00");
  const [toAmpm, setToAmpm] = useState<"AM" | "PM">("AM");

  const [meetingUrl, setMeetingUrl] = useState("");
  const [createCalendarEvent, setCreateCalendarEvent] = useState(true);

  // Recurring Options & Dropdown Accordion
  const [isMultipleOpen, setIsMultipleOpen] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [repeatEveryWeeks, setRepeatEveryWeeks] = useState(1);
  const [untilDay, setUntilDay] = useState("30");
  const [untilMonth, setUntilMonth] = useState("September");
  const [untilYear, setUntilYear] = useState("2026");

  // Step 2 State: Enrollment Data (exact same component & data structure as course wizard)
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentRuleData>({
    selfEnrollment: true,
    adminEnrollment: false,
    departmentAccess: "ALL",
    enrolledUsersList: [],
  });

  // Step 3 State: Certificate Data (exact same component as course wizard)
  const [certificateData, setCertificateData] = useState<CertificateRuleData>({
    enableCertificate: true,
    certificateTitle: "Certificate of Completion",
    primaryColor: "#d97706",
    passingThreshold: 70,
    templateId: "classic",
  });

  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  React.useEffect(() => {
    async function loadEditData() {
      if (!editId) return;
      try {
        const existing = await getSessionById(editId);
        if (existing) {
          setTitle(existing.title || "");
          setDescription(existing.description || "");
          setMeetingUrl(existing.url || "");
          if (existing.eventDate) {
            const dt = new Date(existing.eventDate);
            if (!isNaN(dt.getTime())) {
              setDay(String(dt.getDate()));
              setMonth(MONTHS[dt.getMonth()]);
              setYear(String(dt.getFullYear()));
            }
          }
          if (existing.eventTime) {
            const parts = existing.eventTime.split("-").map((p) => p.trim());
            if (parts[0]) {
              const matchFrom = parts[0].match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
              if (matchFrom) {
                setFromHour(matchFrom[1].padStart(2, "0"));
                setFromMinute(matchFrom[2]);
                if (matchFrom[3]) setFromAmpm(matchFrom[3].toUpperCase() as "AM" | "PM");
              }
            }
            if (parts[1]) {
              const matchTo = parts[1].match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
              if (matchTo) {
                setToHour(matchTo[1].padStart(2, "0"));
                setToMinute(matchTo[2]);
                if (matchTo[3]) setToAmpm(matchTo[3].toUpperCase() as "AM" | "PM");
              }
            }
          }
          if (existing.targetUserIds) {
            let uIds: string[] = [];
            try {
              const parsed = JSON.parse(existing.targetUserIds);
              if (Array.isArray(parsed)) uIds = parsed.map(String);
            } catch (e) {
              if (typeof existing.targetUserIds === "string") {
                uIds = existing.targetUserIds.split(",").map((s) => s.trim());
              }
            }
            const knownEmployees: Record<string, { id: number; name: string; email: string; employeeCode: string }> = {
              "1": { id: 1, name: "Priyanka Davhare", email: "priyanka.davhare@company.com", employeeCode: "EMP001" },
              "2": { id: 2, name: "Omprakash Pandey", email: "omprakash.pandey@company.com", employeeCode: "EMP002" },
              "3": { id: 3, name: "Rahul Sharma", email: "rahul.sharma@company.com", employeeCode: "EMP003" },
              "4": { id: 4, name: "Sneha Patil", email: "sneha.patil@company.com", employeeCode: "EMP004" },
              "5": { id: 5, name: "Guest Visitor", email: "guest.visitor@company.com", employeeCode: "EMP005" },
              "6": { id: 6, name: "Siddharth Savant", email: "siddharth.savant@company.com", employeeCode: "EMP006" },
              "7": { id: 7, name: "Parth Honkalse", email: "parth.honkalse@company.com", employeeCode: "EMP007" },
              "8": { id: 8, name: "Anuja Thorat", email: "anuja.thorat@company.com", employeeCode: "EMP008" },
              "9": { id: 9, name: "Diya Yadav", email: "diya.yadav@company.com", employeeCode: "EMP009" },
              "10": { id: 10, name: "Tushar Dayma", email: "tushar.dayma@company.com", employeeCode: "EMP010" },
              "11": { id: 11, name: "Mohit Gahlot", email: "mohit.gahlot@company.com", employeeCode: "EMP011" },
              "12": { id: 12, name: "Neelkanth Aher", email: "neelkanth.aher@company.com", employeeCode: "EMP012" },
              "13": { id: 13, name: "Siddharth Kshirsagar", email: "siddharth.kshirsagar@company.com", employeeCode: "EMP013" },
              "14": { id: 14, name: "Karan Krishna", email: "karan.krishna@company.com", employeeCode: "EMP014" },
              "15": { id: 15, name: "Deepali Deshmukh", email: "deepali.deshmukh@company.com", employeeCode: "EMP015" },
              "16": { id: 16, name: "Rohan Joshi", email: "rohan.joshi@company.com", employeeCode: "EMP016" },
              "17": { id: 17, name: "Pooja Sharma", email: "pooja.sharma@company.com", employeeCode: "EMP017" },
              "18": { id: 18, name: "Aditya Shinde", email: "aditya.shinde@company.com", employeeCode: "EMP018" },
              "19": { id: 19, name: "Neha Gupta", email: "neha.gupta@company.com", employeeCode: "EMP019" },
              "20": { id: 20, name: "Amit Verma", email: "amit.verma@company.com", employeeCode: "EMP020" },
              "21": { id: 21, name: "Aarav Verma", email: "aarav.verma@company.com", employeeCode: "EMP021" },
              "22": { id: 22, name: "Diya Kulkarni", email: "diya.kulkarni@company.com", employeeCode: "EMP022" },
              "23": { id: 23, name: "Rohan Mehta", email: "rohan.mehta@company.com", employeeCode: "EMP023" },
              "24": { id: 24, name: "Ananya Singh", email: "ananya.singh@company.com", employeeCode: "EMP024" },
              "25": { id: 25, name: "Vikram Nair", email: "vikram.nair@company.com", employeeCode: "EMP025" },
            };
            const prefilledList = uIds.map((idStr) => knownEmployees[idStr] || { id: idStr, name: `Employee #${idStr}`, email: `employee${idStr}@company.com`, employeeCode: `EMP00${idStr}` });

            setEnrollmentData((prev) => ({
              ...prev,
              departmentAccess: existing.enrollmentType || "ALL",
              adminEnrollment: prefilledList.length > 0,
              enrolledUsersList: prefilledList,
            }));
          } else if (existing.enrollmentType) {
            setEnrollmentData((prev) => ({ ...prev, departmentAccess: existing.enrollmentType || "ALL" }));
          }

          if (existing.certificateTemplateId) {
            const isNone = existing.certificateTemplateId === "none";
            setCertificateData((prev) => ({
              ...prev,
              enableCertificate: !isNone,
              templateId: existing.certificateTemplateId || "classic",
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load session for editing", err);
      }
    }
    loadEditData();
  }, [editId]);

  const toggleDay = (d: string) => {
    setRepeatDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const handleFinalSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a session title.");
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      const monthIdx = MONTHS.indexOf(month);
      let calculatedHrs = parseInt(fromHour, 10);
      if (fromAmpm === "PM" && calculatedHrs < 12) calculatedHrs += 12;
      if (fromAmpm === "AM" && calculatedHrs === 12) calculatedHrs = 0;

      const eventDateObj = new Date(Number(year), monthIdx, Number(day), calculatedHrs, Number(fromMinute));
      
      // Block session creation for past dates/times
      if (eventDateObj.getTime() < Date.now()) {
        toast.error("Cannot schedule a session in the past. Please select a current or future date and time.");
        setCurrentStep(1);
        return;
      }

      const eventDateStr = eventDateObj.toISOString();
      const eventTimeStr = `${fromHour}:${fromMinute} ${fromAmpm} - ${toHour}:${toMinute} ${toAmpm}`;

      const targetUserIds = (enrollmentData.enrolledUsersList || []).map(
        (u: any) => String(u.id || u.userId)
      );

      const certIdToSave = certificateData.enableCertificate !== false && certificateData.templateId !== "none" ? (certificateData.templateId || "classic") : "none";

      if (editId) {
        await updateSession(editId, {
          title: title.trim(),
          description: description.trim() || title.trim(),
          eventDate: eventDateStr,
          eventTime: eventTimeStr,
          url: meetingUrl.trim() || undefined,
          eventType: enrollmentData.departmentAccess === "ALL" ? "site" : "course",
          certificateTemplateId: certIdToSave,
        });
        toast.success("Live Session updated successfully!");
      } else {
        await createSession({
          title: title.trim(),
          description: description.trim() || title.trim(),
          eventDate: eventDateStr,
          eventTime: eventTimeStr,
          url: meetingUrl.trim() || undefined,
          eventType: enrollmentData.departmentAccess === "ALL" ? "site" : "course",
          createCalendarEvent,
          enrollmentType: enrollmentData.departmentAccess,
          targetUserIds,
          certificateTemplateId: certIdToSave,
        });
        toast.success("Live Session & Certificate configuration created successfully!");
      }

      router.push("/sessions");
    } catch (err: any) {
      console.error("Failed to save session:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to save session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto min-h-screen">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/sessions")}
            className="gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sessions
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Video className="h-5 w-5 text-red-600" />
            <span>{editId ? "Edit Live Session Details" : "Create New Live Session Wizard"}</span>
          </h1>
        </div>

        <Badge variant="outline" className="font-mono text-xs bg-red-50 text-red-600 border-red-200">
          Step {currentStep} of 3
        </Badge>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentStep(1)}
          className={`p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${
            currentStep === 1
              ? "bg-red-600/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className={`p-2 rounded-lg ${currentStep === 1 ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}>
            <Video className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase">Step 1</div>
            <div className="text-sm font-bold">Session Details</div>
          </div>
        </button>

        <button
          onClick={() => setCurrentStep(2)}
          className={`p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${
            currentStep === 2
              ? "bg-red-600/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className={`p-2 rounded-lg ${currentStep === 2 ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}>
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase">Step 2</div>
            <div className="text-sm font-bold">Student Enrollment</div>
          </div>
        </button>

        <button
          onClick={() => setCurrentStep(3)}
          className={`p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${
            currentStep === 3
              ? "bg-red-600/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className={`p-2 rounded-lg ${currentStep === 3 ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}>
            <Award className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase">Step 3</div>
            <div className="text-sm font-bold">Certificate Selection</div>
          </div>
        </button>
      </div>

      {/* STEP 1: Session Details */}
      {currentStep === 1 && (
        <Card className="p-8 border border-border rounded-2xl space-y-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Video className="h-5 w-5 text-red-600" />
            <span>Session Details &amp; Schedule</span>
          </h2>

          <div className="space-y-5">
            {/* Title */}
            <div>
              <Label className="font-semibold text-sm">Session Title *</Label>
              <Input
                placeholder="e.g. ProCoder Live Mentorship Session - Sept 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            {/* Date */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label className="font-semibold text-sm">Session Date</Label>
              <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-36 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-xs">
                  <CalendarIcon className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label className="font-semibold text-sm">Time Range</Label>
              <div className="md:col-span-3 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold">from:</span>
                <select
                  value={fromHour}
                  onChange={(e) => setFromHour(e.target.value)}
                  className="w-16 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={fromMinute}
                  onChange={(e) => setFromMinute(e.target.value)}
                  className="w-16 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={fromAmpm}
                  onChange={(e) => setFromAmpm(e.target.value as "AM" | "PM")}
                  className="w-20 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-red-600 cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>

                <span className="font-semibold ml-2">to:</span>
                <select
                  value={toHour}
                  onChange={(e) => setToHour(e.target.value)}
                  className="w-16 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={toMinute}
                  onChange={(e) => setToMinute(e.target.value)}
                  className="w-16 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={toAmpm}
                  onChange={(e) => setToAmpm(e.target.value as "AM" | "PM")}
                  className="w-20 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-red-600 cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Past Time Real-Time Warning */}
            {(() => {
              const monthIdx = MONTHS.indexOf(month);
              let calculatedHrs = parseInt(fromHour, 10);
              if (fromAmpm === "PM" && calculatedHrs < 12) calculatedHrs += 12;
              if (fromAmpm === "AM" && calculatedHrs === 12) calculatedHrs = 0;
              const dt = new Date(Number(year), monthIdx, Number(day), calculatedHrs, Number(fromMinute));
              if (dt.getTime() < Date.now()) {
                return (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-red-600" />
                    <span>⚠️ Past Date/Time Selected: Sessions must be scheduled for current or future times.</span>
                  </div>
                );
              }
              return null;
            })()}

            {/* Join Meeting Link */}
            <div>
              <Label className="font-semibold text-sm">Join Meeting URL (Zoom / Teams / Meet)</Label>
              <div className="relative mt-1">
                <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="https://zoom.us/j/987654321 or Google Meet link"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="font-semibold text-sm">Session Description</Label>
              <textarea
                rows={3}
                placeholder="Overview of topics, guest speaker details, or agenda..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            {/* Calendar Sync */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="calSyncFull"
                checked={createCalendarEvent}
                onChange={(e) => setCreateCalendarEvent(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <Label htmlFor="calSyncFull" className="text-sm font-semibold cursor-pointer">
                Create calendar event for session
              </Label>
            </div>

            {/* Multiple Sessions Section / Accordion Dropdown (Screenshot 2) */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setIsMultipleOpen(!isMultipleOpen)}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-red-600" />
                  <span>Multiple sessions</span>
                </div>
                {isMultipleOpen ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
              </button>

              {isMultipleOpen && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="repeatEnabledFull"
                      checked={repeatEnabled}
                      onChange={(e) => setRepeatEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <Label htmlFor="repeatEnabledFull" className="font-semibold cursor-pointer">
                      Repeat the session above as follows
                    </Label>
                  </div>

                  {repeatEnabled && (
                    <div className="space-y-4 pl-6 pt-2">
                      {/* Repeat on */}
                      <div>
                        <Label className="font-semibold block mb-2 text-xs text-slate-600 dark:text-slate-400">Repeat on</Label>
                        <div className="flex flex-wrap items-center gap-3">
                          {WEEKDAYS.map((w) => (
                            <label key={w} className="flex items-center space-x-1.5 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={repeatDays.includes(w)}
                                onChange={() => toggleDay(w)}
                                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                              />
                              <span>{w}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Repeat every */}
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold text-xs text-slate-600 dark:text-slate-400">Repeat every</Label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={repeatEveryWeeks}
                          onChange={(e) => setRepeatEveryWeeks(Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                        />
                        <span className="text-xs text-slate-500">week(s)</span>
                      </div>

                      {/* Repeat until */}
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold text-xs text-slate-600 dark:text-slate-400">Repeat until</Label>
                        <select
                          value={untilDay}
                          onChange={(e) => setUntilDay(e.target.value)}
                          className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        >
                          {DAYS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <select
                          value={untilMonth}
                          onChange={(e) => setUntilMonth(e.target.value)}
                          className="w-28 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        >
                          {MONTHS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={untilYear}
                          onChange={(e) => setUntilYear(e.target.value)}
                          className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={() => setCurrentStep(2)}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-6"
            >
              Continue to Student Enrollment <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Student Enrollment (Exact same component as Course Creation) */}
      {currentStep === 2 && (
        <Card className="p-8 border border-border rounded-2xl shadow-sm">
          <EnrollmentForm
            data={enrollmentData}
            hideTeacherSection={true}
            onChange={(updated) => setEnrollmentData((prev) => ({ ...prev, ...updated }))}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        </Card>
      )}

      {/* STEP 3: Certificate Selection (Exact same CertificateForm component as Course Creation) */}
      {currentStep === 3 && (
        <Card className="p-8 border border-border rounded-2xl shadow-sm">
          <CertificateForm
            data={certificateData}
            courseTitle={title || "Live Session"}
            onChange={(updated) => setCertificateData((prev) => ({ ...prev, ...updated }))}
            onNext={handleFinalSubmit}
            onBack={() => setCurrentStep(2)}
          />
        </Card>
      )}
    </div>
  );
}
