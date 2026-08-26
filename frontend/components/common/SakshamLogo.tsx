"use client";

import React from "react";

interface SakshamLogoProps {
  height?: number;
  variant?: "horizontal" | "vertical";
  className?: string;
}

export default function SakshamLogo({ height = 40, variant = "horizontal", className = "" }: SakshamLogoProps) {
  if (variant === "vertical") {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none shrink-0 gap-1 ${className}`}>
        <img
          src="/saksham_grad_icon.png"
          alt="Saksham Logo"
          style={{ height: `${height * 1.25}px` }}
          className="w-auto object-contain shrink-0 mix-blend-screen drop-shadow-[0_3px_14px_rgba(0,180,255,0.65)]"
        />
        <div className="flex flex-col items-center justify-center leading-none space-y-0.5">
          <span className="text-2xl font-black tracking-tight text-white font-sans drop-shadow">
            Saksham
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] text-slate-300">
            Elevate...Go Beyond
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none shrink-0 ${className}`}>
      {/* 3D Metallic Blue Graduation Cap & Open Book Icon */}
      <img
        src="/saksham_grad_icon.png"
        alt="Saksham Logo"
        style={{ height: `${height}px` }}
        className="w-auto object-contain shrink-0 mix-blend-screen drop-shadow-[0_2px_12px_rgba(0,180,255,0.55)]"
      />

      {/* Saksham Typography */}
      <div className="flex flex-col justify-center leading-none">
        <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans drop-shadow-sm">
          Saksham
        </span>
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] text-slate-300 mt-1">
          Elevate...Go Beyond
        </span>
      </div>
    </div>
  );
}
