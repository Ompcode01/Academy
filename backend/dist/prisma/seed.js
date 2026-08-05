"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcrypt_1.default.hash("Admin@123", 10);
    const eng = await prisma.department.upsert({
        where: { departmentCode: "ENG" },
        update: {},
        create: { departmentCode: "ENG", departmentName: "Engineering" }
    });
    const hr = await prisma.department.upsert({
        where: { departmentCode: "HR" },
        update: {},
        create: { departmentCode: "HR", departmentName: "Human Resources" }
    });
    const mgt = await prisma.department.upsert({
        where: { departmentCode: "MGT" },
        update: {},
        create: { departmentCode: "MGT", departmentName: "Management" }
    });
    const roles = [
        ["SUPER_ADMIN", "SUPER_ADMIN"],
        ["ADMIN", "ADMIN"],
        ["TEACHER", "TEACHER"],
        ["LEARNER", "LEARNER"],
        ["GUEST", "GUEST"]
    ];
    for (const [name, code] of roles) {
        await prisma.role.upsert({
            where: { roleCode: code },
            update: {},
            create: { roleName: name, roleCode: code }
        });
    }
    const departments = [eng, mgt, mgt, hr];
    const names = [
        ["EMP001", "Priyanka", "Davhare"],
        ["EMP002", "Omprakash", "Pandey"],
        ["EMP003", "Rahul", "Sharma"],
        ["EMP004", "Sneha", "Patil"]
    ];
    for (let i = 0; i < 20; i++) {
        const code = names[i]?.[0] ?? `EMP${String(i + 1).padStart(3, "0")}`;
        const first = names[i]?.[1] ?? `Employee${i + 1}`;
        const last = names[i]?.[2] ?? "User";
        const dept = i % 3 === 0 ? eng : i % 3 === 1 ? mgt : hr;
        const emp = await prisma.employee.upsert({
            where: { employeeCode: code },
            update: {},
            create: {
                employeeCode: code,
                firstName: first,
                lastName: last,
                officialEmail: `${first.toLowerCase()}${i + 1}@company.com`,
                designation: "Software Engineer",
                departmentId: dept.id,
                joiningDate: new Date(),
                employmentStatus: client_1.EmploymentStatus.ACTIVE
            }
        });
        await prisma.userAccount.upsert({
            where: { employeeId: emp.id },
            update: {},
            create: {
                employeeId: emp.id,
                username: first.toLowerCase(),
                passwordHash
            }
        });
        const roleCode = i === 0 ? "SUPER_ADMIN" : i <= 2 ? "ADMIN" : i === 3 ? "TEACHER" : i === 4 ? "GUEST" : "LEARNER";
        const role = await prisma.role.findUniqueOrThrow({ where: { roleCode } });
        await prisma.userRole.upsert({
            where: { employeeId_roleId: { employeeId: emp.id, roleId: role.id } },
            update: {},
            create: { employeeId: emp.id, roleId: role.id }
        });
    }
    // Seed categories
    const categoryData = [
        { name: "Technical", description: "Technical and engineering courses" },
        { name: "Management", description: "Leadership and management training" },
        { name: "Soft Skills", description: "Communication and interpersonal skills" },
        { name: "HR", description: "Human resources and compliance" },
    ];
    const categories = {};
    for (const cat of categoryData) {
        categories[cat.name] = await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        });
    }
    // Get the teacher and superadmin employees for course creation
    const teacherEmp = await prisma.employee.findUnique({ where: { employeeCode: "EMP004" } });
    const superadminEmp = await prisma.employee.findUnique({ where: { employeeCode: "EMP001" } });
    if (teacherEmp && superadminEmp) {
        // Seed sample courses
        const coursesData = [
            {
                title: "Java Fundamentals",
                shortDescription: "Learn the core concepts of Java programming",
                description: "A comprehensive course covering Java basics, OOP principles, and practical exercises.",
                categoryId: categories["Technical"].id,
                departmentId: eng.id,
                creatorId: teacherEmp.id,
                level: "Beginner",
                language: "English",
                duration: 40,
                status: client_1.CourseStatus.PUBLISHED,
            },
            {
                title: "Leadership Essentials",
                shortDescription: "Develop your leadership and team management skills",
                description: "This course covers essential leadership concepts, team dynamics, and decision-making frameworks.",
                categoryId: categories["Management"].id,
                departmentId: mgt.id,
                creatorId: superadminEmp.id,
                level: "Intermediate",
                language: "English",
                duration: 20,
                status: client_1.CourseStatus.PUBLISHED,
            },
            {
                title: "Effective Communication",
                shortDescription: "Master workplace communication skills",
                description: "Learn verbal and written communication techniques for professional success.",
                categoryId: categories["Soft Skills"].id,
                departmentId: null,
                creatorId: teacherEmp.id,
                level: "Beginner",
                language: "English",
                duration: 15,
                status: client_1.CourseStatus.DRAFT,
            },
            {
                title: "HR Compliance Basics",
                shortDescription: "Understand core HR compliance requirements",
                description: "Covering workplace regulations, employee rights, and compliance best practices.",
                categoryId: categories["HR"].id,
                departmentId: hr.id,
                creatorId: superadminEmp.id,
                level: "Beginner",
                language: "English",
                duration: 10,
                status: client_1.CourseStatus.PUBLISHED,
            },
            {
                title: "Data Structures in Java",
                shortDescription: "Deep dive into data structures using Java",
                description: "Arrays, linked lists, trees, graphs, and algorithmic complexity analysis.",
                categoryId: categories["Technical"].id,
                departmentId: eng.id,
                creatorId: teacherEmp.id,
                level: "Advanced",
                language: "English",
                duration: 60,
                status: client_1.CourseStatus.DRAFT,
            },
        ];
        for (const courseData of coursesData) {
            const existing = await prisma.course.findFirst({
                where: { title: courseData.title },
            });
            if (!existing) {
                await prisma.course.create({ data: courseData });
            }
        }
    }
    console.log("Seed completed.");
}
main().finally(() => prisma.$disconnect());
