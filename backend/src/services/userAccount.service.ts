import prisma from "../config/prisma";
import bcrypt from "bcrypt";

interface CreateUserAccountInput {
  employeeId: bigint;
  username: string;
  password: string;
}

export const createUserAccount = async (
  data: CreateUserAccountInput
) => {

  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.userAccount.create({
    data: {
      employeeId: data.employeeId,
      username: data.username,
      passwordHash,
      failedLoginAttempts: 0,
      accountLocked: false,
      isActive: true,
    },
    include: {
      employee: true,
    },
  });
};

export const getUserAccounts = async () => {
  return prisma.userAccount.findMany({
    include: {
      employee: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const getUserAccountById = async (
  id: bigint
) => {
  return prisma.userAccount.findUnique({
    where: {
      id,
    },
    include: {
      employee: true,
    },
  });
};

export const deleteUserAccount = async (
  id: bigint
) => {
  return prisma.userAccount.delete({
    where: {
      id,
    },
  });
};