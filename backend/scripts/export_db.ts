import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

async function exportDatabase() {
  console.log("==========================================");
  console.log(" Harbinger Academy LMS - Database Export  ");
  console.log("==========================================");
  console.log("Starting full database snapshot export...\n");

  try {
    const dump = {
      exportedAt: new Date().toISOString(),
      departments: await prisma.department.findMany(),
      employees: await prisma.employee.findMany(),
      userAccounts: await prisma.userAccount.findMany(),
      roles: await prisma.role.findMany(),
      permissions: await prisma.permission.findMany(),
      userRoles: await prisma.userRole.findMany(),
      rolePermissions: await prisma.rolePermission.findMany(),
      categories: await prisma.category.findMany(),
      courses: await prisma.course.findMany(),
      courseTeachers: await prisma.courseTeacher.findMany(),
      courseSections: await prisma.courseSection.findMany(),
      learningContents: await prisma.learningContent.findMany(),
      enrollments: await prisma.enrollment.findMany(),
      userLessonProgresses: await prisma.userLessonProgress.findMany(),
      assessmentSubmissions: await prisma.assessmentSubmission.findMany(),
      issuedCertificates: await prisma.issuedCertificate.findMany(),
      guestAccessGrants: await prisma.guestAccessGrant.findMany(),
      events: await prisma.event.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      notifications: await prisma.notification.findMany(),
    };

    const serialized = serializeData(dump);
    const outputPath = path.join(__dirname, "..", "prisma", "data_dump.json");
    fs.writeFileSync(outputPath, JSON.stringify(serialized, null, 2), "utf-8");

    console.log("------------------------------------------");
    console.log(`✓ Database snapshot successfully exported!`);
    console.log(`📁 File location: ${outputPath}`);
    console.log(`📊 Exported entities summary:`);
    console.log(`   - Departments: ${dump.departments.length}`);
    console.log(`   - Employees: ${dump.employees.length}`);
    console.log(`   - User Accounts: ${dump.userAccounts.length}`);
    console.log(`   - Courses: ${dump.courses.length}`);
    console.log(`   - Course Sections: ${dump.courseSections.length}`);
    console.log(`   - Learning Contents: ${dump.learningContents.length}`);
    console.log(`   - Enrollments: ${dump.enrollments.length}`);
    console.log(`   - Assessment Submissions: ${dump.assessmentSubmissions.length}`);
    console.log(`   - Issued Certificates: ${dump.issuedCertificates.length}`);
    console.log("==========================================");
  } catch (error) {
    console.error("❌ Failed to export database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabase();
