"use client";

import React, { useEffect } from "react";
import EventCalendar from "@/components/events/EventCalendar";
import { useEventsStore } from "@/store/events.store";

export default function EventsPage() {
  const { fetchEvents } = useEventsStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-6.5rem)] select-none">
      {/* Main Content Area */}
      <div className="p-6 flex-1 space-y-6 bg-[#EBF5F8]">
        <div className="mx-auto max-w-6xl">
          <EventCalendar />
        </div>
      </div>

      {/* Pinned Downside Footer */}
      <footer className="bg-[#0B132B] px-6 py-4 text-white flex justify-between items-center text-xs select-none border-t border-slate-800">
        <span>Copyright © 2014-2026 Harbinger LMS</span>
        <a href="#" className="hover:underline font-semibold text-slate-300 hover:text-white transition-colors">
          Get the mobile app
        </a>
      </footer>
    </div>
  );
}
