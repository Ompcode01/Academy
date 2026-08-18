import api from "./auth.service";

export interface SearchResultCourse {
  id: number;
  type: "course";
  title: string;
  description?: string;
  category: string;
  level: string;
  status: string;
  thumbnail?: string;
  url: string;
}

export interface SearchResultModule {
  id: number;
  type: "module";
  title: string;
  description?: string;
  courseId: number;
  courseTitle: string;
  url: string;
}

export interface SearchResultLesson {
  id: number;
  type: "lesson";
  title: string;
  contentType: string;
  description?: string;
  courseId: number;
  courseTitle: string;
  sectionId: number;
  sectionTitle: string;
  url: string;
}

export interface SearchResultQuiz {
  id: number;
  type: "quiz";
  title: string;
  description?: string;
  questionCount: number;
  courseId: number;
  courseTitle: string;
  sectionId: number;
  sectionTitle: string;
  url: string;
}

export interface SearchResultAssignment {
  id: number;
  type: "assignment";
  title: string;
  description?: string;
  courseId: number;
  courseTitle: string;
  sectionId: number;
  sectionTitle: string;
  url: string;
}

export interface SearchResultEvent {
  id: number;
  type: "event";
  title: string;
  description?: string;
  eventType?: string;
  startDate?: string;
  location?: string;
  departmentName?: string;
  url: string;
}

export interface SearchResultSkill {
  id: number;
  type: "skill";
  name: string;
  category: string;
  skillType: string;
  description?: string;
  url: string;
}

export interface SearchResultCategory {
  id: number;
  type: "category";
  name: string;
  description?: string;
  courseCount: number;
  url: string;
}

export interface GlobalSearchResponseData {
  courses: SearchResultCourse[];
  modules: SearchResultModule[];
  lessons: SearchResultLesson[];
  quizzes: SearchResultQuiz[];
  assignments: SearchResultAssignment[];
  events: SearchResultEvent[];
  skills: SearchResultSkill[];
  categories: SearchResultCategory[];
  totalResults: number;
}

export interface GlobalSearchResponse {
  success: boolean;
  data: GlobalSearchResponseData;
  userRole: string;
}

export async function globalSearch(
  query: string,
  category: string = "all"
): Promise<GlobalSearchResponse> {
  try {
    const res = await api.get("/search", {
      params: { q: query, category },
    });
    return res.data;
  } catch (err) {
    console.error("Global search failed:", err);
    return {
      success: false,
      data: {
        courses: [],
        modules: [],
        lessons: [],
        quizzes: [],
        assignments: [],
        events: [],
        skills: [],
        categories: [],
        totalResults: 0,
      },
      userRole: "GUEST",
    };
  }
}
