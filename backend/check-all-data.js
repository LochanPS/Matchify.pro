import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllData() {
  try {
    console.log('\n📊 CHECKING ALL DATA IN DATABASE\n');
    console.log('='.repeat(60));

    // 1. Users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isDeleted: true,
        isSuspended: true,
        suspendedUntil: true,
      }
    });
    console.log('\n👥 USERS:', users.length);
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.name} (${user.email}) - ${user.roles}`);
      if (user.isDeleted) console.log('     ❌ DELETED');
      if (user.isSuspended || (user.suspendedUntil && new Date(user.suspendedUntil) > new Date())) {
        console.log('     🚫 SUSPENDED');
      }
    });

    // 2. Tournaments
    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        organizer: {
          select: { name: true }
        }
      }
    });
    console.log('\n🏆 TOURNAMENTS:', tournaments.length);
    tournaments.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} - ${t.status} (by ${t.organizer.name})`);
    });

    // 3. Registrations
    const registrations = await prisma.registration.findMany({
      select: {
        id: true,
        user: { select: { name: true } },
        tournament: { select: { name: true } },
        status: true,
      }
    });
    console.log('\n📝 REGISTRATIONS:', registrations.length);
    registrations.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.user.name} → ${r.tournament.name} (${r.status})`);
    });

    // 4. Categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        tournament: { select: { name: true } }
      }
    });
    console.log('\n🎯 CATEGORIES:', categories.length);
    categories.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.tournament.name})`);
    });

    // 5. Academies
    const academies = await prisma.academy.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        isDeleted: true,
      }
    });
    console.log('\n🏫 ACADEMIES:', academies.length);
    academies.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.name} - ${a.status}${a.isDeleted ? ' (DELETED)' : ''}`);
    });

    // 6. Wallet Transactions
    const transactions = await prisma.walletTransaction.findMany({
      select: {
        id: true,
        user: { select: { name: true } },
        type: true,
        amount: true,
      }
    });
    console.log('\n💰 WALLET TRANSACTIONS:', transactions.length);
    transactions.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.user.name} - ${t.type} ₹${t.amount}`);
    });

    // 7. KYC Submissions
    const kycs = await prisma.organizerKYC.findMany({
      select: {
        id: true,
        organizer: { select: { name: true } },
        status: true,
      }
    });
    console.log('\n📋 KYC SUBMISSIONS:', kycs.length);
    kycs.forEach((k, i) => {
      console.log(`  ${i + 1}. ${k.organizer.name} - ${k.status}`);
    });

    // 8. Matches
    const matches = await prisma.match.findMany({
      select: {
        id: true,
        tournament: { select: { name: true } },
        status: true,
      }
    });
    console.log('\n🎾 MATCHES:', matches.length);
    matches.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.tournament.name} - ${m.status}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Users: ${users.length}`);
    console.log(`Tournaments: ${tournaments.length}`);
    console.log(`Registrations: ${registrations.length}`);
    console.log(`Categories: ${categories.length}`);
    console.log(`Academies: ${academies.length}`);
    console.log(`Transactions: ${transactions.length}`);
    console.log(`KYC Submissions: ${kycs.length}`);
    console.log(`Matches: ${matches.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();
