import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializePaymentSettings() {
  try {
    console.log('🔍 Checking payment settings...');

    // Check if payment settings exist
    const existingSettings = await prisma.paymentSettings.findFirst({
      where: { isActive: true }
    });

    if (existingSettings) {
      console.log('✅ Payment settings already exist:');
      console.log('   UPI ID:', existingSettings.upiId);
      console.log('   Account Holder:', existingSettings.accountHolder);
      console.log('   QR Code URL:', existingSettings.qrCodeUrl || 'Not uploaded yet');
      return;
    }

    // Create default payment settings
    console.log('📝 Creating default payment settings...');
    
    const settings = await prisma.paymentSettings.create({
      data: {
        upiId: '9742628582@sbi',
        accountHolder: 'P S Lochan',
        qrCodeUrl: null, // Will be uploaded via admin panel
        qrCodePublicId: null,
        isActive: true
      }
    });

    console.log('✅ Payment settings created successfully!');
    console.log('   UPI ID:', settings.upiId);
    console.log('   Account Holder:', settings.accountHolder);
    console.log('');
    console.log('📱 Next step: Upload QR code via admin panel');
    console.log('   URL: http://localhost:5173/admin/qr-settings');

  } catch (error) {
    console.error('❌ Error initializing payment settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializePaymentSettings();
