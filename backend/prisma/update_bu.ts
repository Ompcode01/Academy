import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateBusinessUnits() {
  console.log("Updating Business Units in DB...");

  // 1. Ensure the 4 primary Business Units exist
  const bu1 = await prisma.department.upsert({
    where: { departmentCode: "TSC" },
    update: { departmentName: "Tech Services- Core" },
    create: { departmentCode: "TSC", departmentName: "Tech Services- Core" },
  });

  const bu2 = await prisma.department.upsert({
    where: { departmentCode: "TSD" },
    update: { departmentName: "Tech Services - DPU" },
    create: { departmentCode: "TSD", departmentName: "Tech Services - DPU" },
  });

  const bu3 = await prisma.department.upsert({
    where: { departmentCode: "CS" },
    update: { departmentName: "Content Services" },
    create: { departmentCode: "CS", departmentName: "Content Services" },
  });

  const bu4 = await prisma.department.upsert({
    where: { departmentCode: "BE" },
    update: { departmentName: "Business Enablers" },
    create: { departmentCode: "BE", departmentName: "Business Enablers" },
  });

  const validBuIds = [bu1.id, bu2.id, bu3.id, bu4.id];

  // 2. Fetch all employees in DB and balance them across the 4 BUs
  const employees = await prisma.employee.findMany();
  console.log(`Found ${employees.length} employees to reassign...`);

  for (let i = 0; i < employees.length; i++) {
    const assignedBuId = validBuIds[i % 4];
    await prisma.employee.update({
      where: { id: employees[i].id },
      data: { departmentId: assignedBuId },
    });
  }

  // 3. Fetch all courses in DB and balance them across the 4 BUs
  const courses = await prisma.course.findMany();
  console.log(`Found ${courses.length} courses to reassign...`);

  for (let i = 0; i < courses.length; i++) {
    const assignedBuId = validBuIds[i % 4];
    await prisma.course.update({
      where: { id: courses[i].id },
      data: { departmentId: assignedBuId },
    });
  }

  // 4. Delete any old leftover departments
  const oldDepts = await prisma.department.findMany({
    where: { id: { notIn: validBuIds } },
  });

  for (const dept of oldDepts) {
    try {
      await prisma.department.delete({ where: { id: dept.id } });
      console.log(`Deleted old department ID ${dept.id} (${dept.departmentName})`);
    } catch (err) {
      console.log(`Could not delete old department ID ${dept.id}`);
    }
  }

  console.log("Business Units successfully updated in Database!");
}

updateBusinessUnits()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
