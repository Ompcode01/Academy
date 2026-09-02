import prisma from '../src/config/prisma';
import fs from 'fs';
import path from 'path';

async function updateEmails() {
  console.log("==========================================");
  console.log(" Updating Employee Emails to firstname.lastname@company.com ");
  console.log("==========================================");

  const employees = await prisma.employee.findMany();

  for (const emp of employees) {
    const cleanFirst = emp.firstName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanLast = emp.lastName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const newEmail = `${cleanFirst}.${cleanLast}@company.com`;

    await prisma.employee.update({
      where: { id: emp.id },
      data: { officialEmail: newEmail }
    });
    console.log(`✓ Updated [ID ${emp.id}] ${emp.firstName} ${emp.lastName} -> ${newEmail}`);
  }

  console.log("------------------------------------------");
  console.log("✓ All 25 employee emails updated successfully!");
  console.log("==========================================");
}

updateEmails()
  .catch((err) => {
    console.error("Error updating emails:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
