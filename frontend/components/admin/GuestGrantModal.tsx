"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, Plus, Trash2, Globe, Building2, CheckCircle2, UserCheck } from "lucide-react";
import { getGuestGrants, createGuestGrant, revokeGuestGrant, GuestGrant } from "@/services/api/guestGrant.service";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";

interface Department {
  id: string;
  departmentCode: string;
  departmentName: string;
}

interface GuestGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuestGrantModal({ isOpen, onClose }: GuestGrantModalProps) {
  const { user } = useAuthStore();
  const [grants, setGrants] = useState<GuestGrant[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [scope, setScope] = useState<"DEPARTMENT" | "GLOBAL">("DEPARTMENT");
  const [departmentId, setDepartmentId] = useState<string>("");

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [grantsRes, deptsRes] = await Promise.all([
        getGuestGrants(),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/departments`),
      ]);

      if (grantsRes?.success) {
        setGrants(grantsRes.data || []);
      }
      if (deptsRes.data?.data) {
        setDepartments(deptsRes.data.data);
        if (deptsRes.data.data.length > 0 && !departmentId) {
          setDepartmentId(deptsRes.data.data[0].id);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load guest grants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await createGuestGrant({
        scope,
        departmentId: scope === "DEPARTMENT" ? departmentId : undefined,
      });

      if (res.success) {
        setSuccess("Guest permission grant created successfully!");
        loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create guest grant");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeGrant = async (grantId: string) => {
    try {
      const res = await revokeGuestGrant(grantId);
      if (res.success) {
        setSuccess("Guest grant revoked successfully!");
        loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to revoke grant");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Guest Access Control</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant department-scoped or global Guest preview permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Form to add grant */}
          <form onSubmit={handleCreateGrant} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-amber-600" />
              <span>Grant New Guest Access</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Access Scope
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="DEPARTMENT">Department Scoped</option>
                  {isSuperAdmin && <option value="GLOBAL">Global Access (All Departments)</option>}
                </select>
              </div>

              {scope === "DEPARTMENT" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.departmentName} ({d.departmentCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>{submitting ? "Granting..." : "Grant Permission"}</span>
              </button>
            </div>
          </form>

          {/* Active Grants List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Active Guest Permission Grants ({grants.length})
            </h4>

            {loading ? (
              <p className="text-xs text-slate-500">Loading grants...</p>
            ) : grants.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                No active Guest access grants. Guests currently see 0 restricted courses.
              </div>
            ) : (
              <div className="space-y-2">
                {grants.map((grant) => (
                  <div
                    key={grant.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-amber-600">
                        {grant.scope === "GLOBAL" ? (
                          <Globe className="h-4 w-4" />
                        ) : (
                          <Building2 className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>
                            {grant.scope === "GLOBAL"
                              ? "Global Guest Access"
                              : `Department: ${grant.department?.departmentName || "Specified Department"}`}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            {grant.scope}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Granted by: {grant.grantedBy ? `${grant.grantedBy.firstName} ${grant.grantedBy.lastName}` : "System Administrator"} • {new Date(grant.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeGrant(grant.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                      title="Revoke Grant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
