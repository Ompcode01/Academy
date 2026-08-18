"use client";

import React from "react";

interface FooterProps {
  variant?: "light" | "dark";
  className?: string;
}

export default function Footer({ variant = "light", className = "" }: FooterProps) {
  const isDark = variant === "dark";

  return (
    <footer
      className={`w-full py-4 px-4 sm:px-6 transition-colors duration-200 ${
        isDark
          ? "bg-[#090D16] border-t border-slate-800/80 text-slate-400"
          : "bg-white border-t border-[#E0E6ED] text-[#6C757D]"
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 text-center text-xs font-medium leading-relaxed">
        {/* Copyright */}
        <span className={isDark ? "text-slate-300 font-semibold" : "text-[#212529] font-semibold"}>
          © 2026 Harbinger Group. All Rights Reserved.
        </span>

        {/* Desktop Separator */}
        <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>

        {/* Footer Items Group */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[11px] sm:text-xs">
          {/* dLMS */}
          <span className="font-extrabold tracking-wide text-[#C82333]">
            dLMS
          </span>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Privacy Policy */}
          <a
            href="https://www.harbingergroup.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors duration-150 underline-offset-4 hover:underline ${
              isDark ? "hover:text-white" : "hover:text-[#C82333]"
            }`}
          >
            Privacy Policy
          </a>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Terms of Use */}
          <a
            href="https://www.harbingergroup.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors duration-150 underline-offset-4 hover:underline ${
              isDark ? "hover:text-white" : "hover:text-[#C82333]"
            }`}
          >
            Terms of Use
          </a>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Contact Support */}
          <a
            href="mailto:support@harbingergroup.com"
            className={`transition-colors duration-150 underline-offset-4 hover:underline ${
              isDark ? "hover:text-white" : "hover:text-[#C82333]"
            }`}
          >
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  );
}
