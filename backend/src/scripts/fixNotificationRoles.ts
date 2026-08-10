import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixNotificationRoles() {
  console.log("Fixing existing notification role labels in database...");

  // Update messages mentioning Teacher priyanka to Super Admin priyanka
  const res1 = await prisma.$executeRawUnsafe(`
    UPDATE notifications 
    SET message = REPLACE(message, 'Teacher priyanka', 'Super Admin priyanka') 
    WHERE message LIKE '%Teacher priyanka%';
  `);

  // Update titles mentioning Teacher Updated to Super Admin Updated
  const res2 = await prisma.$executeRawUnsafe(`
    UPDATE notifications 
    SET title = 'Super Admin Updated Course Content' 
    WHERE title LIKE '%Teacher Updated%' AND message LIKE '%priyanka%';
  `);

  // Update messages mentioning Teacher Omprakash to Admin Omprakash
  const res3 = await prisma.$executeRawUnsafe(`
    UPDATE notifications 
    SET message = REPLACE(message, 'Teacher omprakash', 'Admin omprakash') 
    WHERE message LIKE '%Teacher omprakash%';
  `);

  console.log(`Updated notifications. Fix complete. (Res1: ${res1}, Res2: ${res2}, Res3: ${res3})`);
}

fixNotificationRoles()
  .catch((e) => console.error("Error updating notification roles:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
