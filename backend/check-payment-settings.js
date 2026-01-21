import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaymentSettings() {
  try {
    console.log('🔍 Checking Payment Settings...\n');

    const settings = await prisma.paymentSettings.findFirst({
      where: { isActive: true }
    });

    if (!settings) {
      console.log('❌ No active payment settings found');
      console.log('\n💡 Admin needs to upload QR code via Admin Dashboard → QR Settings');
      return;
    }

    console.log('✅ Payment Settings Found:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📱 UPI ID: ${settings.upiId}`);
    console.log(`👤 Account Holder: ${settings.accountHolder}`);
    console.log(`🖼️  QR Code URL: ${settings.qrCodeUrl}`);
    console.log(`🆔 QR Code Public ID: ${settings.qrCodePublicId || 'N/A'}`);
    console.log(`✅ Is Active: ${settings.isActive}`);
    console.log(`📅 Created At: ${settings.createdAt}`);
    console.log(`📅 Updated At: ${settings.updatedAt}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (settings.qrCodeUrl) {
      console.log('\n✅ QR Code is uploaded and will be shown to players during registration');
      console.log('🔗 Players will see this QR code when they register for tournaments');
    } else {
      console.log('\n⚠️  No QR code uploaded yet!');
      console.log('📝 Admin needs to upload the clean QR code showing:');
      console.log('   - UPI ID: 9742628582@slc (or @sbi)');
      console.log('   - Account Holder: P S Lochan');
    }

    console.log('\n💡 To update QR code:');
    console.log('   1. Login as admin (ADMIN@gmail.com)');
    console.log('   2. Go to Admin Dashboard → QR Settings');
    console.log('   3. Upload the clean QR code image');
    console.log('   4. Save settings');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentSettings();
