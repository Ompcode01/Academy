"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Seeding rich reporting data...");
    const passwordHash = await bcrypt_1.default.hash("Admin@123", 10);
    // 1. Ensure Departments
    const deptMap = {};
    const depts = [
        { code: "ENG", name: "Engineering" },
        { code: "HR", name: "Human Resources" },
        { code: "MGT", name: "Management" },
        { code: "SALES", name: "Sales" },
        { code: "MKT", name: "Marketing" },
    ];
    for (const d of depts) {
        deptMap[d.code] = await prisma.department.upsert({
            where: { departmentCode: d.code },
            update: {},
            create: { departmentCode: d.code, departmentName: d.name },
        });
    }
    // 2. Roles
    const roles = ["SUPER_ADMIN", "ADMIN", "TEACHER", "LEARNER", "GUEST"];
    const roleMap = {};
    for (const r of roles) {
        roleMap[r] = await prisma.role.upsert({
            where: { roleCode: r },
            update: {},
            create: { roleName: r, roleCode: r },
        });
    }
    // 3. Super Admin & Admin Employees
    const superadminEmp = await prisma.employee.upsert({
        where: { employeeCode: "EMP001" },
        update: {},
        create: {
            employeeCode: "EMP001",
            firstName: "Priyanka",
            lastName: "Davhare",
            officialEmail: "priyanka@company.com",
            designation: "Super Administrator",
            departmentId: deptMap["ENG"].id,
            joiningDate: new Date("2024-01-15"),
            employmentStatus: client_1.EmploymentStatus.ACTIVE,
        },
    });
    await prisma.userAccount.upsert({
        where: { employeeId: superadminEmp.id },
        update: {},
        create: { employeeId: superadminEmp.id, username: "priyanka", passwordHash, lastLogin: new Date() },
    });
    await prisma.userRole.upsert({
        where: { employeeId_roleId: { employeeId: superadminEmp.id, roleId: roleMap["SUPER_ADMIN"].id } },
        update: {},
        create: { employeeId: superadminEmp.id, roleId: roleMap["SUPER_ADMIN"].id },
    });
    const adminEmp = await prisma.employee.upsert({
        where: { employeeCode: "EMP002" },
        update: {},
        create: {
            employeeCode: "EMP002",
            firstName: "Omprakash",
            lastName: "Pandey",
            officialEmail: "omprakash@company.com",
            designation: "Department Admin",
            departmentId: deptMap["MGT"].id,
            joiningDate: new Date("2024-02-01"),
            employmentStatus: client_1.EmploymentStatus.ACTIVE,
        },
    });
    await prisma.userAccount.upsert({
        where: { employeeId: adminEmp.id },
        update: {},
        create: { employeeId: adminEmp.id, username: "omprakash", passwordHash, lastLogin: new Date() },
    });
    await prisma.userRole.upsert({
        where: { employeeId_roleId: { employeeId: adminEmp.id, roleId: roleMap["ADMIN"].id } },
        update: {},
        create: { employeeId: adminEmp.id, roleId: roleMap["ADMIN"].id },
    });
    // 4. Create 15 Learners across departments
    const learnerDefs = [
        { code: "EMP101", username: "learner1", first: "Aarav", last: "Verma", dept: "ENG" },
        { code: "EMP102", username: "learner2", first: "Diya", last: "Kulkarni", dept: "HR" },
        { code: "EMP103", username: "learner3", first: "Rohan", last: "Mehta", dept: "MGT" },
        { code: "EMP104", username: "learner4", first: "Ananya", last: "Singh", dept: "SALES" },
        { code: "EMP105", username: "learner5", first: "Vikram", last: "Nair", dept: "MKT" },
        { code: "EMP106", username: "learner6", first: "Siddharth", last: "Rao", dept: "ENG" },
        { code: "EMP107", username: "learner7", first: "Neha", last: "Gupta", dept: "ENG" },
        { code: "EMP108", username: "learner8", first: "Kabir", last: "Sharma", dept: "HR" },
        { code: "EMP109", username: "learner9", first: "Ishita", last: "Joshi", dept: "MGT" },
        { code: "EMP110", username: "learner10", first: "Aditya", last: "Deshmukh", dept: "SALES" },
        { code: "EMP111", username: "learner11", first: "Pooja", last: "Chawla", dept: "MKT" },
        { code: "EMP112", username: "learner12", first: "Rahul", last: "Kapoor", dept: "ENG" },
        { code: "EMP113", username: "learner13", first: "Tanvi", last: "Patel", dept: "HR" },
        { code: "EMP114", username: "learner14", first: "Manish", last: "Kumar", dept: "SALES" },
        { code: "EMP115", username: "learner15", first: "Riya", last: "Sen", dept: "MKT" },
    ];
    const employees = {};
    employees["EMP001"] = superadminEmp;
    employees["EMP002"] = adminEmp;
    for (const l of learnerDefs) {
        const deptObj = deptMap[l.dept];
        const emp = await prisma.employee.upsert({
            where: { employeeCode: l.code },
            update: {},
            create: {
                employeeCode: l.code,
                firstName: l.first,
                lastName: l.last,
                officialEmail: `${l.username}@company.com`,
                designation: `Specialist (${deptObj.departmentName})`,
                departmentId: deptObj.id,
                joiningDate: new Date("2024-03-01"),
                employmentStatus: client_1.EmploymentStatus.ACTIVE,
            },
        });
        const daysAgo = Math.floor(Math.random() * 45);
        const lastLoginDate = new Date();
        lastLoginDate.setDate(lastLoginDate.getDate() - daysAgo);
        await prisma.userAccount.upsert({
            where: { employeeId: emp.id },
            update: { lastLogin: lastLoginDate },
            create: { employeeId: emp.id, username: l.username, passwordHash, lastLogin: lastLoginDate },
        });
        await prisma.userRole.upsert({
            where: { employeeId_roleId: { employeeId: emp.id, roleId: roleMap["LEARNER"].id } },
            update: {},
            create: { employeeId: emp.id, roleId: roleMap["LEARNER"].id },
        });
        employees[l.code] = emp;
    }
    // 5. Categories
    const catNames = ["Technical", "Management", "Soft Skills", "HR Compliance"];
    const catMap = {};
    for (const cn of catNames) {
        catMap[cn] = await prisma.category.upsert({
            where: { name: cn },
            update: {},
            create: { name: cn, description: `${cn} learning track` },
        });
    }
    // 6. Courses
    const courseDefs = [
        { title: "Fullstack System Architecture & Security", category: "Technical", dept: "ENG", mandatory: false, duration: 40 },
        { title: "React & Next.js Enterprise Masterclass", category: "Technical", dept: "ENG", mandatory: false, duration: 30 },
        { title: "Cloud Infrastructure & DevOps", category: "Technical", dept: "ENG", mandatory: false, duration: 35 },
        { title: "Strategic Leadership & Change Management", category: "Management", dept: "MGT", mandatory: false, duration: 25 },
        { title: "Enterprise Agile & Scrum Execution", category: "Management", dept: "MGT", mandatory: false, duration: 20 },
        { title: "Executive Communication & Negotiation", category: "Soft Skills", dept: "SALES", mandatory: false, duration: 15 },
        { title: "Information Security & Compliance 2026", category: "HR Compliance", dept: "HR", mandatory: true, duration: 10 },
        { title: "Workplace Ethics & POSH Awareness", category: "HR Compliance", dept: "HR", mandatory: true, duration: 12 },
    ];
    const courseMap = {};
    for (const c of courseDefs) {
        let existing = await prisma.course.findFirst({ where: { title: c.title } });
        if (!existing) {
            existing = await prisma.course.create({
                data: {
                    title: c.title,
                    shortDescription: `Enterprise training course for ${c.title}`,
                    description: `Detailed curriculum covering ${c.title}`,
                    categoryId: catMap[c.category].id,
                    departmentId: deptMap[c.dept].id,
                    creatorId: superadminEmp.id,
                    level: "Intermediate",
                    language: "English",
                    duration: c.duration,
                    status: client_1.CourseStatus.PUBLISHED,
                    enrollmentType: "SELF",
                    isMandatory: c.mandatory,
                },
            });
        }
        else {
            await prisma.course.update({
                where: { id: existing.id },
                data: { isMandatory: c.mandatory },
            });
        }
        courseMap[c.title] = existing;
    }
    // 7. Seed Enrollments across employees & courses
    console.log("Seeding realistic enrollments, assessments & certificates...");
    const allEmpList = Object.values(employees);
    const allCourseList = Object.values(courseMap);
    const statuses = ["COMPLETED", "IN_PROGRESS", "NOT_STARTED", "OVERDUE"];
    for (let i = 0; i < allEmpList.length; i++) {
        const emp = allEmpList[i];
        // Each employee enrolled in 3 to 5 courses
        const numCourses = 3 + (i % 3);
        for (let j = 0; j < numCourses; j++) {
            const course = allCourseList[(i + j) % allCourseList.length];
            const isMandatory = course.isMandatory || (j === 0 && i % 2 === 0);
            // Determine status & timestamps
            let status = statuses[(i + j) % statuses.length];
            let progress = 0;
            let timeSpent = 0;
            let sessions = 1;
            const now = new Date();
            const enrolledAt = new Date(now.getTime() - (30 - (i % 20)) * 86400000);
            let startDate = new Date(enrolledAt.getTime() + 86400000);
            let completedAt = null;
            let dueDate = new Date(enrolledAt.getTime() + 20 * 86400000);
            let lastActivityAt = new Date(now.getTime() - (i % 15) * 86400000);
            if (status === "COMPLETED") {
                progress = 100;
                timeSpent = (course.duration || 20) * 3600;
                sessions = 5 + (i % 4);
                completedAt = new Date(enrolledAt.getTime() + (7 + (i % 5)) * 86400000);
                lastActivityAt = completedAt;
            }
            else if (status === "IN_PROGRESS") {
                progress = 25 + (i * 10) % 65;
                timeSpent = Math.floor(((course.duration || 20) * 3600 * progress) / 100);
                sessions = 2 + (i % 3);
            }
            else if (status === "NOT_STARTED") {
                progress = 0;
                timeSpent = 0;
                sessions = 0;
                startDate = null;
                lastActivityAt = null;
            }
            else if (status === "OVERDUE") {
                progress = 15;
                timeSpent = 1800;
                sessions = 1;
                dueDate = new Date(now.getTime() - (5 + (i % 10)) * 86400000); // Past due date
            }
            await prisma.enrollment.upsert({
                where: {
                    userId_courseId: {
                        userId: emp.id,
                        courseId: course.id,
                    },
                },
                update: {
                    status,
                    progress,
                    timeSpentSeconds: timeSpent,
                    sessionsCount: sessions,
                    isMandatory,
                    enrolledAt,
                    startDate,
                    completedAt,
                    dueDate,
                    lastActivityAt,
                },
                create: {
                    userId: emp.id,
                    courseId: course.id,
                    status,
                    progress,
                    timeSpentSeconds: timeSpent,
                    sessionsCount: sessions,
                    isMandatory,
                    enrolledAt,
                    startDate,
                    completedAt,
                    dueDate,
                    lastActivityAt,
                },
            });
        }
    }
    console.log("Rich reporting data seeded successfully!");
}
main()
    .catch((e) => {
    console.error("Error seeding reporting data:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
