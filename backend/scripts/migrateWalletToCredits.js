import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateWalletToCredits() {
  console.log('🔄 Starting wallet to credits migration...\n');

  try {
    // Get all users with wallet balance > 0
    const usersWithBalance = await prisma.user.findMany({
      where: {
        walletBalance: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletBalance: true
      }
    });

    console.log(`Found ${usersWithBalance.length} users with wallet balance\n`);

    for (const user of usersWithBalance) {
      console.log(`Processing: ${user.name} (${user.email}) - ₹${user.walletBalance}`);

      // Check if credits account already exists
      let credits = await prisma.matchifyCredits.findUnique({
        where: { userId: user.id }
      });

      if (credits) {
        console.log(`  ⚠️ Credits account already exists with balance ₹${credits.balance}`);
        continue;
      }

      // Create credits account with migrated balance
      await prisma.$transaction(async (tx) => {
        // Create credits account
        const newCredits = await tx.matchifyCredits.create({
          data: {
            userId: user.id,
            balance: user.walletBalance,
            lifetimeEarned: user.walletBalance,
            lifetimeUsed: 0
          }
        });

        // Create migration transaction record
        await tx.creditTransaction.create({
          data: {
            creditsId: newCredits.id,
            type: 'ADMIN_GRANT',
            amount: user.walletBalance,
            balanceBefore: 0,
            balanceAfter: user.walletBalance,
            description: 'Migration from wallet balance to Matchify Credits',
            referenceType: 'ADMIN',
            status: 'COMPLETED'
          }
        });
      });

      console.log(`  ✅ Migrated ₹${user.walletBalance} to credits`);
    }

    console.log('\n✅ Migration complete!');

    // Summary
    const totalCredits = await prisma.matchifyCredits.aggregate({
      _sum: { balance: true },
      _count: true
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total credits accounts: ${totalCredits._count}`);
    console.log(`   Total credits balance: ₹${totalCredits._sum.balance || 0}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateWalletToCredits();
