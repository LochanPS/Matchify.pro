import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function healthCheck() {
  try {
    console.log('🔍 Running health check...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection: OK');
    
    // Check admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' }
    });
    console.log(`✅ Admin user: ${admin ? 'EXISTS' : 'MISSING'}`);
    
    // Check payment settings
    const paymentSettings = await prisma.paymentSettings.findFirst();
    console.log(`✅ Payment settings: ${paymentSettings ? 'EXISTS' : 'MISSING'}`);
    
    // Check tournaments
    const tournamentCount = await prisma.tournament.count();
    console.log(`✅ Tournaments: ${tournamentCount} found`);
    
    // Check users
    const userCount = await prisma.user.count();
    console.log(`✅ Users: ${userCount} found`);
    
    // Check payment verifications
    const pendingPayments = await prisma.paymentVerification.count({
      where: { status: 'pending' }
    });
    console.log(`✅ Pending payments: ${pendingPayments} found`);
    
    console.log('🎉 Health check completed successfully!');
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck();