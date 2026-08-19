/**
 * Formats a course title for UI display:
 * 1. If shortName / nickname is given, displays shortName.
 * 2. Otherwise, if title has more than 3 words, truncates to 2-3 words followed by "..."
 *    (e.g., "The AI Engineer Course 2026: Complete AI Engineer Bootcamp" -> "The AI Engineer...").
 * 3. On hover, the full title is shown via HTML title attribute / tooltip.
 */
export function getCourseDisplayTitle(
  title: string | undefined | null,
  shortName?: string | null,
  maxWords: number = 3
): string {
  if (shortName && shortName.trim()) {
    return shortName.trim();
  }
  const cleanTitle = (title || "").trim();
  if (!cleanTitle) return "Untitled Course";

  const words = cleanTitle.split(/\s+/);
  if (words.length <= maxWords) {
    return cleanTitle;
  }

  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Generates an auto Course Code:
 * 1. Takes the 1st 2 letters of shortName if provided, otherwise from title.
 * 2. Appends 2 unique random numbers (10-99).
 */
export function generateAutoCourseCode(title: string, shortName?: string): string {
  const sourceText = shortName && shortName.trim() ? shortName.trim() : title.trim();
  const clean = sourceText.replace(/[^a-zA-Z0-9]/g, "");
  if (!clean) return "";
  const firstTwo = (clean.length >= 2 ? clean.substring(0, 2) : clean + "X").toUpperCase();
  const num = Math.floor(10 + Math.random() * 90);
  return `${firstTwo}${num}`;
}

/**
 * Automatically derives a Short Name from a long Course Name:
 * Takes the first 3 words of the course name if the name has more than 3 words.
 */
export function generateAutoShortName(title: string): string {
  const cleanTitle = title.trim();
  if (!cleanTitle) return "";
  const words = cleanTitle.split(/\s+/);
  if (words.length <= 3) {
    return cleanTitle;
  }
  return words.slice(0, 3).join(" ");
}
