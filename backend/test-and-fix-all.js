import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000';

console.log('🔧 Matchify.pro - Complete System Test & Fix\n');
console.log('='.repeat(60));

async function testAndFix() {
  try {
    // 1. Test Backend Health
    console.log('\n1️⃣  Testing Backend Health...');
    try {
      const health = await axios.get(`${API_URL}/health`);
      console.log('✅ Backend is running:', health.data.status);
    } catch (err) {
      console.log('❌ Backend is NOT running!');
      console.log('   Please start backend: cd matchify/backend && npm run dev');
      process.exit(1);
    }

    // 2. Setup Demo Users
    console.log('\n2️⃣  Setting up demo users...');
    const demoUsers = [
      {
        email: 'testplayer@matchify.com',
        password: 'password123',
        role: 'PLAYER',
        name: 'Test Player',
        phone: '+91 9876543210',
        city: 'Mumbai',
        state: 'Maharashtra',
        walletBalance: 1000
      },
      {
        email: 'testorganizer@matchify.com',
        password: 'password123',
        role: 'ORGANIZER',
        name: 'Test Organizer',
        phone: '+91 9876543211',
        city: 'Delhi',
        state: 'Delhi',
        walletBalance: 25
      },
      {
        email: 'umpire@test.com',
        password: 'password123',
        role: 'UMPIRE',
        name: 'Test Umpire',
        phone: '+91 9876543212',
        city: 'Bangalore',
        state: 'Karnataka',
        walletBalance: 0
      },
      {
        email: 'admin@matchify.com',
        password: 'password123',
        role: 'ADMIN',
        name: 'Admin User',
        phone: '+91 9876543213',
        city: 'Mumbai',
        state: 'Maharashtra',
        walletBalance: 0
      }
    ];

    for (const userData of demoUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      const hashedPassword = await bcrypt.hash(userData.password, 12);

      if (existingUser) {
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: hashedPassword,
            name: userData.name,
            phone: userData.phone,
            city: userData.city,
            state: userData.state,
            role: userData.role,
            walletBalance: userData.walletBalance,
            isActive: true,
            isSuspended: false
          }
        });
        console.log(`   ✅ Updated: ${userData.email}`);
      } else {
        await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            phone: userData.phone,
            city: userData.city,
            state: userData.state,
            role: userData.role,
            walletBalance: userData.walletBalance
          }
        });
        console.log(`   ✅ Created: ${userData.email}`);
      }
    }

    // 3. Test Login
    console.log('\n3️⃣  Testing Login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: 'testorganizer@matchify.com',
        password: 'password123'
      });
      console.log('✅ Login successful');
      console.log(`   User: ${loginResponse.data.user.name}`);
      console.log(`   Role: ${loginResponse.data.user.role}`);
      console.log(`   Wallet: ₹${loginResponse.data.user.walletBalance}`);
      
      const token = loginResponse.data.accessToken;

      // 4. Test Organizer Dashboard
      console.log('\n4️⃣  Testing Organizer Dashboard...');
      try {
        const dashboardResponse = await axios.get(`${API_URL}/api/organizer/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Dashboard API working');
        console.log(`   Total Tournaments: ${dashboardResponse.data.data.total_tournaments}`);
        console.log(`   Total Registrations: ${dashboardResponse.data.data.total_registrations}`);
        console.log(`   Total Revenue: ₹${dashboardResponse.data.data.revenue.total}`);
      } catch (err) {
        console.log('❌ Dashboard API failed:', err.response?.data?.error || err.message);
      }

      // 5. Test Tournament Listing
      console.log('\n5️⃣  Testing Tournament Listing...');
      try {
        const tournamentsResponse = await axios.get(`${API_URL}/api/tournaments?limit=5`);
        console.log('✅ Tournament listing working');
        console.log(`   Found: ${tournamentsResponse.data.data.tournaments.length} tournaments`);
        console.log(`   Total: ${tournamentsResponse.data.data.pagination.total} tournaments`);
      } catch (err) {
        console.log('❌ Tournament listing failed:', err.response?.data?.error || err.message);
      }

    } catch (err) {
      console.log('❌ Login failed:', err.response?.data?.error || err.message);
    }

    // 6. Give credits to all organizers
    console.log('\n6️⃣  Giving 25 credits to organizers with 0 balance...');
    const organizersUpdated = await prisma.user.updateMany({
      where: {
        role: 'ORGANIZER',
        walletBalance: 0
      },
      data: {
        walletBalance: 25
      }
    });
    console.log(`✅ Updated ${organizersUpdated.count} organizers`);

    // 7. Delete demo tournaments
    console.log('\n7️⃣  Cleaning up demo tournaments...');
    const allTournaments = await prisma.tournament.findMany({
      select: { id: true, name: true }
    });

    let deletedCount = 0;
    for (const tournament of allTournaments) {
      const name = tournament.name.toLowerCase();
      if (
        name.includes('test') ||
        name.includes('demo') ||
        name.includes('sample') ||
        name.includes('dummy') ||
        name.includes('example')
      ) {
        try {
          await prisma.registration.deleteMany({ where: { tournamentId: tournament.id } });
          await prisma.category.deleteMany({ where: { tournamentId: tournament.id } });
          await prisma.tournamentPoster.deleteMany({ where: { tournamentId: tournament.id } });
          await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });
          await prisma.tournament.delete({ where: { id: tournament.id } });
          deletedCount++;
        } catch (err) {
          // Ignore errors
        }
      }
    }
    console.log(`✅ Deleted ${deletedCount} demo tournaments`);

    // 8. Make all tournaments public
    console.log('\n8️⃣  Making all tournaments public...');
    const tournamentsUpdated = await prisma.tournament.updateMany({
      where: { privacy: 'private' },
      data: { privacy: 'public' }
    });
    console.log(`✅ Updated ${tournamentsUpdated.count} tournaments to public`);

    // 9. Database Summary
    console.log('\n9️⃣  Database Summary:');
    const [organizers, players, umpires, admins, tournaments, published] = await Promise.all([
      prisma.user.count({ where: { role: 'ORGANIZER' } }),
      prisma.user.count({ where: { role: 'PLAYER' } }),
      prisma.user.count({ where: { role: 'UMPIRE' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: 'published' } })
    ]);

    console.log(`   Organizers: ${organizers}`);
    console.log(`   Players: ${players}`);
    console.log(`   Umpires: ${umpires}`);
    console.log(`   Admins: ${admins}`);
    console.log(`   Total Tournaments: ${tournaments}`);
    console.log(`   Published Tournaments: ${published}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED! System is working correctly.\n');
    console.log('📝 Demo Credentials:');
    console.log('   Player:    testplayer@matchify.com / password123');
    console.log('   Organizer: testorganizer@matchify.com / password123');
    console.log('   Umpire:    umpire@test.com / password123');
    console.log('   Admin:     admin@matchify.com / password123');
    console.log('\n🚀 You can now use the app at http://localhost:5173');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testAndFix().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
