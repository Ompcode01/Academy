"use client";

import { Suspense } from "react";
import CoursePreviewView from "@/components/courses/CoursePreviewView";
import { RefreshCw } from "lucide-react";

export default function CoursePreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-3 text-center bg-slate-50 dark:bg-slate-950">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Loading course preview...</p>
        </div>
      }
    >
      <CoursePreviewView />
    </Suspense>
  );
}

