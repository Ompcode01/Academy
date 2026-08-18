import api from "./auth.service";

export interface Department {
  id: number;
  departmentCode: string;
  departmentName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  roleName: string;
  roleCode: string;
  description?: string;
  isActive: boolean;
}

export interface UserRole {
  id: number;
  employeeId: number;
  roleId: number;
  isActive: boolean;
  role: Role;
}

export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  officialEmail: string;
  phoneNumber?: string;
  designation: string;
  departmentId: number;
  managerId?: number;
  joiningDate: string;
  profileImage?: string;
  employmentStatus: "ACTIVE" | "INACTIVE" | "RESIGNED";
  department?: Department;
  manager?: Employee;
  assignedRoles?: UserRole[];
}

// Business Unit API
export const getDepartments = async () => {
  const response = await api.get("/departments");
  return response.data;
};

export const createDepartment = async (data: {
  departmentCode: string;
  departmentName: string;
}) => {
  const response = await api.post("/departments", data);
  return response.data;
};

// Employee API
export const getEmployees = async () => {
  const response = await api.get("/employees");
  return response.data;
};

export const createEmployee = async (data: Partial<Employee>) => {
  const response = await api.post("/employees", data);
  return response.data;
};

export const updateEmployee = async (id: number, data: Partial<Employee>) => {
  const response = await api.put(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: number) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};

// Roles API
export const getRoles = async () => {
  const response = await api.get("/roles");
  return response.data;
};

export const assignRole = async (data: { employeeId: number; roleId: number }) => {
  const response = await api.post("/user-roles", data);
  return response.data;
};

export const removeUserRole = async (userRoleId: number) => {
  const response = await api.delete(`/user-roles/${userRoleId}`);
  return response.data;
};

