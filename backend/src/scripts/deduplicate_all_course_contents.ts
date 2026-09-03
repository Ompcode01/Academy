import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING DATABASE COURSE CONTENT & FEEDBACK DEDUPLICATION ===");

  const courses = await prisma.course.findMany({
    include: {
      sections: {
        where: { isActive: true },
        include: {
          contents: {
            where: { isActive: true },
            orderBy: { id: "asc" },
          },
        },
        orderBy: { sectionOrder: "asc" },
      },
    },
  });

  let totalDeactivatedContents = 0;
  let totalDeactivatedSections = 0;

  for (const course of courses) {
    if (!course.sections || course.sections.length === 0) continue;

    console.log(`\nProcessing Course ID ${course.id}: "${course.title}"...`);

    let hasFeedbackInCourse = false;
    const seenContentKeys = new Set<string>();
    const contentIdsToDeactivate: bigint[] = [];

    // Step 1: Deduplicate contents across sections
    for (const sec of course.sections) {
      for (const cnt of sec.contents) {
        const cType = (cnt.contentType || "LESSON").toUpperCase().trim();
        const isFeedback = cType === "FEEDBACK" || cType === "FEEDBACK_SURVEY" || cType === "SURVEY";

        if (isFeedback) {
          if (hasFeedbackInCourse) {
            console.log(`  -> Deactivating duplicate Feedback survey (ID: ${cnt.id}) in Section "${sec.title}"`);
            contentIdsToDeactivate.push(cnt.id);
            continue;
          }
          hasFeedbackInCourse = true;
        }

        const normTitle = cnt.title.trim().toLowerCase();
        const key = `${cType}:${normTitle}`;

        if (seenContentKeys.has(key)) {
          console.log(`  -> Deactivating duplicate ${cType} item "${cnt.title}" (ID: ${cnt.id}) in Section "${sec.title}"`);
          contentIdsToDeactivate.push(cnt.id);
          continue;
        }

        seenContentKeys.add(key);
      }
    }

    if (contentIdsToDeactivate.length > 0) {
      await prisma.learningContent.updateMany({
        where: { id: { in: contentIdsToDeactivate } },
        data: { isActive: false },
      });
      totalDeactivatedContents += contentIdsToDeactivate.length;
      console.log(`  ✓ Deactivated ${contentIdsToDeactivate.length} duplicate content items.`);
    }

    // Step 2: Check for duplicate sections with exact same titles or empty duplicate sections
    const seenSectionTitles = new Set<string>();
    const sectionIdsToDeactivate: bigint[] = [];

    for (const sec of course.sections) {
      const remainingActiveContents = sec.contents.filter((c) => !contentIdsToDeactivate.includes(c.id));
      const normSecTitle = sec.title.trim().toLowerCase();

      if (seenSectionTitles.has(normSecTitle) && remainingActiveContents.length === 0) {
        console.log(`  -> Deactivating empty duplicate section "${sec.title}" (ID: ${sec.id})`);
        sectionIdsToDeactivate.push(sec.id);
      } else {
        seenSectionTitles.add(normSecTitle);
      }
    }

    if (sectionIdsToDeactivate.length > 0) {
      await prisma.courseSection.updateMany({
        where: { id: { in: sectionIdsToDeactivate } },
        data: { isActive: false },
      });
      totalDeactivatedSections += sectionIdsToDeactivate.length;
      console.log(`  ✓ Deactivated ${sectionIdsToDeactivate.length} duplicate empty sections.`);
    }
  }

  console.log(`\n=== DEDUPLICATION COMPLETE ===`);
  console.log(`Total duplicate contents deactivated: ${totalDeactivatedContents}`);
  console.log(`Total duplicate sections deactivated: ${totalDeactivatedSections}`);
}

main()
  .catch((err) => {
    console.error("Deduplication error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
