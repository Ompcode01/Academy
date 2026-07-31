"use client";

import React, { useState, useEffect } from "react";
import { useEventsStore, type EventItem } from "@/store/events.store";
import { getCourses, type Course } from "@/services/api/course.service";
import { ChevronDown, Plus, Calendar, AlertCircle, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EventsPage() {
  const { events, hiddenTypes, addEvent } = useEventsStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New event form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-07-15");
  const [type, setType] = useState<"site" | "category" | "course" | "group" | "user" | "other">("course");
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await getCourses({ limit: 100 });
        if (res?.success) {
          setCourses(res.data.courses || []);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    }
    loadCourses();
  }, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    addEvent({
      title,
      date,
      type,
      courseName: type === "course" ? courseName : undefined,
      description,
    });

    // Reset Form
    setTitle("");
    setDate("2026-07-15");
    setType("course");
    setCourseName("");
    setDescription("");
    setShowAddModal(false);
  };

  // Filter events based on active filters and course selection
  const filteredEvents = events.filter((evt) => {
    // 1. Filter by hidden types
    if (hiddenTypes.has(evt.type)) return false;

    // 2. Filter by course selector
    if (selectedCourse !== "all") {
      if (evt.type === "course" && evt.courseName !== selectedCourse) {
        return false;
      }
    }

    return true;
  });

  const getTypeColor = (evtType: string) => {
    const colors = {
      site: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      category: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      course: "bg-pink-500/10 text-pink-600 border-pink-500/20",
      group: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      user: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      other: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    };
    return colors[evtType as keyof typeof colors] || colors.other;
  };

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-6.5rem)] select-none">
      
      {/* Main Content Area */}
      <div className="p-6 flex-1 space-y-6 bg-[#EBF5F8]">
        <div className="mx-auto max-w-4xl bg-white border border-[#E0E6ED] rounded shadow-sm overflow-hidden">
          
          {/* Header Action Controls */}
          <div className="p-5 border-b border-[#E0E6ED] flex flex-wrap items-center justify-between gap-4">
            
            {/* Upcoming events button dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 bg-[#C82333] hover:bg-[#C82333]/90 text-white text-xs font-bold px-4 py-2 rounded shadow transition-colors cursor-pointer">
                <span>Upcoming events</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Course filter select */}
            <div className="w-64">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full text-xs border border-[#E0E6ED] rounded bg-white px-3 py-2 font-semibold text-[#6C757D] outline-none shadow-sm cursor-pointer"
              >
                <option value="all">All courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* New Event Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 bg-[#C82333] hover:bg-[#C82333]/90 text-white text-xs font-bold px-4 py-2 rounded shadow transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New event</span>
            </button>
          </div>

          {/* Canvas Agenda Title */}
          <div className="py-6 text-center">
            <h1 className="text-xl font-bold tracking-wide text-[#212529]">
              Upcoming events
            </h1>
          </div>

          {/* Agenda Event Items */}
          <div className="px-6 pb-6 space-y-4">
            {filteredEvents.length > 0 ? (
              <div className="divide-y divide-[#E0E6ED]">
                {filteredEvents.map((evt) => (
                  <div key={evt.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 transition-colors hover:bg-slate-50/40 rounded px-2">
                    <div className={`rounded border px-2 py-1 text-center shrink-0 w-16 bg-slate-50 border-[#E0E6ED]`}>
                      <span className="block text-[9px] uppercase font-bold text-[#6C757D]">
                        {new Date(evt.date).toLocaleString("default", { month: "short" })}
                      </span>
                      <span className="block text-lg font-bold text-[#212529]">
                        {new Date(evt.date).getDate()}
                      </span>
                    </div>
                    
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#212529] truncate">
                          {evt.title}
                        </h4>
                        <span className={`text-[9px] font-bold border rounded-full px-2 py-0.5 capitalize shrink-0 ${getTypeColor(evt.type)}`}>
                          {evt.type} events
                        </span>
                        {evt.courseName && (
                          <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-500 rounded-full px-2 py-0.5 truncate">
                            {evt.courseName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6C757D] font-medium leading-relaxed">
                        {evt.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-[#6C757D]">
                <AlertCircle className="h-6 w-6 text-[#6C757D]/50 mb-1" />
                <span className="text-xs font-semibold text-[#212529]">There are no upcoming events</span>
              </div>
            )}

            {/* Bottom auxiliary link */}
            <div className="pt-4 border-t border-[#E0E6ED] text-center">
              <span className="text-xs font-semibold text-[#6C757D] hover:text-[#C82333] transition-colors cursor-pointer select-none">
                Import or export calendars
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Downside Footer */}
      <footer className="bg-[#0B132B] px-6 py-4 text-white flex justify-between items-center text-xs select-none border-t border-slate-800">
        <span>Copyright © 2014-2026 Harbinger LMS</span>
        <a href="#" className="hover:underline font-semibold text-slate-300 hover:text-white transition-colors">
          Get the mobile app
        </a>
      </footer>

      {/* Add Event Modal dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#E0E6ED] w-96 p-5 shadow-xl space-y-4 text-[#212529]">
            <h3 className="text-sm font-bold border-b border-[#E0E6ED] pb-2">
              Create New Agenda Event
            </h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[#6C757D] block">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Final Assessment Deadline"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs border border-[#E0E6ED] rounded p-2 outline-none focus:border-[#C82333] focus:ring-1 focus:ring-[#C82333]/20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#6C757D] block">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs border border-[#E0E6ED] rounded p-2 outline-none focus:border-[#C82333]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#6C757D] block">
                    Event Scope / Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs border border-[#E0E6ED] rounded p-2 bg-white outline-none focus:border-[#C82333] cursor-pointer"
                  >
                    <option value="site">Site Event</option>
                    <option value="category">Category Event</option>
                    <option value="course">Course Event</option>
                    <option value="group">Group Event</option>
                    <option value="user">User Event</option>
                    <option value="other">Other Event</option>
                  </select>
                </div>
              </div>

              {type === "course" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#6C757D] block">
                    Select Course
                  </label>
                  <select
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                    className="w-full text-xs border border-[#E0E6ED] rounded p-2 bg-white outline-none focus:border-[#C82333] cursor-pointer"
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[#6C757D] block">
                  Description
                </label>
                <textarea
                  placeholder="Details about the upcoming calendar agenda event..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-[#E0E6ED] rounded p-2 outline-none focus:border-[#C82333]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#C82333] hover:bg-[#C82333]/90 text-white"
                >
                  Create Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
