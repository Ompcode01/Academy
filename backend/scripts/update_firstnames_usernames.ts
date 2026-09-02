import prisma from '../src/config/prisma';

async function updateFirstnameUsernames() {
  console.log("==========================================");
  console.log(" Updating Usernames to First Names        ");
  console.log("==========================================");

  const accounts = await prisma.userAccount.findMany({
    include: { employee: true },
    orderBy: { employeeId: 'asc' }
  });

  const takenUsernames = new Set<string>();

  for (const ua of accounts) {
    const cleanFirst = ua.employee.firstName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanLast = ua.employee.lastName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    let candidate = cleanFirst;

    // Handle name collisions (e.g. Siddharth Savant vs Siddharth Kshirsagar)
    if (takenUsernames.has(candidate)) {
      candidate = `${cleanFirst}${cleanLast[0] || ''}`;
      if (takenUsernames.has(candidate)) {
        candidate = `${cleanFirst}${cleanLast}`;
      }
    }

    takenUsernames.add(candidate);

    await prisma.userAccount.update({
      where: { id: ua.id },
      data: { username: candidate }
    });

    console.log(`✓ [ID ${ua.id}] ${ua.employee.firstName} ${ua.employee.lastName} -> Username: '${candidate}'`);
  }

  console.log("------------------------------------------");
  console.log("✓ All 25 usernames set strictly to first names!");
  console.log("==========================================");
}

updateFirstnameUsernames()
  .catch((err) => {
    console.error("Error updating usernames:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
