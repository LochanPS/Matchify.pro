import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample payment screenshot URLs (realistic looking)
const paymentScreenshots = [
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_001.jpg',
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_002.jpg',
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_003.jpg',
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_004.jpg',
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_005.jpg',
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_006.jpg',
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_007.jpg',
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_008.jpg',
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_009.jpg',
  'https://res.cloudinary.com/matchify/image/upload/v1/payments/screenshot_010.jpg'
];

// UPI transaction IDs (realistic format)
function generateUPITransactionId() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `UPI${timestamp}${random}`;
}

// Generate realistic payment reference
function generatePaymentReference() {
  const prefixes = ['PAY', 'TXN', 'REF', 'PMT'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}${number}`;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function simulate128TournamentRegistrations() {
  try {
    console.log('🏸 Starting tournament registration simulation...');
    
    // First, find the tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: { contains: 'ace badhbhj', mode: 'insensitive' }
      },
      include: {
        categories: true
      }
    });

    if (!tournament) {
      console.log('❌ Tournament "ace badhbhj" not found');
      return;
    }

    console.log('✅ Found tournament:', tournament.name);
    console.log('📊 Categories available:', tournament.categories.length);

    if (tournament.categories.length === 0) {
      console.log('❌ No categories found in tournament');
      return;
    }

    // Get all test users (excluding admin)
    const testUsers = await prisma.user.findMany({
      where: {
        AND: [
          { roles: { not: { contains: 'ADMIN' } } },
          { email: { not: { contains: 'admin' } } }
        ]
      },
      take: 128
    });

    console.log(`✅ Found ${testUsers.length} test users to register`);

    if (testUsers.length === 0) {
      console.log('❌ No test users found');
      return;
    }

    // Find admin user for notifications
    const adminUser = await prisma.user.findFirst({
      where: { roles: { contains: 'ADMIN' } }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Found admin user:', adminUser.name);

    let registrationCount = 0;
    let notificationCount = 0;
    let paymentVerificationCount = 0;
    let ledgerEntryCount = 0;

    // Process users in batches
    const batchSize = 10;
    for (let i = 0; i < testUsers.length; i += batchSize) {
      const batch = testUsers.slice(i, i + batchSize);
      
      console.log(`📝 Processing batch ${Math.floor(i / batchSize) + 1}: Users ${i + 1} to ${Math.min(i + batchSize, testUsers.length)}`);

      for (const user of batch) {
        try {
          // Select random category
          const category = getRandomElement(tournament.categories);
          const entryFee = category.entryFee || 100; // Default to ₹100 if not set

          // Create registration
          const registration = await prisma.registration.create({
            data: {
              userId: user.id,
              tournamentId: tournament.id,
              categoryId: category.id,
              amountTotal: entryFee,
              amountRazorpay: entryFee,
              amountWallet: 0,
              paymentScreenshot: getRandomElement(paymentScreenshots),
              status: 'pending', // NOT CONFIRMED - waiting for admin approval
              paymentStatus: 'submitted', // Payment submitted, waiting for verification
              createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random date in last week
            }
          });

          registrationCount++;

          // Create payment verification record
          const paymentVerification = await prisma.paymentVerification.create({
            data: {
              registrationId: registration.id,
              tournamentId: tournament.id,
              userId: user.id,
              amount: entryFee,
              paymentScreenshot: registration.paymentScreenshot,
              status: 'pending'
            }
          });

          paymentVerificationCount++;

          // Create admin notification
          const notification = await prisma.notification.create({
            data: {
              userId: adminUser.id,
              title: '💰 New Payment Verification Required',
              message: `🏸 **MATCHIFY.PRO Payment Verification**

📋 **Player Details:**
👤 Name: ${user.name}
📧 Email: ${user.email}
📱 Phone: ${user.phone || 'N/A'}

🏆 **Tournament Details:**
🎯 Tournament: ${tournament.name}
📍 Location: ${tournament.location || 'Bengaluru Urban, Karnataka'}
📅 Dates: ${tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'} - ${tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'TBD'}
🏸 Category: ${category.name}

💰 **Payment Information:**
💵 Amount: ₹${entryFee}
🆔 Transaction ID: ${generateUPITransactionId()}
📄 Reference: ${generatePaymentReference()}
📸 Screenshot: ${registration.paymentScreenshot}

⚡ **Action Required:**
Please review the payment screenshot and approve/reject this registration.

🔴 **IMPORTANT:** This registration is PENDING your approval. The player will only be confirmed after you verify the payment.

🔗 **Quick Actions:**
- View Payment Verification Page
- Approve/Reject Registration
- Check Player Profile
- Review Tournament Details

⏰ Submitted: ${registration.createdAt.toLocaleString()}
📋 Status: PENDING ADMIN APPROVAL`,
              type: 'PAYMENT_VERIFICATION',
              data: JSON.stringify({
                registrationId: registration.id,
                paymentVerificationId: paymentVerification.id,
                userId: user.id,
                tournamentId: tournament.id,
                amount: entryFee,
                screenshot: registration.paymentScreenshot
              })
            }
          });

          notificationCount++;

          // Create user payment ledger entry
          const ledgerEntry = await prisma.userPaymentLedger.create({
            data: {
              userId: user.id,
              type: 'CREDIT',
              category: 'TOURNAMENT_ENTRY',
              amount: entryFee,
              description: `Tournament entry fee - ${tournament.name} (${category.name})`,
              tournamentId: tournament.id,
              registrationId: registration.id,
              paymentMethod: 'UPI',
              transactionRef: generateUPITransactionId(),
              screenshot: registration.paymentScreenshot,
              status: 'pending' // NOT CONFIRMED - waiting for admin verification
            }
          });

          ledgerEntryCount++;

          // Update or create user payment summary
          const existingSummary = await prisma.userPaymentSummary.findUnique({
            where: { userId: user.id }
          });

          if (existingSummary) {
            await prisma.userPaymentSummary.update({
              where: { userId: user.id },
              data: {
                // Don't add to totalCredits yet - only after admin approval
                lastTransactionDate: new Date(),
                lastTransactionAmount: entryFee,
                lastTransactionType: 'CREDIT'
              }
            });
          } else {
            await prisma.userPaymentSummary.create({
              data: {
                userId: user.id,
                totalCredits: 0, // Will be updated after admin approval
                totalDebits: 0,
                currentBalance: 0, // Will be updated after admin approval
                totalTransactions: 1,
                creditTransactions: 0, // Will be incremented after admin approval
                debitTransactions: 0,
                lastTransactionDate: new Date(),
                lastTransactionAmount: entryFee,
                lastTransactionType: 'CREDIT'
              }
            });
          }

        } catch (error) {
          console.error(`❌ Error processing user ${user.name}:`, error.message);
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('🎉 Tournament registration simulation completed!');
    console.log('📊 Summary:');
    console.log(`  ✅ Registrations created: ${registrationCount}`);
    console.log(`  ✅ Payment verifications: ${paymentVerificationCount}`);
    console.log(`  ✅ Admin notifications: ${notificationCount}`);
    console.log(`  ✅ Ledger entries: ${ledgerEntryCount}`);

    // Verify the data
    const totalRegistrations = await prisma.registration.count({
      where: { tournamentId: tournament.id }
    });

    const pendingVerifications = await prisma.paymentVerification.count({
      where: { 
        tournamentId: tournament.id,
        status: 'pending'
      }
    });

    const adminNotifications = await prisma.notification.count({
      where: { 
        userId: adminUser.id,
        type: 'PAYMENT_VERIFICATION'
      }
    });

    console.log('🔍 Verification:');
    console.log(`  📋 Total tournament registrations: ${totalRegistrations}`);
    console.log(`  ⏳ Pending payment verifications: ${pendingVerifications}`);
    console.log(`  🔔 Admin notifications: ${adminNotifications}`);

    // Show category distribution
    const categoryStats = await prisma.registration.groupBy({
      by: ['categoryId'],
      where: { tournamentId: tournament.id },
      _count: { id: true }
    });

    console.log('📈 Category distribution:');
    for (const stat of categoryStats) {
      const category = tournament.categories.find(c => c.id === stat.categoryId);
      console.log(`  - ${category?.name || 'Unknown'}: ${stat._count.id} registrations`);
    }

    console.log('✅ All 128 users have submitted registrations for the tournament!');
    console.log('🔔 Admin will receive notifications for payment verification');
    console.log('⏳ All registrations are PENDING admin approval');
    console.log('💰 Payment verification page will show all pending payments');
    console.log('📊 User ledger system has recorded all pending transactions');
    console.log('🔴 IMPORTANT: Nothing is confirmed until admin approves!');

  } catch (error) {
    console.error('❌ Error in tournament registration simulation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulate128TournamentRegistrations();