"use client";

interface HarbingerLogoProps {
  className?: string;
  height?: number;
  customLogoUrl?: string | null;
}

export default function HarbingerLogo({ className = "", height = 48, customLogoUrl }: HarbingerLogoProps) {
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt="Company Logo"
        style={{ height: `${height}px` }}
        className={`object-contain max-w-full ${className}`}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Harbinger Red Ribbon Icon */}
      <svg
        width={Math.round(height * 0.8)}
        height={height}
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M25 20C40 10 70 25 65 45C60 65 30 70 25 90C20 110 50 115 75 105"
          stroke="#E53E3E"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 50C25 40 55 50 50 70C45 85 25 90 20 105"
          stroke="#E53E3E"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      </svg>

      {/* Harbinger Group Typography */}
      <div className="flex flex-col text-left font-sans">
        <span
          className="font-extrabold tracking-tight text-[#1E3A8A] leading-none"
          style={{ fontSize: `${Math.round(height * 0.52)}px`, fontFamily: "'Inter', sans-serif" }}
        >
          Harbinger
        </span>
        <span
          className="font-extrabold tracking-tight text-[#1E3A8A] leading-none mt-0.5"
          style={{ fontSize: `${Math.round(height * 0.52)}px`, fontFamily: "'Inter', sans-serif" }}
        >
          Group
        </span>
      </div>
    </div>
  );
}
