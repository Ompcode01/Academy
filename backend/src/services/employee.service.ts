import prisma from "../config/prisma";

interface CreateEmployeeInput {
  employeeCode: string;
  firstName: string;
  lastName: string;
  officialEmail: string;
  phoneNumber?: string;
  designation: string;
  departmentId: bigint;
  managerId?: bigint;
  joiningDate: Date;
  profileImage?: string;
}

export const createEmployee = async (data: CreateEmployeeInput) => {
  return prisma.employee.create({
    data: {
      ...data,
      employmentStatus: "ACTIVE",
    },
    include: {
      department: true,
    },
  });
};

export const getEmployees = async () => {
  return prisma.employee.findMany({
    include: {
      department: true,
      manager: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const getEmployeeById = async (id: bigint) => {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      manager: true,
    },
  });
};

export const updateEmployee = async (
  id: bigint,
  data: Partial<CreateEmployeeInput>
) => {
  return prisma.employee.update({
    where: { id },
    data,
  });
};

export const deleteEmployee = async (id: bigint) => {
  return prisma.employee.delete({
    where: { id },
  });
};