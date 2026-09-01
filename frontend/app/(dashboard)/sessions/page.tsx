"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Video,
  Play,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  ExternalLink,
  Link2,
  Filter,
  Users,
  UserCheck,
  Award,
} from "lucide-react";
import RoleGate from "@/components/auth/RoleGate";
import { getSessions, deleteSession, SessionItem } from "@/services/api/session.service";
import LearnerCertificateModal from "@/components/certificates/LearnerCertificateModal";
import HarbingerConfirmModal from "@/components/common/HarbingerConfirmModal";
import toast from "react-hot-toast";

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState<"ALL" | "PAST" | "MONTHS" | "WEEKS" | "DAYS">("ALL");
  const [certModalSession, setCertModalSession] = useState<SessionItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);

  const fetchSessionsList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      toast.error("Failed to load live sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionsList();
  }, [fetchSessionsList]);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteSession(deleteTargetId);
      toast.success("Session deleted successfully");
      fetchSessionsList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete session");
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSessions.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: number | string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Filtering based on Active Filter Tab
  const now = new Date();
  const filteredSessions = sessions.filter((s) => {
    const sDate = new Date(s.eventDate);
    if (activeFilterTab === "PAST") {
      return sDate < now;
    }
    if (activeFilterTab === "DAYS") {
      // Starting within 24h
      const diffMs = sDate.getTime() - now.getTime();
      return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
    }
    if (activeFilterTab === "WEEKS") {
      const diffMs = sDate.getTime() - now.getTime();
      return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
    }
    if (activeFilterTab === "MONTHS") {
      const diffMs = sDate.getTime() - now.getTime();
      return diffMs >= 0 && diffMs <= 30 * 24 * 60 * 60 * 1000;
    }
    return true; // ALL
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600/10 text-red-600 dark:text-red-400 rounded-xl border border-red-500/20">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Academy Live Sessions &amp; Calendar</span>
              <Badge className="bg-red-600 text-white font-bold text-[10px]">LIVE</Badge>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Schedule, track, and join live learning sessions, webinars, and instructor classes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSessionsList}
            className="gap-1.5 text-xs font-semibold rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>

          <RoleGate allowed={["ADMIN", "SUPER_ADMIN"]}>
            <Button
              onClick={() => router.push("/sessions/create")}
              className="gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold rounded-xl shadow-md hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add session
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* Filter Tabs Bar (Matching Screenshot 3) */}
      <div className="flex items-center justify-end border-b border-border pb-3">
        {/* Tabs: All | All past | Months | Weeks | Days */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl gap-1 border border-border">
          {(["ALL", "PAST", "MONTHS", "WEEKS", "DAYS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilterTab === tab
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "ALL"
                ? "All"
                : tab === "PAST"
                ? "All past"
                : tab === "MONTHS"
                ? "Months"
                : tab === "WEEKS"
                ? "Weeks"
                : "Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List Table (Matching Screenshot 3) */}
      <Card className="border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-border text-[11px] font-bold">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredSessions.length > 0 &&
                      selectedIds.length === filteredSessions.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Date</th>
                <th className="p-4">Time</th>
                <th className="p-4">Session Name / Description</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-slate-800 dark:text-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-red-500" />
                    Loading live sessions...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <Video className="h-8 w-8 mx-auto mb-2 opacity-40 text-red-500" />
                    <p className="font-semibold text-sm">No live sessions found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click "+ Add session" to schedule a new live class or webinar.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(session.id)}
                        onChange={() => toggleSelectOne(session.id)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                      {formatDateDisplay(session.eventDate)}
                    </td>
                    <td className="p-4 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                      {session.eventTime || "All Day"}
                    </td>
                    <td className="p-4 max-w-md">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {session.title}
                      </div>
                      {session.description && session.description !== session.title && (
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {session.description}
                        </div>
                      )}
                      {session.url && (
                        <div className="text-[11px] text-red-600 dark:text-red-400 truncate mt-1 font-mono flex items-center gap-1">
                          <Link2 className="h-3 w-3 shrink-0" />
                          <span>{session.url}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Play Button ▶️ to Join Live Session */}
                        {session.url && (
                          <a
                            href={session.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs transition-transform hover:scale-105 inline-flex items-center justify-center"
                            title="Join Live Session"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                          </a>
                        )}

                        <RoleGate allowed={["ADMIN", "SUPER_ADMIN"]}>
                          {/* Dark Play/Attendance Button opening Full-Screen Attendance Dashboard */}
                          <button
                            onClick={() => router.push(`/sessions/${session.id}/attendance`)}
                            className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition-transform hover:scale-105 inline-flex items-center justify-center border border-slate-700"
                            title="Take attendance (Full Screen)"
                          >
                            <Play className="h-3.5 w-3.5 fill-current text-white" />
                          </button>

                          <button
                            onClick={() => router.push(`/sessions/create?id=${session.id}`)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs transition-transform hover:scale-105 inline-flex items-center justify-center"
                            title="Edit Session"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteTargetId(session.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs transition-transform hover:scale-105 inline-flex items-center justify-center"
                            title="Delete Session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </RoleGate>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-border flex items-center justify-end">
          <div className="text-xs text-muted-foreground font-semibold">
            Showing {filteredSessions.length} session(s)
          </div>
        </div>
      </Card>

      {/* Custom Harbinger LMS Delete Confirmation Modal */}
      <HarbingerConfirmModal
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Delete Live Session?"
        description="Are you sure you want to delete this live session? This action will permanently remove the event and cannot be undone."
        confirmLabel="Delete Session"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
      />

      {/* Official Certificate Download Modal for Learner */}
      <LearnerCertificateModal
        isOpen={!!certModalSession}
        onClose={() => setCertModalSession(null)}
        certificate={null}
        fallbackCourseTitle={certModalSession?.title}
      />
    </div>
  );
}
