"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, loading, children }) => {
  if (loading) {
    return (
      <Card className="border border-border/80 bg-card shadow-sm">
        <CardHeader className="p-4 pb-2">
          <Skeleton className="h-4 w-40 mb-1" />
          <Skeleton className="h-3 w-60" />
        </CardHeader>
        <CardContent className="p-4 pt-0 h-64 flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 bg-card shadow-sm hover:border-primary/30 transition-all duration-200">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold tracking-tight text-foreground">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="p-4 pt-2 h-64">{children}</CardContent>
    </Card>
  );
};

// 1. Status Donut / Pie Chart Component
export const StatusPieChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
  const filteredData = data.filter((d) => d.value > 0);
  if (!data || filteredData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        No status distribution data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

// 2. Bar Chart Component (e.g. Top Courses, Department Comparison)
export const SimpleBarChart: React.FC<{
  data: any[];
  xKey: string;
  yKey: string;
  fillColor?: string;
  unit?: string;
}> = ({ data, xKey, yKey, fillColor = "#3b82f6", unit = "" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        No comparative data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10 }}
          interval={0}
          angle={-15}
          textAnchor="end"
        />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          formatter={(value: any) => [`${value}${unit}`, "Metric"]}
          contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey={yKey} fill={fillColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// 3. Area / Line Trend Chart
export const TrendAreaChart: React.FC<{
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
}> = ({ data, xKey, yKey, color = "#10b981" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        No trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Area type="monotone" dataKey={yKey} stroke={color} fillOpacity={1} fill={`url(#gradient-${yKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
};
