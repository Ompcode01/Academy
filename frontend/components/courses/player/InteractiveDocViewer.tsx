"use client";

import React from "react";
import {
  FileText,
  Download,
  Maximize2,
  Presentation,
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

export default function InteractiveDocViewer({
  title,
  contentType,
  contentUrl,
  description,
}: InteractiveDocViewerProps) {
  const hasCustomUrl = Boolean(contentUrl && contentUrl.trim() !== "");
  const [currentSlideIdx, setCurrentSlideIdx] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<"EMBED">("EMBED");

  const isPpt =
    contentType === "PPT" ||
    contentType === "PPTX" ||
    (contentUrl && contentUrl.toLowerCase().match(/\.(ppt|pptx)$/i));
  const isPdf =
    contentType === "PDF" ||
    (contentUrl && contentUrl.toLowerCase().includes(".pdf"));
  const isArticle = contentType === "ARTICLE" || (!contentUrl && Boolean(description && !isPpt && !isPdf));

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

  // Check if description contains extracted slides JSON or text notes
  let slides: any[] | null = null;
  if (isPpt) {
    if (description) {
      try {
        const parsed = JSON.parse(description);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].heading !== undefined) {
          slides = parsed;
        }
      } catch (e) {
        // Not JSON slides array
      }
    }

    // Build presentation slides strictly using Admin uploaded title and description
    if (!slides || slides.length === 0) {
      slides = [
        {
          slideNum: 1,
          tag: "Admin Presentation Deck",
          heading: title || "Uploaded Presentation",
          subheading: contentUrl ? `Source File: ${contentUrl.split("/").pop()}` : "Course Learning Material",
          bullets: [
            description || "Uploaded PowerPoint presentation module.",
            "Use the View/Download button below to open the complete original PPTX file.",
          ],
        },
      ];
    }
  }

  // Resolved URL (fallback to local sample file if empty)
  const resolvedTargetUrl = hasCustomUrl
    ? getStorageUrl(contentUrl)
    : isPdf
    ? getStorageUrl("/storage/sample_course_manual.pdf")
    : getStorageUrl("/storage/sample_presentation.pptx");

  // Determine iframe source URL for PDF vs PPT
  const isLocalHost = resolvedTargetUrl.includes("localhost") || resolvedTargetUrl.includes("127.0.0.1");
  const iframeSrc = isPdf
    ? `${resolvedTargetUrl}#page=1`
    : `https://docs.google.com/gview?url=${encodeURIComponent(resolvedTargetUrl)}&embedded=true`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = resolvedTargetUrl;
    a.download = `${title.replace(/\s+/g, "_")}${isPpt ? ".pptx" : ".pdf"}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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

        {/* Right: Voluntary Download & View Mode Actions */}
        <div className="flex items-center gap-2">


          <Button
            size="sm"
            onClick={handleDownload}
            className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-1.5 cursor-pointer shadow-md"
            title="Download Admin uploaded file"
          >
            <Download className="h-3.5 w-3.5" /> Download Document
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(resolvedTargetUrl, "_blank")}
            className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer"
            title="Open file in new tab"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
          </Button>
        </div>
      </div>

      {/* ── Main Viewport Container ────── */}
      <div className="w-full space-y-3">
        {isPpt && isLocalHost ? (
          <div className="w-full h-[620px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center p-8 text-center text-white space-y-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Presentation className="h-12 w-12" />
            </div>

            <div className="space-y-2 max-w-lg">
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-extrabold px-3 py-1">
                Admin Uploaded PowerPoint File ({contentUrl ? contentUrl.split("/").pop() : "sample3.ppt"})
              </Badge>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{title}</h2>
              {description && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                  {description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button
                onClick={() => window.open(resolvedTargetUrl, "_blank")}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-2 px-7 h-11 shadow-lg cursor-pointer"
              >
                <Maximize2 className="h-4 w-4" /> Open Actual Uploaded File ({contentUrl ? contentUrl.split("/").pop() : "sample3.ppt"})
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 font-semibold text-xs gap-2 px-5 h-11 cursor-pointer"
              >
                <Download className="h-4 w-4 text-amber-400" /> Download Presentation File
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full h-[620px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <iframe
              src={iframeSrc}
              className="w-full h-full border-0 bg-white"
              title={title}
            />
          </div>
        )}

        {description && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
            <strong className="text-white block font-bold">Admin Lesson Notes:</strong>
            <p className="leading-relaxed">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
