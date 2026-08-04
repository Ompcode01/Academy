import { create } from "zustand";
import { getEvents, createEvent, updateEvent, deleteEvent } from "@/services/api/event.service";

export interface EventItem {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  url?: string;
  type: "site" | "category" | "course" | "group" | "user" | "other";
  description?: string;
  courseName?: string;
}

interface EventsState {
  events: EventItem[];
  hiddenTypes: Set<string>;
  courseFilter: string;
  loading: boolean;

  fetchEvents: () => Promise<void>;
  toggleTypeVisibility: (type: string) => void;
  setCourseFilter: (course: string) => void;
  addEvent: (event: Omit<EventItem, "id">) => Promise<void>;
  editEvent: (id: number, event: Partial<Omit<EventItem, "id">>) => Promise<void>;
  removeEvent: (id: number) => Promise<void>;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  hiddenTypes: new Set<string>(),
  courseFilter: "all",
  loading: false,

  fetchEvents: async () => {
    set({ loading: true });
    try {
      const data = await getEvents();
      if (data && Array.isArray(data)) {
        const parsedEvents: EventItem[] = data.map((ev) => ({
          id: ev.id,
          title: ev.title,
          date: ev.eventDate ? ev.eventDate.split("T")[0] : new Date().toISOString().split("T")[0],
          time: ev.eventTime || undefined,
          url: ev.url || undefined,
          type: (ev.eventType as any) || "site",
          description: ev.description || "",
          courseName: ev.courseId ? `Course #${ev.courseId}` : undefined,
        }));
        set({ events: parsedEvents });
      }
    } catch (err) {
      console.error("Failed to fetch events from backend:", err);
    } finally {
      set({ loading: false });
    }
  },

  toggleTypeVisibility: (type) =>
    set((state) => {
      const newHidden = new Set(state.hiddenTypes);
      if (newHidden.has(type)) {
        newHidden.delete(type);
      } else {
        newHidden.add(type);
      }
      return { hiddenTypes: newHidden };
    }),

  setCourseFilter: (course) => set({ courseFilter: course }),

  addEvent: async (event) => {
    try {
      await createEvent({
        title: event.title,
        description: event.description,
        eventDate: event.date,
        eventTime: event.time,
        url: event.url,
        eventType: event.type || "site",
      });
      await get().fetchEvents();
    } catch (err) {
      console.error("Failed to add event to database:", err);
    }
  },

  editEvent: async (id, event) => {
    try {
      await updateEvent(id, {
        title: event.title,
        description: event.description,
        eventDate: event.date,
        eventTime: event.time,
        url: event.url,
        eventType: event.type,
      });
      await get().fetchEvents();
    } catch (err) {
      console.error("Failed to edit event:", err);
    }
  },

  removeEvent: async (id: number) => {
    try {
      await deleteEvent(id);
      await get().fetchEvents();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  },
}));
