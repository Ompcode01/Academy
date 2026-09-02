import prisma from "../src/config/prisma";

async function seedAuditLogs() {
  console.log("Seeding Audit Logs...");

  // Clean existing sample audit logs
  await prisma.auditLog.deleteMany({});

  const sampleLogs = [
    {
      actorName: "Priyanka Davhare",
      username: "priyanka",
      departmentName: "Management",
      action: "SUPER_ADMIN_SYSTEM_CONFIG",
      type: "security",
      detail: "Configured Enterprise LMS global security policies and initialized Super Admin reporting engine.",
      ipAddress: "192.168.1.36",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      actorName: "Priyanka Davhare",
      username: "priyanka",
      departmentName: "Management",
      action: "ROLE_PERMISSION_UPDATE",
      type: "role",
      detail: "Updated Department Admin permissions for scope isolation across reporting & user access.",
      ipAddress: "192.168.1.36",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      actorName: "Omprakash Pandey",
      username: "omprakash",
      departmentName: "Engineering",
      action: "USER_LOGIN_SUCCESS",
      type: "login",
      detail: "Department Admin successfully authenticated from local network IP.",
      ipAddress: "192.168.1.42",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      actorName: "Siddharth Savant",
      username: "siddharth",
      departmentName: "Engineering",
      action: "USER_AUTO_PROVISION",
      type: "user",
      detail: "Account auto-provisioned and logged in with learner credentials via external IP (192.168.1.36).",
      ipAddress: "192.168.1.36",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      actorName: "Sneha Patil",
      username: "sneha",
      departmentName: "Human Resources",
      action: "COURSE_PUBLISH",
      type: "course",
      detail: "Published new enterprise compliance course: 'Advanced Cybersecurity & Data Protection 2026'.",
      ipAddress: "192.168.1.50",
      timestamp: new Date(Date.now() - 2 * 3600 * 1000),
    },
    {
      actorName: "Learner One",
      username: "learner1",
      departmentName: "Engineering",
      action: "ASSESSMENT_SUBMIT",
      type: "course",
      detail: "Completed assessment for 'Full-Stack React & Next.js Architecture' with score 92.5% (GRADE: PASS).",
      ipAddress: "192.168.1.101",
      timestamp: new Date(Date.now() - 3 * 3600 * 1000),
    },
    {
      actorName: "Learner Two",
      username: "learner2",
      departmentName: "Human Resources",
      action: "CERTIFICATE_ISSUED",
      type: "course",
      detail: "Issued Certificate #CERT-2026-ENG-102 for course 'Enterprise Security Compliance'.",
      ipAddress: "192.168.1.102",
      timestamp: new Date(Date.now() - 5 * 3600 * 1000),
    },
    {
      actorName: "System Automation",
      username: "system",
      departmentName: "Global System",
      action: "AUTOMATED_COMPLIANCE_CHECK",
      type: "system",
      detail: "Ran mandatory compliance verification. Flagged 3 overdue enrollments in Sales department.",
      ipAddress: "127.0.0.1",
      timestamp: new Date(Date.now() - 8 * 3600 * 1000),
    },
    {
      actorName: "Rahul Sharma",
      username: "rahul",
      departmentName: "Sales",
      action: "COURSE_ENROLLMENT",
      type: "user",
      detail: "Enrolled 5 sales executives in 'Enterprise Negotiation & Deal Closing Strategies'.",
      ipAddress: "192.168.1.60",
      timestamp: new Date(Date.now() - 12 * 3600 * 1000),
    },
    {
      actorName: "Priyanka Davhare",
      username: "priyanka",
      departmentName: "Management",
      action: "EXPORT_REPORTS",
      type: "settings",
      detail: "Exported Organization Learning Overview report in XLSX format.",
      ipAddress: "192.168.1.36",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000),
    },
  ];

  for (const log of sampleLogs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log(`Seeded ${sampleLogs.length} audit logs successfully.`);
  await prisma.$disconnect();
}

seedAuditLogs().catch((err) => {
  console.error("Failed to seed audit logs:", err);
  process.exit(1);
});
