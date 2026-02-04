/**
 * Fix Admin Panel - Check and fix all admin panel issues
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixAdminPanel() {
  console.log('🔧 Fixing Admin Panel Issues...\n');

  try {
    // 1. Check if PaymentSettings table exists and has data
    console.log('1️⃣  Checking Payment Settings...');
    let paymentSettings = await prisma.paymentSettings.findFirst();
    
    if (!paymentSettings) {
      console.log('   ❌ No payment settings found. Creating default...');
      paymentSettings = await prisma.paymentSettings.create({
        data: {
          upiId: '9742628582@slc',
          accountHolder: 'PS Lochan',
          qrCodeUrl: null,
          qrCodePublicId: null,
          isActive: true
        }
      });
      console.log('   ✅ Payment settings created:', paymentSettings);
    } else {
      console.log('   ✅ Payment settings exist:', {
        id: paymentSettings.id,
        upiId: paymentSettings.upiId,
        accountHolder: paymentSettings.accountHolder,
        hasQR: !!paymentSettings.qrCodeUrl,
        isActive: paymentSettings.isActive
      });
    }

    // 2. Check if admin user exists
    console.log('\n2️⃣  Checking Admin User...');
    const adminUser = await prisma.user.findFirst({
      where: { email: 'ADMIN@gmail.com' }
    });

    if (!adminUser) {
      console.log('   ❌ Admin user not found!');
      console.log('   Run: node ensure-admin-exists.js');
    } else {
      console.log('   ✅ Admin user exists:', {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        roles: adminUser.roles
      });
    }

    // 3. Test database connection
    console.log('\n3️⃣  Testing Database Connection...');
    const userCount = await prisma.user.count();
    const tournamentCount = await prisma.tournament.count();
    console.log('   ✅ Database connected:', {
      users: userCount,
      tournaments: tournamentCount
    });

    // 4. Check Cloudinary configuration
    console.log('\n4️⃣  Checking Cloudinary Configuration...');
    const cloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    
    if (cloudinaryConfigured) {
      console.log('   ✅ Cloudinary is configured');
      console.log('      Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    } else {
      console.log('   ❌ Cloudinary NOT configured');
      console.log('      This will cause QR code upload to fail');
    }

    // 5. Check JWT configuration
    console.log('\n5️⃣  Checking JWT Configuration...');
    const jwtConfigured = !!(
      process.env.JWT_SECRET &&
      process.env.JWT_REFRESH_SECRET
    );
    
    if (jwtConfigured) {
      console.log('   ✅ JWT is configured');
    } else {
      console.log('   ❌ JWT NOT configured');
    }

    console.log('\n✅ Admin Panel Check Complete!\n');
    console.log('📊 Summary:');
    console.log('   - Payment Settings:', paymentSettings ? '✅' : '❌');
    console.log('   - Admin User:', adminUser ? '✅' : '❌');
    console.log('   - Database:', '✅');
    console.log('   - Cloudinary:', cloudinaryConfigured ? '✅' : '❌');
    console.log('   - JWT:', jwtConfigured ? '✅' : '❌');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPanel();
