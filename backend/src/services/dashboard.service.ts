import prisma from "../config/prisma";

interface UserContext {
  role: string;
  employeeId: string;
  departmentId: string;
}

export const getDashboardStats = async (userContext: UserContext) => {
  const { role, employeeId, departmentId } = userContext;
  const empId = BigInt(employeeId);
  const deptId = BigInt(departmentId);

  const superAdminOrAdminCreator = {
    creator: {
      assignedRoles: {
        some: {
          role: {
            roleCode: { in: ["SUPER_ADMIN", "ADMIN"] },
          },
          isActive: true,
        },
      },
    },
  };

  // Build course filter based on role
  let courseWhere: any = { isActive: true };
  switch (role) {
    case "SUPER_ADMIN":
      break;
    case "ADMIN":
      courseWhere.OR = [
        { departmentId: deptId },
        { departmentId: null },
        { creatorId: empId },
        superAdminOrAdminCreator,
      ];
      break;
    case "TEACHER":
      courseWhere.OR = [
        { creatorId: empId },
        { departmentId: deptId },
        { departmentId: null },
        superAdminOrAdminCreator,
      ];
      break;
    case "LEARNER":
      courseWhere.status = "PUBLISHED";
      courseWhere.OR = [
        { departmentId: deptId },
        { departmentId: null },
        superAdminOrAdminCreator,
      ];
      break;
    case "GUEST":
      courseWhere.status = "PUBLISHED";
      break;
    default:
      courseWhere.status = "PUBLISHED";
  }

  // Build enrollment filter based on role
  let enrollmentWhere: any = {};
  if (role === "LEARNER") {
    enrollmentWhere.userId = empId;
  } else if (role === "TEACHER" || role === "ADMIN") {
    enrollmentWhere.courseId = {
      in: (
        await prisma.course.findMany({
          where: courseWhere,
          select: { id: true },
        })
      ).map((c) => c.id),
    };
  }

  const [
    coursesCount,
    publishedCoursesCount,
    draftCoursesCount,
    employeesCount,
    departmentsCount,
    enrollmentsCount,
    completedEnrollments,
  ] = await Promise.all([
    prisma.course.count({ where: courseWhere }),
    prisma.course.count({ where: { ...courseWhere, status: "PUBLISHED" } }),
    prisma.course.count({ where: { ...courseWhere, status: "DRAFT" } }),
    role === "SUPER_ADMIN"
      ? prisma.employee.count({ where: { employmentStatus: "ACTIVE" } })
      : role === "ADMIN"
        ? prisma.employee.count({ where: { departmentId: deptId, employmentStatus: "ACTIVE" } })
        : prisma.employee.count({ where: { employmentStatus: "ACTIVE" } }),
    prisma.department.count({ where: { isActive: true } }),
    prisma.enrollment.count({ where: enrollmentWhere }),
    prisma.enrollment.count({ where: { ...enrollmentWhere, status: "COMPLETED" } }),
  ]);

  const completionRate =
    enrollmentsCount > 0
      ? Math.round((completedEnrollments / enrollmentsCount) * 100 * 10) / 10
      : 0;

  return {
    coursesCount,
    publishedCoursesCount,
    draftCoursesCount,
    employeesCount,
    departmentsCount,
    activeEnrollments: enrollmentsCount,
    completedEnrollments,
    completionRate,
  };
};
