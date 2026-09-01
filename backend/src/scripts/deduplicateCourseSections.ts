import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting enhanced course section deduplication & reordering...\n");

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      sections: {
        where: { isActive: true },
        include: { contents: { where: { isActive: true } } },
        orderBy: { id: "asc" },
      },
    },
  });

  for (const course of courses) {
    if (!course.sections || course.sections.length === 0) continue;

    console.log(`Processing Course ID ${course.id}: "${course.title}"...`);

    // Group sections by normalized title
    const sectionsByTitle = new Map<string, typeof course.sections>();

    for (const sec of course.sections) {
      const normTitle = sec.title.trim().toLowerCase();
      if (!sectionsByTitle.has(normTitle)) {
        sectionsByTitle.set(normTitle, []);
      }
      sectionsByTitle.get(normTitle)!.push(sec);
    }

    const sectionsToKeep: typeof course.sections = [];
    const sectionsToDeactivate: bigint[] = [];

    sectionsByTitle.forEach((secGroup, normTitle) => {
      if (secGroup.length === 1) {
        sectionsToKeep.push(secGroup[0]);
      } else {
        // Sort group by content count descending, so we keep the section with the most contents
        secGroup.sort((a, b) => b.contents.length - a.contents.length || Number(b.id - a.id));
        const winner = secGroup[0];
        sectionsToKeep.push(winner);

        for (let i = 1; i < secGroup.length; i++) {
          sectionsToDeactivate.push(secGroup[i].id);
        }
      }
    });

    if (sectionsToDeactivate.length > 0) {
      console.log(`  Deactivating ${sectionsToDeactivate.length} duplicate section(s)...`);
      await prisma.learningContent.updateMany({
        where: { sectionId: { in: sectionsToDeactivate } },
        data: { isActive: false },
      });
      await prisma.courseSection.updateMany({
        where: { id: { in: sectionsToDeactivate } },
        data: { isActive: false },
      });
    }

    // Re-order remaining sections
    sectionsToKeep.sort((a, b) => a.sectionOrder - b.sectionOrder || Number(a.id - b.id));
    for (let idx = 0; idx < sectionsToKeep.length; idx++) {
      await prisma.courseSection.update({
        where: { id: sectionsToKeep[idx].id },
        data: { sectionOrder: idx + 1 },
      });
    }
  }

  console.log("\nFinished enhanced deduplication and reordering!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
