"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notification.store";
import { Search, Bell, LogOut, ChevronDown, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NotificationPanel from "@/components/layout/NotificationPanel";
import GuestBanner from "@/components/layout/GuestBanner";

const fullNameMap: Record<string, string> = {
  omprakash: "Omprakash Pandey",
  priyanka: "Priyanka Davhare",
  rahul: "Rahul Sharma",
  sneha: "Sneha Patil",
  guest: "Guest Visitor",
};

export default function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount, togglePanel, fetchUnreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const username = user?.username || "Guest";
  const fullName = fullNameMap[username.toLowerCase()] || username;
  const initials = getInitials(fullName);

  return (
    <>
      <GuestBanner />
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between bg-[#0B132B] px-6 text-white shrink-0 select-none">
      {/* Left Logo and Tagline */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Custom Wavy/Red Crest Logo */}
          <svg
            className="h-6 w-6 text-[#C82333]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          <span className="text-base font-bold tracking-wide">
            Harbinger Group
          </span>
        </div>
        <div className="hidden sm:block h-4 w-px bg-white/20" />
        <span className="hidden sm:inline text-xs font-medium text-slate-300">
          Elevate... Go Beyond
        </span>
      </div>

      {/* Right Brand, Search, and Profile */}
      <div className="flex items-center gap-6">
        {/* CapDev Brand */}
        <span className="text-sm font-semibold tracking-wide text-white">
          CapDev
        </span>

        {/* Search Toggle Icon */}
        <button className="text-slate-300 hover:text-white transition-colors cursor-pointer">
          <Search className="h-4 w-4" />
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={togglePanel}
            className="relative text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C82333] px-1 text-[9px] font-bold text-white leading-none animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel />
        </div>

        {/* User Account Controls */}
        <div className="relative">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity py-1"
          >
            <Avatar className="h-7 w-7 border border-white/20">
              <AvatarFallback className="bg-[#C82333] text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-xs font-medium tracking-wide">
              {fullName}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-300" />
          </div>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 text-[#212529]">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-[#6C757D]">Logged in as</p>
                  <p className="text-xs font-bold truncate">{fullName}</p>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                    {user?.role?.toLowerCase().replace("_", " ")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs hover:bg-[#F4F7F9] transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-[#6C757D]" />
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[#C82333] hover:bg-[#F4F7F9] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  </>
);
}
