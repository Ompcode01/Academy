import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findUnique({
    where: { id: BigInt(25) },
    include: {
      sections: {
        include: {
          contents: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  console.log("=== COURSE ID 25 ALL SECTIONS IN DATABASE ===");
  course?.sections.forEach((sec) => {
    console.log(`Section ID ${sec.id} | title: "${sec.title}" | order: ${sec.sectionOrder} | active: ${sec.isActive} | pub: ${sec.isPublished} | updated: ${sec.updatedAt.toISOString()} | contents: ${sec.contents.filter(c => c.isActive).length}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
