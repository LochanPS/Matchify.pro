import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

console.log('🔍 MATCHIFY.PRO SYSTEM CHECK\n');
console.log('═'.repeat(50));

async function checkSystem() {
  const results = {
    database: false,
    admin: false,
    users: 0,
    tournaments: 0,
    registrations: 0,
    matches: 0,
    notifications: 0,
    errors: []
  };

  try {
    // 1. Check Database Connection
    console.log('\n📊 Checking Database Connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    results.database = true;

    // 2. Check Admin User
    console.log('\n👤 Checking Admin User...');
    const admin = await prisma.user.findFirst({
      where: { 
        email: 'ADMIN@gmail.com'
      }
    });
    
    if (admin) {
      console.log('✅ Admin user exists');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Roles: ${admin.roles}`);
      results.admin = true;
    } else {
      console.log('❌ Admin user not found');
      results.errors.push('Admin user missing');
    }

    // 3. Count Users
    console.log('\n👥 Checking Users...');
    const userCount = await prisma.user.count();
    console.log(`✅ Total users: ${userCount}`);
    results.users = userCount;

    // Get role breakdown
    const allUsers = await prisma.user.findMany({
      select: { roles: true }
    });
    
    const roleStats = {
      PLAYER: 0,
      ORGANIZER: 0,
      UMPIRE: 0,
      ADMIN: 0
    };
    
    allUsers.forEach(user => {
      const roles = user.roles.split(',');
      roles.forEach(role => {
        if (roleStats[role] !== undefined) {
          roleStats[role]++;
        }
      });
    });
    
    console.log('   Role breakdown:');
    console.log(`   - Players: ${roleStats.PLAYER}`);
    console.log(`   - Organizers: ${roleStats.ORGANIZER}`);
    console.log(`   - Umpires: ${roleStats.UMPIRE}`);
    console.log(`   - Admins: ${roleStats.ADMIN}`);

    // 4. Check Tournaments
    console.log('\n🏆 Checking Tournaments...');
    const tournamentCount = await prisma.tournament.count();
    console.log(`✅ Total tournaments: ${tournamentCount}`);
    results.tournaments = tournamentCount;

    if (tournamentCount > 0) {
      const tournaments = await prisma.tournament.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true
        }
      });
      
      console.log('   Recent tournaments:');
      tournaments.forEach(t => {
        console.log(`   - ${t.name} (${t.status})`);
      });
    }

    // 5. Check Registrations
    console.log('\n📝 Checking Registrations...');
    const registrationCount = await prisma.registration.count();
    console.log(`✅ Total registrations: ${registrationCount}`);
    results.registrations = registrationCount;

    // 6. Check Matches
    console.log('\n🎾 Checking Matches...');
    const matchCount = await prisma.match.count();
    console.log(`✅ Total matches: ${matchCount}`);
    results.matches = matchCount;

    // 7. Check Notifications
    console.log('\n🔔 Checking Notifications...');
    const notificationCount = await prisma.notification.count();
    console.log(`✅ Total notifications: ${notificationCount}`);
    results.notifications = notificationCount;

    // 8. Check Environment Variables
    console.log('\n⚙️  Checking Environment Variables...');
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'PORT',
      'FRONTEND_URL',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingEnvVars.length === 0) {
      console.log('✅ All required environment variables are set');
    } else {
      console.log('❌ Missing environment variables:');
      missingEnvVars.forEach(v => console.log(`   - ${v}`));
      results.errors.push(`Missing env vars: ${missingEnvVars.join(', ')}`);
    }

    // 9. Check Database File
    console.log('\n💾 Checking Database File...');
    const dbPath = './prisma/dev.db';
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Database file exists (${sizeInMB} MB)`);
    } else {
      console.log('❌ Database file not found');
      results.errors.push('Database file missing');
    }

  } catch (error) {
    console.error('\n❌ Error during system check:', error.message);
    results.errors.push(error.message);
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📋 SYSTEM CHECK SUMMARY\n');
  console.log(`Database: ${results.database ? '✅' : '❌'}`);
  console.log(`Admin User: ${results.admin ? '✅' : '❌'}`);
  console.log(`Users: ${results.users}`);
  console.log(`Tournaments: ${results.tournaments}`);
  console.log(`Registrations: ${results.registrations}`);
  console.log(`Matches: ${results.matches}`);
  console.log(`Notifications: ${results.notifications}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Issues Found:');
    results.errors.forEach(err => console.log(`   - ${err}`));
  } else {
    console.log('\n✅ All systems operational!');
  }
  
  console.log('\n' + '═'.repeat(50));
  
  return results;
}

checkSystem()
  .then(() => {
    console.log('\n✅ System check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ System check failed:', error);
    process.exit(1);
  });
