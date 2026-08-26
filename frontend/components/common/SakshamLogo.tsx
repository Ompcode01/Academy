"use client";

import React from "react";

interface SakshamLogoProps {
  height?: number;
  variant?: "horizontal" | "vertical";
  className?: string;
}

export default function SakshamLogo({ height = 60, className = "" }: SakshamLogoProps) {
  return (
    <img
      src="/saksham-logo.png"
      alt="Saksham Logo"
      style={{ height: `${height}px` }}
      className={`w-auto object-contain shrink-0 filter drop-shadow-[0_4px_20px_rgba(227,52,70,0.35)] ${className}`}
    />
  );
}
