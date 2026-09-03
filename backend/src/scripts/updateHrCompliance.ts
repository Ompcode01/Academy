import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hrCourse = await prisma.course.findFirst({
    where: {
      title: { contains: "HR Compliance" },
    },
  });

  if (hrCourse) {
    console.log(`Updating Course ID ${hrCourse.id} "${hrCourse.title}" updatedAt to NOW...`);
    await prisma.course.update({
      where: { id: hrCourse.id },
      data: {
        updatedAt: new Date(),
      },
    });
    console.log("✓ Updated HR Compliance Basics timestamp to current time.");
  } else {
    console.log("HR Compliance course not found.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
