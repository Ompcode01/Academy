"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notification.store";
import { Search, Bell, LogOut, ChevronDown, User, Settings, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NotificationPanel from "@/components/layout/NotificationPanel";
import GuestBanner from "@/components/layout/GuestBanner";
import TopBarSearch from "@/components/layout/TopBarSearch";
import HarbingerLogoIcon from "@/components/common/HarbingerLogoIcon";
import CapDevLogo from "@/components/common/CapDevLogo";
import SakshamLogo from "@/components/common/SakshamLogo";

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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
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
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between bg-[#0B132B] px-6 text-white shrink-0 select-none relative transition-all">
        {/* Left Section: 2-Line Harbinger Group Logo & Pushed Elements when search expands */}
        <div className="flex items-center gap-4 transition-all duration-300">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
            <HarbingerLogoIcon size={30} color="#E33446" />
            <div className="flex flex-col font-extrabold leading-none tracking-tight text-white shrink-0">
              <span className="text-sm font-black tracking-tight text-white">Harbinger</span>
              <span className="text-sm font-black tracking-tight text-white">Group</span>
            </div>
          </div>

          {/* When search expands, shift Saksham logo and CapDev logo to the left side next to logo */}
          {isSearchExpanded && (
            <div className="hidden lg:flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="h-4 w-px bg-white/20" />
              <SakshamLogo height={24} />
              <div className="h-4 w-px bg-white/20" />
              <CapDevLogo height={28} />
            </div>
          )}
        </div>

        {/* Center Logo: Saksham Logo (Shown only when search is collapsed) */}
        {!isSearchExpanded && (
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center justify-center pointer-events-auto transition-all hover:scale-105 duration-200">
            <SakshamLogo height={24} />
          </div>
        )}

        {/* Right Section & Controls */}
        <div className="flex items-center gap-6 sm:gap-7 md:gap-8">
          {/* CapDev Logo Image (Shown on right only when search is collapsed) */}
          {!isSearchExpanded && (
            <CapDevLogo height={30} />
          )}

          {/* Expandable TopBar Search */}
          <TopBarSearch onExpandChange={setIsSearchExpanded} />

        {/* Notification Bell */}
        <div className="relative mr-1" ref={bellRef}>
          <button
            onClick={togglePanel}
            className="relative p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C82333] px-1 text-[9px] font-bold text-white leading-none shadow-sm border border-[#0B132B]">
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
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity p-1 rounded-lg hover:bg-white/10"
          >
            <Avatar className="h-7 w-7 border border-white/20 shadow-sm">
              <AvatarFallback className="bg-[#C82333] text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
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
                    router.push("/profile");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs hover:bg-[#F4F7F9] transition-colors text-left"
                >
                  <User className="h-3.5 w-3.5 text-[#6C757D]" />
                  <span>View profile</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/messages");
                  }}
                  className="flex w-full items-center justify-between px-4 py-2 text-xs hover:bg-[#F4F7F9] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-[#6C757D]" />
                    <span>Messages</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C82333] px-1 text-[9px] font-bold text-white leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs hover:bg-[#F4F7F9] transition-colors text-left"
                >
                  <Settings className="h-3.5 w-3.5 text-[#6C757D]" />
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[#C82333] hover:bg-[#F4F7F9] transition-colors border-t border-slate-100 text-left"
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
