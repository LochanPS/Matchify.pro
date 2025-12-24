const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQueries() {
  console.log('🧪 Testing database queries...\n');

  try {
    // Test 1: Fetch all users
    const users = await prisma.user.findMany();
    console.log('✅ Total users:', users.length);
    console.log('   Users:', users.map(u => `${u.name} (${u.role})`).join(', '));

    // Test 2: Fetch tournaments with organizer
    const tournaments = await prisma.tournament.findMany({
      include: {
        organizer: true,
        categories: true,
      },
    });
    console.log('\n✅ Total tournaments:', tournaments.length);
    if (tournaments.length > 0) {
      console.log('   Tournament 1:', tournaments[0].name);
      console.log('   Organizer:', tournaments[0].organizer.name);
      console.log('   Categories:', tournaments[0].categories.length);
    }

    // Test 3: Fetch wallet transactions
    const transactions = await prisma.walletTransaction.findMany({
      include: {
        user: true,
      },
    });
    console.log('\n✅ Total transactions:', transactions.length);
    transactions.forEach(t => {
      console.log(`   ${t.user.name}: ${t.type} ₹${t.amount}`);
    });

    // Test 4: Test user stats
    const playersWithStats = await prisma.user.findMany({
      where: { role: 'PLAYER' },
      select: {
        name: true,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        walletBalance: true,
      },
    });
    console.log('\n✅ Player stats:');
    playersWithStats.forEach(p => {
      console.log(`   ${p.name}: ${p.totalPoints} pts, ₹${p.walletBalance} wallet`);
    });

    console.log('\n🎉 All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries();