"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  Star,
  Award,
  Check,
  X,
  Eye,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import {
  getUserOverviewStats,
  getUserSkills,
  getUserProjects,
  getApprovalRequests,
  handleApprovalAction,
  deleteUserSkill,
  deleteUserProject,
  UserSkill,
  UserProject,
  ApprovalRequestItem,
  UserOverviewStats,
} from "@/services/api/skill.service";

import AddSkillModal from "@/components/skill-cloud/AddSkillModal";
import AddProjectModal from "@/components/skill-cloud/AddProjectModal";
import RejectRequestModal from "@/components/skill-cloud/RejectRequestModal";
import { useAuthStore } from "@/store/auth.store";

import DataFilterToolbar, { SortOption, applyDataFilters } from "@/components/common/DataFilterToolbar";

export default function SkillCloudPage() {
  const { user } = useAuthStore();
  
  // 5 Roles Access Enforcement (SUPER_ADMIN, ADMIN, LEARNER allowed; TEACHER, GUEST restricted)
  const userRole = user?.role || "LEARNER";
  const isAllowed = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "LEARNER";
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  // Active sub-tab inside Learner view
  const [learnerTab, setLearnerTab] = useState<"OVERVIEW" | "MY_SKILLS">("OVERVIEW");
  const [skillCategoryFilter, setSkillCategoryFilter] = useState("ALL");
  const [skillStatusFilter, setSkillStatusFilter] = useState("ALL");

  // Active sub-tab inside Admin view
  const [adminTypeFilter, setAdminTypeFilter] = useState<"ALL" | "SKILLS" | "PROJECTS">("ALL");
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>("ALL");
  const [adminSearch, setAdminSearch] = useState("");
  const [sortValue, setSortValue] = useState<SortOption>("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals state
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [selectedSkillToEdit, setSelectedSkillToEdit] = useState<UserSkill | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProjectToEdit, setSelectedProjectToEdit] = useState<UserProject | null>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequestToReject, setSelectedRequestToReject] = useState<ApprovalRequestItem | null>(null);

  // Detail viewer modal
  const [detailModalItem, setDetailModalItem] = useState<any | null>(null);

  // Data states
  const [overviewStats, setOverviewStats] = useState<UserOverviewStats | null>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!isAdmin) {
        const [stats, skills, projects] = await Promise.all([
          getUserOverviewStats(),
          getUserSkills(),
          getUserProjects(),
        ]);
        setOverviewStats(stats);
        setUserSkills(skills);
        setUserProjects(projects);
      } else {
        const requests = await getApprovalRequests({
          status: adminStatusFilter === "ALL" ? undefined : adminStatusFilter,
          search: adminSearch || undefined,
        });
        setApprovalRequests(requests);
      }
    } catch (err) {
      console.error("Failed to load skill cloud data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, adminStatusFilter, adminSearch]);

  // Quick action approve by admin
  const handleQuickApprove = async (request: ApprovalRequestItem) => {
    try {
      await handleApprovalAction(request.id, request.requestKind, "APPROVE");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSkill = async (id: number) => {
    if (confirm("Are you sure you want to delete this skill entry?")) {
      await deleteUserSkill(id);
      loadData();
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm("Are you sure you want to delete this project entry?")) {
      await deleteUserProject(id);
      loadData();
    }
  };

  const handleDeleteAdminRequest = async (reqItem: ApprovalRequestItem) => {
    if (confirm(`Are you sure you want to permanently delete this ${reqItem.requestKind.toLowerCase()} entry ("${reqItem.title}")?`)) {
      try {
        if (reqItem.requestKind === "SKILL") {
          await deleteUserSkill(reqItem.id);
        } else {
          await deleteUserProject(reqItem.id);
        }
        loadData();
      } catch (err) {
        console.error("Failed to delete request:", err);
      }
    }
  };

  // Learner Filtered Skills
  const filteredUserSkills = userSkills.filter((s) => {
    if (skillCategoryFilter !== "ALL") {
      if (skillCategoryFilter === "Technical" && s.skillType !== "Technical Skill") return false;
      if (skillCategoryFilter === "Soft" && s.skillType !== "Soft Skill") return false;
      if (skillCategoryFilter === "Domain" && s.skillType !== "Domain Knowledge") return false;
      if (skillCategoryFilter === "Tool" && s.skillType !== "Tool / Technology") return false;
    }
    if (skillStatusFilter !== "ALL" && s.status !== skillStatusFilter) return false;
    return true;
  });

  // Admin Filtered Requests with Universal Sorting, Date Range & Column Search
  const filteredApprovalRequests = applyDataFilters(
    approvalRequests.map((r) => ({
      ...r,
      submittedDate: r.createdAt || r.updatedAt,
    })),
    {
      searchQuery: adminSearch,
      searchFields: ["title", "category", "subCategory", "requestKind"],
      sortValue,
      titleField: "title",
      dateField: "submittedDate",
      startDate,
      endDate,
      columnFilters: {
        requestKind: adminTypeFilter === "ALL" ? null : adminTypeFilter === "SKILLS" ? "SKILL" : "PROJECT",
        status: adminStatusFilter === "ALL" ? null : adminStatusFilter,
      },
    }
  );

  // Admin Counts
  const pendingCount = approvalRequests.filter((r) => r.status === "PENDING").length;
  const approvedCount = approvalRequests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = approvalRequests.filter((r) => r.status === "REJECTED").length;

  // Learner Counts (strictly calculated from userSkills/userProjects)
  const learnerTotalSkills = userSkills.length;
  const learnerApprovedSkills = userSkills.filter((s) => s.status === "APPROVED").length;
  const learnerPendingSkills = userSkills.filter((s) => s.status === "PENDING").length;
  const learnerTotalProjects = userProjects.length;

  // Restrict access for TEACHER, GUEST, or any unauthorized role
  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Skill Cloud Access Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The Skill Cloud platform is strictly reserved for Learners (to manage skills &amp; projects) and Super Admins / Admins (to verify and approve requests).
          </p>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Your account role <span className="font-bold text-rose-600 uppercase">({userRole})</span> does not have permission to access this portal.
          </div>
        </div>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 transition-all shadow"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>My Profile</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-emerald-600 dark:text-emerald-400">Skill Cloud</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-500" />
            {isAdmin ? "Skill Approval Portal" : "Skill Cloud Platform"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. LEARNER VIEW (Automatically displayed for Learners/Students) */}
      {/* ========================================================================= */}
      {!isAdmin && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30 mb-2">
                  Learner Skill Matrix
                </span>
                <h2 className="text-xl font-bold text-white">
                  Welcome back, {user?.username || "Learner"}! 👋
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Add and showcase your verified skills and projects. When you master a technology or complete a hands-on project, submit it here for Admin verification.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedSkillToEdit(null);
                    setIsSkillModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add New Skill
                </button>
                <button
                  onClick={() => {
                    setSelectedProjectToEdit(null);
                    setIsProjectModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-600 transition-all border border-slate-600"
                >
                  <Briefcase className="h-4 w-4" />
                  Add Project
                </button>
              </div>
            </div>
          </div>

          {/* Learner Nav Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setLearnerTab("OVERVIEW")}
                className={`border-b-2 py-3 text-xs font-bold transition-all ${
                  learnerTab === "OVERVIEW"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Dashboard Overview
              </button>
              <button
                onClick={() => setLearnerTab("MY_SKILLS")}
                className={`border-b-2 py-3 text-xs font-bold transition-all ${
                  learnerTab === "MY_SKILLS"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                My Skills & Projects ({userSkills.length})
              </button>
            </div>
          </div>

          {/* OVERVIEW TAB */}
          {learnerTab === "OVERVIEW" && (
            <div className="space-y-6">
              {/* Stat Cards Grid (Derived from real user data) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Skills */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Skills</span>
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {learnerTotalSkills}
                    </span>
                    <span className="text-xs text-amber-600 font-medium">
                      ({learnerPendingSkills} Pending)
                    </span>
                  </div>
                </div>

                {/* Approved Skills */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Approved Skills</span>
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {learnerApprovedSkills}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> Verified
                    </span>
                  </div>
                </div>

                {/* Projects */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Projects</span>
                    <div className="rounded-lg bg-sky-50 p-2 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {learnerTotalProjects}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Submitted Projects
                    </span>
                  </div>
                </div>

                {/* Certifications */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Verified Badges</span>
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                      <Award className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {learnerApprovedSkills}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Verified Competencies
                    </span>
                  </div>
                </div>
              </div>

              {/* Distribution & Recent Activity Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Skill Distribution Donut Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                    Skill Distribution
                  </h3>

                  {userSkills.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <p>No skills added to portfolio yet.</p>
                      <button
                        onClick={() => setIsSkillModalOpen(true)}
                        className="mt-3 inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        + Add your first skill
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center my-4">
                        <div className="relative flex items-center justify-center h-36 w-36 rounded-full border-8 border-emerald-500/20 border-t-emerald-500 border-r-indigo-500">
                          <div className="text-center">
                            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                              {userSkills.length}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Total Skills</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-6">
                        {[
                          { name: "Technical Skills", color: "bg-emerald-500", count: userSkills.filter(s => s.skillType === 'Technical Skill').length },
                          { name: "Soft Skills", color: "bg-indigo-500", count: userSkills.filter(s => s.skillType === 'Soft Skill').length },
                          { name: "Domain Knowledge", color: "bg-sky-500", count: userSkills.filter(s => s.skillType === 'Domain Knowledge').length },
                          { name: "Tools & Tech", color: "bg-amber-500", count: userSkills.filter(s => s.skillType === 'Tool / Technology').length },
                        ].map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                              <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Recent Activities Timeline */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Recent Skill & Approval Activity
                      </h3>
                      {userSkills.length > 0 && (
                        <button
                          onClick={() => setLearnerTab("MY_SKILLS")}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                        >
                          View all skills <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {userSkills.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
                          <Layers className="h-8 w-8 mx-auto text-emerald-500/40 mb-2" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Your Skill Matrix is Empty</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Assigned courses are not automatically added as skills. Once you complete a course or master a technology, add it to your skill matrix for Admin approval!
                          </p>
                          <button
                            onClick={() => setIsSkillModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow"
                          >
                            <Plus className="h-4 w-4" /> Add Your First Skill
                          </button>
                        </div>
                      ) : (
                        userSkills.slice(0, 4).map((s) => (
                          <div
                            key={s.id}
                            className="flex items-start justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/40"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-lg p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                <Layers className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                    {s.skillName}
                                  </h4>
                                  <span className="text-[10px] text-slate-400">• {s.category}</span>
                                </div>
                                {s.status === "REJECTED" && (
                                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> Reviewer Comment: {s.rejectionReason}
                                  </p>
                                )}
                                {s.status === "APPROVED" && (
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Verified by {s.verifiedBy || "Admin"}
                                  </p>
                                )}
                                {s.status === "PENDING" && (
                                  <p className="text-[11px] text-amber-600 mt-0.5">
                                    Awaiting Admin verification
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {s.status === "APPROVED" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </span>
                              )}
                              {s.status === "PENDING" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              )}
                              {s.status === "REJECTED" && (
                                <button
                                  onClick={() => {
                                    setSelectedSkillToEdit(s);
                                    setIsSkillModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-400 transition-colors"
                                >
                                  <XCircle className="h-3 w-3" /> Rejected (Click to Edit)
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Sense AI Recommendations */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      NEW
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Skill Sense Recommendations
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">Based on your role and target skills</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Agentic AI",
                      priority: "High Priority",
                      priorityBg: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
                      course: "Agentic AI Fundamentals",
                    },
                    {
                      title: "LangChain Advanced",
                      priority: "Medium Priority",
                      priorityBg: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                      course: "LangChain for LLM Apps",
                    },
                    {
                      title: "Vector Databases",
                      priority: "Medium Priority",
                      priorityBg: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
                      course: "Vector DB Masterclass",
                    },
                  ].map((rec) => (
                    <div
                      key={rec.title}
                      className="rounded-xl border border-slate-200 p-4 hover:border-emerald-500 transition-all dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rec.priorityBg}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Recommended Course:</p>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {rec.course}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MY SKILLS & PROJECTS TAB */}
          {learnerTab === "MY_SKILLS" && (
            <div className="space-y-6">
              {/* Category Filter Pills & Add Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "ALL", label: "All Skills" },
                    { id: "Technical", label: "Technical Skills" },
                    { id: "Soft", label: "Soft Skills" },
                    { id: "Domain", label: "Domain Knowledge" },
                    { id: "Tool", label: "Tools & Others" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSkillCategoryFilter(filter.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        skillCategoryFilter === filter.id
                          ? "bg-emerald-600 text-white shadow dark:bg-emerald-500"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={skillStatusFilter}
                    onChange={(e) => setSkillStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <option value="ALL">All Status</option>
                    <option value="APPROVED">Approved Only</option>
                    <option value="PENDING">Pending Only</option>
                    <option value="REJECTED">Rejected Only</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedSkillToEdit(null);
                      setIsSkillModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow"
                  >
                    <Plus className="h-4 w-4" /> Add Skill
                  </button>
                </div>
              </div>

              {/* Skills Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Skills Portfolio ({filteredUserSkills.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Skill Name</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Proficiency</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Verified By</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {filteredUserSkills.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                            No skills found under the selected filters. Click <b>+ Add Skill</b> to submit your skills.
                          </td>
                        </tr>
                      ) : (
                        filteredUserSkills.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                              {s.skillName}
                              {s.subCategory && (
                                <span className="block text-[11px] font-normal text-slate-400">
                                  {s.subCategory}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">{s.category}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold">{s.proficiencyLevel}</span>
                                <div className="flex text-amber-400">
                                  {[...Array(s.rating || 3)].map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-current" />
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {s.status === "APPROVED" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </span>
                              )}
                              {s.status === "PENDING" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              )}
                              {s.status === "REJECTED" && (
                                <div className="flex flex-col items-start gap-1">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                                    <XCircle className="h-3 w-3" /> Rejected
                                  </span>
                                  {s.rejectionReason && (
                                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium max-w-xs truncate">
                                      Comment: {s.rejectionReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {s.verifiedBy ? (
                                <div>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {s.verifiedBy}
                                  </span>
                                  {s.verifiedAt && (
                                    <span className="block text-[10px] text-slate-400">
                                      {new Date(s.verifiedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {s.status === "REJECTED" ? (
                                  <button
                                    onClick={() => {
                                      setSelectedSkillToEdit(s);
                                      setIsSkillModalOpen(true);
                                    }}
                                    className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition-colors"
                                  >
                                    Edit & Re-submit
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedSkillToEdit(s);
                                      setIsSkillModalOpen(true);
                                    }}
                                    className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    title="Edit"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteSkill(s.id)}
                                  className="rounded p-1 text-slate-400 hover:text-rose-600"
                                  title="Delete"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Projects Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Projects Showcase ({userProjects.length})
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedProjectToEdit(null);
                      setIsProjectModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    <Plus className="h-4 w-4" /> Add Project
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Project Name</th>
                        <th className="px-6 py-3">Type / Client</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {userProjects.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                            No projects submitted yet. Click <b>+ Add Project</b> to showcase your project experience.
                          </td>
                        </tr>
                      ) : (
                        userProjects.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                              {p.projectName}
                              {p.technologies && (
                                <span className="block text-[11px] font-normal text-slate-400">
                                  Tech: {p.technologies}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold">{p.projectType}</span>
                              {p.organization && (
                                <span className="block text-[11px] text-slate-400">{p.organization}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">{p.roleName || "Contributor"}</td>
                            <td className="px-6 py-4">
                              {p.status === "APPROVED" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </span>
                              )}
                              {p.status === "PENDING" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              )}
                              {p.status === "REJECTED" && (
                                <div className="flex flex-col items-start gap-1">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                                    <XCircle className="h-3 w-3" /> Rejected
                                  </span>
                                  {p.rejectionReason && (
                                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                                      Comment: {p.rejectionReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {p.status === "REJECTED" ? (
                                  <button
                                    onClick={() => {
                                      setSelectedProjectToEdit(p);
                                      setIsProjectModalOpen(true);
                                    }}
                                    className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition-colors"
                                  >
                                    Edit & Re-submit
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedProjectToEdit(p);
                                      setIsProjectModalOpen(true);
                                    }}
                                    className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    title="Edit"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteProject(p.id)}
                                  className="rounded p-1 text-slate-400 hover:text-rose-600"
                                  title="Delete"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADMIN / SUPER ADMIN APPROVAL VIEW (Automatically displayed for Admins) */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Admin Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300 border border-amber-500/30 mb-2">
                  Admin Approval Portal
                </span>
                <h2 className="text-xl font-bold text-white">
                  Skill & Project Approval Queue
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Review learner submissions, verify skill proficiencies, approve valid entries, or provide feedback comments on rejections.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Metric Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Pending Approval */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Pending Approval
                </span>
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-amber-900 dark:text-amber-200">
                {pendingCount}
              </div>
            </div>

            {/* Approved */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Approved
                </span>
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">
                {approvedCount}
              </div>
            </div>

            {/* Rejected */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                  Rejected
                </span>
                <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                  <XCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-rose-900 dark:text-rose-200">
                {rejectedCount}
              </div>
            </div>

            {/* Total Requests */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                  Total Requests
                </span>
                <div className="rounded-lg bg-sky-100 p-2 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-sky-900 dark:text-sky-200">
                {approvalRequests.length}
              </div>
            </div>
          </div>

          {/* Universal Filter & Sorting Toolbar for Admin Approval Queue */}
          <DataFilterToolbar
            searchQuery={adminSearch}
            onSearchChange={setAdminSearch}
            searchPlaceholder="Search request title, learner name, category..."
            sortValue={sortValue}
            onSortChange={setSortValue}
            sortOptions={[
              { label: "Request Title (A-Z)", value: "a_z" },
              { label: "Request Title (Z-A)", value: "z_a" },
              { label: "Date Submitted (Newest)", value: "newest" },
              { label: "Date Submitted (Oldest)", value: "oldest" },
            ]}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start || "");
              setEndDate(end || "");
            }}
            columnFilters={[
              {
                key: "requestKind",
                label: "Kind",
                value: adminTypeFilter === "ALL" ? "all" : adminTypeFilter === "SKILLS" ? "SKILL" : "PROJECT",
                options: [
                  { label: "Skills Only", value: "SKILL" },
                  { label: "Projects Only", value: "PROJECT" },
                ],
              },
              {
                key: "status",
                label: "Status",
                value: adminStatusFilter === "ALL" ? "all" : adminStatusFilter,
                options: [
                  { label: "Pending Only", value: "PENDING" },
                  { label: "Approved Only", value: "APPROVED" },
                  { label: "Rejected Only", value: "REJECTED" },
                ],
              },
            ]}
            onColumnFilterChange={(key, val) => {
              if (key === "requestKind") {
                setAdminTypeFilter(val === "SKILL" ? "SKILLS" : val === "PROJECT" ? "PROJECTS" : "ALL");
              }
              if (key === "status") {
                setAdminStatusFilter(val || "ALL");
              }
            }}
            onResetAll={() => {
              setAdminSearch("");
              setSortValue("newest");
              setAdminTypeFilter("ALL");
              setAdminStatusFilter("ALL");
              setStartDate("");
              setEndDate("");
            }}
          />

          {/* Admin Queue Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Skill / Project</th>
                    <th className="px-6 py-3.5">Category / Type</th>
                    <th className="px-6 py-3.5">Proficiency</th>
                    <th className="px-6 py-3.5">Requested On</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredApprovalRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                        No requests found in approval queue.
                      </td>
                    </tr>
                  ) : (
                    filteredApprovalRequests.map((req) => (
                      <tr key={`${req.requestKind}-${req.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        {/* Employee Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                              {req.employee.firstName ? req.employee.firstName[0] : "P"}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {req.employee.firstName} {req.employee.lastName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {req.employee.designation}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Title */}
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{req.title}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {req.requestKind}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="font-semibold">{req.category}</span>
                          {req.subCategory && (
                            <span className="block text-[10px] text-slate-400">{req.subCategory}</span>
                          )}
                        </td>

                        {/* Proficiency */}
                        <td className="px-6 py-4">
                          <span className="font-semibold">{req.proficiencyLevel}</span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(req.updatedAt).toLocaleDateString()}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {req.status === "APPROVED" && (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Approved
                              </span>
                              {req.verifiedBy && (
                                <span className="text-[10px] text-slate-500 font-medium truncate max-w-xs">
                                  Approved by {req.verifiedBy}
                                </span>
                              )}
                            </div>
                          )}
                          {req.status === "PENDING" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                          {req.status === "REJECTED" && (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                                <XCircle className="h-3 w-3" /> Rejected
                              </span>
                              {req.verifiedBy && (
                                <span className="text-[10px] text-slate-500 font-medium truncate max-w-xs">
                                  By {req.verifiedBy}
                                </span>
                              )}
                              {req.rejectionReason && (
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 truncate max-w-xs">
                                  {req.rejectionReason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Admin Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Approve & Reject Action Buttons - ONLY enabled for PENDING requests */}
                            {req.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleQuickApprove(req)}
                                  className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white transition-colors"
                                  title="Approve Request"
                                >
                                  <Check className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedRequestToReject(req);
                                    setIsRejectModalOpen(true);
                                  }}
                                  className="rounded-lg bg-rose-100 p-1.5 text-rose-700 hover:bg-rose-600 hover:text-white dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white transition-colors"
                                  title="Reject with Feedback Comment"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {/* View Details Button */}
                            <button
                              onClick={() => setDetailModalItem(req)}
                              className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Permanently Delete Button for Admin & Super Admin */}
                            <button
                              onClick={() => handleDeleteAdminRequest(req)}
                              className="rounded-lg bg-rose-100 p-1.5 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-950/60 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white transition-colors"
                              title="Permanently Delete Entry from Database"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <AddSkillModal
        isOpen={isSkillModalOpen}
        initialData={selectedSkillToEdit}
        onClose={() => setIsSkillModalOpen(false)}
        onSuccess={loadData}
      />

      <AddProjectModal
        isOpen={isProjectModalOpen}
        initialData={selectedProjectToEdit}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={loadData}
      />

      <RejectRequestModal
        isOpen={isRejectModalOpen}
        request={selectedRequestToReject}
        onClose={() => setIsRejectModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Request Details Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Request Details - {detailModalItem.title}
              </h3>
              <button
                onClick={() => setDetailModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p><b>Type:</b> {detailModalItem.requestKind}</p>
              <p><b>Learner:</b> {detailModalItem.employee.firstName} {detailModalItem.employee.lastName}</p>
              <p><b>Category:</b> {detailModalItem.category}</p>
              <p><b>Proficiency:</b> {detailModalItem.proficiencyLevel}</p>
              <p><b>Status:</b> {detailModalItem.status}</p>
              {detailModalItem.rejectionReason && (
                <div className="rounded-lg bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  <b>Rejection Reason / Feedback:</b> {detailModalItem.rejectionReason}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetailModalItem(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
