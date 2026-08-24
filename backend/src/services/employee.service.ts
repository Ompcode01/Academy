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
      assignedRoles: {
        where: { isActive: true },
        include: { role: true },
      },
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
      assignedRoles: {
        where: { isActive: true },
        include: { role: true },
      },
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
  // Ensure MySQL ENUM column includes DELETED option
  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE employees MODIFY COLUMN employmentStatus ENUM('ACTIVE', 'INACTIVE', 'RESIGNED', 'DELETED') NOT NULL DEFAULT 'ACTIVE'"
    );
  } catch (err) {
    // Column already modified or alter unsupported in transaction
  }

  // Soft delete employee status via raw SQL to bypass strict Prisma client enum validation
  await prisma.$executeRawUnsafe(
    "UPDATE employees SET employmentStatus = 'DELETED' WHERE id = ?",
    id
  );

  // Deactivate user account
  await prisma.userAccount.updateMany({
    where: { employeeId: id },
    data: { isActive: false },
  });

  return true;
};

export const restoreEmployee = async (id: bigint) => {
  await prisma.$executeRawUnsafe(
    "UPDATE employees SET employmentStatus = 'ACTIVE' WHERE id = ?",
    id
  );

  await prisma.userAccount.updateMany({
    where: { employeeId: id },
    data: { isActive: true },
  });

  return true;
};