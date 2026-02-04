import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializePaymentSettings() {
  console.log('🔧 Initializing payment settings...\n');

  try {
    // Check if payment settings already exist
    const existing = await prisma.paymentSettings.findFirst({
      where: { isActive: true }
    });

    if (existing) {
      console.log('✅ Payment settings already exist:');
      console.log(`   UPI ID: ${existing.upiId}`);
      console.log(`   Account Holder: ${existing.accountHolder}`);
      console.log(`   QR Code: ${existing.qrCodeUrl ? 'Uploaded' : 'Not uploaded'}`);
      console.log(`   Status: ${existing.isActive ? 'Active' : 'Inactive'}`);
      return;
    }

    // Create default payment settings
    const settings = await prisma.paymentSettings.create({
      data: {
        upiId: 'matchify@paytm',
        accountHolder: 'Matchify Pro',
        qrCodeUrl: null,
        qrCodePublicId: null,
        isActive: true
      }
    });

    console.log('✅ Payment settings initialized successfully!');
    console.log(`   UPI ID: ${settings.upiId}`);
    console.log(`   Account Holder: ${settings.accountHolder}`);
    console.log(`   Status: Active`);
    console.log('\n📝 Note: Please upload your QR code from the admin panel');

  } catch (error) {
    console.error('❌ Error initializing payment settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializePaymentSettings()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
