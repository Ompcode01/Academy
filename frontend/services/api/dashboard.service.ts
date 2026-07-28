import api from "./auth.service";

export interface DashboardStats {
  coursesCount: number;
  publishedCoursesCount: number;
  draftCoursesCount: number;
  employeesCount: number;
  departmentsCount: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
}

export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};
