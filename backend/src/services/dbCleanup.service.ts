import prisma from "../config/prisma";

export async function autoCleanupDatabaseDuplicates() {
  try {
    console.log("🧹 Running automated database duplicate cleanup...");

    // 1. Soft-delete duplicate sections (same courseId & title) keeping the latest ID
    const duplicateSections = await prisma.$queryRaw<Array<{ courseId: bigint; title: string; maxId: bigint }>>`
      SELECT courseId, LOWER(TRIM(title)) as title, MAX(id) as maxId
      FROM course_sections
      WHERE isActive = 1
      GROUP BY courseId, LOWER(TRIM(title))
      HAVING COUNT(*) > 1
    `;

    for (const dup of duplicateSections) {
      const courseId = BigInt(dup.courseId);
      const titleLower = String(dup.title).toLowerCase().trim();
      const maxId = BigInt(dup.maxId);

      const allMatching = await prisma.courseSection.findMany({
        where: { courseId, isActive: true },
        select: { id: true, title: true },
      });

      const idsToDeactivate = allMatching
        .filter((s) => (s.title || "").toLowerCase().trim() === titleLower && s.id !== maxId)
        .map((s) => s.id);

      if (idsToDeactivate.length > 0) {
        await prisma.learningContent.updateMany({
          where: { sectionId: { in: idsToDeactivate } },
          data: { isActive: false },
        });
        await prisma.courseSection.updateMany({
          where: { id: { in: idsToDeactivate } },
          data: { isActive: false },
        });
      }
    }

    // 2. Soft-delete duplicate learning contents (same sectionId, title & contentType) keeping latest ID
    const duplicateContents = await prisma.$queryRaw<Array<{ sectionId: bigint; title: string; contentType: string; maxId: bigint }>>`
      SELECT sectionId, LOWER(TRIM(title)) as title, UPPER(TRIM(contentType)) as contentType, MAX(id) as maxId
      FROM learning_contents
      WHERE isActive = 1
      GROUP BY sectionId, LOWER(TRIM(title)), UPPER(TRIM(contentType))
      HAVING COUNT(*) > 1
    `;

    for (const dup of duplicateContents) {
      const sectionId = BigInt(dup.sectionId);
      const titleLower = String(dup.title).toLowerCase().trim();
      const cTypeUpper = String(dup.contentType).toUpperCase().trim();
      const maxId = BigInt(dup.maxId);

      const allMatching = await prisma.learningContent.findMany({
        where: { sectionId, isActive: true },
        select: { id: true, title: true, contentType: true },
      });

      const idsToDeactivate = allMatching
        .filter(
          (c) =>
            (c.title || "").toLowerCase().trim() === titleLower &&
            (c.contentType || "").toUpperCase().trim() === cTypeUpper &&
            c.id !== maxId
        )
        .map((c) => c.id);

      if (idsToDeactivate.length > 0) {
        await prisma.learningContent.updateMany({
          where: { id: { in: idsToDeactivate } },
          data: { isActive: false },
        });
      }
    }

    // 3. Keep ONLY 1 Feedback section per course
    const allCourses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sections: {
          where: { isActive: true },
          orderBy: { id: "desc" },
          select: { id: true, title: true, contents: { where: { isActive: true } } },
        },
      },
    });

    for (const crs of allCourses) {
      const fbSections = crs.sections.filter((sec) => {
        const titleLower = (sec.title || "").toLowerCase().trim();
        return (
          titleLower.includes("course feedback") ||
          titleLower.includes("end-of-course feedback") ||
          titleLower.includes("feedback & evaluation") ||
          sec.contents.some((c) => (c.contentType || "").toUpperCase().includes("FEEDBACK"))
        );
      });

      if (fbSections.length > 1) {
        const olderFbSecIds = fbSections.slice(1).map((s) => s.id);
        await prisma.learningContent.updateMany({
          where: { sectionId: { in: olderFbSecIds } },
          data: { isActive: false },
        });
        await prisma.courseSection.updateMany({
          where: { id: { in: olderFbSecIds } },
          data: { isActive: false },
        });
      }
    }

    console.log("✅ Database duplicate cleanup completed successfully.");
  } catch (err) {
    console.error("Warning: Database duplicate cleanup encountered error:", err);
  }
}
