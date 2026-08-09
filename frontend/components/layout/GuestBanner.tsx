"use client";

import React from "react";
import { Eye, Lock, ShieldAlert, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";

export default function GuestBanner() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  if (user?.role !== "GUEST") return null;

  const handleSwitchAccount = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2 text-xs select-none shadow-md flex items-center justify-between z-40 border-b border-amber-500/30 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 font-medium">
        <span className="flex h-5 px-2 items-center justify-center rounded bg-amber-900/60 border border-amber-400/40 text-[10px] font-bold tracking-wider uppercase">
          <Eye className="h-3 w-3 mr-1" />
          Guest Preview Mode
        </span>
        <span className="hidden md:inline text-amber-100">
          You are exploring the LMS in read-only preview mode. Video streaming, quizzes, assignment submissions, and progress tracking are locked.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSwitchAccount}
          className="flex items-center gap-1 bg-white text-amber-900 hover:bg-amber-100 px-2.5 py-1 rounded font-semibold text-[11px] transition-all shadow-sm cursor-pointer"
        >
          <span>Sign In as Learner</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
