import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Completely deactivate/remove all script-inserted sections for Course 30
  await prisma.courseSection.updateMany({
    where: { courseId: 30n },
    data: { isActive: false },
  });

  console.log("Successfully removed all script-inserted sample sections from Course 30.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
