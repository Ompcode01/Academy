import api from "./auth.service";

export interface ReportFilterParams {
  dateFrom?: string;
  dateTo?: string;
  preset?: string;
  departmentId?: string;
  courseId?: string;
  categoryId?: string;
  employeeId?: string;
  mandatory?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lowCompletionThreshold?: number;
  expiringSoonDays?: number;
  inactiveDays?: number;
}

export const getReportingFilterOptions = async () => {
  const response = await api.get("/reports/filter-options");
  return response.data.data;
};

export const getEnrollmentReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/enrollments", { params });
  return response.data.data;
};

export const getCourseCompletionReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/completions", { params });
  return response.data.data;
};

export const getLearnerPerformanceReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/learner-performance", { params });
  return response.data.data;
};

export const getAssessmentReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/assessments", { params });
  return response.data.data;
};

export const getEngagementReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/engagement", { params });
  return response.data.data;
};

export const getDepartmentPerformanceReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/department-performance", { params });
  return response.data.data;
};

export const getOrganizationOverviewReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/organization-overview", { params });
  return response.data.data;
};

export const getTeacherPerformanceReport = async (params?: ReportFilterParams) => {
  const response = await api.get("/reports/teacher-performance", { params });
  return response.data.data;
};

export const getEmployeeDrilldown = async (id: number | string) => {
  const response = await api.get(`/reports/drilldown/employee/${id}`);
  return response.data.data;
};

export const exportReportFile = async (type: string, format: string, params: ReportFilterParams) => {
  const response = await api.get(`/reports/export/${type}`, {
    params: { ...params, format },
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `LMS_${type}_report.${format === "csv" ? "csv" : "xlsx"}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// 3 Core Role-Based Reports & Assignment Evaluation API calls
export const getLearnerProgressReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/learner-progress", { params });
  return response.data.data;
};

export const getQuizAssessmentReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/quiz-assessments", { params });
  return response.data.data;
};

export const getAssignmentSubmissionReport = async (params: ReportFilterParams) => {
  const response = await api.get("/reports/assignment-submissions", { params });
  return response.data.data;
};

export const evaluateAssignmentSubmission = async (
  submissionId: number | string,
  data: { score: number; grade: string; feedback: string }
) => {
  const response = await api.post(`/reports/evaluate-assignment/${submissionId}`, data);
  return response.data;
};
