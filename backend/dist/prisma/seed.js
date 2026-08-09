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
    // Departments
    const eng = await prisma.department.upsert({
        where: { departmentCode: "ENG" },
        update: {},
        create: { departmentCode: "ENG", departmentName: "Engineering" },
    });
    const hr = await prisma.department.upsert({
        where: { departmentCode: "HR" },
        update: {},
        create: { departmentCode: "HR", departmentName: "Human Resources" },
    });
    const mgt = await prisma.department.upsert({
        where: { departmentCode: "MGT" },
        update: {},
        create: { departmentCode: "MGT", departmentName: "Management" },
    });
    const sales = await prisma.department.upsert({
        where: { departmentCode: "SALES" },
        update: {},
        create: { departmentCode: "SALES", departmentName: "Sales" },
    });
    const mkt = await prisma.department.upsert({
        where: { departmentCode: "MKT" },
        update: {},
        create: { departmentCode: "MKT", departmentName: "Marketing" },
    });
    // Roles
    const roles = [
        ["SUPER_ADMIN", "SUPER_ADMIN"],
        ["ADMIN", "ADMIN"],
        ["TEACHER", "TEACHER"],
        ["LEARNER", "LEARNER"],
        ["GUEST", "GUEST"],
    ];
    for (const [name, code] of roles) {
        await prisma.role.upsert({
            where: { roleCode: code },
            update: {},
            create: { roleName: name, roleCode: code },
        });
    }
    const learnerRole = await prisma.role.findUniqueOrThrow({ where: { roleCode: "LEARNER" } });
    const teacherRole = await prisma.role.findUniqueOrThrow({ where: { roleCode: "TEACHER" } });
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { roleCode: "ADMIN" } });
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { roleCode: "SUPER_ADMIN" } });
    const guestRole = await prisma.role.findUniqueOrThrow({ where: { roleCode: "GUEST" } });
    // 1. Super Admin (Priyanka)
    const superadminEmp = await prisma.employee.upsert({
        where: { employeeCode: "EMP001" },
        update: {},
        create: {
            employeeCode: "EMP001",
            firstName: "Priyanka",
            lastName: "Davhare",
            officialEmail: "priyanka@company.com",
            designation: "Super Administrator",
            departmentId: eng.id,
            joiningDate: new Date(),
            employmentStatus: client_1.EmploymentStatus.ACTIVE,
        },
    });
    await prisma.userAccount.upsert({
        where: { employeeId: superadminEmp.id },
        update: {},
        create: {
            employeeId: superadminEmp.id,
            username: "priyanka",
            passwordHash,
        },
    });
    await prisma.userRole.upsert({
        where: { employeeId_roleId: { employeeId: superadminEmp.id, roleId: superAdminRole.id } },
        update: {},
        create: { employeeId: superadminEmp.id, roleId: superAdminRole.id },
    });
    // 2. Admin (Omprakash)
    const adminEmp = await prisma.employee.upsert({
        where: { employeeCode: "EMP002" },
        update: {},
        create: {
            employeeCode: "EMP002",
            firstName: "Omprakash",
            lastName: "Pandey",
            officialEmail: "omprakash@company.com",
            designation: "Department Admin",
            departmentId: mgt.id,
            joiningDate: new Date(),
            employmentStatus: client_1.EmploymentStatus.ACTIVE,
        },
    });
    await prisma.userAccount.upsert({
        where: { employeeId: adminEmp.id },
        update: {},
        create: {
            employeeId: adminEmp.id,
            username: "omprakash",
            passwordHash,
        },
    });
    await prisma.userRole.upsert({
        where: { employeeId_roleId: { employeeId: adminEmp.id, roleId: adminRole.id } },
        update: {},
        create: { employeeId: adminEmp.id, roleId: adminRole.id },
    });
    // 3. Teacher (Sneha)
    const teacherEmp = await prisma.employee.upsert({
        where: { employeeCode: "EMP004" },
        update: {},
        create: {
            employeeCode: "EMP004",
            firstName: "Sneha",
            lastName: "Patil",
            officialEmail: "sneha@company.com",
            designation: "Senior Instructor",
            departmentId: eng.id,
            joiningDate: new Date(),
            employmentStatus: client_1.EmploymentStatus.ACTIVE,
        },
    });
    await prisma.userAccount.upsert({
        where: { employeeId: teacherEmp.id },
        update: {},
        create: {
            employeeId: teacherEmp.id,
            username: "sneha",
            passwordHash,
        },
    });
    await prisma.userRole.upsert({
        where: { employeeId_roleId: { employeeId: teacherEmp.id, roleId: teacherRole.id } },
        update: {},
        create: { employeeId: teacherEmp.id, roleId: teacherRole.id },
    });
    // 4. Guest (Guest User)
    const guestEmp = await prisma.employee.upsert({
        where: { employeeCode: "EMP005" },
        update: {},
        create: {
            employeeCode: "EMP005",
            firstName: "Guest",
            lastName: "Visitor",
            officialEmail: "guest@company.com",
            designation: "Auditor",
            departmentId: hr.id,
            joiningDate: new Date(),
            employmentStatus: client_1.EmploymentStatus.ACTIVE,
        },
    });
    await prisma.userAccount.upsert({
        where: { employeeId: guestEmp.id },
        update: { passwordHash, isActive: true, username: "guest" },
        create: {
            employeeId: guestEmp.id,
            username: "guest",
            passwordHash,
        },
    });
    await prisma.userRole.upsert({
        where: { employeeId_roleId: { employeeId: guestEmp.id, roleId: guestRole.id } },
        update: {},
        create: { employeeId: guestEmp.id, roleId: guestRole.id },
    });
    // Seed default Guest Access Grant (Engineering Dept & Global access for default guest)
    const existingGrant = await prisma.guestAccessGrant.findFirst({
        where: { userId: guestEmp.id },
    });
    if (!existingGrant) {
        await prisma.guestAccessGrant.create({
            data: {
                userId: guestEmp.id,
                departmentId: eng.id,
                scope: "DEPARTMENT",
                grantedById: superadminEmp.id,
                isActive: true,
            },
        });
        await prisma.guestAccessGrant.create({
            data: {
                scope: "GLOBAL",
                grantedById: superadminEmp.id,
                isActive: true,
            },
        });
    }
    // 5 Dedicated Learners for testing across different departments
    const dummyLearners = [
        { code: "EMP101", username: "learner1", first: "Aarav", last: "Verma", dept: eng, email: "learner1@company.com" },
        { code: "EMP102", username: "learner2", first: "Diya", last: "Kulkarni", dept: hr, email: "learner2@company.com" },
        { code: "EMP103", username: "learner3", first: "Rohan", last: "Mehta", dept: mgt, email: "learner3@company.com" },
        { code: "EMP104", username: "learner4", first: "Ananya", last: "Singh", dept: sales, email: "learner4@company.com" },
        { code: "EMP105", username: "learner5", first: "Vikram", last: "Nair", dept: mkt, email: "learner5@company.com" },
    ];
    const createdLearners = [];
    for (const l of dummyLearners) {
        const emp = await prisma.employee.upsert({
            where: { employeeCode: l.code },
            update: {},
            create: {
                employeeCode: l.code,
                firstName: l.first,
                lastName: l.last,
                officialEmail: l.email,
                designation: `Associate (${l.dept.departmentName})`,
                departmentId: l.dept.id,
                joiningDate: new Date(),
                employmentStatus: client_1.EmploymentStatus.ACTIVE,
            },
        });
        await prisma.userAccount.upsert({
            where: { employeeId: emp.id },
            update: {},
            create: {
                employeeId: emp.id,
                username: l.username,
                passwordHash,
            },
        });
        await prisma.userRole.upsert({
            where: { employeeId_roleId: { employeeId: emp.id, roleId: learnerRole.id } },
            update: {},
            create: { employeeId: emp.id, roleId: learnerRole.id },
        });
        createdLearners.push(emp);
    }
    // Categories
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
    // Create a comprehensive sample course with dynamic sections, lessons, quiz, assignment, and assigned teacher
    let sampleCourse = await prisma.course.findFirst({
        where: { title: "Fullstack System Architecture & Security" },
    });
    if (!sampleCourse) {
        sampleCourse = await prisma.course.create({
            data: {
                title: "Fullstack System Architecture & Security",
                shortDescription: "Master microservice architecture, API design, RBAC security, and dynamic workflows.",
                description: "An intensive enterprise course covering modern web architecture, distributed systems, role-based access control, security best practices, and hands-on assessments.",
                categoryId: categories["Technical"].id,
                departmentId: eng.id,
                creatorId: superadminEmp.id,
                level: "Intermediate",
                language: "English",
                duration: 35,
                status: client_1.CourseStatus.PUBLISHED,
                enrollmentType: "SELF",
            },
        });
    }
    // Assign Teacher Sneha to sampleCourse
    await prisma.courseTeacher.upsert({
        where: {
            courseId_teacherId: {
                courseId: sampleCourse.id,
                teacherId: teacherEmp.id,
            },
        },
        update: {},
        create: {
            courseId: sampleCourse.id,
            teacherId: teacherEmp.id,
        },
    });
    // Create Sections & Contents for sampleCourse
    let section1 = await prisma.courseSection.findFirst({
        where: { courseId: sampleCourse.id, title: "Module 1: Architecture & API Design" },
    });
    if (!section1) {
        section1 = await prisma.courseSection.create({
            data: {
                courseId: sampleCourse.id,
                title: "Module 1: Architecture & API Design",
                description: "Fundamental concepts of distributed systems and microservices.",
                sectionOrder: 1,
                isPublished: true,
            },
        });
        await prisma.learningContent.createMany({
            data: [
                {
                    sectionId: section1.id,
                    title: "1.1 Introduction to Enterprise Architecture",
                    contentType: "LESSON",
                    description: "Understanding monolithic vs microservice architectures, API gateways, and domain-driven design.",
                    duration: 15,
                    contentOrder: 1,
                    isMandatory: true,
                    isPublished: true,
                },
                {
                    sectionId: section1.id,
                    title: "1.2 Video Walkthrough: RESTful API Principles",
                    contentType: "VIDEO",
                    contentUrl: "https://www.youtube.com/watch?v=lsMQRaeHwkY",
                    description: "Detailed video breakdown of HTTP verbs, status codes, payload design, and JWT auth flow.",
                    duration: 20,
                    contentOrder: 2,
                    isMandatory: true,
                    isPublished: true,
                },
            ],
        });
    }
    let section2 = await prisma.courseSection.findFirst({
        where: { courseId: sampleCourse.id, title: "Module 2: Hands-on Assessment & Security" },
    });
    if (!section2) {
        section2 = await prisma.courseSection.create({
            data: {
                courseId: sampleCourse.id,
                title: "Module 2: Hands-on Assessment & Security",
                description: "Evaluate your knowledge with automated quizzes and a graded assignment.",
                sectionOrder: 2,
                isPublished: true,
            },
        });
        // Quiz Content with MCQs
        const quizQuestions = [
            {
                id: 1,
                question: "Which HTTP status code signifies a resource was successfully created?",
                options: ["200 OK", "201 Created", "400 Bad Request", "500 Server Error"],
                correctIndex: 1,
                explanation: "201 Created is the standard HTTP status code for successful creation of a resource.",
            },
            {
                id: 2,
                question: "What does JWT stand for in web security authentication?",
                options: ["Java Web Token", "JSON Web Token", "JavaScript Web Transfer", "Joint Work Task"],
                correctIndex: 1,
                explanation: "JWT stands for JSON Web Token.",
            },
            {
                id: 3,
                question: "Which pattern is best suited for decoupled asynchronous event processing?",
                options: ["Synchronous RPC", "Pub/Sub Messaging Queue", "Direct Database Access", "Polled File Access"],
                correctIndex: 1,
                explanation: "Publish/Subscribe messaging queues allow decoupled asynchronous message handling.",
            },
        ];
        await prisma.learningContent.create({
            data: {
                sectionId: section2.id,
                title: "2.1 System Architecture & Security Quiz",
                contentType: "QUIZ",
                description: "Answer the following 3 multiple choice questions to test your comprehension.",
                duration: 10,
                contentOrder: 1,
                isMandatory: true,
                isPublished: true,
                quizConfigJson: JSON.stringify(quizQuestions),
            },
        });
        // Assignment Content
        const assignmentConfig = {
            instructions: "Design a secure Express.js microservice API endpoint that validates JWT tokens and implements role-based access control (RBAC). Submit your solution text or GitHub repo URL below.",
            maxScore: 100,
            requiresGrading: true,
        };
        await prisma.learningContent.create({
            data: {
                sectionId: section2.id,
                title: "2.2 Practical Assignment: Build RBAC Express Service",
                contentType: "ASSIGNMENT",
                description: "Hands-on assignment required for course completion. Submissions will be graded by the assigned Teacher.",
                duration: 45,
                contentOrder: 2,
                isMandatory: true,
                isPublished: true,
                assignmentConfigJson: JSON.stringify(assignmentConfig),
            },
        });
    }
    // Enroll Learner 1 in sampleCourse
    await prisma.enrollment.upsert({
        where: {
            userId_courseId: {
                userId: createdLearners[0].id,
                courseId: sampleCourse.id,
            },
        },
        update: {},
        create: {
            userId: createdLearners[0].id,
            courseId: sampleCourse.id,
            status: "IN_PROGRESS",
            progress: 0,
        },
    });
    console.log("Database seeded successfully with 5 dummy learners and sample dynamic course!");
}
main().finally(() => prisma.$disconnect());
