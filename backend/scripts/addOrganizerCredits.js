import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCreditsToOrganizers() {
  console.log('🎯 Adding 10 Matchify credits to all organizers...\n');

  try {
    // Find all users who have ORGANIZER role (roles field contains 'ORGANIZER')
    const organizers = await prisma.user.findMany({
      where: {
        roles: {
          contains: 'ORGANIZER'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        walletBalance: true
      }
    });

    console.log(`Found ${organizers.length} organizer(s)\n`);

    if (organizers.length === 0) {
      console.log('No organizers found in the database.');
      return;
    }

    // Update each organizer's wallet balance
    for (const organizer of organizers) {
      const newBalance = organizer.walletBalance + 10;
      
      await prisma.user.update({
        where: { id: organizer.id },
        data: { walletBalance: newBalance }
      });

      // Create a wallet transaction record
      await prisma.walletTransaction.create({
        data: {
          userId: organizer.id,
          type: 'CREDIT',
          amount: 10,
          balanceBefore: organizer.walletBalance,
          balanceAfter: newBalance,
          description: 'Matchify promotional credits - Thank you for being an organizer!',
          status: 'COMPLETED'
        }
      });

      console.log(`✅ ${organizer.name} (${organizer.email})`);
      console.log(`   Previous balance: ₹${organizer.walletBalance} → New balance: ₹${newBalance}`);
    }

    console.log(`\n🎉 Successfully added 10 credits to ${organizers.length} organizer(s)!`);

  } catch (error) {
    console.error('Error adding credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCreditsToOrganizers();
