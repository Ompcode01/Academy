import api from "./auth.service";

export interface Department {
  id: number;
  departmentCode: string;
  departmentName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
}

// Department API
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
