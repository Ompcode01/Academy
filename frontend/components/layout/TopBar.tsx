"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Search, Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const username = user?.username || "Guest User";
  const initials = getInitials(username);
  const userRole = user?.role || "GUEST";

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-red-500/10 text-red-600 border-red-500/20",
    ADMIN: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    TEACHER: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    LEARNER: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    GUEST: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-6 shrink-0">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search courses..."
          className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{username}</p>
            <div className="mt-1 flex items-center gap-1">
              <Badge variant="outline" className={`text-[10px] px-1 py-0 font-medium capitalize border ${roleColors[userRole] || roleColors.GUEST}`}>
                {userRole.toLowerCase().replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-border" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
