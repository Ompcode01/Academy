"use client";

import React from "react";
import {
  FileText,
  Download,
  Maximize2,
  Presentation,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStorageUrl } from "@/services/api/course.service";

interface InteractiveDocViewerProps {
  title: string;
  contentType: string; // "PDF" | "PPT" | "DOCUMENT" etc.
  contentUrl?: string;
  description?: string;
}

/**
 * Returns a same-origin path for embedding files in iframes.
 * Uses Next.js rewrite proxy: /storage/* → http://localhost:5000/storage/*
 * This avoids cross-origin iframe issues that break PDF/document viewing.
 */
function getSameOriginPath(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // If it's already a relative path starting with /storage/, use it directly
  if (trimmed.startsWith("/storage/")) return trimmed;

  // If it's a full backend URL like http://localhost:5000/storage/..., extract the path
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/storage/")) {
      return parsed.pathname;
    }
  } catch {
    // Not a valid URL
  }

  // Prepend /storage/ if it's just a filename or relative path
  return `/storage/${trimmed.replace(/^\/+/, "")}`;
}

export default function InteractiveDocViewer({
  title,
  contentType,
  contentUrl,
  description,
}: InteractiveDocViewerProps) {
  const hasCustomUrl = Boolean(contentUrl && contentUrl.trim() !== "");
  const [pdfCheckState, setPdfCheckState] = React.useState<"loading" | "found" | "notfound">("loading");

  const isPpt =
    contentType === "PPT" ||
    contentType === "PPTX" ||
    (contentUrl && contentUrl.toLowerCase().match(/\.(ppt|pptx)$/i));
  const isPdf =
    contentType === "PDF" ||
    (contentUrl && contentUrl.toLowerCase().includes(".pdf"));
  const isArticle = contentType === "ARTICLE" || (!contentUrl && Boolean(description && !isPpt && !isPdf));

  // Determine if the description is JSON slide data (so we don't display it as text)
  let descriptionIsSlideJson = false;
  if (isPpt && description) {
    try {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].heading !== undefined) {
        descriptionIsSlideJson = true;
      }
    } catch {
      // Not JSON
    }
  }
  const plainDescription = descriptionIsSlideJson ? null : description;

  // Build the converted PDF path for PPTX files
  // Backend saves converted PDFs as: original-name.converted.pdf
  const convertedPdfPath = React.useMemo(() => {
    if (!isPpt || !contentUrl) return null;
    const trimmed = contentUrl.trim();
    // Replace .pptx/.ppt extension with .converted.pdf
    const pdfPath = trimmed.replace(/\.(pptx?|PPTX?)$/i, ".converted.pdf");
    return getSameOriginPath(pdfPath);
  }, [isPpt, contentUrl]);

  // Check if the converted PDF exists
  React.useEffect(() => {
    if (!isPpt || !convertedPdfPath) {
      setPdfCheckState("notfound");
      return;
    }

    const checkPdf = async () => {
      try {
        const resp = await fetch(convertedPdfPath, { method: "HEAD" });
        setPdfCheckState(resp.ok ? "found" : "notfound");
      } catch {
        setPdfCheckState("notfound");
      }
    };
    checkPdf();
  }, [isPpt, convertedPdfPath]);

  // Same-origin path for iframe embedding (uses Next.js rewrite proxy)
  const sameOriginPath = hasCustomUrl
    ? getSameOriginPath(contentUrl)
    : isPdf
    ? "/storage/sample_course_manual.pdf"
    : "/storage/sample_presentation.pptx";

  // Full backend URL for downloads (direct access)
  const downloadUrl = hasCustomUrl
    ? getStorageUrl(contentUrl)
    : isPdf
    ? getStorageUrl("/storage/sample_course_manual.pdf")
    : getStorageUrl("/storage/sample_presentation.pptx");

  // Determine the iframe source
  const iframeSrc = React.useMemo(() => {
    if (isPdf) {
      // PDF: embed directly via same-origin path (browser renders natively)
      return `${sameOriginPath}#page=1`;
    }
    if (isPpt) {
      // PPT: use the converted PDF if available
      if (pdfCheckState === "found" && convertedPdfPath) {
        return `${convertedPdfPath}#page=1`;
      }
      // Fallback: try Google Docs viewer for remote URLs
      if (!sameOriginPath.includes("localhost") && !sameOriginPath.includes("127.0.0.1")) {
        return `https://docs.google.com/gview?url=${encodeURIComponent(getStorageUrl(contentUrl))}&embedded=true`;
      }
      return null; // No viewable source available
    }
    return `${sameOriginPath}#page=1`;
  }, [isPdf, isPpt, pdfCheckState, convertedPdfPath, sameOriginPath, contentUrl]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${title.replace(/\s+/g, "_")}${isPpt ? ".pptx" : ".pdf"}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isArticle) {
    return (
      <div className="w-full space-y-4">
        {/* Article Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border border-border rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold text-[10px] uppercase">
              <FileText className="h-3.5 w-3.5 mr-1 inline" /> Text Article
            </Badge>
            <span className="font-semibold text-muted-foreground">Reading Material</span>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">Estimated Read: 5-10 mins</span>
        </div>

        {/* Article Content Card */}
        <div className="p-8 bg-card border border-border rounded-2xl shadow-sm space-y-6 max-h-[500px] overflow-y-auto scrollbar-thin">
          <div className="border-b border-border pb-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-foreground whitespace-pre-line space-y-4">
            {description || "No additional text content provided for this article."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 select-none">
      {/* ── Top Header Toolbar ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs backdrop-blur-md shadow-md">
        {/* Left: Document Type Badge & Title */}
        <div className="flex items-center gap-2.5">
          {isPpt ? (
            <Badge className="bg-amber-500 text-slate-950 border border-amber-500/30 gap-1 font-extrabold text-[10px] uppercase">
              <Presentation className="h-3.5 w-3.5" /> PPT Presentation
            </Badge>
          ) : (
            <Badge className="bg-red-500 text-white border border-red-500/30 gap-1 font-extrabold text-[10px] uppercase">
              <FileText className="h-3.5 w-3.5" /> PDF Document
            </Badge>
          )}
          <span className="font-bold text-slate-200 truncate max-w-xs md:max-w-md">
            {title}
          </span>
        </div>

        {/* Right: Download & Fullscreen Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleDownload}
            className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-1.5 cursor-pointer shadow-md"
            title="Download original file"
          >
            <Download className="h-3.5 w-3.5" /> Download {isPpt ? "PPT" : "PDF"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(downloadUrl, "_blank")}
            className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer"
            title="Open file in new tab"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
          </Button>
        </div>
      </div>

      {/* ── Main Viewport Container ────── */}
      <div className="w-full space-y-3">
        {isPpt && pdfCheckState === "loading" ? (
          /* Loading state while checking for converted PDF */
          <div className="w-full h-[620px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-slate-400">
              <div className="h-10 w-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Loading presentation...</p>
            </div>
          </div>
        ) : iframeSrc ? (
          /* PDF or converted PPT → PDF embedded in iframe */
          <div className="w-full h-[620px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <iframe
              src={iframeSrc}
              className="w-full h-full border-0 bg-white"
              title={title}
            />
          </div>
        ) : (
          /* PPT fallback when no converted PDF is available */
          <div className="w-full h-[620px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center p-8 text-center text-white space-y-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Presentation className="h-12 w-12" />
            </div>

            <div className="space-y-3 max-w-lg">
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-extrabold px-3 py-1">
                PowerPoint Presentation
              </Badge>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed flex items-center justify-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                Preview not available — please download or open the file to view the full presentation.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button
                onClick={() => window.open(downloadUrl, "_blank")}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-2 px-7 h-11 shadow-lg cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" /> Open Presentation
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 font-semibold text-xs gap-2 px-5 h-11 cursor-pointer"
              >
                <Download className="h-4 w-4 text-amber-400" /> Download File
              </Button>
            </div>
          </div>
        )}

        {/* Only show Admin Lesson Notes if the description is actual text, not JSON slide data */}
        {plainDescription && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
            <strong className="text-white block font-bold">Admin Lesson Notes:</strong>
            <p className="leading-relaxed">{plainDescription}</p>
          </div>
        )}
      </div>
    </div>
  );
}
