import api from "./auth.service";

export interface SessionItem {
  id: number | string;
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  url?: string;
  eventType: string; // site, course, group, etc.
  courseId?: number | string;
  departmentId?: number | string;
  creatorName?: string;
  reminderSent?: boolean;
  enrollmentType?: string;
  targetUserIds?: string;
  certificateTemplateId?: string;
  attendanceData?: string;
  createdAt?: string;
}

export interface CreateSessionPayload {
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  url?: string;
  eventType?: string;
  courseId?: number | string;
  departmentId?: number | string;
  createCalendarEvent?: boolean;
  enrollmentType?: string;
  targetUserIds?: string[];
  certificateTemplateId?: string;
  // Recurring Session Options
  repeatOptions?: {
    repeatEnabled: boolean;
    repeatDays: string[]; // ['Sun', 'Mon', etc.]
    repeatEveryWeeks: number;
    repeatUntilDate: string;
  };
}

export async function getSessions(): Promise<SessionItem[]> {
  const response = await api.get("/events");
  return response.data?.data || [];
}

export async function getSessionById(id: number | string): Promise<SessionItem | null> {
  try {
    const response = await api.get(`/events/${id}`);
    if (response.data?.data) return response.data.data;
  } catch (err) {
    console.warn("api.get(/events/:id) failed, falling back to getSessions():", err);
  }
  try {
    const all = await getSessions();
    return all.find((s) => String(s.id) === String(id)) || null;
  } catch (err) {
    return null;
  }
}

export async function createSession(payload: CreateSessionPayload): Promise<any> {
  const response = await api.post("/events", payload);
  return response.data;
}

export async function updateSession(id: number | string, payload: Partial<CreateSessionPayload>): Promise<any> {
  const response = await api.put(`/events/${id}`, payload);
  return response.data;
}

export async function deleteSession(id: number | string): Promise<any> {
  const response = await api.delete(`/events/${id}`);
  return response.data;
}

export async function saveSessionAttendance(
  id: number | string,
  attendanceRecords: Array<{ userId: number | string; name?: string; status: "PRESENT" | "ABSENT" | "LATE" }>
): Promise<any> {
  const response = await api.post(`/events/${id}/attendance`, { attendanceRecords });
  return response.data;
}
