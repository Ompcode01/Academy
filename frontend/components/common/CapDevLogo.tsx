"use client";

import React from "react";

interface CapDevLogoProps {
  height?: number;
  className?: string;
}

export default function CapDevLogo({ height = 22, className = "" }: CapDevLogoProps) {
  return (
    <svg
      height={height}
      viewBox="0 0 150 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* CapDe Text */}
      <text
        x="0"
        y="31"
        fill="#38BDF8"
        fontSize="32"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        letterSpacing="-0.5"
      >
        CapDe
      </text>

      {/* Upward Arrow 'v' */}
      <g transform="translate(106, 2)">
        {/* Left V leg */}
        <path
          d="M 4 11 L 14 30"
          stroke="#38BDF8"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Right Arrow stem */}
        <path
          d="M 14 30 L 32 4"
          stroke="#00E5FF"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        {/* Arrowhead tip */}
        <path
          d="M 20 4 H 32 V 16"
          stroke="#00E5FF"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
