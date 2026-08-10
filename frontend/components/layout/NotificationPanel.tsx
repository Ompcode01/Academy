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
  Calendar,
  AlertTriangle,
  Megaphone,
  CheckCircle,
  Clock,
  ShieldAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Notification } from "@/services/api/notification.service";

/* ─── Category & Type Icons ────────────────────────────────── */
const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; accent: string; bg: string }
> = {
  COURSE_CREATED: { icon: BookOpen, accent: "border-l-blue-500", bg: "bg-blue-500/10 text-blue-600" },
  COURSE_UPDATED: { icon: BookOpen, accent: "border-l-blue-500", bg: "bg-blue-500/10 text-blue-600" },
  TEACHER_COURSE_UPDATED: { icon: BookOpen, accent: "border-l-indigo-500", bg: "bg-indigo-500/10 text-indigo-600" },
  ENROLLMENT: { icon: GraduationCap, accent: "border-l-indigo-500", bg: "bg-indigo-500/10 text-indigo-600" },
  TEACHER_ASSIGNED: { icon: UserPlus, accent: "border-l-purple-500", bg: "bg-purple-500/10 text-purple-600" },
  COURSE_COMPLETED: { icon: Trophy, accent: "border-l-emerald-500", bg: "bg-emerald-500/10 text-emerald-600" },
  SUBMISSION_RECEIVED: { icon: Clock, accent: "border-l-amber-500", bg: "bg-amber-500/10 text-amber-600" },
  SUBMISSION_GRADED: { icon: CheckCircle, accent: "border-l-emerald-500", bg: "bg-emerald-500/10 text-emerald-600" },
  SUBMISSION_REVISION: { icon: AlertTriangle, accent: "border-l-amber-600", bg: "bg-amber-500/15 text-amber-700" },
  ANNOUNCEMENT: { icon: Megaphone, accent: "border-l-purple-600", bg: "bg-purple-500/15 text-purple-700" },
  ESCALATION: { icon: ShieldAlert, accent: "border-l-red-600", bg: "bg-red-500/15 text-red-700" },
  EVENT_CREATED: { icon: Calendar, accent: "border-l-cyan-500", bg: "bg-cyan-500/10 text-cyan-600" },
  EVENT_UPDATED: { icon: Calendar, accent: "border-l-cyan-500", bg: "bg-cyan-500/10 text-cyan-600" },
  EVENT_CANCELLED: { icon: Calendar, accent: "border-l-red-400", bg: "bg-red-500/10 text-red-500" },
  EVENT_ENROLLED_SYNC: { icon: Calendar, accent: "border-l-indigo-500", bg: "bg-indigo-500/10 text-indigo-600" },
  SKILL_SUBMITTED: { icon: Award, accent: "border-l-purple-500", bg: "bg-purple-500/10 text-purple-600" },
  SKILL_APPROVED: { icon: Award, accent: "border-l-emerald-500", bg: "bg-emerald-500/10 text-emerald-600" },
  SKILL_REJECTED: { icon: Award, accent: "border-l-red-500", bg: "bg-red-500/10 text-red-600" },
  PROJECT_SUBMITTED: { icon: Briefcase, accent: "border-l-amber-500", bg: "bg-amber-500/10 text-amber-600" },
  PROJECT_APPROVED: { icon: Briefcase, accent: "border-l-emerald-500", bg: "bg-emerald-500/10 text-emerald-600" },
  PROJECT_REJECTED: { icon: Briefcase, accent: "border-l-red-500", bg: "bg-red-500/10 text-red-600" },
  SYSTEM_EVENT: { icon: Shield, accent: "border-l-orange-500", bg: "bg-orange-500/10 text-orange-600" },
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
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

/* ─── Priority Badge Renderer ─────────────────────────── */
function renderPriorityBadge(priority?: string) {
  if (priority === "URGENT") {
    return (
      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">
        URGENT
      </span>
    );
  }
  if (priority === "HIGH") {
    return (
      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
        HIGH
      </span>
    );
  }
  return null;
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
      const targetLink = notification.link.trim();
      if (targetLink.startsWith("http://") || targetLink.startsWith("https://")) {
        window.open(targetLink, "_blank", "noopener,noreferrer");
      } else {
        router.push(targetLink);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3 px-4 py-3 border-l-[3px] transition-all duration-200 cursor-pointer ${
        notification.isRead
          ? "border-l-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
          : `${config.accent} bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40`
      }`}
    >
      {/* Type Icon */}
      <div className={`shrink-0 mt-0.5 rounded-lg p-1.5 ${config.bg}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5 mb-0.5">
          <p
            className={`text-xs leading-snug truncate ${
              notification.isRead
                ? "text-muted-foreground font-medium"
                : "text-foreground font-semibold"
            }`}
          >
            {notification.title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {renderPriorityBadge(notification.priority)}
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground/70 font-medium">
            {timeAgo(notification.createdAt)}
          </span>
          {notification.category && (
            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wide">
              {notification.category}
            </span>
          )}
        </div>
      </div>

      {/* Delete on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          remove(notification.id);
        }}
        className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
        title="Delete notification"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Category Filter Pills ────────────────────────────── */
const CATEGORY_TABS = [
  { key: "ALL", label: "All" },
  { key: "COURSE", label: "Courses" },
  { key: "EVALUATION", label: "Evaluations" },
  { key: "EVENT", label: "Events" },
  { key: "ANNOUNCEMENT", label: "Alerts" },
];

/* ─── Main Panel ───────────────────────────────────────── */
export default function NotificationPanel() {
  const {
    notifications,
    isOpen,
    isLoading,
    unreadCount,
    filter,
    categoryFilter,
    soundEnabled,
    setFilter,
    setCategoryFilter,
    toggleSound,
    playSoundPreview,
    markAllRead,
    closePanel,
  } = useNotificationStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={closePanel} />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-2 z-50 w-[400px] rounded-2xl border border-border bg-card shadow-2xl shadow-black/15 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-card to-accent/20">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              title={soundEnabled ? "Notification sound enabled (Click to mute)" : "Notification sound muted (Click to enable)"}
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground/60" />
              )}
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Read Status & Category Filter Tabs */}
        <div className="px-3 py-2 border-b border-border bg-accent/10 space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  filter === "unread"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition-all shrink-0 cursor-pointer ${
                  categoryFilter === cat.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-border/50">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="ml-2 text-xs text-muted-foreground font-medium">
                Loading notifications...
              </span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="rounded-full bg-accent/40 p-4 mb-3">
                <Inbox className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {filter === "unread" ? "No unread notifications" : "All caught up!"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 text-center">
                {filter === "unread"
                  ? "Switch to 'All' to see your notification history."
                  : "You have no notifications in this category."}
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
          <div className="border-t border-border bg-card">
            <button
              onClick={closePanel}
              className="w-full py-2.5 text-center text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
