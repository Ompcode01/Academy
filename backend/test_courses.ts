import { ProgressService } from "./src/modules/course/progress.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const progressService = new ProgressService();

async function testNoAutoEnrollment() {
  console.log("=== TESTING PROGRESS SERVICE AUTO-ENROLLMENT REMOVAL ===");

  const courseId = BigInt(17);
  const testUserId = BigInt(9999);

  // Ensure no enrollment exists initially
  await prisma.enrollment.deleteMany({
    where: { userId: testUserId, courseId },
  });

  // Call getLearnerCourseProgress
  const result1 = await progressService.getLearnerCourseProgress(testUserId, courseId);
  console.log("\n1. Querying progress for unenrolled user:");
  console.log("   Returned enrollment:", result1.enrollment);

  // Check DB count
  const countInDb = await prisma.enrollment.count({
    where: { userId: testUserId, courseId },
  });
  console.log(`   Enrollments in MySQL DB: ${countInDb} (Should be 0!)`);

  if (countInDb === 0 && result1.enrollment === null) {
    console.log("✓ SUCCESS: No auto-enrollment created in DB!");
  } else {
    console.error("❌ FAILURE: Auto-enrollment was created!");
  }

  await prisma.$disconnect();
}

testNoAutoEnrollment();
