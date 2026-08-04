"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { handleApprovalAction, ApprovalRequestItem } from "@/services/api/skill.service";

interface RejectRequestModalProps {
  isOpen: boolean;
  request: ApprovalRequestItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RejectRequestModal({ isOpen, request, onClose, onSuccess }: RejectRequestModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason or comment for rejection");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await handleApprovalAction(request.id, request.requestKind, "REJECT", reason);
      onSuccess();
      onClose();
      setReason("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
            <AlertCircle className="h-5 w-5" />
            <span>Reject Request Feedback</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-700 dark:text-slate-300">
            <p><b>Target Request:</b> {request.title} ({request.requestKind})</p>
            <p><b>Employee:</b> {request.employee.firstName} {request.employee.lastName}</p>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rejection Comment / Feedback for Learner <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Explain why this submission is not approved (e.g. insufficient details, missing proof, needs category adjustment). The learner will see this comment and update their submission.
            </p>
            <textarea
              rows={4}
              required
              placeholder="e.g., Please provide more specific information about your hands-on experience or project context before we approve this skill..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 dark:bg-rose-600 dark:hover:bg-rose-700"
            >
              {loading ? "Submitting..." : "Confirm Rejection with Comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
