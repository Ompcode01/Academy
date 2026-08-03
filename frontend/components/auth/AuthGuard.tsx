"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Show a minimal loader while session hydrates from localStorage
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EBF5F8] text-[#212529]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#C82333] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#6C757D]">Loading...</p>
        </div>
      </div>
    );
  }

  // Simple, clean Login Required view for unauthenticated access
  if (!isAuthenticated || !token || !user) {
    return (
      <div className="min-h-screen w-full bg-[#EBF5F8] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E0E6ED] p-6 shadow-sm text-center space-y-4">
          {/* Lock Icon */}
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-[#C82333] flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>

          {/* Title & Description */}
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-[#212529]">Please Log In First</h1>
            <p className="text-xs text-[#6C757D]">
              You must log in to view academy courses and dashboard content.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-[#C82333] hover:bg-[#A71D2A] text-white text-xs font-semibold h-10 gap-2 cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Go to Login Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
