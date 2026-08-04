"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/courses/${params.id}/preview`);
    } else {
      router.replace("/courses");
    }
  }, [params, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        <p className="text-xs text-slate-500 font-medium">Loading Course Experience...</p>
      </div>
    </div>
  );
}
