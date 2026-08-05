"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getDashboardStats = async (userContext) => {
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
    let courseWhere = { isActive: true };
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
    let enrollmentWhere = {};
    if (role === "LEARNER") {
        enrollmentWhere.userId = empId;
    }
    else if (role === "TEACHER" || role === "ADMIN") {
        enrollmentWhere.courseId = {
            in: (await prisma_1.default.course.findMany({
                where: courseWhere,
                select: { id: true },
            })).map((c) => c.id),
        };
    }
    const [coursesCount, publishedCoursesCount, draftCoursesCount, employeesCount, departmentsCount, enrollmentsCount, completedEnrollments,] = await Promise.all([
        prisma_1.default.course.count({ where: courseWhere }),
        prisma_1.default.course.count({ where: { ...courseWhere, status: "PUBLISHED" } }),
        prisma_1.default.course.count({ where: { ...courseWhere, status: "DRAFT" } }),
        role === "SUPER_ADMIN"
            ? prisma_1.default.employee.count({ where: { employmentStatus: "ACTIVE" } })
            : role === "ADMIN"
                ? prisma_1.default.employee.count({ where: { departmentId: deptId, employmentStatus: "ACTIVE" } })
                : prisma_1.default.employee.count({ where: { employmentStatus: "ACTIVE" } }),
        prisma_1.default.department.count({ where: { isActive: true } }),
        prisma_1.default.enrollment.count({ where: enrollmentWhere }),
        prisma_1.default.enrollment.count({ where: { ...enrollmentWhere, status: "COMPLETED" } }),
    ]);
    const completionRate = enrollmentsCount > 0
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
exports.getDashboardStats = getDashboardStats;
