import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Reordering course sections to ensure Feedback is ALWAYS the LAST section...\n");

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      sections: {
        where: { isActive: true },
        include: { contents: { where: { isActive: true } } },
        orderBy: { sectionOrder: "asc" },
      },
    },
  });

  let reorderedCount = 0;

  for (const course of courses) {
    if (!course.sections || course.sections.length <= 1) continue;

    const normalSections: typeof course.sections = [];
    const feedbackSections: typeof course.sections = [];

    for (const sec of course.sections) {
      const isFeedback =
        sec.title.trim().toLowerCase().includes("course feedback") ||
        sec.title.trim().toLowerCase().includes("end-of-course feedback") ||
        (sec.contents.length > 0 &&
          sec.contents.some((c) => c.contentType?.toUpperCase() === "FEEDBACK"));

      if (isFeedback) {
        feedbackSections.push(sec);
      } else {
        normalSections.push(sec);
      }
    }

    // Only reorder if feedback section was not already at the end
    if (feedbackSections.length > 0) {
      const orderedSections = [...normalSections, ...feedbackSections];

      let needsUpdate = false;
      for (let i = 0; i < orderedSections.length; i++) {
        if (orderedSections[i].id !== course.sections[i].id || orderedSections[i].sectionOrder !== i + 1) {
          needsUpdate = true;
          break;
        }
      }

      if (needsUpdate) {
        console.log(`Reordering sections for Course ID ${course.id}: "${course.title}"...`);
        for (let idx = 0; idx < orderedSections.length; idx++) {
          const sec = orderedSections[idx];
          await prisma.courseSection.update({
            where: { id: sec.id },
            data: { sectionOrder: idx + 1 },
          });

          // Also reorder contents within section so FEEDBACK content is at the end of section contents
          if (sec.contents && sec.contents.length > 1) {
            const normalCnt = sec.contents.filter((c) => c.contentType?.toUpperCase() !== "FEEDBACK");
            const fbCnt = sec.contents.filter((c) => c.contentType?.toUpperCase() === "FEEDBACK");
            const orderedContents = [...normalCnt, ...fbCnt];
            for (let cIdx = 0; cIdx < orderedContents.length; cIdx++) {
              await prisma.learningContent.update({
                where: { id: orderedContents[cIdx].id },
                data: { contentOrder: cIdx + 1 },
              });
            }
          }
        }
        reorderedCount++;
      }
    }
  }

  console.log(`\nSuccessfully reordered feedback section to be LAST in ${reorderedCount} course(s)!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
