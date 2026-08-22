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
      ];
      break;
    case "TEACHER":
      courseWhere.OR = [
        { creatorId: empId },
        { teachers: { some: { teacherId: empId } } },
        { departmentId: deptId },
        { departmentId: null },
        { departmentId: BigInt(5) },
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
  let enrollmentWhere: any = { course: { isActive: true } };
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

  // Calculate total issued certificates from issuedCertificate table
  const totalCertificatesIssued = await prisma.issuedCertificate.count();

  // For Teacher / Admin assignment evaluation metrics
  const teacherCourseIds = (
    await prisma.course.findMany({
      where: courseWhere,
      select: { id: true },
    })
  ).map((c) => c.id);

  const [
    pendingAssignmentsCount,
    approvedAssignmentsCount,
  ] = await Promise.all([
    prisma.assessmentSubmission.count({
      where: {
        submissionType: { in: ["ASSIGNMENT", "FEEDBACK"] },
        courseId: { in: teacherCourseIds },
        status: { in: ["SUBMITTED", "PENDING"] },
      },
    }),
    prisma.assessmentSubmission.count({
      where: {
        submissionType: { in: ["ASSIGNMENT", "FEEDBACK"] },
        courseId: { in: teacherCourseIds },
        status: { in: ["GRADED", "EVALUATED", "APPROVED", "PASSED"] },
      },
    }),
  ]);

  return {
    coursesCount,
    publishedCoursesCount,
    draftCoursesCount,
    employeesCount,
    departmentsCount,
    activeEnrollments: enrollmentsCount,
    completedEnrollments,
    completionRate,
    totalCertificatesIssued,
    pendingAssignmentsCount,
    approvedAssignmentsCount,
  };
};
