import { create } from "zustand";

export interface EventItem {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  type: "site" | "category" | "course" | "group" | "user" | "other";
  description?: string;
  courseName?: string;
}

interface EventsState {
  events: EventItem[];
  hiddenTypes: Set<string>;
  courseFilter: string;
  
  toggleTypeVisibility: (type: string) => void;
  setCourseFilter: (course: string) => void;
  addEvent: (event: Omit<EventItem, "id">) => void;
}

const defaultEvents: EventItem[] = [
  {
    id: 1,
    title: "LMS Platform Launch",
    date: "2026-07-02",
    type: "site",
    description: "Global rollout of the new Harbinger Academy Enterprise LMS platform.",
  },
  {
    id: 2,
    title: "Technical Training Webinar",
    date: "2026-07-08",
    type: "category",
    description: "A specialized presentation on microservices architecture and modern web stacks.",
  },
  {
    id: 3,
    title: "Java OOP Quiz",
    date: "2026-07-15",
    type: "course",
    courseName: "Java Fundamentals",
    description: "Assessment covering object-oriented programming concepts in Java.",
  },
  {
    id: 4,
    title: "Project Alpha Standup",
    date: "2026-07-20",
    type: "group",
    description: "Weekly synchronization meeting for Project Alpha core developers.",
  },
  {
    id: 5,
    title: "Personal Goal Check-in",
    date: "2026-07-25",
    type: "user",
    description: "1-on-1 performance milestones review session with team manager.",
  },
  {
    id: 6,
    title: "Platform Scheduled Maintenance",
    date: "2026-07-30",
    type: "other",
    description: "Routine database optimization and cluster updates (downtime: 2:00 AM - 4:00 AM).",
  },
];

export const useEventsStore = create<EventsState>((set) => ({
  events: defaultEvents,
  hiddenTypes: new Set<string>(),
  courseFilter: "all",
  
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
  
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, { ...event, id: Date.now() }],
    })),
}));
