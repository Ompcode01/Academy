import prisma from '../src/config/prisma';

async function updateAccountUsernames() {
  console.log("==========================================");
  console.log(" Removing dots (.) from all usernames     ");
  console.log("==========================================");

  const accounts = await prisma.userAccount.findMany({
    include: { employee: true }
  });

  for (const ua of accounts) {
    let cleanUsername = ua.username.replace(/\./g, '').trim().toLowerCase();
    
    // Ensure uniqueness if cleanUsername collides
    const existing = await prisma.userAccount.findFirst({
      where: {
        username: cleanUsername,
        id: { not: ua.id }
      }
    });

    if (existing) {
      cleanUsername = `${ua.employee.firstName.toLowerCase()}${ua.employee.lastName.toLowerCase()}`.replace(/\./g, '');
    }

    if (ua.username !== cleanUsername) {
      await prisma.userAccount.update({
        where: { id: ua.id },
        data: { username: cleanUsername }
      });
      console.log(`✓ Updated [ID ${ua.id}] ${ua.employee.firstName} ${ua.employee.lastName}: '${ua.username}' -> '${cleanUsername}'`);
    } else {
      console.log(`- Unchanged [ID ${ua.id}] ${ua.employee.firstName} ${ua.employee.lastName}: '${cleanUsername}'`);
    }
  }

  console.log("------------------------------------------");
  console.log("✓ All usernames verified and updated without dots!");
  console.log("==========================================");
}

updateAccountUsernames()
  .catch((err) => {
    console.error("Error updating usernames:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
