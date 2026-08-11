"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Calendar, Layout, Users, TrendingUp, Settings, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { ROLES } from "@/lib/rbac";

interface SecondaryNavProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function SecondaryNav({ isSidebarOpen, onToggleSidebar }: SecondaryNavProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const userRole = user?.role;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Courses", href: "/courses", icon: GraduationCap },
    { label: "Events", href: "/events", icon: Calendar },
  ];

  if (userRole === ROLES.SUPER_ADMIN) {
    navItems.push(
      { label: "Users", href: "/users", icon: Users },
      { label: "Reports", href: "/reports", icon: TrendingUp },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck },
      { label: "Settings", href: "/settings", icon: Settings }
    );
  } else if (userRole === ROLES.ADMIN) {
    navItems.push(
      { label: "Users", href: "/users", icon: Users },
      { label: "Reports", href: "/reports", icon: TrendingUp },
      { label: "Settings", href: "/settings", icon: Settings }
    );
  } else if (userRole === ROLES.TEACHER) {
    navItems.push(
      { label: "Reports", href: "/reports", icon: TrendingUp }
    );
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-12 w-full items-center justify-between border-b border-[#E0E6ED] bg-[#FCF8F8] px-6 py-2 select-none">
      {/* Left Links */}
      <div className="flex items-center gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 text-xs font-semibold tracking-wide transition-colors py-1 border-b-2 ${
                active
                  ? "border-[#C82333] text-[#C82333]"
                  : "border-transparent text-[#6C757D] hover:text-[#212529]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right Control */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="flex items-center gap-1.5 rounded border border-[#E0E6ED] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6C757D] shadow-sm hover:bg-[#F4F7F9] hover:text-[#212529] transition-all cursor-pointer"
        >
          <Layout className="h-3.5 w-3.5" />
          <span>{isSidebarOpen ? "Standard view" : "Full screen view"}</span>
        </button>
      </div>
    </div>
  );
}
