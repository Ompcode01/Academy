export interface RecentCourseItem {
  id: number;
  title: string;
  category?: string;
  thumbnail?: string;
  level?: string;
  accessedAt: string;
}

export function getRecentlyAccessedCourses(userKey: string = "guest"): RecentCourseItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`lms_recent_accessed_${userKey}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse recently accessed courses:", err);
    return [];
  }
}

export function recordRecentCourseAccess(
  userKey: string = "guest",
  course: { id: number; title: string; category?: string; thumbnail?: string; level?: string }
) {
  if (typeof window === "undefined" || !course || !course.id) return;
  try {
    const existing = getRecentlyAccessedCourses(userKey);
    // Filter out duplicate
    const filtered = existing.filter((c) => c.id !== course.id);
    // Add new item at the top
    const newItem: RecentCourseItem = {
      id: course.id,
      title: course.title,
      category: course.category || "General",
      thumbnail: course.thumbnail,
      level: course.level,
      accessedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...filtered].slice(0, 6); // Max 6 items
    localStorage.setItem(`lms_recent_accessed_${userKey}`, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to record recent course access:", err);
  }
}

export function purgeDeletedRecentCourses(userKey: string = "guest", validCourseIds: number[]): RecentCourseItem[] {
  if (typeof window === "undefined" || !Array.isArray(validCourseIds)) return [];
  try {
    const existing = getRecentlyAccessedCourses(userKey);
    const valid = existing.filter((c) => validCourseIds.includes(Number(c.id)));
    localStorage.setItem(`lms_recent_accessed_${userKey}`, JSON.stringify(valid));
    return valid;
  } catch (err) {
    console.error("Failed to purge deleted recent courses:", err);
    return [];
  }
}
