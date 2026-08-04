import api from "./auth.service";

export interface CatalogSkill {
  id: number;
  name: string;
  category: string;
  subCategory?: string;
  skillType: string;
  description?: string;
}

export interface UserSkill {
  id: number;
  userId: number;
  skillId?: number;
  skillName: string;
  category: string;
  subCategory?: string;
  skillType: string;
  proficiencyLevel: string;
  rating: number;
  yearsOfExp?: number;
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProject {
  id: number;
  userId: number;
  projectName: string;
  projectType: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  roleName?: string;
  responsibilities?: string;
  technologies?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequestItem {
  id: number;
  requestKind: "SKILL" | "PROJECT";
  userId: number;
  employee: {
    firstName: string;
    lastName: string;
    officialEmail?: string;
    designation: string;
    profileImage?: string;
  };
  title: string;
  category: string;
  subCategory?: string;
  type: string;
  proficiencyLevel: string;
  rating: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserOverviewStats {
  totalSkills: number;
  approvedSkills: number;
  pendingSkills: number;
  rejectedSkills: number;
  totalProjects: number;
  currentProjects: number;
  certificationsCount: number;
  skillDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  recentActivities: Array<{
    id: string;
    title: string;
    status: string;
    reason?: string;
    updatedAt: string;
  }>;
}

export const getCatalogSkills = async (): Promise<CatalogSkill[]> => {
  const response = await api.get("/skills/catalog");
  return response.data.data;
};

export const getUserOverviewStats = async (): Promise<UserOverviewStats> => {
  const response = await api.get("/skills/overview");
  return response.data.data;
};

export const getUserSkills = async (status?: string): Promise<UserSkill[]> => {
  const response = await api.get("/skills/my-skills", { params: { status } });
  return response.data.data;
};

export const createUserSkill = async (data: Partial<UserSkill>): Promise<UserSkill> => {
  const response = await api.post("/skills/my-skills", data);
  return response.data.data;
};

export const updateUserSkill = async (id: number, data: Partial<UserSkill>, resubmit = false): Promise<UserSkill> => {
  const response = await api.put(`/skills/my-skills/${id}?resubmit=${resubmit}`, data);
  return response.data.data;
};

export const deleteUserSkill = async (id: number): Promise<void> => {
  await api.delete(`/skills/my-skills/${id}`);
};

export const getUserProjects = async (status?: string): Promise<UserProject[]> => {
  const response = await api.get("/skills/my-projects", { params: { status } });
  return response.data.data;
};

export const createUserProject = async (data: Partial<UserProject>): Promise<UserProject> => {
  const response = await api.post("/skills/my-projects", data);
  return response.data.data;
};

export const updateUserProject = async (id: number, data: Partial<UserProject>, resubmit = false): Promise<UserProject> => {
  const response = await api.put(`/skills/my-projects/${id}?resubmit=${resubmit}`, data);
  return response.data.data;
};

export const deleteUserProject = async (id: number): Promise<void> => {
  await api.delete(`/skills/my-projects/${id}`);
};

export const getApprovalRequests = async (params?: { status?: string; search?: string }): Promise<ApprovalRequestItem[]> => {
  const response = await api.get("/skills/approvals", { params });
  return response.data.data;
};

export const handleApprovalAction = async (
  id: number,
  requestKind: "SKILL" | "PROJECT",
  action: "APPROVE" | "REJECT",
  reason?: string
): Promise<any> => {
  const response = await api.post(`/skills/approvals/${id}/action`, {
    requestKind,
    action,
    reason,
  });
  return response.data;
};
