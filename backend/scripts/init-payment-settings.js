import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function initPaymentSettings() {
  try {
    console.log('🔧 Initializing payment settings...');

    // Check if settings already exist
    const existing = await prisma.paymentSettings.findFirst();
    
    if (existing) {
      console.log('✅ Payment settings already exist');
      console.log('Current settings:', {
        upiId: existing.upiId,
        accountHolder: existing.accountHolder,
        isActive: existing.isActive
      });
      return;
    }

    // Create initial payment settings
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
    console.log('Settings:', {
      id: settings.id,
      upiId: settings.upiId,
      accountHolder: settings.accountHolder,
      isActive: settings.isActive
    });
    console.log('\n📝 Note: Upload QR code via Admin Panel > QR Code Settings');

  } catch (error) {
    console.error('❌ Error initializing payment settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initPaymentSettings();
