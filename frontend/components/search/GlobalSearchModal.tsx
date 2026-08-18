"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  BookOpen,
  Layers,
  FileText,
  HelpCircle,
  Paperclip,
  Calendar,
  Sparkles,
  Folder,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Clock,
  History,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  globalSearch,
  GlobalSearchResponseData,
} from "@/services/api/search.service";
import { useAuthStore } from "@/store/auth.store";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabCategory = "all" | "courses" | "modules_lessons" | "quizzes_assignments" | "events_skills";

const RECENT_SEARCHES_KEY = "dlms_recent_searches_v1";

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabCategory>("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponseData | null>(null);
  const [userRole, setUserRole] = useState<string>(user?.role || "GUEST");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setResults(null);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Debounced Search API Call
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const categoryFilter =
          activeTab === "courses"
            ? "courses"
            : activeTab === "modules_lessons"
            ? "all"
            : activeTab === "quizzes_assignments"
            ? "all"
            : activeTab === "events_skills"
            ? "all"
            : "all";

        const res = await globalSearch(query.trim(), categoryFilter);
        if (res.success) {
          setResults(res.data);
          setUserRole(res.userRole || user?.role || "GUEST");
        }
      } catch (err) {
        console.error("Search execution error:", err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, activeTab, user]);

  const saveRecentSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (_) {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (_) {}
  };

  const handleSelectResult = (url: string, title: string) => {
    saveRecentSearch(query || title);
    onClose();
    router.push(url);
  };

  // Build flattened result list for active tab and keyboard navigation
  const getFilteredItems = () => {
    if (!results) return [];

    const { courses, modules, lessons, quizzes, assignments, events, skills, categories } = results;

    if (activeTab === "courses") return courses;
    if (activeTab === "modules_lessons") return [...modules, ...lessons];
    if (activeTab === "quizzes_assignments") return [...quizzes, ...assignments];
    if (activeTab === "events_skills") return [...events, ...skills, ...categories];

    return [
      ...courses,
      ...quizzes,
      ...assignments,
      ...lessons,
      ...modules,
      ...events,
      ...skills,
      ...categories,
    ];
  };

  const filteredItems = getFilteredItems();

  // Keyboard navigation listener (ESC, ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && filteredItems[selectedIndex]) {
      e.preventDefault();
      const item: any = filteredItems[selectedIndex];
      handleSelectResult(item.url, item.title || item.name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Search Command Dialog */}
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0F172A] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[82vh] z-10 select-none animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Top Header & Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="h-5 w-5 text-[#C82333] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            placeholder="Search across courses, modules, lessons, quizzes, assignments, events..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 text-[#C82333] animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300/40 dark:border-slate-700 shrink-0">
            <span>ESC</span>
          </div>
        </div>

        {/* Category Tabs & Scoped RBAC Info Bar */}
        <div className="px-4 py-2 bg-slate-100/60 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Results" },
              { id: "courses", label: "Courses" },
              { id: "modules_lessons", label: "Modules & Lessons" },
              { id: "quizzes_assignments", label: "Quizzes & Assignments" },
              { id: "events_skills", label: "Events & Skills" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabCategory);
                  setSelectedIndex(-1);
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#C82333] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Scoped for: <strong className="text-[#C82333] uppercase">{userRole}</strong></span>
          </div>
        </div>

        {/* Main Results Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {/* Empty Query State: Recent Searches & Quick Tips */}
          {!query.trim() && (
            <div className="space-y-4 py-2">
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-[#C82333]" />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[11px] font-semibold text-slate-400 hover:text-[#C82333] transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(term)}
                        className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
                      >
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center space-y-2 bg-slate-50/40 dark:bg-slate-900/20">
                <Search className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Search across your entire dLMS Catalog
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Type a course title, module name, quiz question, assignment topic, or skill (e.g., <strong className="text-[#C82333]">React</strong>, <strong className="text-[#C82333]">Quiz</strong>, <strong className="text-[#C82333]">Cybersecurity</strong>).
                </p>
              </div>
            </div>
          )}

          {/* Results State */}
          {query.trim() && (
            <>
              {loading && !results && (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="h-7 w-7 text-[#C82333] animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Searching LMS records...</p>
                </div>
              )}

              {results && filteredItems.length === 0 && !loading && (
                <div className="py-12 text-center space-y-2">
                  <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No results found matching "{query}"
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Try refining your search terms or selecting a different category filter.
                  </p>
                </div>
              )}

              {results && filteredItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Found {results.totalResults} matching LMS item{results.totalResults === 1 ? "" : "s"}
                  </div>

                  <div className="space-y-1.5">
                    {filteredItems.map((item: any, idx: number) => {
                      const isSelected = selectedIndex === idx;
                      const itemTitle = item.title || item.name;

                      return (
                        <div
                          key={`${item.type}-${item.id}-${idx}`}
                          onClick={() => handleSelectResult(item.url, itemTitle)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-[#C82333]/10 border-[#C82333]/40 shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Icon per type */}
                            <div className="p-2 rounded-lg shrink-0 mt-0.5 border" style={getBadgeStyle(item.type)}>
                              {getItemIcon(item.type)}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {itemTitle}
                                </span>

                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border" style={getBadgeStyle(item.type)}>
                                  {item.type}
                                </span>

                                {item.contentType && (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    {item.contentType}
                                  </span>
                                )}
                              </div>

                              {/* Details Context */}
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {item.courseTitle && (
                                  <span>
                                    Course: <strong className="text-slate-700 dark:text-slate-300">{item.courseTitle}</strong>
                                  </span>
                                )}
                                {item.sectionTitle && (
                                  <span> • Section: {item.sectionTitle}</span>
                                )}
                                {item.category && item.type === "course" && (
                                  <span>Category: {item.category} • Level: {item.level}</span>
                                )}
                                {item.questionCount !== undefined && (
                                  <span> • {item.questionCount} Questions</span>
                                )}
                                {item.eventType && (
                                  <span>Event Type: {item.eventType} • Location: {item.location || "Online"}</span>
                                )}
                                {item.skillType && (
                                  <span>Category: {item.category} • Type: {item.skillType}</span>
                                )}
                                {item.courseCount !== undefined && (
                                  <span>{item.courseCount} Courses available</span>
                                )}
                              </div>

                              {item.description && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-[#C82333] shrink-0">
                            <span className="hidden sm:inline">Open</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">↑</kbd> <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">↵</kbd> to select</span>
          </div>
          <span>dLMS Global Search v2.0</span>
        </div>
      </div>
    </div>
  );
}

function getItemIcon(type: string) {
  switch (type) {
    case "course":
      return <BookOpen className="h-4 w-4" />;
    case "module":
      return <Layers className="h-4 w-4" />;
    case "lesson":
      return <FileText className="h-4 w-4" />;
    case "quiz":
      return <HelpCircle className="h-4 w-4" />;
    case "assignment":
      return <Paperclip className="h-4 w-4" />;
    case "event":
      return <Calendar className="h-4 w-4" />;
    case "skill":
      return <Sparkles className="h-4 w-4" />;
    case "category":
      return <Folder className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
}

function getBadgeStyle(type: string) {
  switch (type) {
    case "course":
      return { backgroundColor: "rgba(200, 35, 51, 0.1)", color: "#C82333", borderColor: "rgba(200, 35, 51, 0.2)" };
    case "module":
      return { backgroundColor: "rgba(147, 51, 234, 0.1)", color: "#9333ea", borderColor: "rgba(147, 51, 234, 0.2)" };
    case "lesson":
      return { backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#2563eb", borderColor: "rgba(59, 130, 246, 0.2)" };
    case "quiz":
      return { backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.2)" };
    case "assignment":
      return { backgroundColor: "rgba(244, 63, 94, 0.1)", color: "#e11d48", borderColor: "rgba(244, 63, 94, 0.2)" };
    case "event":
      return { backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#4f46e5", borderColor: "rgba(99, 102, 241, 0.2)" };
    case "skill":
      return { backgroundColor: "rgba(6, 182, 212, 0.1)", color: "#0891b2", borderColor: "rgba(6, 182, 212, 0.2)" };
    case "category":
      return { backgroundColor: "rgba(20, 184, 166, 0.1)", color: "#0d9488", borderColor: "rgba(20, 184, 166, 0.2)" };
    default:
      return { backgroundColor: "rgba(108, 117, 125, 0.1)", color: "#6c757d", borderColor: "rgba(108, 117, 125, 0.2)" };
  }
}
