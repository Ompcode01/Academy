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
    console.log("Seed completed.");
}
main().finally(() => prisma.$disconnect());
