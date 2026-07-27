import prisma from "../config/prisma";

interface CreateRolePermissionInput {
  roleId: bigint;
  permissionId: bigint;
}

export const assignPermission = async (
  data: CreateRolePermissionInput
) => {
  return prisma.rolePermission.create({
    data: {
      roleId: data.roleId,
      permissionId: data.permissionId,
    },
    include: {
      role: true,
      permission: true,
    },
  });
};

export const getRolePermissions = async () => {
  return prisma.rolePermission.findMany({
    include: {
      role: true,
      permission: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const getRolePermissionById = async (id: bigint) => {
  return prisma.rolePermission.findUnique({
    where: { id },
    include: {
      role: true,
      permission: true,
    },
  });
};

export const deleteRolePermission = async (id: bigint) => {
  return prisma.rolePermission.delete({
    where: { id },
  });
};