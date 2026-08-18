import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getYouTubeEmbedUrl(url: string): string {
  if (!url) return url;
  try {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("youtube.com/watch")) {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      videoId = urlObj.searchParams.get("v") || "";
    } else if (url.includes("youtube.com/embed/")) {
      return url;
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  } catch (e) {
    return url;
  }
}
