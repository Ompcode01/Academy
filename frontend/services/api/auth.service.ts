import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return `http://${hostname}:5000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
};

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginRequest {
  username: string;
  password: string;
}

export const login = async (data: LoginRequest) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export default api;