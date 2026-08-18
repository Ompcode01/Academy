"use client";

import React from "react";

interface HarbingerLogoIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function HarbingerLogoIcon({
  className = "",
  size = 24,
  color = "#C82333",
}: HarbingerLogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Top Wave Swoosh */}
      <path
        d="M 42 49 C 56 40, 75 36, 68 18"
        stroke={color}
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Wave Swoosh */}
      <path
        d="M 78 51 C 64 60, 44 64, 46 84"
        stroke={color}
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HarbingerCircleLogo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-[#0B132B] shadow-md border border-white/10 shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <HarbingerLogoIcon size={Math.round(size * 0.65)} color="#C82333" />
    </div>
  );
}
