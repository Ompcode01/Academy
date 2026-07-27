import prisma from "../config/prisma";

interface CreatePermissionInput {
  permissionName: string;
  permissionCode: string;
  moduleName: string;
  description?: string;
}

export const createPermission = async (
  data: CreatePermissionInput
) => {
  return prisma.permission.create({
    data: {
      permissionName: data.permissionName,
      permissionCode: data.permissionCode,
      moduleName: data.moduleName,
      description: data.description,
      isActive: true,
    },
  });
};

export const getPermissions = async () => {
  return prisma.permission.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

export const getPermissionById = async (id: bigint) => {
  return prisma.permission.findUnique({
    where: {
      id,
    },
  });
};

export const updatePermission = async (
  id: bigint,
  data: Partial<CreatePermissionInput>
) => {
  return prisma.permission.update({
    where: {
      id,
    },
    data,
  });
};

export const deletePermission = async (id: bigint) => {
  return prisma.permission.delete({
    where: {
      id,
    },
  });
};