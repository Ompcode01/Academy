import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      sections: {
        where: { isActive: true },
        orderBy: { sectionOrder: "asc" },
        include: { contents: { where: { isActive: true }, orderBy: { contentOrder: "asc" } } },
      },
    },
    orderBy: { id: "desc" },
  });

  console.log(`Found ${courses.length} active courses in DB:\n`);

  for (const c of courses) {
    console.log(`--- Course ID: ${c.id} | Title: "${c.title}" | Status: ${c.status} ---`);
    console.log(`  Sections count: ${c.sections.length}`);
    for (const sec of c.sections) {
      console.log(`  [Section ${sec.id}] ${sec.title}`);
      for (const cnt of sec.contents) {
        console.log(`    - [Content ${cnt.id}] (${cnt.contentType}) ${cnt.title} | URL: ${cnt.contentUrl}`);
      }
    }
    console.log("");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
