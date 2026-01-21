import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBulkApproveFix() {
  try {
    console.log('🔍 Testing Bulk Approve Fix...\n');

    // Get a few pending verifications to test with
    const pendingVerifications = await prisma.paymentVerification.findMany({
      where: { status: 'pending' },
      take: 3,
      include: {
        registration: {
          include: {
            user: { select: { name: true, email: true } },
            tournament: { select: { name: true } }
          }
        }
      }
    });

    console.log(`✅ Found ${pendingVerifications.length} pending verifications for testing`);

    if (pendingVerifications.length === 0) {
      console.log('⚠️ No pending verifications found');
      return;
    }

    // Display sample data
    console.log('\n📋 Sample verifications:');
    pendingVerifications.forEach((v, index) => {
      console.log(`${index + 1}. ${v.registration?.user?.name} - ₹${v.amount} - ${v.registration?.tournament?.name}`);
    });

    // Test the bulk approve logic manually
    console.log('\n🧪 Testing bulk approve logic...');
    
    const verificationIds = pendingVerifications.map(v => v.id);
    console.log('Verification IDs to process:', verificationIds.length);

    // Simulate the bulk approve process
    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const id of verificationIds) {
      try {
        const verification = await prisma.paymentVerification.findUnique({
          where: { id },
          include: { 
            registration: {
              include: {
                tournament: true,
                user: true
              }
            }
          }
        });

        if (!verification) {
          failed++;
          errors.push(`Payment verification ${id} not found`);
          continue;
        }

        if (verification.status !== 'pending') {
          failed++;
          errors.push(`Payment ${id} already processed (status: ${verification.status})`);
          continue;
        }

        console.log(`✅ Processing ${verification.registration?.user?.name} - ₹${verification.amount}`);

        // This is where we would update the verification
        // For testing, we'll just simulate without actually updating
        successful++;

      } catch (error) {
        failed++;
        errors.push(`Error processing ${id}: ${error.message}`);
        console.error(`❌ Error processing verification ${id}:`, error.message);
      }
    }

    console.log('\n📊 Test Results:');
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ❌ Failed: ${failed}`);
    if (errors.length > 0) {
      console.log('  🔍 Errors:');
      errors.forEach(error => console.log(`    - ${error}`));
    }

    // Check if there are any issues with the data structure
    console.log('\n🔍 Data Structure Check:');
    const sampleVerification = pendingVerifications[0];
    console.log('Sample verification structure:');
    console.log('  - ID:', sampleVerification.id);
    console.log('  - Status:', sampleVerification.status);
    console.log('  - Registration ID:', sampleVerification.registrationId);
    console.log('  - User Name:', sampleVerification.registration?.user?.name);
    console.log('  - Tournament Name:', sampleVerification.registration?.tournament?.name);

    // Check for potential issues
    console.log('\n🔍 Potential Issues Check:');
    
    // Check if registrations exist
    const registrationCheck = await prisma.registration.findUnique({
      where: { id: sampleVerification.registrationId }
    });
    console.log('  - Registration exists:', !!registrationCheck);
    
    // Check if tournament exists
    if (registrationCheck) {
      const tournamentCheck = await prisma.tournament.findUnique({
        where: { id: registrationCheck.tournamentId }
      });
      console.log('  - Tournament exists:', !!tournamentCheck);
    }

    console.log('\n🎯 Likely Issues:');
    console.log('  1. API endpoint might not be properly handling the request');
    console.log('  2. Authentication might be failing');
    console.log('  3. Database transaction might be timing out');
    console.log('  4. Frontend might not be sending correct data format');

    console.log('\n🔧 Quick Fix Suggestions:');
    console.log('  1. Check server logs for detailed error messages');
    console.log('  2. Test individual approve first to isolate the issue');
    console.log('  3. Verify the bulk API endpoint is receiving requests');
    console.log('  4. Check if admin authentication is working');

  } catch (error) {
    console.error('❌ Error in bulk approve test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBulkApproveFix();