import prisma from "../config/prisma";
import { comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";

interface LoginInput {
  username: string;
  password: string;
}

export const login = async (
  data: LoginInput
) => {

  const account = await prisma.userAccount.findUnique({
    where: {
      username: data.username,
    },
    include: {
      employee: true,
    },
  });

  if (!account) {
    throw new Error("Invalid username or password");
  }

  if (!account.isActive) {
    throw new Error("Account is inactive");
  }

  const passwordMatched = await comparePassword(
    data.password,
    account.passwordHash
  );

  if (!passwordMatched) {
    throw new Error("Invalid username or password");
  }

  await prisma.userAccount.update({
    where: {
      id: account.id,
    },
    data: {
      lastLogin: new Date(),
      failedLoginAttempts: 0,
    },
  });

  const roles = await prisma.userRole.findMany({
    where: {
      employeeId: account.employeeId,
      isActive: true,
    },
    include: {
      role: true,
    },
  });

  const token = generateToken({
    userId: account.id.toString(),
    employeeId: account.employeeId.toString(),
    username: account.username,
  });

  return {
    token,
    employee: account.employee,
    roles,
  };

};