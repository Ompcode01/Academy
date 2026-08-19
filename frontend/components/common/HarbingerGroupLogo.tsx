"use client";

import React from "react";

interface HarbingerGroupLogoProps {
  height?: number;
  className?: string;
}

export default function HarbingerGroupLogo({ height = 28, className = "" }: HarbingerGroupLogoProps) {
  return (
    <img
      src="/images/harbinger-group-logo.png"
      alt="Harbinger Group Logo"
      style={{ height: `${height}px` }}
      className={`shrink-0 w-auto object-contain ${className}`}
    />
  );
}
