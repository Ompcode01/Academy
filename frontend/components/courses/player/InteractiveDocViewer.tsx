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
  const [currentSlideIdx, setCurrentSlideIdx] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<"SLIDES" | "EMBED">("SLIDES");

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
        <div className="p-8 bg-card border border-border rounded-2xl shadow-sm space-y-6">
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

    // Default generated presentation slides if no structured JSON was saved
    if (!slides || slides.length === 0) {
      slides = [
        {
          slideNum: 1,
          tag: "Executive Overview",
          heading: title || "Course Presentation Deck",
          subheading: "Interactive Training Material",
          bullets: [
            description || "Key domain concepts, architectural models, and practical guidelines.",
            "Review each slide carefully to understand the core subject matter.",
            "Click Next Slide or download the full PPTX presentation below.",
          ],
        },
        {
          slideNum: 2,
          tag: "Core Concepts & Architecture",
          heading: "Key Takeaways & Modules",
          subheading: "Structured Learning Framework",
          bullets: [
            "Modular architecture designed for enterprise scalability and reliability.",
            "Best practices for implementation, code quality, and security standards.",
            "Real-world application scenarios and hands-on exercises.",
          ],
        },
        {
          slideNum: 3,
          tag: "Summary & Action Items",
          heading: "Review & Knowledge Check",
          subheading: "Next Steps in Curriculum",
          bullets: [
            "Complete associated quizzes and assignments in this module.",
            "Download original presentation file for offline study.",
            "Proceed to next lesson upon completing slide review.",
          ],
        },
      ];
    }
  }

  // Resolved URL (fallback to local sample file if empty)
  const hasCustomUrl = Boolean(contentUrl && contentUrl.trim() !== "");
  const resolvedTargetUrl = hasCustomUrl
    ? getStorageUrl(contentUrl)
    : isPdf
    ? getStorageUrl("/storage/sample_course_manual.pdf")
    : getStorageUrl("/storage/sample_presentation.pptx");

  // Determine iframe source URL for PDF vs PPT
  const isLocalHost = resolvedTargetUrl.includes("localhost") || resolvedTargetUrl.includes("127.0.0.1");
  const iframeSrc = isPdf
    ? `${resolvedTargetUrl}#page=1`
    : isLocalHost
    ? resolvedTargetUrl
    : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedTargetUrl)}`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = resolvedTargetUrl;
    a.download = `${title.replace(/\s+/g, "_")}${isPpt ? ".pptx" : ".pdf"}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isPpt && viewMode === "SLIDES" && slides && slides.length > 0) {
    const slide = slides[currentSlideIdx] || slides[0];
    return (
      <div className="w-full space-y-3 select-none">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs backdrop-blur-md shadow-md">
          <div className="flex items-center gap-2.5">
            <Badge className="bg-amber-500 text-slate-950 border border-amber-500/30 gap-1 font-extrabold text-[10px] uppercase">
              <Presentation className="h-3.5 w-3.5" /> Interactive PPT Presentation
            </Badge>
            <span className="font-bold text-slate-200 truncate max-w-xs md:max-w-md">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode(viewMode === "SLIDES" ? "EMBED" : "SLIDES")}
              className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Toggle Embed View
            </Button>

            <Button
              size="sm"
              onClick={handleDownload}
              className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="h-3.5 w-3.5" /> Download PPTX
            </Button>
          </div>
        </div>

        {/* Presentation Slide Card */}
        <div className="w-full min-h-[460px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-8 text-white bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
          {/* Top Info */}
          <div className="flex justify-between items-center text-xs">
            <span className="px-3 py-1 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold tracking-wider">
              {slide.tag || `Slide ${currentSlideIdx + 1}`}
            </span>
            <span className="font-semibold text-slate-400">
              Slide {currentSlideIdx + 1} of {slides.length}
            </span>
          </div>

          {/* Slide Content Body */}
          <div className="flex-1 flex flex-col justify-center my-6 space-y-4">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
              {slide.heading}
            </h2>
            {slide.subheading && (
              <h3 className="text-sm md:text-base font-semibold text-amber-400">
                {slide.subheading}
              </h3>
            )}
            <div className="pt-2 space-y-2">
              {slide.bullets && slide.bullets.length > 0 ? (
                slide.bullets.map((bullet: string, bIdx: number) => (
                  <div key={bIdx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-300">
                    <span className="text-amber-500 font-extrabold mt-1">•</span>
                    <p className="leading-relaxed">{bullet}</p>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center border-t border-slate-800/60 pt-4 gap-2 flex-wrap">
            <Button
              disabled={currentSlideIdx === 0}
              onClick={() => setCurrentSlideIdx((prev) => prev - 1)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9 cursor-pointer"
            >
              &larr; Previous Slide
            </Button>
            <div className="flex gap-1.5 overflow-x-auto py-1 max-w-[200px] sm:max-w-xs md:max-w-md">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIdx(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlideIdx ? "w-6 bg-amber-500" : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
            <Button
              disabled={currentSlideIdx === slides.length - 1}
              onClick={() => setCurrentSlideIdx((prev) => prev + 1)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 cursor-pointer"
            >
              Next Slide &rarr;
            </Button>
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

        {/* Right: Voluntary Download & View Mode Actions */}
        <div className="flex items-center gap-2">
          {isPpt && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode(viewMode === "SLIDES" ? "EMBED" : "SLIDES")}
              className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer"
            >
              <Presentation className="h-3.5 w-3.5" /> Slides View
            </Button>
          )}

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
        <div className="w-full h-[620px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <iframe
            src={iframeSrc}
            className="w-full h-full border-0 bg-white"
            title={title}
          />
        </div>
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
