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
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M 42 49 C 56 40, 75 36, 68 18"
          stroke="#C82333"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 78 51 C 64 60, 44 64, 46 84"
          stroke="#C82333"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
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
