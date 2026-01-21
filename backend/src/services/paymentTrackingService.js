import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Update or create tournament payment record when registrations change
 */
export async function updateTournamentPaymentRecord(tournamentId) {
  try {
    console.log(`💰 Updating payment record for tournament: ${tournamentId}`);
    
    // Get tournament details
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        organizerId: true
      }
    });
    
    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }
    
    // Get all confirmed registrations for this tournament
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId,
        status: 'confirmed'
      },
      select: {
        id: true,
        amountTotal: true,
        paymentStatus: true
      }
    });
    
    // Calculate totals with CORRECT math: 30% + 65% + 5%
    const totalRegistrations = registrations.length;
    const totalCollected = registrations.reduce((sum, reg) => sum + (reg.amountTotal || 0), 0);
    const platformFeePercent = 5;
    const platformFeeAmount = totalCollected * (platformFeePercent / 100); // 5% to Matchify.pro
    const organizerShare = totalCollected - platformFeeAmount; // 95% to organizer
    
    // Split organizer share: 30% + 65%
    const payout30Percent = totalCollected * 0.30; // First 30% of total (before tournament)
    const payout65Percent = totalCollected * 0.65; // Remaining 65% of total (after tournament)
    
    console.log(`📊 Tournament: ${tournament.name}`);
    console.log(`   Registrations: ${totalRegistrations}`);
    console.log(`   Total Collected: ₹${totalCollected}`);
    console.log(`   Platform Fee (5%): ₹${platformFeeAmount}`);
    console.log(`   Organizer Share (95%): ₹${organizerShare}`);
    console.log(`   First Payout (30%): ₹${payout30Percent}`);
    console.log(`   Second Payout (65%): ₹${payout65Percent}`);
    
    // Check if payment record exists
    const existingPayment = await prisma.tournamentPayment.findUnique({
      where: { tournamentId }
    });
    
    if (existingPayment) {
      // Update existing record
      await prisma.tournamentPayment.update({
        where: { tournamentId },
        data: {
          totalCollected,
          totalRegistrations,
          platformFeeAmount,
          organizerShare,
          payout50Percent1: payout30Percent,
          payout50Percent2: payout65Percent,
          updatedAt: new Date()
        }
      });
      console.log('✅ Payment record updated');
    } else if (totalCollected > 0) {
      // Create new record
      await prisma.tournamentPayment.create({
        data: {
          tournamentId,
          organizerId: tournament.organizerId,
          totalCollected,
          totalRegistrations,
          platformFeePercent,
          platformFeeAmount,
          organizerShare,
          payout50Percent1: payout30Percent,
          payout50Percent2: payout65Percent,
          payout50Status1: 'pending',
          payout50Status2: 'pending'
        }
      });
      console.log('✅ Payment record created');
    }
    
    return {
      totalCollected,
      totalRegistrations,
      platformFeeAmount,
      organizerShare
    };
    
  } catch (error) {
    console.error('❌ Error updating tournament payment record:', error);
    throw error;
  }
}

/**
 * Sync all tournament payment records
 */
export async function syncAllTournamentPayments() {
  try {
    console.log('🔄 Syncing all tournament payment records...');
    
    const tournaments = await prisma.tournament.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`📊 Found ${tournaments.length} tournaments to sync`);
    
    for (const tournament of tournaments) {
      await updateTournamentPaymentRecord(tournament.id);
    }
    
    console.log('✅ All tournament payments synced');
    
  } catch (error) {
    console.error('❌ Error syncing tournament payments:', error);
    throw error;
  }
}

/**
 * Get payment summary for admin dashboard
 */
export async function getPaymentSummary() {
  try {
    const summary = await prisma.tournamentPayment.aggregate({
      _sum: {
        totalCollected: true,
        platformFeeAmount: true,
        organizerShare: true,
        payout50Percent1: true,
        payout50Percent2: true
      },
      _count: {
        id: true
      }
    });
    
    // Get payout status counts
    const [pending50_1, pending50_2, paid50_1, paid50_2] = await Promise.all([
      prisma.tournamentPayment.count({ where: { payout50Status1: 'pending' } }),
      prisma.tournamentPayment.count({ where: { payout50Status2: 'pending' } }),
      prisma.tournamentPayment.count({ where: { payout50Status1: 'paid' } }),
      prisma.tournamentPayment.count({ where: { payout50Status2: 'paid' } })
    ]);
    
    const totalPaidOut = (summary._sum.payout50Percent1 || 0) + (summary._sum.payout50Percent2 || 0);
    const balanceInHand = (summary._sum.totalCollected || 0) - totalPaidOut;
    
    return {
      totalTournaments: summary._count.id,
      totalCollected: summary._sum.totalCollected || 0,
      platformFees: summary._sum.platformFeeAmount || 0,
      organizerShare: summary._sum.organizerShare || 0,
      totalPaidOut,
      balanceInHand,
      payoutStatus: {
        pending50_1,
        pending50_2,
        paid50_1,
        paid50_2
      }
    };
    
  } catch (error) {
    console.error('❌ Error getting payment summary:', error);
    throw error;
  }
}

export default {
  updateTournamentPaymentRecord,
  syncAllTournamentPayments,
  getPaymentSummary
};