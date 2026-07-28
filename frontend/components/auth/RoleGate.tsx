"use client";

import React from "react";
import { useAuthStore } from "@/store/auth.store";
import { hasRole } from "@/lib/rbac";

interface RoleGateProps {
  allowed: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGate({
  allowed,
  children,
  fallback = null,
}: RoleGateProps) {
  const user = useAuthStore((state) => state.user);

  if (!user || !hasRole(user.role, ...allowed)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
