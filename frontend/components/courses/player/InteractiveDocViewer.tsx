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

  const isPpt =
    contentType === "PPT" ||
    (contentUrl && contentUrl.toLowerCase().match(/\.(ppt|pptx)$/));
  const isPdf =
    contentType === "PDF" ||
    (contentUrl && contentUrl.toLowerCase().includes(".pdf"));

  // Check if description contains extracted slides JSON
  let slides: any[] | null = null;
  if (isPpt && description) {
    try {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].slideNum !== undefined) {
        slides = parsed;
      }
    } catch (e) {
      // Ignore parsing error, fall back to standard viewer
    }
  }

  // Resolved URL (fallback to local sample file if empty)
  const hasCustomUrl = Boolean(contentUrl && contentUrl.trim() !== "");
  const resolvedTargetUrl = hasCustomUrl
    ? getStorageUrl(contentUrl)
    : isPdf
    ? getStorageUrl("/storage/sample_course_manual.pdf")
    : getStorageUrl("/storage/sample_presentation.pptx");

  // Determine iframe source URL
  const iframeSrc = isPdf
    ? `${resolvedTargetUrl}#page=1`
    : resolvedTargetUrl.startsWith("http://localhost") || resolvedTargetUrl.startsWith("http://127.0.0.1")
    ? resolvedTargetUrl
    : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(resolvedTargetUrl)}`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = resolvedTargetUrl;
    a.download = `${title.replace(/\s+/g, "_")}${isPpt ? ".pptx" : ".pdf"}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (slides && slides.length > 0) {
    const slide = slides[currentSlideIdx];
    return (
      <div className="w-full space-y-3 select-none">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs backdrop-blur-md shadow-md">
          <div className="flex items-center gap-2.5">
            <Badge className="bg-amber-500 text-slate-950 border border-amber-500/30 gap-1 font-extrabold text-[10px] uppercase">
              <Presentation className="h-3.5 w-3.5" /> Interactive PPT Slideshow
            </Badge>
            <span className="font-bold text-slate-200 truncate max-w-xs md:max-w-md">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleDownload}
              className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="h-3.5 w-3.5" /> Download PPTX
            </Button>
          </div>
        </div>

        {/* Carousel Slide Card */}
        <div className="w-full min-h-[480px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-8 text-white bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
          {/* Top Info */}
          <div className="flex justify-between items-center text-xs">
            <span className="px-2.5 py-1 rounded-md bg-white/10 font-bold tracking-wider text-slate-300">
              {slide.tag || `Slide ${slide.slideNum}`}
            </span>
            <span className="font-semibold text-slate-400">
              {currentSlideIdx + 1} / {slides.length}
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
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9"
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
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9"
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

        {/* Right: Voluntary Download & Fullscreen Actions */}
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

      {/* ── Main Viewport Container (Renders Document Directly) ────── */}
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
