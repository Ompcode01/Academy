import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface GuestGrant {
  id: string;
  userId?: string;
  departmentId?: string;
  scope: "GLOBAL" | "DEPARTMENT";
  isActive: boolean;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    officialEmail: string;
  } | null;
  department?: {
    id: string;
    departmentCode: string;
    departmentName: string;
  } | null;
  grantedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    officialEmail: string;
  } | null;
}

export async function getGuestGrants(): Promise<{ success: boolean; data: GuestGrant[] }> {
  const res = await axios.get(`${API_URL}/guest-grants`, getAuthHeaders());
  return res.data;
}

export async function createGuestGrant(data: {
  userId?: string;
  departmentId?: string;
  scope: "GLOBAL" | "DEPARTMENT";
}): Promise<{ success: boolean; message: string }> {
  const res = await axios.post(`${API_URL}/guest-grants`, data, getAuthHeaders());
  return res.data;
}

export async function revokeGuestGrant(id: string): Promise<{ success: boolean; message: string }> {
  const res = await axios.delete(`${API_URL}/guest-grants/${id}`, getAuthHeaders());
  return res.data;
}
