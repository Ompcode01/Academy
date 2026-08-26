import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function toBigInt(val: any): bigint {
  return BigInt(val);
}

function toBigIntNullable(val: any): bigint | null {
  return val !== null && val !== undefined ? BigInt(val) : null;
}

function toDateNullable(val: any): Date | null {
  return val ? new Date(val) : null;
}

async function importDatabase() {
  console.log("==========================================");
  console.log(" Harbinger Academy LMS - Database Import  ");
  console.log("==========================================");

  const dumpPath = path.join(__dirname, "..", "prisma", "data_dump.json");
  if (!fs.existsSync(dumpPath)) {
    console.log("⚠️ No data_dump.json snapshot file found in backend/prisma/.");
    console.log("   Falling back to standard database seed...\n");
    require("child_process").execSync("npm run seed", { stdio: "inherit" });
    return;
  }

  console.log(`Reading database snapshot from: ${dumpPath}\n`);
  const raw = fs.readFileSync(dumpPath, "utf-8");
  const dump = JSON.parse(raw);

  try {
    console.log("Cleaning target database before snapshot import...");
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);
    const tables = [
      "audit_logs",
      "notifications",
      "events",
      "guest_access_grants",
      "issued_certificates",
      "assessment_submissions",
      "user_lesson_progress",
      "enrollments",
      "learning_contents",
      "course_sections",
      "course_teachers",
      "courses",
      "categories",
      "role_permissions",
      "user_roles",
      "permissions",
      "roles",
      "user_accounts",
      "employees",
      "departments",
    ];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
    }
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
    console.log("✓ Database cleaned successfully.\n");
    // 1. Departments
    if (dump.departments?.length > 0) {
      for (const d of dump.departments) {
        await prisma.department.upsert({
          where: { id: toBigInt(d.id) },
          update: {},
          create: {
            id: toBigInt(d.id),
            departmentCode: d.departmentCode,
            departmentName: d.departmentName,
            isActive: d.isActive ?? true,
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt),
          },
        });
      }
      console.log(`✓ Restored ${dump.departments.length} departments`);
    }

    // 2. Employees
    if (dump.employees?.length > 0) {
      for (const e of dump.employees) {
        await prisma.employee.upsert({
          where: { id: toBigInt(e.id) },
          update: {},
          create: {
            id: toBigInt(e.id),
            employeeCode: e.employeeCode,
            firstName: e.firstName,
            lastName: e.lastName,
            officialEmail: e.officialEmail,
            phoneNumber: e.phoneNumber,
            designation: e.designation,
            departmentId: toBigInt(e.departmentId),
            managerId: toBigIntNullable(e.managerId),
            joiningDate: new Date(e.joiningDate),
            profileImage: e.profileImage,
            employmentStatus: e.employmentStatus || "ACTIVE",
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt),
          },
        });
      }
      console.log(`✓ Restored ${dump.employees.length} employees`);
    }

    // 3. User Accounts
    if (dump.userAccounts?.length > 0) {
      for (const u of dump.userAccounts) {
        await prisma.userAccount.upsert({
          where: { id: toBigInt(u.id) },
          update: {},
          create: {
            id: toBigInt(u.id),
            employeeId: toBigInt(u.employeeId),
            username: u.username,
            passwordHash: u.passwordHash,
            lastLogin: toDateNullable(u.lastLogin),
            failedLoginAttempts: u.failedLoginAttempts || 0,
            accountLocked: u.accountLocked ?? false,
            passwordChangedAt: toDateNullable(u.passwordChangedAt),
            isActive: u.isActive ?? true,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          },
        });
      }
      console.log(`✓ Restored ${dump.userAccounts.length} user accounts`);
    }

    // 4. Roles & Permissions
    if (dump.roles?.length > 0) {
      for (const r of dump.roles) {
        await prisma.role.upsert({
          where: { id: toBigInt(r.id) },
          update: {},
          create: {
            id: toBigInt(r.id),
            roleName: r.roleName,
            roleCode: r.roleCode,
            description: r.description,
            isActive: r.isActive ?? true,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
          },
        });
      }
    }
    if (dump.permissions?.length > 0) {
      for (const p of dump.permissions) {
        await prisma.permission.upsert({
          where: { id: toBigInt(p.id) },
          update: {},
          create: {
            id: toBigInt(p.id),
            permissionName: p.permissionName,
            permissionCode: p.permissionCode,
            moduleName: p.moduleName,
            description: p.description,
            isActive: p.isActive ?? true,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          },
        });
      }
    }
    if (dump.userRoles?.length > 0) {
      for (const ur of dump.userRoles) {
        await prisma.userRole.upsert({
          where: {
            employeeId_roleId: {
              employeeId: toBigInt(ur.employeeId),
              roleId: toBigInt(ur.roleId),
            },
          },
          update: {},
          create: {
            employeeId: toBigInt(ur.employeeId),
            roleId: toBigInt(ur.roleId),
            assignedBy: toBigIntNullable(ur.assignedBy),
            assignedAt: new Date(ur.assignedAt),
          },
        });
      }
    }
    if (dump.rolePermissions?.length > 0) {
      for (const rp of dump.rolePermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: toBigInt(rp.roleId),
              permissionId: toBigInt(rp.permissionId),
            },
          },
          update: {},
          create: {
            roleId: toBigInt(rp.roleId),
            permissionId: toBigInt(rp.permissionId),
          },
        });
      }
    }

    // 5. Categories
    if (dump.categories?.length > 0) {
      for (const c of dump.categories) {
        await prisma.category.upsert({
          where: { id: toBigInt(c.id) },
          update: {},
          create: {
            id: toBigInt(c.id),
            name: c.name,
            description: c.description,
            isActive: c.isActive ?? true,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          },
        });
      }
      console.log(`✓ Restored ${dump.categories.length} categories`);
    }

    // 6. Courses
    if (dump.courses?.length > 0) {
      for (const crs of dump.courses) {
        await prisma.course.upsert({
          where: { id: toBigInt(crs.id) },
          update: {
            title: crs.title,
            shortDescription: crs.shortDescription,
            description: crs.description,
            thumbnail: crs.thumbnail,
            duration: crs.duration,
            level: crs.level,
            language: crs.language,
            status: crs.status,
            enrollmentType: crs.enrollmentType,
            isActive: crs.isActive ?? true,
          },
          create: {
            id: toBigInt(crs.id),
            categoryId: toBigInt(crs.categoryId),
            departmentId: toBigIntNullable(crs.departmentId),
            creatorId: toBigInt(crs.creatorId),
            title: crs.title,
            shortDescription: crs.shortDescription,
            description: crs.description,
            thumbnail: crs.thumbnail,
            duration: crs.duration,
            level: crs.level,
            language: crs.language,
            status: crs.status,
            enrollmentType: crs.enrollmentType,
            isActive: crs.isActive ?? true,
            createdAt: new Date(crs.createdAt),
            updatedAt: new Date(crs.updatedAt),
          },
        });
      }
      console.log(`✓ Restored ${dump.courses.length} courses`);
    }

    // 7. Course Sections
    if (dump.courseSections?.length > 0) {
      for (const cs of dump.courseSections) {
        await prisma.courseSection.upsert({
          where: { id: toBigInt(cs.id) },
          update: {
            title: cs.title,
            description: cs.description,
            sectionOrder: cs.sectionOrder,
            isPublished: cs.isPublished ?? true,
          },
          create: {
            id: toBigInt(cs.id),
            courseId: toBigInt(cs.courseId),
            title: cs.title,
            description: cs.description,
            sectionOrder: cs.sectionOrder,
            isPublished: cs.isPublished ?? true,
            createdAt: new Date(cs.createdAt),
            updatedAt: new Date(cs.updatedAt),
          },
        });
      }
      console.log(`✓ Restored ${dump.courseSections.length} course sections`);
    }

    // 8. Learning Contents
    if (dump.learningContents?.length > 0) {
      for (const lc of dump.learningContents) {
        await prisma.learningContent.upsert({
          where: { id: toBigInt(lc.id) },
          update: {
            title: lc.title,
            contentType: lc.contentType,
            contentUrl: lc.contentUrl,
            description: lc.description,
            duration: lc.duration,
            contentOrder: lc.contentOrder,
            isMandatory: lc.isMandatory ?? true,
            isPublished: lc.isPublished ?? true,
            quizConfigJson: lc.quizConfigJson,
            assignmentConfigJson: lc.assignmentConfigJson,
          },
          create: {
            id: toBigInt(lc.id),
            sectionId: toBigInt(lc.sectionId),
            title: lc.title,
            contentType: lc.contentType,
            contentUrl: lc.contentUrl,
            description: lc.description,
            duration: lc.duration,
            contentOrder: lc.contentOrder,
            isMandatory: lc.isMandatory ?? true,
            isPublished: lc.isPublished ?? true,
            quizConfigJson: lc.quizConfigJson,
            assignmentConfigJson: lc.assignmentConfigJson,
            createdAt: new Date(lc.createdAt),
            updatedAt: new Date(lc.updatedAt),
          },
        });
      }
      console.log(`✓ Restored ${dump.learningContents.length} learning contents`);
    }

    // 9. Enrollments
    if (dump.enrollments?.length > 0) {
      for (const en of dump.enrollments) {
        await prisma.enrollment.upsert({
          where: { id: toBigInt(en.id) },
          update: {
            userId: toBigInt(en.userId),
            courseId: toBigInt(en.courseId),
            progress: en.progress,
            status: en.status,
            completedAt: toDateNullable(en.completedAt),
          },
          create: {
            id: toBigInt(en.id),
            userId: toBigInt(en.userId),
            courseId: toBigInt(en.courseId),
            enrolledAt: new Date(en.enrolledAt),
            progress: en.progress,
            status: en.status,
            completedAt: toDateNullable(en.completedAt),
          },
        });
      }
      console.log(`✓ Restored ${dump.enrollments.length} enrollments`);
    }

    // 10. User Lesson Progresses
    if (dump.userLessonProgresses?.length > 0) {
      for (const ulp of dump.userLessonProgresses) {
        await prisma.userLessonProgress.upsert({
          where: { 
            userId_contentId: {
              userId: toBigInt(ulp.userId),
              contentId: toBigInt(ulp.contentId)
            }
          },
          update: {
            isCompleted: ulp.isCompleted ?? true,
            completedAt: new Date(ulp.completedAt),
          },
          create: {
            userId: toBigInt(ulp.userId),
            courseId: toBigInt(ulp.courseId),
            contentId: toBigInt(ulp.contentId),
            isCompleted: ulp.isCompleted ?? true,
            completedAt: new Date(ulp.completedAt),
          },
        });
      }
    }

    // 11. Assessment Submissions
    if (dump.assessmentSubmissions?.length > 0) {
      for (const asub of dump.assessmentSubmissions) {
        await prisma.assessmentSubmission.upsert({
          where: { id: toBigInt(asub.id) },
          update: {},
          create: {
            id: toBigInt(asub.id),
            userId: toBigInt(asub.userId),
            courseId: toBigInt(asub.courseId),
            contentId: toBigIntNullable(asub.contentId),
            submissionType: asub.submissionType || "QUIZ",
            answersJson: asub.answersJson,
            submissionText: asub.submissionText,
            fileUrl: asub.fileUrl,
            status: asub.status || "SUBMITTED",
            score: asub.score || 0,
            maxScore: asub.maxScore || 100,
            percentage: asub.percentage || 0,
            grade: asub.grade,
            feedback: asub.feedback,
            attemptNumber: asub.attemptNumber || 1,
            gradedBy: asub.gradedBy,
            gradedAt: toDateNullable(asub.gradedAt),
            submittedAt: new Date(asub.submittedAt),
          },
        });
      }
    }

    // 12. Issued Certificates
    if (dump.issuedCertificates?.length > 0) {
      for (const cert of dump.issuedCertificates) {
        await prisma.issuedCertificate.upsert({
          where: { certificateCode: cert.certificateCode },
          update: {
            recipientName: cert.recipientName || "Learner",
            courseTitle: cert.courseTitle || "Academy Course",
            templateSnapshot: cert.templateSnapshot,
            status: cert.status || "ACTIVE",
            issuedAt: new Date(cert.issuedAt),
            expiresAt: toDateNullable(cert.expiresAt),
          },
          create: {
            certificateCode: cert.certificateCode,
            userId: toBigInt(cert.userId),
            courseId: toBigInt(cert.courseId),
            recipientName: cert.recipientName || "Learner",
            courseTitle: cert.courseTitle || "Academy Course",
            templateSnapshot: cert.templateSnapshot,
            status: cert.status || "ACTIVE",
            issuedAt: new Date(cert.issuedAt),
            expiresAt: toDateNullable(cert.expiresAt),
          },
        });
      }
    }

    console.log("------------------------------------------");
    console.log("✓ Database successfully synchronized & imported!");
    console.log("==========================================");
  } catch (error) {
    console.error("❌ Failed to import database snapshot:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importDatabase();
