"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Award,
  BookOpen,
  Users,
  Download,
  Calendar,
} from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Reports &amp; Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor learning performance, audit completion metrics, and export data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Analytics highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Certifications
            </CardTitle>
            <Award className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">148</div>
            <p className="text-xs text-muted-foreground mt-1">
              +14% completed this week
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">84%</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2% overall test score growth
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Study Time (Average)
            </CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.2 Hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              Spent per active learner/week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rates by Course */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Course Completion Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { course: "Java Fundamentals", enrollments: 125, rate: 82, badge: "technical" },
            { course: "Leadership Essentials", enrollments: 78, rate: 68, badge: "management" },
            { course: "Effective Communication", enrollments: 93, rate: 45, badge: "soft-skills" },
            { course: "Data Structures in Java", enrollments: 64, rate: 12, badge: "technical" },
            { course: "HR Compliance Basics", enrollments: 40, rate: 95, badge: "hr" },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5 p-3 rounded-lg border border-border/40 hover:bg-muted/10 transition-colors">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{item.course}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {item.enrollments} enrolled • {item.rate}% complete
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary rounded-r"
                  style={{ width: `${item.rate}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
