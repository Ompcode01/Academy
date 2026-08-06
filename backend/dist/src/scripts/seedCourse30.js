"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const course30 = await prisma.course.findUnique({
        where: { id: 30n },
        include: { sections: { include: { contents: true } } },
    });
    if (!course30) {
        console.log("Course 30 not found");
        return;
    }
    console.log("Found Course 30:", course30.title);
    // Soft-delete any existing sections
    await prisma.courseSection.updateMany({
        where: { courseId: 30n },
        data: { isActive: false },
    });
    // Create Module 1: Java Foundations & Core Programming
    const sec1 = await prisma.courseSection.create({
        data: {
            courseId: 30n,
            title: "Module 1: Java Foundations & Core Programming",
            description: "Comprehensive introduction to Java syntax, Object-Oriented principles, and JVM memory management.",
            sectionOrder: 1,
            isPublished: true,
            isActive: true,
        },
    });
    // Add Lesson 1.1: Java Video Tutorial
    await prisma.learningContent.create({
        data: {
            sectionId: sec1.id,
            title: "1.1 Java Programming Full Course & Environment Setup",
            contentType: "VIDEO",
            contentUrl: "https://www.youtube.com/watch?v=eIrMbAQSU34",
            description: "Learn Java programming from scratch including JDK setup, variables, control flows, and OOP concepts.",
            duration: 45,
            contentOrder: 1,
            isMandatory: true,
            isPublished: true,
            isActive: true,
        },
    });
    // Add Lesson 1.2: Advanced Java Concepts & Collections
    await prisma.learningContent.create({
        data: {
            sectionId: sec1.id,
            title: "1.2 Java Collections & Multithreading Guide",
            contentType: "LESSON",
            contentUrl: "https://docs.oracle.com/javase/tutorial/",
            description: "In-depth guide covering Java ArrayLists, HashMaps, Streams API, and multithreading best practices.",
            duration: 30,
            contentOrder: 2,
            isMandatory: false,
            isPublished: true,
            isActive: true,
        },
    });
    // Add Lesson 1.3: Java Quiz Assessment
    await prisma.learningContent.create({
        data: {
            sectionId: sec1.id,
            title: "1.3 Java Fundamentals Knowledge Check",
            contentType: "QUIZ",
            description: "Test your understanding of Java fundamentals, object inheritance, and memory management.",
            duration: 15,
            contentOrder: 3,
            isMandatory: true,
            isPublished: true,
            isActive: true,
            quizConfigJson: JSON.stringify({
                passingScore: 70,
                questions: [
                    {
                        id: 1,
                        questionText: "Which keyword is used to create a subclass in Java?",
                        options: ["implements", "extends", "inherits", "subclass"],
                        correctAnswerIndex: 1,
                        explanation: "The 'extends' keyword is used to inherit from a superclass in Java.",
                    },
                    {
                        id: 2,
                        questionText: "Which data structure in Java uses key-value pairs and does not allow duplicate keys?",
                        options: ["ArrayList", "LinkedList", "HashMap", "HashSet"],
                        correctAnswerIndex: 2,
                        explanation: "HashMap stores data as key-value pairs where each key must be unique.",
                    },
                ],
            }),
        },
    });
    console.log("Successfully seeded Course 30 with Java Video Module, Lesson, and Quiz!");
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
