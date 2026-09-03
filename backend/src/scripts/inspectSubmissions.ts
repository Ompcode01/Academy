import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const submissions = await prisma.assessmentSubmission.findMany({
    orderBy: { id: "desc" },
    take: 10,
  });

  console.log("=== RECENT ASSESSMENT SUBMISSIONS ===");
  submissions.forEach((s) => {
    console.log(`ID: ${s.id} | userId: ${s.userId} | type: ${s.submissionType} | fileUrl: "${s.fileUrl}" | status: ${s.status} | time: ${s.submittedAt.toISOString()}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
