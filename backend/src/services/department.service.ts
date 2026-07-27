import prisma from "../config/prisma";

interface CreateDepartmentInput {
  departmentCode: string;
  departmentName: string;
}

export const createDepartment = async ({
  departmentCode,
  departmentName,
}: CreateDepartmentInput) => {
  return prisma.department.create({
    data: {
      departmentCode,
      departmentName,
      isActive: true,
    },
  });
};

export const getDepartments = async () => {
  return prisma.department.findMany({
    orderBy: {
      id: "asc",
    },
  });
};