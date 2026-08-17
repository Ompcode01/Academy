"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getStorageUrl } from "@/services/api/course.service";

export interface SlideItem {
  slideNum: number;
  tag?: string;
  heading: string;
  subheading?: string;
  bullets?: string[];
  color?: string;
}

interface InteractivePptViewerProps {
  title: string;
  contentUrl?: string;
  description?: string;
  convertedPdfUrl?: string;
  onComplete?: () => void;
}

export default function InteractivePptViewer({
  title,
  contentUrl,
  description,
  convertedPdfUrl,
  onComplete,
}: InteractivePptViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse slide data from description JSON if available, or generate a structured slide deck
  const slides: SlideItem[] = React.useMemo(() => {
    if (description) {
      try {
        const parsed = JSON.parse(description);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].heading !== undefined) {
          return parsed.map((s: any, idx: number) => ({
            slideNum: s.slideNum || idx + 1,
            tag: s.tag || `Slide ${idx + 1}`,
            heading: s.heading || `Slide ${idx + 1}`,
            subheading: s.subheading || "",
            bullets: Array.isArray(s.bullets) ? s.bullets : [],
            color: s.color || "from-slate-900 via-slate-900 to-slate-950 border-amber-500/30",
          }));
        }
      } catch {
        // Not JSON
      }
    }

    // Fallback: Build structured presentation slides from title & text notes
    const rawLines = (description || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const bulletsFromDesc = rawLines.length > 0
      ? rawLines
      : [
          "Overview of core concepts and objectives",
          "Key principles and practical applications",
          "Best practices and standard operating procedures",
          "Summary and evaluation checklist",
        ];

    return [
      {
        slideNum: 1,
        tag: "Introduction",
        heading: title,
        subheading: "Course Training Presentation",
        bullets: [
          "Welcome to this interactive presentation module.",
          "Use the Previous (<) and Next (>) buttons or your Arrow Keys to navigate.",
          "Click the Play button to start automatic slideshow mode.",
        ],
        color: "from-amber-500/20 via-slate-900 to-slate-950 border-amber-500/40",
      },
      {
        slideNum: 2,
        tag: "Key Takeaways",
        heading: "Core Objectives & Learning Outcomes",
        subheading: "Mastering Domain Principles",
        bullets: bulletsFromDesc.slice(0, 4),
        color: "from-blue-500/20 via-slate-900 to-slate-950 border-blue-500/40",
      },
      {
        slideNum: 3,
        tag: "Workflow Analysis",
        heading: "Implementation Framework",
        subheading: "Step-by-Step Methodology",
        bullets: bulletsFromDesc.length > 4 ? bulletsFromDesc.slice(4, 8) : [
          "1. Review fundamental prerequisites",
          "2. Execute guided practice tasks",
          "3. Perform quality assurance checks",
          "4. Apply knowledge to real-world scenarios",
        ],
        color: "from-emerald-500/20 via-slate-900 to-slate-950 border-emerald-500/40",
      },
      {
        slideNum: 4,
        tag: "Best Practices",
        heading: "Industry Standards & Best Practices",
        subheading: "Ensuring Excellence",
        bullets: [
          "Maintain clear documentation and standard logs",
          "Follow security, compliance, and governance guidelines",
          "Collaborate with team leads and domain experts",
          "Continuous review and performance evaluation",
        ],
        color: "from-purple-500/20 via-slate-900 to-slate-950 border-purple-500/40",
      },
      {
        slideNum: 5,
        tag: "Summary",
        heading: "Conclusion & Review",
        subheading: "Next Steps",
        bullets: [
          "You have completed reviewing all presentation slides.",
          "Proceed to the next lesson or attempt the module quiz.",
          "Thank you for completing this presentation deck!",
        ],
        color: "from-rose-500/20 via-slate-900 to-slate-950 border-rose-500/40",
      },
    ];
  }, [title, description]);

  const [detectedPdfPageCount, setDetectedPdfPageCount] = useState<number | null>(null);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const effectivePdfUrl = React.useMemo(() => {
    if (convertedPdfUrl) return convertedPdfUrl;
    if (contentUrl && contentUrl.match(/\.(pptx?|PPTX?)$/i)) {
      const pdfPath = contentUrl.replace(/\.(pptx?|PPTX?)$/i, ".converted.pdf");
      return pdfPath.startsWith("/storage/") ? pdfPath : `/storage/${pdfPath.replace(/^\/+/, "")}`;
    }
    return undefined;
  }, [convertedPdfUrl, contentUrl]);

  useEffect(() => {
    if (!effectivePdfUrl) {
      setDetectedPdfPageCount(null);
      return;
    }
    const fetchPageCount = async () => {
      try {
        const fullUrl = getStorageUrl(effectivePdfUrl);
        const resp = await fetch(fullUrl);
        const buffer = await resp.arrayBuffer();
        const text = new TextDecoder("latin1").decode(buffer);

        const countMatch = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
        if (countMatch && countMatch[1]) {
          const parsedCount = parseInt(countMatch[1], 10);
          if (parsedCount > 0) {
            setDetectedPdfPageCount(parsedCount);
            return;
          }
        }

        const pageMatches = text.match(/\/Type\s*\/Page\b/g);
        if (pageMatches && pageMatches.length > 0) {
          setDetectedPdfPageCount(pageMatches.length);
          return;
        }
      } catch (err) {
        console.error("Failed to parse PDF page count:", err);
      }
      setDetectedPdfPageCount(null);
    };

    fetchPageCount();
  }, [effectivePdfUrl]);

  const [viewMode, setViewMode] = useState<"slides" | "pdf">("pdf");

  useEffect(() => {
    if (effectivePdfUrl) {
      setViewMode("pdf");
    }
  }, [effectivePdfUrl]);

  const totalSlides = (viewMode === "pdf" && detectedPdfPageCount && detectedPdfPageCount > 0)
    ? detectedPdfPageCount
    : slides.length;

  const currentSlide = slides[currentSlideIdx] || slides[0];

  const handleNextSlide = useCallback(() => {
    setCurrentSlideIdx((prev) => {
      const nextIdx = (prev + 1) % totalSlides;
      if (nextIdx === totalSlides - 1 && onComplete) {
        onComplete();
      }
      return nextIdx;
    });
  }, [totalSlides, onComplete]);

  const handlePrevSlide = useCallback(() => {
    setCurrentSlideIdx((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Slideshow timer (auto-advances every 4 seconds when playing)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      handleNextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, handleNextSlide]);

  // Keyboard Navigation (Left / Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextSlide, handlePrevSlide]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const downloadUrl = getStorageUrl(contentUrl || "/storage/sample_presentation.pptx");

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${title.replace(/\s+/g, "_")}.pptx`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const progressPercent = Math.round(((currentSlideIdx + 1) / totalSlides) * 100);

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none ${
        isFullscreen ? "h-screen rounded-none border-0" : ""
      }`}
    >
      {/* ── 1. Top Presentation Toolbar ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        {/* Left: Badge & Title */}
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-500 text-slate-950 border border-amber-500/30 gap-1.5 font-extrabold text-[10px] uppercase px-2.5 py-1">
            <Presentation className="h-3.5 w-3.5" /> Presentation Slide Deck
          </Badge>
          <span className="font-bold text-xs text-slate-200 truncate max-w-xs md:max-w-md">
            {title}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Switch View Mode (Presentation Document vs Interactive Slides) */}
          {(effectivePdfUrl || contentUrl) && (
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === "pdf"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Presentation Document
              </button>
              <button
                type="button"
                onClick={() => setViewMode("slides")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === "slides"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Interactive Slides
              </button>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleDownload}
            className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-1.5 cursor-pointer shadow"
          >
            <Download className="h-3.5 w-3.5" /> Download PPT
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer"
            title="Toggle fullscreen presentation"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* ── 2. Main Slide Viewport Canvas ────────────────────────────── */}
      {viewMode === "pdf" && effectivePdfUrl ? (
        <div className="w-full h-[560px] bg-slate-950 flex items-center justify-center p-2 overflow-hidden">
          <iframe
            key={`${effectivePdfUrl}-${currentSlideIdx}`}
            src={`${effectivePdfUrl}#page=${currentSlideIdx + 1}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full border-0 rounded-xl bg-white shadow-inner object-contain"
            title={title}
          />
        </div>
      ) : (
        <div className="relative flex-1 min-h-[460px] md:min-h-[500px] flex flex-col justify-between p-8 md:p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80 overflow-hidden">
          {/* Subtle Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Slide Header: Tag & Counter */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {currentSlide.tag || `Slide ${currentSlide.slideNum}`}
              </span>
              {currentSlideIdx === totalSlides - 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> End of Deck
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-400">
                Slide <strong className="text-white font-extrabold text-sm">{currentSlideIdx + 1}</strong> / {totalSlides}
              </span>
            </div>
          </div>

          {/* Slide Main Content */}
          <div className="my-auto py-6 space-y-6 z-10 max-w-4xl mx-auto w-full">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {currentSlide.heading}
              </h1>
              {currentSlide.subheading && (
                <p className="text-sm md:text-base font-medium text-amber-400">
                  {currentSlide.subheading}
                </p>
              )}
            </div>

            {/* Slide Bullets Grid */}
            {currentSlide.bullets && currentSlide.bullets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {currentSlide.bullets.map((bullet, bIdx) => (
                  <div
                    key={bIdx}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex items-start gap-3 shadow-md"
                  >
                    <div className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {bIdx + 1}
                    </div>
                    <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-normal">
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Slide Footer Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 z-10 border-t border-slate-800/80 pt-3">
            <span>Harbinger Academy Presentation Viewer</span>
            <span>Use &larr; &rarr; Arrow Keys to Navigate</span>
          </div>
        </div>
      )}

      {/* ── 3. Bottom Slide Deck Navigation Bar ─────────────────────── */}
      <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-4">
        <Button
          type="button"
          onClick={handlePrevSlide}
          disabled={currentSlideIdx === 0}
          className="h-10 px-6 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-extrabold text-xs gap-2 border border-slate-700 shadow cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Previous Slide
        </Button>

        <span className="text-xs font-bold text-slate-300 px-3">
          Slide <strong className="text-amber-400">{currentSlideIdx + 1}</strong> / {totalSlides}
        </span>

        <Button
          type="button"
          onClick={handleNextSlide}
          disabled={currentSlideIdx === totalSlides - 1}
          className="h-10 px-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-extrabold text-xs gap-2 shadow-lg cursor-pointer"
        >
          Next Slide <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
