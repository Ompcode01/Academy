"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  FolderTree,
  Route,
  BarChart3,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Organization", href: "/organization", icon: Building2 },
  { label: "Users", href: "/users", icon: Users },
  {
    label: "Courses",
    icon: GraduationCap,
    children: [
      { label: "All Courses", href: "/courses" },
      { label: "Categories", href: "/courses/categories" },
      { label: "Learning Paths", href: "/courses/learning-paths" },
    ],
  },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Darwinbox Sync", href: "/darwinbox-sync", icon: RefreshCw },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Courses"]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((child) => pathname.startsWith(child.href));
    }
    return isActive(item.href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-tight tracking-wide text-white">
            HARBINGER
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
            Academy LMS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const expanded = expandedItems.includes(item.label);
          const active = isParentActive(item);

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? "bg-sidebar-primary text-white"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  ) : (
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  )}
                </button>
                {expanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-4">
                    {item.children.map((child) => {
                      const childActive =
                        child.href === "/courses"
                          ? pathname === "/courses" ||
                            pathname.startsWith("/courses/create")
                          : pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block rounded-md px-3 py-2 text-[13px] transition-all duration-150 ${
                            childActive
                              ? "bg-sidebar-primary/20 font-medium text-sidebar-primary"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                active
                  ? "bg-sidebar-primary text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
