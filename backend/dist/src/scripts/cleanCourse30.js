"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Soft-delete seeded sections for Course 30 so it returns to Admin's exact creation state
    await prisma.courseSection.updateMany({
        where: { courseId: 30n },
        data: { isActive: false },
    });
    console.log("Successfully removed seeded sections from Course 30. Course 30 now strictly reflects Admin/SA UI input.");
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
