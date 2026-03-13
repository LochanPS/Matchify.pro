import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAcademySystem() {
  console.log('🧪 Testing Academy Approval System...\n');

  try {
    // 1. Check if Academy model exists
    console.log('1️⃣ Checking Academy model...');
    const academyCount = await prisma.academy.count();
    console.log(`   ✅ Academy model exists`);
    console.log(`   📊 Total academies: ${academyCount}\n`);

    // 2. Check pending academies
    console.log('2️⃣ Checking pending academies...');
    const pendingAcademies = await prisma.academy.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        phone: true,
        submittedByEmail: true,
        paymentScreenshot: true,
        createdAt: true
      }
    });
    console.log(`   📋 Pending academies: ${pendingAcademies.length}`);
    if (pendingAcademies.length > 0) {
      pendingAcademies.forEach((academy, i) => {
        console.log(`   ${i + 1}. ${academy.name} - ${academy.city}, ${academy.state}`);
        console.log(`      Email: ${academy.submittedByEmail || 'N/A'}`);
        console.log(`      Payment: ${academy.paymentScreenshot ? '✅ Uploaded' : '❌ Missing'}`);
      });
    } else {
      console.log('   ℹ️  No pending academies');
    }
    console.log('');

    // 3. Check approved academies
    console.log('3️⃣ Checking approved academies...');
    const approvedAcademies = await prisma.academy.findMany({
      where: { status: 'approved' },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        isVerified: true,
        reviewedAt: true
      }
    });
    console.log(`   ✅ Approved academies: ${approvedAcademies.length}`);
    if (approvedAcademies.length > 0) {
      approvedAcademies.slice(0, 5).forEach((academy, i) => {
        console.log(`   ${i + 1}. ${academy.name} - ${academy.city}, ${academy.state}`);
      });
      if (approvedAcademies.length > 5) {
        console.log(`   ... and ${approvedAcademies.length - 5} more`);
      }
    }
    console.log('');

    // 4. Check rejected academies
    console.log('4️⃣ Checking rejected academies...');
    const rejectedAcademies = await prisma.academy.findMany({
      where: { status: 'rejected' },
      select: {
        id: true,
        name: true,
        rejectionReason: true,
        reviewedAt: true
      }
    });
    console.log(`   ❌ Rejected academies: ${rejectedAcademies.length}`);
    if (rejectedAcademies.length > 0) {
      rejectedAcademies.forEach((academy, i) => {
        console.log(`   ${i + 1}. ${academy.name}`);
        console.log(`      Reason: ${academy.rejectionReason || 'N/A'}`);
      });
    }
    console.log('');

    // 5. Check blocked academies
    console.log('5️⃣ Checking blocked academies...');
    const blockedAcademies = await prisma.academy.findMany({
      where: { isBlocked: true },
      select: {
        id: true,
        name: true,
        blockReason: true,
        blockedAt: true
      }
    });
    console.log(`   🚫 Blocked academies: ${blockedAcademies.length}`);
    if (blockedAcademies.length > 0) {
      blockedAcademies.forEach((academy, i) => {
        console.log(`   ${i + 1}. ${academy.name}`);
        console.log(`      Reason: ${academy.blockReason || 'N/A'}`);
      });
    }
    console.log('');

    // 6. Check deleted academies
    console.log('6️⃣ Checking deleted academies...');
    const deletedAcademies = await prisma.academy.findMany({
      where: { isDeleted: true },
      select: {
        id: true,
        name: true,
        deletionReason: true,
        deletedAt: true
      }
    });
    console.log(`   🗑️  Deleted academies: ${deletedAcademies.length}`);
    if (deletedAcademies.length > 0) {
      deletedAcademies.forEach((academy, i) => {
        console.log(`   ${i + 1}. ${academy.name}`);
        console.log(`      Reason: ${academy.deletionReason || 'N/A'}`);
      });
    }
    console.log('');

    // 7. Check admin notifications
    console.log('7️⃣ Checking admin notifications for academy submissions...');
    const adminUser = await prisma.user.findFirst({
      where: { email: { equals: 'ADMIN@gmail.com', mode: 'insensitive' } }
    });
    
    if (adminUser) {
      const academyNotifications = await prisma.notification.findMany({
        where: {
          userId: adminUser.id,
          type: { in: ['ACADEMY_SUBMISSION', 'ACADEMY_APPROVED', 'ACADEMY_REJECTED'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      console.log(`   📬 Academy notifications: ${academyNotifications.length}`);
      if (academyNotifications.length > 0) {
        academyNotifications.forEach((notif, i) => {
          console.log(`   ${i + 1}. ${notif.type} - ${notif.title}`);
          console.log(`      ${notif.message.substring(0, 60)}...`);
        });
      }
    } else {
      console.log('   ⚠️  Admin user not found');
    }
    console.log('');

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Total Academies: ${academyCount}`);
    console.log(`   ⏳ Pending: ${pendingAcademies.length}`);
    console.log(`   ✅ Approved: ${approvedAcademies.length}`);
    console.log(`   ❌ Rejected: ${rejectedAcademies.length}`);
    console.log(`   🚫 Blocked: ${blockedAcademies.length}`);
    console.log(`   🗑️  Deleted: ${deletedAcademies.length}`);
    console.log('');

    // System Status
    console.log('🔍 SYSTEM STATUS:');
    console.log(`   ✅ Database connection: Working`);
    console.log(`   ✅ Academy model: Accessible`);
    console.log(`   ✅ Notification system: ${adminUser ? 'Working' : 'Admin not found'}`);
    console.log('');

    // Recommendations
    if (pendingAcademies.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      console.log(`   📝 You have ${pendingAcademies.length} pending academy submission(s)`);
      console.log(`   👉 Go to Admin Panel → Academy Approvals to review them`);
      console.log(`   🔗 URL: http://localhost:5173/admin/academies`);
    } else {
      console.log('✨ All academy submissions have been reviewed!');
    }

  } catch (error) {
    console.error('❌ Error testing academy system:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAcademySystem()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
