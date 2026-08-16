"use client";

import React from "react";
import {
  FileText,
  Download,
  Maximize2,
  Presentation,
  ChevronLeft,
  ChevronRight,
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
  let descriptionIsSlideJson = false;
  if (isPpt) {
    if (description) {
      try {
        const parsed = JSON.parse(description);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].heading !== undefined) {
          slides = parsed;
          descriptionIsSlideJson = true;
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

  // The plain-text description to show in notes (hide if it's the raw JSON slides data)
  const plainDescription = descriptionIsSlideJson ? null : description;

  // Current slide for PPT slide viewer
  const currentSlide = slides && slides.length > 0 ? slides[currentSlideIdx] : null;
  const totalSlides = slides ? slides.length : 0;

  // Gradient color palettes for slides
  const slideGradients = [
    "from-indigo-950 via-slate-900 to-purple-950",
    "from-slate-900 via-blue-950 to-cyan-950",
    "from-emerald-950 via-slate-900 to-teal-950",
    "from-rose-950 via-slate-900 to-pink-950",
    "from-amber-950 via-slate-900 to-orange-950",
    "from-violet-950 via-slate-900 to-fuchsia-950",
    "from-sky-950 via-slate-900 to-blue-950",
    "from-lime-950 via-slate-900 to-green-950",
  ];

  const slideAccentColors = [
    { tag: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30", heading: "text-white", sub: "text-indigo-300", bullet: "bg-indigo-500", bulletText: "text-slate-200" },
    { tag: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30", heading: "text-white", sub: "text-cyan-300", bullet: "bg-cyan-500", bulletText: "text-slate-200" },
    { tag: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30", heading: "text-white", sub: "text-emerald-300", bullet: "bg-emerald-500", bulletText: "text-slate-200" },
    { tag: "text-rose-400 bg-rose-500/15 border-rose-500/30", heading: "text-white", sub: "text-rose-300", bullet: "bg-rose-500", bulletText: "text-slate-200" },
    { tag: "text-amber-400 bg-amber-500/15 border-amber-500/30", heading: "text-white", sub: "text-amber-300", bullet: "bg-amber-500", bulletText: "text-slate-200" },
    { tag: "text-violet-400 bg-violet-500/15 border-violet-500/30", heading: "text-white", sub: "text-violet-300", bullet: "bg-violet-500", bulletText: "text-slate-200" },
    { tag: "text-sky-400 bg-sky-500/15 border-sky-500/30", heading: "text-white", sub: "text-sky-300", bullet: "bg-sky-500", bulletText: "text-slate-200" },
    { tag: "text-lime-400 bg-lime-500/15 border-lime-500/30", heading: "text-white", sub: "text-lime-300", bullet: "bg-lime-500", bulletText: "text-slate-200" },
  ];

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
        {isPpt && slides && slides.length > 0 && (isLocalHost || descriptionIsSlideJson) ? (
          /* ── PPT Slide Viewer ── */
          <div className="w-full">
            {/* Slide Display Area */}
            <div
              className={`w-full min-h-[520px] bg-gradient-to-br ${slideGradients[currentSlideIdx % slideGradients.length]} border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col`}
            >
              {/* Slide Content */}
              {currentSlide && (
                <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-10 space-y-6">
                  {/* Tag */}
                  {currentSlide.tag && (
                    <Badge className={`${slideAccentColors[currentSlideIdx % slideAccentColors.length].tag} border text-[10px] uppercase font-extrabold px-3 py-1 w-fit`}>
                      {currentSlide.tag}
                    </Badge>
                  )}

                  {/* Heading */}
                  <h2 className={`text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${slideAccentColors[currentSlideIdx % slideAccentColors.length].heading}`}>
                    {currentSlide.heading}
                  </h2>

                  {/* Subheading */}
                  {currentSlide.subheading && (
                    <p className={`text-base md:text-lg font-medium leading-relaxed max-w-2xl ${slideAccentColors[currentSlideIdx % slideAccentColors.length].sub}`}>
                      {currentSlide.subheading}
                    </p>
                  )}

                  {/* Bullets */}
                  {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                    <ul className="space-y-2.5 mt-2 max-w-2xl">
                      {currentSlide.bullets.map((bullet: string, bIdx: number) => (
                        <li key={bIdx} className="flex items-start gap-3 text-sm">
                          <span className={`mt-1.5 h-2 w-2 rounded-full ${slideAccentColors[currentSlideIdx % slideAccentColors.length].bullet} shrink-0`} />
                          <span className={`leading-relaxed ${slideAccentColors[currentSlideIdx % slideAccentColors.length].bulletText}`}>
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Slide Number Watermark */}
              <div className="absolute bottom-4 right-6 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                {currentSlide?.tag || title}
              </div>
            </div>

            {/* Navigation Controls */}
            {totalSlides > 1 && (
              <div className="flex items-center justify-between mt-3 px-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentSlideIdx(Math.max(0, currentSlideIdx - 1))}
                  disabled={currentSlideIdx === 0}
                  className="h-9 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>

                <div className="flex items-center gap-2">
                  {slides.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIdx(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentSlideIdx
                          ? "w-8 bg-amber-500"
                          : "w-2.5 bg-slate-700 hover:bg-slate-600"
                      }`}
                      title={`Slide ${idx + 1}`}
                    />
                  ))}
                  <span className="ml-3 text-xs font-bold text-slate-400">
                    {currentSlideIdx + 1} / {totalSlides}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentSlideIdx(Math.min(totalSlides - 1, currentSlideIdx + 1))}
                  disabled={currentSlideIdx === totalSlides - 1}
                  className="h-9 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : isPpt && !isLocalHost ? (
          /* ── PPT via Google Docs Viewer (remote URL) ── */
          <div className="w-full h-[620px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <iframe
              src={iframeSrc}
              className="w-full h-full border-0 bg-white"
              title={title}
            />
          </div>
        ) : (
          /* ── PDF / Other Embedded Viewer ── */
          <div className="w-full h-[620px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <iframe
              src={iframeSrc}
              className="w-full h-full border-0 bg-white"
              title={title}
            />
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
