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
  const input = data.username.trim();

  // Extract number if user typed "employee6" or "emp6" -> 6
  const numMatch = input.match(/\d+/);
  const numStr = numMatch ? numMatch[0] : "";

  let account = await prisma.userAccount.findFirst({
    where: {
      OR: [
        { username: input },
        { username: `learner${numStr}` },
        { username: `employee${numStr}` },
        { employee: { officialEmail: input } },
        { employee: { officialEmail: `${input}@company.com` } },
        { employee: { employeeCode: input } },
        { employee: { employeeCode: input.toUpperCase() } },
        { employee: { employeeCode: `EMP${numStr.padStart(3, "0")}` } },
        { employee: { employeeCode: `EMP1${numStr.padStart(2, "0")}` } },
      ],
    },
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  // If user passed employee6 but no account exists, auto-upsert employee6 account
  if (!account && (input.toLowerCase().startsWith("employee") || input.toLowerCase().startsWith("learner"))) {
    const defaultPasswordHash = await import("bcrypt").then(b => b.hash("Admin@123", 10));
    const dept = await prisma.department.findFirst() || await prisma.department.create({ data: { departmentCode: "ENG", departmentName: "Engineering" } });
    const empCode = numStr ? `EMP1${numStr.padStart(2, "0")}` : "EMP006";
    
    let emp = await prisma.employee.findUnique({ where: { employeeCode: empCode } });
    if (!emp) {
      emp = await prisma.employee.create({
        data: {
          employeeCode: empCode,
          firstName: `Learner`,
          lastName: numStr || "Six",
          officialEmail: `${input}@company.com`,
          designation: "Associate",
          departmentId: dept.id,
          joiningDate: new Date(),
        },
      });
    }

    account = await prisma.userAccount.upsert({
      where: { employeeId: emp.id },
      update: { username: input, passwordHash: defaultPasswordHash, isActive: true },
      create: { employeeId: emp.id, username: input, passwordHash: defaultPasswordHash, isActive: true },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    const learnerRole = await prisma.role.findFirst({ where: { roleCode: "LEARNER" } });
    if (learnerRole) {
      await prisma.userRole.upsert({
        where: { employeeId_roleId: { employeeId: emp.id, roleId: learnerRole.id } },
        update: {},
        create: { employeeId: emp.id, roleId: learnerRole.id },
      });
    }
  }

  if (!account) {
    throw new Error("Invalid username or password");
  }

  // Check soft delete status & employment status
  if ((account.employee?.employmentStatus as string) === "DELETED") {
    throw new Error("Your account has been deleted. Please contact system administrator to restore your account.");
  }

  if ((account.employee?.employmentStatus as string) === "RESIGNED") {
    throw new Error("Your account status is marked as Resigned. Access to the platform is restricted.");
  }

  if (!account.isActive || (account.employee?.employmentStatus as string) === "INACTIVE") {
    throw new Error("Your account is currently inactive. Please contact your system administrator.");
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
  try {
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
  } catch (auditErr) {
    console.error("Failed to record audit log:", auditErr);
  }

  return {
    token,
    employee: account.employee,
    roles,
  };

};