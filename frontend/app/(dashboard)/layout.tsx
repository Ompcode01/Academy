"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import SecondaryNav from "@/components/layout/SecondaryNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-screen max-w-[100vw] overflow-x-hidden bg-[#EBF5F8] text-[#212529]">
      {/* 1. Top Navigation Bar (Fixed Header) */}
      <TopBar />

      {/* 2. Secondary Navigation Bar */}
      <SecondaryNav
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 3. Main dual-column layout */}
      <div className="flex flex-1 flex-row min-h-0 w-full overflow-hidden">
        {/* Left/Center Main Content (75% or 100%) */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-[#EBF5F8] transition-all duration-200">
          {children}
        </main>

        {/* Right Collapsible Sidebar (25% or w-80) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
