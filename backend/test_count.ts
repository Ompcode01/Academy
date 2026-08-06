import prisma from "./src/config/prisma";
async function run() {
  const empCount = await prisma.employee.count();
  const accCount = await prisma.userAccount.count();
  console.log(`TOTAL_EMPLOYEES: ${empCount}, TOTAL_USER_ACCOUNTS: ${accCount}`);
  const depts = await prisma.department.findMany({
    include: { _count: { select: { employees: true } } }
  });
  console.log("BY_DEPARTMENT:", depts.map(d => `${d.departmentName}: ${d._count.employees}`).join(", "));
  await prisma.$disconnect();
}
run();
