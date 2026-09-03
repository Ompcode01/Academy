import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultFeedbackConfig = JSON.stringify({
  title: "End-of-Course Feedback & Evaluation Survey",
  description: "Please share your review regarding course structure, content clarity, and instructor support.",
  questions: [
    {
      id: 1,
      questionText: "How satisfied are you with the overall course content and instructor explanations?",
      questionType: "MCQ",
      options: ["5 - Excellent", "4 - Very Good", "3 - Satisfactory", "2 - Needs Improvement", "1 - Poor"],
      isMandatory: true,
    },
    {
      id: 2,
      questionText: "How effective were the practical exercises, quizzes, and learning materials?",
      questionType: "MCQ",
      options: ["Extremely Helpful", "Moderately Helpful", "Neutral", "Not Helpful"],
      isMandatory: true,
    },
    {
      id: 3,
      questionText: "How clear and helpful were the instructor's explanations?",
      questionType: "MCQ",
      options: ["Very Clear", "Somewhat Clear", "Unclear"],
      isMandatory: true,
    },
    {
      id: 4,
      questionText: "What key improvements or additional topics would you suggest for this course?",
      questionType: "WRITTEN",
      isMandatory: false,
    },
  ],
});

async function main() {
  console.log("=== ENSURING FEEDBACK SURVEY IS PRESENT AND AT THE END OF ALL COURSES ===");

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

  let addedCount = 0;

  for (const course of courses) {
    const hasFeedback = course.sections.some((sec) =>
      sec.contents.some((cnt) => (cnt.contentType || "").toUpperCase() === "FEEDBACK")
    );

    if (!hasFeedback) {
      console.log(`Adding Feedback Survey to Course ID ${course.id}: "${course.title}"...`);

      const lastOrder = course.sections.length > 0
        ? Math.max(...course.sections.map((s) => s.sectionOrder)) + 1
        : 1;

      const fbSection = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          title: "Course Feedback & Evaluation",
          description: "End-of-Course Feedback & Evaluation Survey",
          sectionOrder: lastOrder,
          isPublished: true,
          isActive: true,
        },
      });

      await prisma.learningContent.create({
        data: {
          sectionId: fbSection.id,
          title: "End-of-Course Feedback & Evaluation Survey",
          contentType: "FEEDBACK",
          description: "Please share your review regarding course structure, content clarity, and instructor support.",
          duration: 5,
          exactDurationSeconds: 300,
          contentOrder: 1,
          isMandatory: true,
          isPublished: true,
          isActive: true,
          quizConfigJson: defaultFeedbackConfig,
        },
      });

      addedCount++;
    }
  }

  console.log(`✓ Added Feedback Survey to ${addedCount} course(s).`);

  // Now run reordering to ensure Feedback section is at the very end
  for (const course of await prisma.course.findMany({ where: { isActive: true }, include: { sections: { where: { isActive: true }, include: { contents: { where: { isActive: true } } }, orderBy: { sectionOrder: "asc" } } } })) {
    if (!course.sections || course.sections.length <= 1) continue;

    const normalSections: typeof course.sections = [];
    const feedbackSections: typeof course.sections = [];

    for (const sec of course.sections) {
      const isFeedback =
        sec.title.trim().toLowerCase().includes("course feedback") ||
        sec.title.trim().toLowerCase().includes("end-of-course feedback") ||
        (sec.contents.length > 0 &&
          sec.contents.some((c) => c.contentType?.toUpperCase() === "FEEDBACK"));

      if (isFeedback) feedbackSections.push(sec);
      else normalSections.push(sec);
    }

    if (feedbackSections.length > 0) {
      const orderedSections = [...normalSections, ...feedbackSections];
      for (let idx = 0; idx < orderedSections.length; idx++) {
        await prisma.courseSection.update({
          where: { id: orderedSections[idx].id },
          data: { sectionOrder: idx + 1 },
        });
      }
    }
  }

  console.log("=== COMPLETED ===");
}

main()
  .catch((err) => {
    console.error("Error ensuring feedback:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
