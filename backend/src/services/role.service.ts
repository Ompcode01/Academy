import prisma from "../config/prisma";

interface CreateRoleInput {
  roleName: string;
  roleCode: string;
  description?: string;
}

export const createRole = async (data: CreateRoleInput) => {
  return prisma.role.create({
    data: {
      roleName: data.roleName,
      roleCode: data.roleCode,
      description: data.description,
      isActive: true,
    },
  });
};

export const getRoles = async () => {
  return prisma.role.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

export const getRoleById = async (id: bigint) => {
  return prisma.role.findUnique({
    where: {
      id,
    },
  });
};

export const updateRole = async (
  id: bigint,
  data: Partial<CreateRoleInput>
) => {
  return prisma.role.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteRole = async (id: bigint) => {
  return prisma.role.delete({
    where: {
      id,
    },
  });
};