import api from "./auth.service";

// Course types
export interface Course {
  id: number;
  categoryId: number;
  departmentId?: number | null;
  creatorId: number;
  title: string;
  code?: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  level?: string;
  language?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  /** Wizard step an unfinished draft was left on; null once published. */
  draftStep?: number | null;
  enrollmentType?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  department?: Department;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  creatorInfo?: {
    creatorRole: string;
    creatorName: string;
    creatorDepartment: string;
  };
  sections?: CourseSection[];
}

export interface Department {
  id: number;
  departmentCode: string;
  departmentName: string;
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
  fileSize?: string;
  duration?: number;
  metaData?: string;
  contentOrder: number;
  isMandatory: boolean;
  isPublished: boolean;
}

// Course Filters Props
export interface CourseFiltersProps {
  search?: string;
  categoryId?: number;
  departmentId?: number;
  status?: string;
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
export const getCourses = async (filters: CourseFiltersProps = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.categoryId)
    params.append("categoryId", String(filters.categoryId));
  if (filters.departmentId)
    params.append("departmentId", String(filters.departmentId));
  if (filters.status)
    params.append("status", filters.status);
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));

  const response = await api.get(`/courses?${params.toString()}`);
  return response.data;
};

export const getCourseById = async (id: number) => {
  try {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  } catch (err: any) {
    console.warn(`Course #${id} not found or failed to load:`, err?.message || err);
    return { success: false, data: null, message: err?.response?.data?.message || "Course not found" };
  }
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

export const updateContent = async (
  contentId: number,
  data: Partial<LearningContent>
) => {
  const response = await api.put(`/courses/contents/${contentId}`, data);
  return response.data;
};

export const deleteContent = async (contentId: number) => {
  const response = await api.delete(`/courses/contents/${contentId}`);
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

// Enrolment APIs
export const selfEnrollCourse = async (courseId: number) => {
  const response = await api.post(`/courses/${courseId}/enroll`);
  return response.data;
};

export const adminEnrollUser = async (courseId: number, identifier: string) => {
  const response = await api.post(`/courses/${courseId}/admin-enroll`, { identifier });
  return response.data;
};

export const bulkEnrollUsers = async (courseId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/courses/${courseId}/bulk-enroll`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const verifyUser = async (identifier: string) => {
  const response = await api.post("/courses/verify-user", { identifier });
  return response.data;
};

export const verifyBulkFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/courses/verify-bulk-file", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Learner Progress & Submissions
export const getLearnerCourseProgress = async (courseId: number) => {
  const response = await api.get(`/courses/${courseId}/my-progress`);
  return response.data;
};

export const updateLessonProgress = async (
  courseId: number,
  data: { contentId: number; isCompleted: boolean; additionalSeconds?: number }
) => {
  const response = await api.post(`/courses/${courseId}/progress`, data);
  return response.data;
};

export const submitQuiz = async (
  courseId: number,
  data: { contentId?: number; score: number; maxScore: number; answersJson?: string }
) => {
  const response = await api.post(`/courses/${courseId}/quiz/submit`, data);
  return response.data;
};

export const submitAssignment = async (
  courseId: number,
  data: { contentId?: number; submissionText: string; fileUrl?: string }
) => {
  const response = await api.post(`/courses/${courseId}/assignment/submit`, data);
  return response.data;
};

// Teacher & Admin Submissions Review
export const getTeacherSubmissions = async () => {
  const response = await api.get("/courses/teacher/submissions");
  return response.data;
};

export const gradeSubmission = async (
  submissionId: number,
  data: { grade: string; score: number; feedback: string; status?: string }
) => {
  const response = await api.post(`/courses/admin/grade-submission/${submissionId}`, data);
  return response.data;
};

export const uploadScormPackage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/courses/upload-scorm", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const uploadDocumentFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/courses/upload-document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getStorageUrl = (url?: string) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  const cleanPath = trimmed.startsWith("/storage/")
    ? trimmed
    : `/storage/${trimmed.replace(/^\/+/, "")}`;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return `http://${hostname}:5000${cleanPath}`;
  }
  return `http://localhost:5000${cleanPath}`;
};
