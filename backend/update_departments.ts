import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const newDepts = [
    { code: "ABU", name: "Across BUs" },
    { code: "TSC", name: "Tech Services- Core" },
    { code: "TSD", name: "Tech Services - DPU" },
    { code: "CS", name: "Content Services" },
    { code: "BE", name: "Business Enablers" },
  ];

  for (let i = 0; i < newDepts.length; i++) {
    const id = BigInt(i + 1);
    await prisma.department.updateMany({
      where: { id: id },
      data: { 
        departmentCode: newDepts[i].code + "_TMP",
        departmentName: newDepts[i].name + " TMP"
      },
    });
  }

  for (let i = 0; i < newDepts.length; i++) {
    const id = BigInt(i + 1);
    await prisma.department.upsert({
      where: { id: id },
      update: { departmentName: newDepts[i].name, departmentCode: newDepts[i].code },
      create: { departmentName: newDepts[i].name, departmentCode: newDepts[i].code },
    });
  }
  
  console.log("Departments updated!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
