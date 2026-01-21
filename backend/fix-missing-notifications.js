// Script to fix missing admin notifications and user ledger entries
import { PrismaClient } from '@prisma/client';
import userPaymentLedgerService from './src/services/userPaymentLedgerService.js';

const prisma = new PrismaClient();

async function fixMissingNotifications() {
  try {
    console.log('🔧 Fixing missing admin notifications and user ledger entries...');
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        roles: {
          contains: 'ADMIN'
        }
      }
    });
    
    if (!adminUser) {
      console.error('❌ No admin user found');
      return;
    }
    
    console.log('✅ Admin user found:', adminUser.name);
    
    // Find registrations that have screenshots but no payment verification records
    const registrationsWithoutVerification = await prisma.registration.findMany({
      where: {
        AND: [
          { paymentScreenshot: { not: null } },
          { status: 'pending' },
          { 
            paymentVerification: null // No payment verification record exists
          }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        tournament: {
          select: { id: true, name: true }
        },
        category: {
          select: { name: true }
        }
      }
    });
    
    console.log(`\n📋 Found ${registrationsWithoutVerification.length} registrations needing fixes`);
    
    for (const registration of registrationsWithoutVerification) {
      console.log(`\n🔧 Processing: ${registration.user.name} - ${registration.tournament.name}`);
      
      try {
        // 1. Create PaymentVerification record
        await prisma.paymentVerification.create({
          data: {
            registrationId: registration.id,
            userId: registration.userId,
            tournamentId: registration.tournamentId,
            amount: registration.amountTotal,
            paymentScreenshot: registration.paymentScreenshot,
            status: 'pending',
            submittedAt: registration.createdAt,
          }
        });
        console.log('  ✅ Created payment verification record');
        
        // 2. Create admin notification
        await prisma.notification.create({
          data: {
            userId: adminUser.id,
            type: 'PAYMENT_VERIFICATION_REQUIRED',
            title: '🔔 Registration Needs Verification',
            message: `${registration.user.name} registered for ${registration.tournament.name} (₹${registration.amountTotal}). Please verify their payment screenshot.`,
            data: JSON.stringify({
              registrationId: registration.id,
              playerName: registration.user.name,
              tournamentId: registration.tournament.id,
              tournamentName: registration.tournament.name,
              amount: registration.amountTotal,
              paymentScreenshot: registration.paymentScreenshot,
              category: registration.category.name,
              backfilled: true
            }),
          },
        });
        console.log('  ✅ Created admin notification');
        
        // 3. Create user ledger entry
        await userPaymentLedgerService.recordUserPayment({
          userId: registration.userId,
          amount: registration.amountTotal,
          tournamentId: registration.tournamentId,
          registrationId: registration.id,
          description: `Tournament entry fee for ${registration.tournament.name} - ${registration.category.name}`,
          transactionRef: `REG-${registration.id}`,
          paymentMethod: 'UPI',
          screenshot: registration.paymentScreenshot,
          adminId: adminUser.id
        });
        console.log('  ✅ Created user ledger entry');
        
      } catch (error) {
        console.error(`  ❌ Error processing registration ${registration.id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Finished processing registrations');
    
    // Show summary
    const totalNotifications = await prisma.notification.count({
      where: { type: 'PAYMENT_VERIFICATION_REQUIRED' }
    });
    
    const totalLedgerEntries = await prisma.userPaymentLedger.count();
    
    console.log('\n📊 Summary:');
    console.log(`  Admin notifications: ${totalNotifications}`);
    console.log(`  User ledger entries: ${totalLedgerEntries}`);
    
  } catch (error) {
    console.error('❌ Error fixing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingNotifications();