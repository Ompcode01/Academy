import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log("Existing categories:", categories);
  
  // Upsert the 5 categories
  const newNames = [
    "Technical",
    "Soft Skill",
    "Process/Compliances",
    "Leadership (Futurefit, MCC, Basecamp)"
  ];

  for (let i = 0; i < newNames.length; i++) {
    const id = BigInt(i + 1);
    await prisma.category.upsert({
      where: { id: id },
      update: { name: newNames[i] },
      create: { name: newNames[i], description: newNames[i] },
    });
  }

  // Delete category 5 if it exists
  try {
    await prisma.category.delete({ where: { id: BigInt(5) } });
  } catch (e) {
    // Ignore if not found
  }
  
  console.log("Categories updated!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
