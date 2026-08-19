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

type TabCategory = "all" | "courses" | "modules_lessons" | "quizzes_assignments" | "events_skills";

const RECENT_SEARCHES_KEY = "dlms_recent_searches_v1";

interface TopBarSearchProps {
  onExpandChange?: (expanded: boolean) => void;
}

export default function TopBarSearch({ onExpandChange }: TopBarSearchProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isExpanded, setIsExpanded] = useState(false);

  const setExpanded = (expanded: boolean) => {
    setIsExpanded(expanded);
    onExpandChange?.(expanded);
  };

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabCategory>("all");
  const [isOpen, setIsOpen] = useState(false);
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
    } catch (_) { }
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut to focus TopBar search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setExpanded(true);
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Close dropdown and collapse search on click outside if empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (!query.trim()) {
          setExpanded(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  // Debounced API search
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
        console.error("TopBar search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeTab, user]);

  const saveRecentSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (_) { }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (_) { }
  };

  const handleSelectResult = (url: string, title: string) => {
    saveRecentSearch(query || title);
    setIsOpen(false);
    setExpanded(false);
    router.push(url);
  };

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      if (!query.trim()) {
        setExpanded(false);
      }
      inputRef.current?.blur();
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

  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          setExpanded(true);
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
        title="Search LMS (Ctrl+K)"
      >
        <Search className="h-4 w-4 text-[#C82333]" />
      </button>
    );
  }

  return (
    <div className="relative w-48 sm:w-64 md:w-80 lg:w-[360px] animate-in fade-in zoom-in-95 duration-150" ref={containerRef}>
      {/* TopBar Search Input Field */}
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 h-4 w-4 text-[#C82333] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search courses, lessons, quizzes, etc"
          className="w-full h-9 pl-9 pr-14 rounded-lg bg-white/10 hover:bg-white/15 focus:bg-white text-xs font-medium text-white focus:text-[#212529] placeholder-slate-300 focus:placeholder-slate-400 border border-white/15 focus:border-slate-300 shadow-inner focus:shadow-md transition-all outline-none"
        />

        {loading && (
          <Loader2 className="absolute right-3 h-4 w-4 text-[#C82333] animate-spin" />
        )}

        {!loading && (
          <button
            onClick={() => {
              if (query) {
                setQuery("");
                setResults(null);
              } else {
                setIsOpen(false);
                setExpanded(false);
              }
            }}
            className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors"
            title="Close search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {!loading && !query && (
          <span className="absolute right-8 hidden sm:inline-block text-[9px] font-mono text-slate-300 bg-black/40 px-1.5 py-0.5 rounded border border-white/10 pointer-events-none">

          </span>
        )}
      </div>

      {/* Floating Inline Search Results Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 sm:right-auto sm:w-[580px] md:w-[680px] bg-white dark:bg-[#0F172A] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 text-[#212529] dark:text-white z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 select-none">
          {/* Header Category Pills & RBAC Badge */}
          <div className="px-3.5 py-2 bg-slate-100/70 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All" },
                { id: "courses", label: "Courses" },
                { id: "modules_lessons", label: "Lessons" },
                { id: "quizzes_assignments", label: "Quizzes & Tasks" },
                { id: "events_skills", label: "Events & Skills" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabCategory);
                    setSelectedIndex(-1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${activeTab === tab.id
                    ? "bg-[#C82333] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Role: <strong className="text-[#C82333] uppercase">{userRole}</strong></span>
            </div>
          </div>

          {/* Results List Area */}
          <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {/* Empty Input State: Recent Searches */}
            {!query.trim() && (
              <div className="space-y-3 py-1">
                {recentSearches.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5 text-[#C82333]" />
                        <span>Recent Searches</span>
                      </div>
                      <button
                        onClick={clearRecentSearches}
                        className="text-[10px] font-semibold text-slate-400 hover:text-[#C82333] transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(term);
                            inputRef.current?.focus();
                          }}
                          className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 transition-all"
                        >
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1 bg-slate-50/50 dark:bg-slate-900/30">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Search across LMS Courses, Modules, Quizzes, &amp; Skills
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Type a query (e.g. <strong className="text-[#C82333]">React</strong>, <strong className="text-[#C82333]">Quiz</strong>, <strong className="text-[#C82333]">Python</strong>) to see instant authorized results.
                  </p>
                </div>
              </div>
            )}

            {/* Results State */}
            {query.trim() && (
              <>
                {loading && !results && (
                  <div className="py-8 text-center space-y-2">
                    <Loader2 className="h-6 w-6 text-[#C82333] animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Searching LMS platform...</p>
                  </div>
                )}

                {results && filteredItems.length === 0 && !loading && (
                  <div className="py-8 text-center space-y-1">
                    <BookOpen className="h-7 w-7 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No results found matching "{query}"
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Try searching with different course terms or keywords.
                    </p>
                  </div>
                )}

                {results && filteredItems.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                      Showing {filteredItems.length} matching LMS record{filteredItems.length === 1 ? "" : "s"}
                    </div>

                    {filteredItems.map((item: any, idx: number) => {
                      const isSelected = selectedIndex === idx;
                      const itemTitle = item.title || item.name;

                      return (
                        <div
                          key={`${item.type}-${item.id}-${idx}`}
                          onClick={() => handleSelectResult(item.url, itemTitle)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                            ? "bg-[#C82333]/10 border-[#C82333]/40 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-md shrink-0 mt-0.5 border" style={getBadgeStyle(item.type)}>
                              {getItemIcon(item.type)}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {itemTitle}
                                </span>

                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border" style={getBadgeStyle(item.type)}>
                                  {item.type}
                                </span>

                                {item.contentType && (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                                    {item.contentType}
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {item.courseTitle && (
                                  <span>Course: <strong className="text-slate-700 dark:text-slate-300">{item.courseTitle}</strong></span>
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
                                  <span>Event Type: {item.eventType}</span>
                                )}
                                {item.skillType && (
                                  <span>Category: {item.category} • Type: {item.skillType}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#C82333] shrink-0">
                            <span>Open</span>
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Press <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">ESC</kbd> to close</span>
            <span>dLMS Direct Platform Search</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getItemIcon(type: string) {
  switch (type) {
    case "course":
      return <BookOpen className="h-3.5 w-3.5" />;
    case "module":
      return <Layers className="h-3.5 w-3.5" />;
    case "lesson":
      return <FileText className="h-3.5 w-3.5" />;
    case "quiz":
      return <HelpCircle className="h-3.5 w-3.5" />;
    case "assignment":
      return <Paperclip className="h-3.5 w-3.5" />;
    case "event":
      return <Calendar className="h-3.5 w-3.5" />;
    case "skill":
      return <Sparkles className="h-3.5 w-3.5" />;
    case "category":
      return <Folder className="h-3.5 w-3.5" />;
    default:
      return <BookOpen className="h-3.5 w-3.5" />;
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
