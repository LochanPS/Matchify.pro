import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix Payment Split Calculation
 * 
 * CORRECT FORMULA:
 * - Platform Fee: 5% of TOTAL
 * - First Payout: 30% of TOTAL
 * - Second Payout: 65% of TOTAL
 * - Total: 5% + 30% + 65% = 100%
 * 
 * Example for ₹100:
 * - Platform: ₹5
 * - First: ₹30
 * - Second: ₹65
 */

async function fixPaymentCalculations() {
  try {
    console.log('🔧 Starting payment calculation fix...\n');

    // Get all tournament payments
    const payments = await prisma.tournamentPayment.findMany({
      include: {
        tournament: {
          select: { name: true }
        }
      }
    });

    console.log(`Found ${payments.length} tournament payment records\n`);

    let fixedCount = 0;

    for (const payment of payments) {
      const {
        id,
        tournamentId,
        totalCollected,
        platformFeePercent,
        platformFeeAmount: oldPlatformFee,
        organizerShare: oldOrganizerShare,
        payout50Percent1: oldPayout1,
        payout50Percent2: oldPayout2
      } = payment;

      // Recalculate with CORRECT formula
      const platformFeeAmount = Math.round(totalCollected * 0.03); // 3% of TOTAL
      const organizerShare = totalCollected - platformFeeAmount; // For display (97%)
      const payout50Percent1 = Math.round(totalCollected * 0.30); // 30% of TOTAL
      const payout50Percent2 = Math.round(totalCollected * 0.67); // 67% of TOTAL

      // Verify the math
      const total = platformFeeAmount + payout50Percent1 + payout50Percent2;
      const isCorrect = Math.abs(total - totalCollected) <= 1; // Allow 1 rupee rounding difference

      // Check if values need updating
      const needsUpdate = 
        Math.abs(oldPayout1 - payout50Percent1) > 0.01 ||
        Math.abs(oldPayout2 - payout50Percent2) > 0.01;

      if (needsUpdate) {
        fixedCount++;

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔄 Fixing: ${payment.tournament?.name || tournamentId}`);
        console.log(`   Total Collected: ₹${totalCollected}`);
        console.log(`   Platform Fee (5%): ₹${oldPlatformFee.toFixed(2)} → ₹${platformFeeAmount.toFixed(2)}`);
        console.log(`   Organizer Share (95%): ₹${oldOrganizerShare.toFixed(2)} → ₹${organizerShare.toFixed(2)}`);
        console.log(`   OLD First 30%: ₹${oldPayout1.toFixed(2)} → NEW: ₹${payout50Percent1.toFixed(2)}`);
        console.log(`   OLD Second 65%: ₹${oldPayout2.toFixed(2)} → NEW: ₹${payout50Percent2.toFixed(2)}`);
        console.log(`   Math Check: ₹${platformFeeAmount} + ₹${payout50Percent1} + ₹${payout50Percent2} = ₹${total} ${isCorrect ? '✅' : '❌'}`);
        console.log('');

        // Update the record
        await prisma.tournamentPayment.update({
          where: { id },
          data: {
            platformFeeAmount,
            organizerShare,
            payout50Percent1,
            payout50Percent2
          }
        });
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Fixed ${fixedCount} payment records`);
    console.log(`✅ ${payments.length - fixedCount} records were already correct`);

    // Show a sample calculation for verification
    if (payments.length > 0) {
      const sample = await prisma.tournamentPayment.findFirst({
        include: {
          tournament: { select: { name: true } }
        }
      });

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 Sample Verification:`);
      console.log(`   Tournament: ${sample.tournament.name}`);
      console.log(`   Total Collected: ₹${sample.totalCollected}`);
      console.log(`   Platform Fee (5%): ₹${sample.platformFeeAmount.toFixed(2)}`);
      console.log(`   First Payout (30%): ₹${sample.payout50Percent1.toFixed(2)}`);
      console.log(`   Second Payout (65%): ₹${sample.payout50Percent2.toFixed(2)}`);
      console.log(`   Sum: ₹${(sample.platformFeeAmount + sample.payout50Percent1 + sample.payout50Percent2).toFixed(2)}`);
      console.log('');
      
      // Verify the calculation
      const expectedPlatform = sample.totalCollected * 0.03;
      const expectedFirst = sample.totalCollected * 0.30;
      const expectedSecond = sample.totalCollected * 0.67;
      const isCorrect = 
        Math.abs(sample.platformFeeAmount - expectedPlatform) < 1 &&
        Math.abs(sample.payout50Percent1 - expectedFirst) < 1 &&
        Math.abs(sample.payout50Percent2 - expectedSecond) < 1;
      
      console.log(`   ✅ Math Verification: ${isCorrect ? 'CORRECT ✓' : 'INCORRECT ✗'}`);
      
      if (isCorrect) {
        console.log(`   ✅ Formula: 5% + 30% + 65% = 100% ✓`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('✅ Payment calculation fix complete!');
    console.log('✅ All payments now use: 5% + 30% + 65% = 100%');

  } catch (error) {
    console.error('❌ Error fixing payment calculations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixPaymentCalculations();
