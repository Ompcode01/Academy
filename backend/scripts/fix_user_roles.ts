import prisma from "../src/config/prisma";

async function main() {
  console.log("Fixing User Role Mappings in MySQL...");

  // Get roles
  const roles = await prisma.role.findMany();
  const roleMap: Record<string, bigint> = {};
  for (const r of roles) {
    roleMap[r.roleName] = r.id;
  }

  console.log("Roles map:", roleMap);

  // Delete all existing userRoles
  await prisma.userRole.deleteMany({});

  // 1. Priyanka Davhare (EMP001) -> SUPER_ADMIN
  await prisma.userRole.create({
    data: { employeeId: 1n, roleId: roleMap["SUPER_ADMIN"] || 1n }
  });

  // 2. Omprakash Pandey (EMP002) -> ADMIN
  await prisma.userRole.create({
    data: { employeeId: 2n, roleId: roleMap["ADMIN"] || 2n }
  });

  // 3. Rahul Sharma (EMP003) -> LEARNER
  await prisma.userRole.create({
    data: { employeeId: 3n, roleId: roleMap["LEARNER"] || 4n }
  });

  // 4. Sneha Patil (EMP004) -> TEACHER
  await prisma.userRole.create({
    data: { employeeId: 4n, roleId: roleMap["TEACHER"] || 3n }
  });

  // 5. Guest Visitor (EMP005) -> GUEST
  await prisma.userRole.create({
    data: { employeeId: 5n, roleId: roleMap["GUEST"] || 5n }
  });

  // 6..25 -> LEARNER
  for (let id = 6n; id <= 25n; id++) {
    await prisma.userRole.create({
      data: { employeeId: id, roleId: roleMap["LEARNER"] || 4n }
    });
  }

  console.log("✓ User role mappings updated successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
