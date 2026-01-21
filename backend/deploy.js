import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function deploy() {
  try {
    console.log('🚀 Starting deployment setup...');

    // Push database schema
    console.log('📊 Database schema already pushed by Prisma');

    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'ADMIN@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ADMIN@123(123)';

    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Super Admin',
          roles: 'ADMIN,PLAYER,ORGANIZER,UMPIRE',
          isActive: true,
          isVerified: true,
          country: 'India'
        }
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Check if payment settings exist
    let paymentSettings = await prisma.paymentSettings.findFirst();

    if (!paymentSettings) {
      console.log('💳 Creating payment settings...');
      paymentSettings = await prisma.paymentSettings.create({
        data: {
          upiId: 'admin@matchify.pro',
          accountHolder: 'Matchify Pro Admin',
          isActive: true
        }
      });
      console.log('✅ Payment settings created successfully');
    } else {
      console.log('✅ Payment settings already exist');
    }

    console.log('🎉 Deployment setup completed successfully!');
    console.log('📝 Summary:');
    console.log(`   - Admin Email: ${adminEmail}`);
    console.log(`   - Payment UPI: ${paymentSettings.upiId}`);
    console.log(`   - Database: Connected`);

  } catch (error) {
    console.error('❌ Deployment setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deploy();
