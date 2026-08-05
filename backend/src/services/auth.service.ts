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
      employee: {
        include: {
          department: true,
        },
      },
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

  const primaryRole = roles[0]?.role?.roleCode || "LEARNER";

  const token = generateToken({
    userId: account.id.toString(),
    employeeId: account.employeeId.toString(),
    username: account.username,
    role: primaryRole,
    departmentId: account.employee.departmentId.toString(),
  });

  // Record Audit Log for successful login
  const actorName = `${account.employee.firstName} ${account.employee.lastName} (${primaryRole})`;
  await prisma.auditLog.create({
    data: {
      actorName,
      action: "Login Success",
      detail: "Successfully authenticated to LMS Portal",
      type: "login",
      actorId: account.employeeId,
      ipAddress: "192.168.1.38",
    },
  });

  return {
    token,
    employee: account.employee,
    roles,
  };

};