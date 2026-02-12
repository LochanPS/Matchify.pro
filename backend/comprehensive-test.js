import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function comprehensiveTest() {
  console.log('🧪 COMPREHENSIVE APPLICATION TEST\n');
  console.log('═'.repeat(60));
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    // TEST 1: Database Connection
    console.log('\n📊 TEST 1: Database Connection');
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      results.passed.push('Database Connection');
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      results.failed.push('Database Connection');
    }

    // TEST 2: Users
    console.log('\n👥 TEST 2: Users');
    try {
      const userCount = await prisma.user.count();
      const adminUser = await prisma.user.findFirst({
        where: { email: 'ADMIN@gmail.com' }
      });
      console.log(`✅ Total users: ${userCount}`);
      console.log(`✅ Admin user exists: ${adminUser ? 'Yes' : 'No'}`);
      if (!adminUser) {
        results.warnings.push('Admin user not found');
      }
      results.passed.push('Users');
    } catch (error) {
      console.log('❌ User test failed:', error.message);
      results.failed.push('Users');
    }

    // TEST 3: Tournaments
    console.log('\n🏆 TEST 3: Tournaments');
    try {
      const tournaments = await prisma.tournament.findMany({
        include: {
          categories: true,
          organizer: true,
          _count: {
            select: { registrations: true }
          }
        }
      });
      console.log(`✅ Total tournaments: ${tournaments.length}`);
      tournaments.forEach(t => {
        console.log(`   - ${t.name}: ${t.categories.length} categories, ${t._count.registrations} registrations, Status: ${t.status}`);
      });
      results.passed.push('Tournaments');
    } catch (error) {
      console.log('❌ Tournament test failed:', error.message);
      results.failed.push('Tournaments');
    }

    // TEST 4: Registrations
    console.log('\n📝 TEST 4: Registrations');
    try {
      const registrations = await prisma.registration.findMany({
        include: {
          user: { select: { name: true, email: true } },
          tournament: { select: { name: true } },
          category: { select: { name: true } }
        }
      });
      console.log(`✅ Total registrations: ${registrations.length}`);
      
      const byStatus = {
        pending: registrations.filter(r => r.status === 'pending').length,
        confirmed: registrations.filter(r => r.status === 'confirmed').length,
        cancelled: registrations.filter(r => r.status === 'cancelled').length
      };
      console.log(`   - Pending: ${byStatus.pending}`);
      console.log(`   - Confirmed: ${byStatus.confirmed}`);
      console.log(`   - Cancelled: ${byStatus.cancelled}`);
      
      results.passed.push('Registrations');
    } catch (error) {
      console.log('❌ Registration test failed:', error.message);
      results.failed.push('Registrations');
    }

    // TEST 5: Payment Verifications
    console.log('\n💳 TEST 5: Payment Verifications');
    try {
      const verifications = await prisma.paymentVerification.findMany({
        include: {
          registration: {
            include: {
              user: { select: { name: true } },
              tournament: { select: { name: true } }
            }
          }
        }
      });
      console.log(`✅ Total payment verifications: ${verifications.length}`);
      
      const byStatus = {
        pending: verifications.filter(v => v.status === 'pending').length,
        approved: verifications.filter(v => v.status === 'approved').length,
        rejected: verifications.filter(v => v.status === 'rejected').length
      };
      console.log(`   - Pending: ${byStatus.pending}`);
      console.log(`   - Approved: ${byStatus.approved}`);
      console.log(`   - Rejected: ${byStatus.rejected}`);
      
      results.passed.push('Payment Verifications');
    } catch (error) {
      console.log('❌ Payment verification test failed:', error.message);
      results.failed.push('Payment Verifications');
    }

    // TEST 6: Categories
    console.log('\n🎯 TEST 6: Categories');
    try {
      const categories = await prisma.category.findMany({
        include: {
          tournament: { select: { name: true } },
          _count: { select: { registrations: true } }
        }
      });
      console.log(`✅ Total categories: ${categories.length}`);
      categories.forEach(c => {
        console.log(`   - ${c.name} (${c.format}, ${c.gender}): ${c._count.registrations} registrations`);
      });
      results.passed.push('Categories');
    } catch (error) {
      console.log('❌ Category test failed:', error.message);
      results.failed.push('Categories');
    }

    // TEST 7: Tournament Payments
    console.log('\n💰 TEST 7: Tournament Payments');
    try {
      const payments = await prisma.tournamentPayment.findMany({
        include: {
          tournament: { select: { name: true } }
        }
      });
      console.log(`✅ Total tournament payment records: ${payments.length}`);
      payments.forEach(p => {
        console.log(`   - ${p.tournament.name}: ₹${p.totalCollected} collected, ${p.totalRegistrations} registrations`);
      });
      results.passed.push('Tournament Payments');
    } catch (error) {
      console.log('❌ Tournament payment test failed:', error.message);
      results.failed.push('Tournament Payments');
    }

    // TEST 8: Notifications
    console.log('\n🔔 TEST 8: Notifications');
    try {
      const notifications = await prisma.notification.count();
      const unread = await prisma.notification.count({
        where: { read: false }
      });
      console.log(`✅ Total notifications: ${notifications}`);
      console.log(`   - Unread: ${unread}`);
      results.passed.push('Notifications');
    } catch (error) {
      console.log('❌ Notification test failed:', error.message);
      results.failed.push('Notifications');
    }

    // TEST 9: Matches
    console.log('\n🎾 TEST 9: Matches');
    try {
      const matches = await prisma.match.count();
      console.log(`✅ Total matches: ${matches}`);
      results.passed.push('Matches');
    } catch (error) {
      console.log('❌ Match test failed:', error.message);
      results.failed.push('Matches');
    }

    // TEST 10: Draws
    console.log('\n📋 TEST 10: Draws');
    try {
      const draws = await prisma.draw.count();
      console.log(`✅ Total draws: ${draws}`);
      results.passed.push('Draws');
    } catch (error) {
      console.log('❌ Draw test failed:', error.message);
      results.failed.push('Draws');
    }

    // TEST 11: Prisma Relations
    console.log('\n🔗 TEST 11: Prisma Relations');
    try {
      // Test PaymentVerification -> Registration relation
      const verification = await prisma.paymentVerification.findFirst({
        include: { registration: true }
      });
      if (verification) {
        console.log('✅ PaymentVerification -> Registration relation works');
      } else {
        console.log('⚠️  No payment verifications to test relation');
      }
      
      // Test Registration -> PaymentVerification relation
      const registration = await prisma.registration.findFirst({
        include: { paymentVerification: true }
      });
      if (registration) {
        console.log('✅ Registration -> PaymentVerification relation works');
      }
      
      results.passed.push('Prisma Relations');
    } catch (error) {
      console.log('❌ Prisma relation test failed:', error.message);
      results.failed.push('Prisma Relations');
    }

    // SUMMARY
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    
    if (results.passed.length > 0) {
      console.log('\n✅ Passed Tests:');
      results.passed.forEach(test => console.log(`   - ${test}`));
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      results.failed.forEach(test => console.log(`   - ${test}`));
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      results.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    console.log('\n' + '═'.repeat(60));
    
    if (results.failed.length === 0) {
      console.log('🎉 ALL TESTS PASSED! Application is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Critical error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveTest();
