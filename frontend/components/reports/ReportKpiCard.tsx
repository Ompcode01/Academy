"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface ReportKpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  variant?: "emerald" | "blue" | "indigo" | "amber" | "rose" | "purple" | "cyan";
  loading?: boolean;
}

const variantStyles = {
  emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  cyan: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

export const ReportKpiCard: React.FC<ReportKpiCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  variant = "blue",
  loading = false,
}) => {
  if (loading) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-4 flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 bg-card hover:border-primary/40 transition-all duration-200 shadow-sm">
      <CardContent className="p-4 flex items-center space-x-4">
        <div className={`p-3 rounded-xl border ${variantStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground truncate">{value}</h3>
          </div>
          {subtext && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
};
