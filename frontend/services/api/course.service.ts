import api from "./auth.service";

// Course types
export interface Course {
  id: number;
  categoryId: number;
  title: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  level?: string;
  language?: string;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  sections?: CourseSection[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CourseSection {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  sectionOrder: number;
  isPublished: boolean;
  contents?: LearningContent[];
}

export interface LearningContent {
  id: number;
  sectionId: number;
  title: string;
  contentType: string;
  contentUrl?: string;
  description?: string;
  duration?: number;
  contentOrder: number;
  isMandatory: boolean;
  isPublished: boolean;
}

export interface CourseFilters {
  search?: string;
  categoryId?: number;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  courses: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Course API
export const getCourses = async (filters: CourseFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.categoryId)
    params.append("categoryId", String(filters.categoryId));
  if (filters.isPublished !== undefined)
    params.append("isPublished", String(filters.isPublished));
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));

  const response = await api.get(`/courses?${params.toString()}`);
  return response.data;
};

export const getCourseById = async (id: number) => {
  const response = await api.get(`/courses/${id}`);
  return response.data;
};

export const createCourse = async (data: Partial<Course>) => {
  const response = await api.post("/courses", data);
  return response.data;
};

export const updateCourse = async (id: number, data: Partial<Course>) => {
  const response = await api.put(`/courses/${id}`, data);
  return response.data;
};

export const deleteCourse = async (id: number) => {
  const response = await api.delete(`/courses/${id}`);
  return response.data;
};

// Section API
export const createSection = async (
  courseId: number,
  data: Partial<CourseSection>
) => {
  const response = await api.post(`/courses/${courseId}/sections`, data);
  return response.data;
};

export const updateSection = async (
  sectionId: number,
  data: Partial<CourseSection>
) => {
  const response = await api.put(`/courses/sections/${sectionId}`, data);
  return response.data;
};

export const deleteSection = async (sectionId: number) => {
  const response = await api.delete(`/courses/sections/${sectionId}`);
  return response.data;
};

// Content API
export const createContent = async (
  sectionId: number,
  data: Partial<LearningContent>
) => {
  const response = await api.post(
    `/courses/sections/${sectionId}/contents`,
    data
  );
  return response.data;
};

// Category API
export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

export const createCategory = async (data: {
  name: string;
  description?: string;
}) => {
  const response = await api.post("/categories", data);
  return response.data;
};
