import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const course30 = await prisma.course.findUnique({
    where: { id: 30n },
  });

  if (!course30) {
    console.log("Course 30 not found");
    return;
  }

  // Soft-delete any existing sections
  await prisma.courseSection.updateMany({
    where: { courseId: 30n },
    data: { isActive: false },
  });

  // Create Section 1: Java Basics & Documentation
  const sec = await prisma.courseSection.create({
    data: {
      courseId: 30n,
      title: "Section 1: Java Core Concepts & Documentation",
      description: "Fundamental Java concepts, YouTube lecture, and reference PDF document.",
      sectionOrder: 1,
      isPublished: true,
      isActive: true,
    },
  });

  // 1. YouTube Video
  await prisma.learningContent.create({
    data: {
      sectionId: sec.id,
      title: "Java Full Course Video Lecture",
      contentType: "YOUTUBE",
      contentUrl: "https://www.youtube.com/watch?v=eIrMbAQSU34",
      description: "Interactive YouTube video tutorial covering Java syntax, variables, OOP, and methods.",
      duration: 30,
      contentOrder: 1,
      isMandatory: true,
      isPublished: true,
      isActive: true,
    },
  });

  // 2. PDF Document
  await prisma.learningContent.create({
    data: {
      sectionId: sec.id,
      title: "Java Reference Manual PDF",
      contentType: "PDF",
      contentUrl: "https://docs.oracle.com/javase/specs/jls/se17/jls17.pdf",
      description: "Official Java Language Specification reference document PDF.",
      duration: 20,
      contentOrder: 2,
      isMandatory: false,
      isPublished: true,
      isActive: true,
    },
  });

  console.log("Successfully created Section 1 for Course 30 with 1 YouTube Video and 1 PDF Document!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
