import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function resetBalances() {
  console.log('🔄 Resetting all wallet balances...\n');

  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, roles: true, walletBalance: true }
  });

  for (const user of users) {
    const isOrganizer = user.roles && user.roles.includes('ORGANIZER');
    const newBalance = isOrganizer ? 20 : 0;

    if (user.walletBalance !== newBalance) {
      await prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: newBalance }
      });
    }

    const roleLabel = isOrganizer ? '🏢 ORGANIZER' : '👤 OTHER';
    console.log(`${roleLabel} ${user.name} (${user.email}): ₹${newBalance}`);
  }

  // Clear all transaction history
  await prisma.walletTransaction.deleteMany({});
  console.log('\n🗑️ Cleared all transaction history');

  const organizerCount = users.filter(u => u.roles?.includes('ORGANIZER')).length;
  const otherCount = users.length - organizerCount;

  console.log(`\n✅ Done!`);
  console.log(`   ${organizerCount} organizers → ₹20 each`);
  console.log(`   ${otherCount} others → ₹0 each`);

  await prisma.$disconnect();
}

resetBalances();
