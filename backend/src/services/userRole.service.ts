import prisma from "../config/prisma";

interface CreateUserRoleInput {
  employeeId: bigint;
  roleId: bigint;
  assignedBy: bigint;
}

export const assignRole = async (
  data: CreateUserRoleInput
) => {

  return prisma.userRole.create({

    data: {

      employeeId: data.employeeId,
      roleId: data.roleId,
      assignedBy: data.assignedBy,
      assignedAt: new Date(),
      isActive: true,

    },

    include: {

      employee: true,
      role: true,

    },

  });

};

export const getUserRoles = async () => {

  return prisma.userRole.findMany({

    include: {

      employee: true,
      role: true,

    },

    orderBy: {

      id: "asc",

    },

  });

};

export const getUserRoleById = async (
  id: bigint
) => {

  return prisma.userRole.findUnique({

    where: {

      id,

    },

    include: {

      employee: true,
      role: true,

    },

  });

};

export const deleteUserRole = async (
  id: bigint
) => {

  return prisma.userRole.delete({

    where: {

      id,

    },

  });

};