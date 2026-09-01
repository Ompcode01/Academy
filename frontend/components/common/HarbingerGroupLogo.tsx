"use client";

import React from "react";
import HarbingerLogoIcon from "./HarbingerLogoIcon";

interface HarbingerGroupLogoProps {
  height?: number;
  className?: string;
  textColor?: string;
}

export default function HarbingerGroupLogo({
  height = 30,
  className = "",
  textColor = "text-white",
}: HarbingerGroupLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <HarbingerLogoIcon size={height} color="#E33446" />
      <div className={`flex flex-col font-extrabold leading-none tracking-tight shrink-0 ${textColor}`}>
        <span className="text-sm font-black tracking-tight leading-none">Harbinger</span>
        <span className="text-sm font-black tracking-tight leading-none mt-0.5">Group</span>
      </div>
    </div>
  );
}
