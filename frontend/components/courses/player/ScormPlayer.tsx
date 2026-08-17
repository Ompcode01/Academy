"use client";

import React, { useEffect, useRef, useState } from "react";
import { Archive, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStorageUrl } from "@/services/api/course.service";

interface ScormPlayerProps {
  title: string;
  contentUrl?: string;
  onComplete?: () => void;
  height?: string;
  isPreview?: boolean;
}

/**
 * Normalizes content URL to a same-origin relative path (/storage/...)
 * so the iframe shares the exact same origin as the Next.js frontend (localhost:3000).
 */
function getSameOriginPath(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  if (trimmed.startsWith("/storage/")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/storage/")) {
      return parsed.pathname;
    }
  } catch {
    // Relative path without leading slash
  }

  return `/storage/${trimmed.replace(/^\/+/, "")}`;
}

export default function ScormPlayer({
  title,
  contentUrl,
  onComplete,
  height = "650px",
  isPreview = false,
}: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [scormVersion, setScormVersion] = useState<"1.2" | "2004" | "Initialized">("Initialized");

  const sameOriginUrl = getSameOriginPath(contentUrl);
  const fullDownloadUrl = getStorageUrl(contentUrl);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Internal data model store for SCORM key-values
    const cmiStore: Record<string, string> = {
      "cmi.core.lesson_status": "not attempted",
      "cmi.completion_status": "not attempted",
      "cmi.success_status": "unknown",
      "cmi.core.student_id": "101",
      "cmi.learner_id": "101",
      "cmi.core.student_name": "Learner",
      "cmi.learner_name": "Learner",
      "cmi.core.credit": "credit",
      "cmi.credit": "credit",
      "cmi.core.lesson_mode": "normal",
      "cmi.mode": "normal",
      "cmi.core.entry": "ab-initio",
      "cmi.entry": "ab-initio",
      "cmi.core.score.raw": "0",
      "cmi.score.raw": "0",
      "cmi.score.scaled": "0",
    };

    const handleCompletionCheck = (element: string, value: string) => {
      const valLower = (value || "").toLowerCase();
      if (
        (element.includes("lesson_status") || element.includes("completion_status") || element.includes("success_status")) &&
        (valLower === "completed" || valLower === "passed")
      ) {
        setIsCompleted(true);
        if (onComplete && !isPreview) {
          onComplete();
        }
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SCORM 1.2 LMS API Adapter
    // ─────────────────────────────────────────────────────────────────────────
    const API_1_2 = {
      LMSInitialize: (_param: string) => {
        setScormVersion("1.2");
        return "true";
      },
      LMSFinish: (_param: string) => {
        return "true";
      },
      LMSGetValue: (element: string) => {
        return cmiStore[element] || "";
      },
      LMSSetValue: (element: string, value: string) => {
        cmiStore[element] = String(value);
        handleCompletionCheck(element, String(value));
        return "true";
      },
      LMSCommit: (_param: string) => {
        return "true";
      },
      LMSGetLastError: () => "0",
      LMSGetErrorString: (_errorCode: string) => "No error",
      LMSGetDiagnostic: (_errorCode: string) => "No error",
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SCORM 2004 LMS API Adapter
    // ─────────────────────────────────────────────────────────────────────────
    const API_2004 = {
      Initialize: (_param: string) => {
        setScormVersion("2004");
        return "true";
      },
      Terminate: (_param: string) => {
        return "true";
      },
      GetValue: (element: string) => {
        return cmiStore[element] || "";
      },
      SetValue: (element: string, value: string) => {
        cmiStore[element] = String(value);
        handleCompletionCheck(element, String(value));
        return "true";
      },
      Commit: (_param: string) => {
        return "true";
      },
      GetLastError: () => "0",
      GetErrorString: (_errorCode: string) => "No error",
      GetDiagnostic: (_errorCode: string) => "No error",
    };

    // Attach SCORM API objects to window and parent window
    (window as any).API = API_1_2;
    (window as any).API_1484_11 = API_2004;

    // Attach to top window if accessible
    try {
      if (window.top && window.top !== window) {
        (window.top as any).API = API_1_2;
        (window.top as any).API_1484_11 = API_2004;
      }
    } catch {
      // Cross-origin top window guard
    }

    // Also attach to frame window once loaded
    const injectIntoFrame = () => {
      try {
        const frameWin = iframeRef.current?.contentWindow;
        if (frameWin) {
          (frameWin as any).API = API_1_2;
          (frameWin as any).API_1484_11 = API_2004;
        }
      } catch {
        // Guard if iframe is cross-origin
      }
    };

    const iframeElem = iframeRef.current;
    if (iframeElem) {
      iframeElem.addEventListener("load", injectIntoFrame);
    }

    return () => {
      if (iframeElem) {
        iframeElem.removeEventListener("load", injectIntoFrame);
      }
    };
  }, [onComplete, isPreview]);

  return (
    <div className="w-full space-y-2 select-none">
      {/* SCORM Control Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Badge className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-[10px] uppercase gap-1">
            <Archive className="h-3.5 w-3.5" /> SCORM {scormVersion} Package
          </Badge>
          {isCompleted && (
            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 font-bold text-[10px]">
              <CheckCircle2 className="h-3 w-3" /> SCORM Status: Completed
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {sameOriginUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(sameOriginUrl, "_blank")}
              className="h-7 text-[11px] font-medium border-border text-foreground hover:bg-muted gap-1"
            >
              <ExternalLink className="h-3 w-3" /> Open in New Tab
            </Button>
          )}
        </div>
      </div>

      {/* Embedded SCORM Viewport */}
      <div
        className="w-full bg-card rounded-xl overflow-hidden border border-border shadow-md relative"
        style={{ height }}
      >
        <iframe
          ref={iframeRef}
          src={sameOriginUrl}
          className="w-full h-full border-0 bg-white"
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
