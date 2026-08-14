import { getMyEnrollments } from "./progress.service";

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
    const filtered = existing.filter((c) => c.id !== course.id);
    const newItem: RecentCourseItem = {
      id: course.id,
      title: course.title,
      category: course.category || "General",
      thumbnail: course.thumbnail,
      level: course.level,
      accessedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...filtered].slice(0, 6);
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

/**
 * Synchronize recently accessed courses with backend MySQL database user enrollments
 */
export async function syncRecentlyAccessedWithBackend(userKey: string, allCourses: any[]): Promise<RecentCourseItem[]> {
  try {
    const enrollments = await getMyEnrollments();
    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      return getRecentlyAccessedCourses(userKey);
    }

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    const matchedCourses = allCourses.filter((c) => enrolledCourseIds.has(c.id));

    const syncItems: RecentCourseItem[] = matchedCourses.slice(0, 6).map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category?.name || "General",
      thumbnail: c.thumbnail,
      level: c.level || "Beginner",
      accessedAt: new Date().toISOString(),
    }));

    if (typeof window !== "undefined" && syncItems.length > 0) {
      localStorage.setItem(`lms_recent_accessed_${userKey}`, JSON.stringify(syncItems));
    }

    return syncItems;
  } catch (err) {
    console.error("Failed to sync recent courses with backend database:", err);
    return getRecentlyAccessedCourses(userKey);
  }
}
