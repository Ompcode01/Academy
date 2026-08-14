"use client";

import React, { useState } from "react";
import { useEventsStore, EventItem } from "@/store/events.store";
import { useAuthStore } from "@/store/auth.store";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventCalendarProps {
  compact?: boolean;
}

export default function EventCalendar({ compact = false }: EventCalendarProps) {
  const { user } = useAuthStore();
  const { events, addEvent, editEvent, removeEvent } = useEventsStore();

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  // Date Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [targetDeptId, setTargetDeptId] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Days in current month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper to format date string YYYY-MM-DD
  const formatDateKey = (y: number, m: number, d: number) => {
    const mm = (m + 1).toString().padStart(2, "0");
    const dd = d.toString().padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  // Map events by date
  const eventsByDateMap = events.reduce((acc, evt) => {
    const key = evt.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(evt);
    return acc;
  }, {} as Record<string, EventItem[]>);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split("T")[0]);
  };

  // Open modal for Create
  const handleOpenCreateModal = (prefillDate?: string) => {
    if (!isAdmin) return;
    setEditingEvent(null);
    setTitle("");
    setDate(prefillDate || selectedDateStr || new Date().toISOString().split("T")[0]);
    setTime("");
    setDescription("");
    setUrl("");
    setTargetDeptId(user?.role === "ADMIN" && user?.departmentId ? String(user.departmentId) : "all");
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (evt: EventItem) => {
    if (!isAdmin) return;
    setEditingEvent(evt);
    setTitle(evt.title);
    setDate(evt.date);
    setTime(evt.time || "");
    setDescription(evt.description || "");
    setUrl(evt.url || "");
    setTargetDeptId(evt.departmentId ? String(evt.departmentId) : "all");
    setShowModal(true);
  };

  // Handle Form Submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setSubmitting(true);
    try {
      if (editingEvent) {
        await editEvent(editingEvent.id, {
          title,
          date,
          time: time || undefined,
          description: description || undefined,
          url: url || undefined,
        });
      } else {
        await addEvent({
          title,
          date,
          time: time || undefined,
          description: description || undefined,
          url: url || undefined,
          type: "site",
          departmentId: targetDeptId !== "all" ? Number(targetDeptId) : undefined,
        });
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error saving event:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to delete this event?")) {
      await removeEvent(id);
    }
  };

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  // Filter events: if a date is selected, show that date's events; otherwise show upcoming & today's events
  const displayedEvents = selectedDateStr
    ? events.filter((evt) => evt.date === selectedDateStr)
    : events
        .filter((evt) => evt.date >= todayStr)
        .sort((a, b) => (a.date > b.date ? 1 : -1));

  return (
    <div className="space-y-6 select-none">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0E6ED] pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-[#C82333]" />
          <h2 className="text-base font-bold text-[#212529]">
            Calendar &amp; Scheduled Events
          </h2>
          {selectedDateStr && (
            <span className="text-xs bg-[#C82333]/10 text-[#C82333] px-2 py-0.5 rounded font-semibold border border-[#C82333]/20 flex items-center gap-1">
              Filtered: {selectedDateStr}
              <button
                onClick={() => setSelectedDateStr(null)}
                className="hover:text-black font-bold ml-1 cursor-pointer"
                title="Clear date filter"
              >
                ×
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={goToToday}
            className="text-xs font-semibold"
          >
            Today
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => handleOpenCreateModal()}
              className="bg-[#C82333] hover:bg-[#C82333]/90 text-white font-bold text-xs gap-1 shadow"
            >
              <Plus className="h-3.5 w-3.5" /> Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Calendar on Left/Top, Event List on Right/Bottom */}
      <div className={`grid grid-cols-1 ${compact ? "lg:grid-cols-1" : "lg:grid-cols-12"} gap-6`}>
        {/* Calendar View */}
        <div className={`${compact ? "" : "lg:col-span-7"} bg-white rounded-xl border border-[#E0E6ED] p-4 shadow-sm space-y-4`}>
          {/* Calendar Month Navigation */}
          <div className="flex items-center justify-between border-b border-[#E0E6ED] pb-3">
            <h3 className="text-sm font-extrabold text-[#212529]">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded hover:bg-slate-100 text-[#6C757D] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded hover:bg-slate-100 text-[#6C757D] transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#6C757D] py-1 border-b border-slate-100">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for previous month */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-10 rounded border border-transparent" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateKey = formatDateKey(year, month, dayNum);
              const hasEvents = eventsByDateMap[dateKey] && eventsByDateMap[dateKey].length > 0;
              const isSelected = selectedDateStr === dateKey;
              const isToday = todayStr === dateKey;

              return (
                <button
                  key={dateKey}
                  onClick={() => {
                    if (selectedDateStr === dateKey) {
                      setSelectedDateStr(null); // toggle off
                    } else {
                      setSelectedDateStr(dateKey);
                    }
                  }}
                  className={`h-11 rounded-lg border transition-all flex flex-col items-center justify-between p-1 relative group cursor-pointer ${
                    isSelected
                      ? "border-[#C82333] bg-[#C82333]/10 font-bold text-[#C82333] ring-2 ring-[#C82333]/30"
                      : isToday
                      ? "border-amber-400 bg-amber-50 font-bold text-amber-900"
                      : hasEvents
                      ? "border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 font-bold text-blue-900"
                      : "border-slate-100 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-xs">{dayNum}</span>
                  {hasEvents && (
                    <div className="flex gap-0.5 items-center justify-center">
                      {eventsByDateMap[dateKey].slice(0, 3).map((_, i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-[#C82333]"
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#6C757D] pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#C82333]" /> Days with Events
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Today
            </span>
            {selectedDateStr && (
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-[#C82333] font-bold hover:underline cursor-pointer"
              >
                Show All Events ({events.length})
              </button>
            )}
          </div>
        </div>

        {/* Date-Wise Event List */}
        <div className={`${compact ? "" : "lg:col-span-5"} bg-white rounded-xl border border-[#E0E6ED] p-4 shadow-sm flex flex-col justify-between space-y-4`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E0E6ED] pb-2">
              <h3 className="text-sm font-bold text-[#212529]">
                {selectedDateStr ? `Events on ${selectedDateStr}` : "Upcoming Scheduled Events"} ({displayedEvents.length})
              </h3>
              {selectedDateStr && isAdmin && (
                <button
                  onClick={() => handleOpenCreateModal(selectedDateStr)}
                  className="text-xs text-[#C82333] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add on Date
                </button>
              )}
            </div>

            {displayedEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6C757D] flex flex-col items-center justify-center space-y-1">
                <CalendarIcon className="h-8 w-8 text-slate-300 mb-1" />
                <p className="font-semibold text-slate-700">No events scheduled</p>
                <p className="text-[11px]">
                  {selectedDateStr
                    ? `No events found for ${selectedDateStr}.`
                    : "There are currently no events."}
                </p>
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenCreateModal(selectedDateStr || undefined)}
                    className="mt-2 bg-[#C82333] text-white text-xs font-bold cursor-pointer"
                  >
                    + Add Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                {displayedEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-lg border border-[#E0E6ED] bg-slate-50/50 hover:bg-slate-100/50 transition-colors space-y-2 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-[#212529]">
                          {evt.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] font-semibold text-[#6C757D] mt-0.5">
                          <span className="flex items-center gap-1 text-[#C82333]">
                            <CalendarIcon className="h-3 w-3" /> {evt.date}
                          </span>
                          {evt.time && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Clock className="h-3 w-3" /> {evt.time}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Admin Edit & Delete Actions */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(evt)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Event"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(evt.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {evt.description && (
                      <p className="text-xs text-[#6C757D] font-medium leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    {evt.url && (
                      <div className="pt-1">
                        <a
                          href={evt.url.startsWith("http") ? evt.url : `https://${evt.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded border border-blue-200"
                        >
                          <ExternalLink className="h-3 w-3" /> Event Link / Join
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simplified Add / Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl space-y-4 text-[#212529]">
            <div className="flex items-center justify-between border-b border-[#E0E6ED] pb-2">
              <h3 className="text-sm font-bold text-[#212529]">
                {editingEvent ? "Edit Calendar Event" : "Add New Event"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-black p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Event Name */}
              <div>
                <label className="text-xs font-bold text-[#212529] block mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Evaluation & Review"
                  className="w-full rounded border border-[#E0E6ED] p-2 text-xs font-medium focus:border-[#C82333] outline-none"
                />
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#212529] block mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded border border-[#E0E6ED] p-2 text-xs font-medium focus:border-[#C82333] outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#212529] block mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full rounded border border-[#E0E6ED] p-2 text-xs font-medium focus:border-[#C82333] outline-none"
                  />
                </div>
              </div>

              {/* Optional Description */}
              <div>
                <label className="text-xs font-bold text-[#212529] block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context or notes for attendees..."
                  className="w-full rounded border border-[#E0E6ED] p-2 text-xs font-medium focus:border-[#C82333] outline-none"
                />
              </div>

              {/* Optional URL Link */}
              <div>
                <label className="text-xs font-bold text-[#212529] block mb-1">
                  URL Link (Optional)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. https://meet.google.com/abc-defg-hij"
                  className="w-full rounded border border-[#E0E6ED] p-2 text-xs font-medium focus:border-[#C82333] outline-none"
                />
              </div>

              {/* Department Target Selection */}
              <div>
                <label className="text-xs font-bold text-[#212529] block mb-1">
                  Target Department Scope
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full rounded border border-[#E0E6ED] p-2 text-xs font-medium focus:border-[#C82333] outline-none bg-white cursor-pointer"
                >
                  <option value="all">🌐 All Departments (Global Event)</option>
                  <option value="1">Engineering (ENG)</option>
                  <option value="2">Human Resources (HR)</option>
                  <option value="3">Management (MGT)</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {user?.role === "ADMIN"
                    ? "As Admin, events are restricted to your department or global."
                    : "Super Admins can target specific departments or publish globally."}
                </p>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E0E6ED]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[#C82333] hover:bg-[#C82333]/90 text-white font-bold text-xs cursor-pointer"
                >
                  {submitting ? "Saving..." : editingEvent ? "Update Event" : "Add Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
