import api from "./auth.service";

export interface CalendarEventData {
  id: number;
  title: string;
  description?: string | null;
  eventDate: string;
  eventTime?: string | null;
  url?: string | null;
  eventType?: string;
  courseId?: number | null;
  departmentId?: number | null;
  creatorName?: string | null;
}

export async function getEvents(): Promise<CalendarEventData[]> {
  try {
    const res = await api.get("/events");
    return res.data?.data || [];
  } catch (err) {
    console.error("Failed to fetch events:", err);
    return [];
  }
}

export async function createEvent(data: {
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  url?: string;
  eventType?: string;
  courseId?: number;
  departmentId?: string | number;
}) {
  const res = await api.post("/events", data);
  return res.data;
}

export async function updateEvent(
  id: number,
  data: {
    title?: string;
    description?: string;
    eventDate?: string;
    eventTime?: string;
    url?: string;
    eventType?: string;
  }
) {
  const res = await api.put(`/events/${id}`, data);
  return res.data;
}

export async function deleteEvent(id: number) {
  const res = await api.delete(`/events/${id}`);
  return res.data;
}
