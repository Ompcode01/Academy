"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/store/notification.store";
import {
  Bell,
  BookOpen,
  Award,
  Briefcase,
  CheckCheck,
  Trash2,
  Loader2,
  Inbox,
  GraduationCap,
  Trophy,
  Shield,
  UserPlus,
} from "lucide-react";
import type { Notification } from "@/services/api/notification.service";

/* ─── Type → Icon + Accent Color Mapping ───────────────── */
const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; accent: string; bg: string }
> = {
  COURSE_CREATED: {
    icon: BookOpen,
    accent: "border-l-blue-500",
    bg: "bg-blue-500/10 text-blue-600",
  },
  ENROLLMENT: {
    icon: GraduationCap,
    accent: "border-l-indigo-500",
    bg: "bg-indigo-500/10 text-indigo-600",
  },
  COURSE_COMPLETED: {
    icon: Trophy,
    accent: "border-l-teal-500",
    bg: "bg-teal-500/10 text-teal-600",
  },
  SKILL_SUBMITTED: {
    icon: Award,
    accent: "border-l-purple-500",
    bg: "bg-purple-500/10 text-purple-600",
  },
  SKILL_APPROVED: {
    icon: Award,
    accent: "border-l-emerald-500",
    bg: "bg-emerald-500/10 text-emerald-600",
  },
  SKILL_REJECTED: {
    icon: Award,
    accent: "border-l-red-500",
    bg: "bg-red-500/10 text-red-600",
  },
  PROJECT_SUBMITTED: {
    icon: Briefcase,
    accent: "border-l-amber-500",
    bg: "bg-amber-500/10 text-amber-600",
  },
  PROJECT_APPROVED: {
    icon: Briefcase,
    accent: "border-l-emerald-500",
    bg: "bg-emerald-500/10 text-emerald-600",
  },
  PROJECT_REJECTED: {
    icon: Briefcase,
    accent: "border-l-red-500",
    bg: "bg-red-500/10 text-red-600",
  },
  SYSTEM_EVENT: {
    icon: Shield,
    accent: "border-l-orange-500",
    bg: "bg-orange-500/10 text-orange-600",
  },
  ADMIN_CREATED: {
    icon: UserPlus,
    accent: "border-l-cyan-500",
    bg: "bg-cyan-500/10 text-cyan-600",
  },
};

const DEFAULT_CONFIG = {
  icon: Bell,
  accent: "border-l-slate-400",
  bg: "bg-slate-500/10 text-slate-600",
};

/* ─── Relative Time Utility ────────────────────────────── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/* ─── Single Notification Card ─────────────────────────── */
function NotificationCard({ notification }: { notification: Notification }) {
  const router = useRouter();
  const { markRead, remove } = useNotificationStore();
  const config = TYPE_CONFIG[notification.type] || DEFAULT_CONFIG;
  const Icon = config.icon;

  const handleClick = async () => {
    if (!notification.isRead) {
      await markRead(notification.id);
    }
    if (notification.link) {
      useNotificationStore.getState().closePanel();
      router.push(notification.link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3 px-4 py-3 border-l-[3px] transition-all duration-200 cursor-pointer ${
        notification.isRead
          ? "border-l-transparent bg-transparent hover:bg-slate-50"
          : `${config.accent} bg-blue-50/40 hover:bg-blue-50/70`
      }`}
    >
      {/* Type Icon */}
      <div
        className={`shrink-0 mt-0.5 rounded-lg p-1.5 ${config.bg}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-xs leading-snug ${
              notification.isRead
                ? "text-[#6C757D] font-medium"
                : "text-[#212529] font-semibold"
            }`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-[#C82333] animate-pulse" />
          )}
        </div>
        <p className="text-[11px] text-[#6C757D] mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <span className="text-[10px] text-[#ADB5BD] mt-1 block font-medium">
          {timeAgo(notification.createdAt)}
        </span>
      </div>

      {/* Delete on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          remove(notification.id);
        }}
        className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-1 text-[#ADB5BD] hover:text-[#C82333] hover:bg-red-50 transition-all cursor-pointer"
        title="Delete notification"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Filter Tab Button ────────────────────────────────── */
function FilterTab({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 cursor-pointer ${
        active
          ? "bg-[#C82333]/10 text-[#C82333]"
          : "text-[#6C757D] hover:text-[#212529] hover:bg-slate-100"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full px-1 text-[9px] font-bold ${
            active
              ? "bg-[#C82333] text-white"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

/* ─── Main Panel ───────────────────────────────────────── */
export default function NotificationPanel() {
  const {
    notifications,
    isOpen,
    isLoading,
    unreadCount,
    filter,
    setFilter,
    markAllRead,
    closePanel,
  } = useNotificationStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={closePanel} />

      {/* Panel */}
      <div
        className="absolute right-0 top-full mt-2 z-50 w-[380px] rounded-xl border border-[#E0E6ED] bg-white shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E0E6ED] bg-gradient-to-r from-[#F8F9FA] to-white">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#C82333]" />
            <h3 className="text-sm font-bold text-[#212529] tracking-tight">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-[#C82333] px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#6C757D] hover:text-[#C82333] transition-colors cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[#F0F2F5] bg-[#FAFBFC]">
          <FilterTab
            label="All"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterTab
            label="Unread"
            active={filter === "unread"}
            count={unreadCount}
            onClick={() => setFilter("unread")}
          />
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-[#F0F2F5]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 text-[#C82333] animate-spin" />
              <span className="ml-2 text-xs text-[#6C757D] font-medium">
                Loading...
              </span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="rounded-full bg-[#F4F7F9] p-4 mb-3">
                <Inbox className="h-8 w-8 text-[#ADB5BD]" />
              </div>
              <p className="text-sm font-semibold text-[#6C757D]">
                {filter === "unread" ? "No unread notifications" : "All caught up!"}
              </p>
              <p className="text-[11px] text-[#ADB5BD] mt-1 text-center">
                {filter === "unread"
                  ? "Switch to 'All' to see your notification history."
                  : "You have no notifications at the moment."}
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-[#E0E6ED] bg-[#F8F9FA]">
            <button
              onClick={closePanel}
              className="w-full py-2.5 text-center text-[11px] font-semibold text-[#6C757D] hover:text-[#C82333] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
