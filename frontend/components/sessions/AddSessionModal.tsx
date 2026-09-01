"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  ChevronUp,
  Link2,
  Sparkles,
  Users,
  Repeat,
} from "lucide-react";
import { createSession } from "@/services/api/session.service";
import toast from "react-hot-toast";

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEARS = ["2026", "2027", "2028"];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export default function AddSessionModal({ isOpen, onClose, onSuccess }: AddSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("All students");
  
  // Date state
  const [day, setDay] = useState("2");
  const [month, setMonth] = useState("September");
  const [year, setYear] = useState("2026");

  // Time state
  const [fromHour, setFromHour] = useState("09");
  const [fromMinute, setFromMinute] = useState("00");
  const [toHour, setToHour] = useState("10");
  const [toMinute, setToMinute] = useState("00");

  // Meeting Link & Description
  const [meetingUrl, setMeetingUrl] = useState("");
  const [description, setDescription] = useState("");
  const [createCalendarEvent, setCreateCalendarEvent] = useState(true);

  // Multiple Sessions Accordion state (Screenshot 2)
  const [isMultipleOpen, setIsMultipleOpen] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [repeatEveryWeeks, setRepeatEveryWeeks] = useState(1);
  const [untilDay, setUntilDay] = useState("30");
  const [untilMonth, setUntilMonth] = useState("September");
  const [untilYear, setUntilYear] = useState("2026");

  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const toggleDay = (d: string) => {
    setRepeatDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please enter a session description or title.");
      return;
    }

    setLoading(true);
    try {
      const monthIdx = MONTHS.indexOf(month);
      const eventDateObj = new Date(Number(year), monthIdx, Number(day), Number(fromHour), Number(fromMinute));
      const eventDateStr = eventDateObj.toISOString();
      const eventTimeStr = `${fromHour}:${fromMinute} - ${toHour}:${toMinute}`;

      // Build payload matching backend requirements
      await createSession({
        title: description.substring(0, 150),
        description: description,
        eventDate: eventDateStr,
        eventTime: eventTimeStr,
        url: meetingUrl.trim() || undefined,
        eventType: type === "All students" ? "site" : "course",
        createCalendarEvent,
      });

      toast.success("Live Session scheduled & event created!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create session:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 text-white flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <Video className="h-6 w-6 text-amber-200" />
            <span>Add Live Session</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Add Session Accordion Content (Screenshot 1) */}
          <div className="space-y-5">
            {/* Type */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label className="font-semibold text-sm text-slate-700 dark:text-slate-300">Type</Label>
              <div className="md:col-span-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500"
                >
                  <option value="All students">All students</option>
                  <option value="Group / Course">Course Enrolled Students</option>
                  <option value="Department">Department Specific</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label className="font-semibold text-sm text-slate-700 dark:text-slate-300">Date</Label>
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

            {/* Time (from: HH:MM to: HH:MM) */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label className="font-semibold text-sm text-slate-700 dark:text-slate-300">Time</Label>
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
              </div>
            </div>

            {/* Meeting Join URL */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label className="font-semibold text-sm text-slate-700 dark:text-slate-300">Join Meeting Link</Label>
              <div className="md:col-span-3">
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="e.g. https://zoom.us/j/123456789 or Teams / Meet link"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
              <Label className="font-semibold text-sm text-slate-700 dark:text-slate-300 pt-2">Description</Label>
              <div className="md:col-span-3">
                <textarea
                  rows={3}
                  placeholder="Enter live session title & topic overview..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Checkbox: Create calendar event for session */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="calendarSync"
                checked={createCalendarEvent}
                onChange={(e) => setCreateCalendarEvent(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <Label htmlFor="calendarSync" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Create calendar event for session
              </Label>
            </div>
          </div>

          {/* Multiple Sessions Section / Accordion (Screenshot 2) */}
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
                    id="repeatEnabled"
                    checked={repeatEnabled}
                    onChange={(e) => setRepeatEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <Label htmlFor="repeatEnabled" className="font-semibold cursor-pointer">
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

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold rounded-xl shadow-md hover:opacity-90"
            >
              {loading ? "Saving Session..." : "Add session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
