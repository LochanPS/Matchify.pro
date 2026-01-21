import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Payment Split Formula (CRITICAL - DO NOT CHANGE):
 * - Platform Fee: 5% of total revenue
 * - Organizer Share: 95% of total revenue
 * - First Payout: 30% of organizer share
 * - Second Payout: 65% of organizer share
 * 
 * Example: ₹160,000 total
 * - Platform: ₹8,000 (5%)
 * - Organizer: ₹152,000 (95%)
 * - First: ₹45,600 (30% of ₹152,000)
 * - Second: ₹98,800 (65% of ₹152,000)
 */

export async function createOrUpdateTournamentPayment(tournamentId) {
  try {
    // Get tournament with registrations
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { paymentStatus: 'approved' }
        },
        categories: true
      }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Calculate total collected from approved registrations
    let totalCollected = 0;
    for (const registration of tournament.registrations) {
      const category = tournament.categories.find(c => c.id === registration.categoryId);
      if (category) {
        totalCollected += category.entryFee;
      }
    }

    const totalRegistrations = tournament.registrations.length;

    // Calculate payment split
    const platformFeePercent = 5;
    const platformFeeAmount = Math.round(totalCollected * (platformFeePercent / 100));
    const organizerShare = totalCollected - platformFeeAmount;

    // CRITICAL: 30% + 65% split (NOT 50-50)
    const payout50Percent1 = Math.round(organizerShare * 0.30); // 30% of organizer share
    const payout50Percent2 = Math.round(organizerShare * 0.65); // 65% of organizer share

    // Create or update tournament payment record
    const existingPayment = await prisma.tournamentPayment.findUnique({
      where: { tournamentId }
    });

    if (existingPayment) {
      return await prisma.tournamentPayment.update({
        where: { tournamentId },
        data: {
          totalCollected,
          totalRegistrations,
          platformFeePercent,
          platformFeeAmount,
          organizerShare,
          payout50Percent1,
          payout50Percent2
        }
      });
    } else {
      return await prisma.tournamentPayment.create({
        data: {
          tournamentId,
          organizerId: tournament.organizerId,
          totalCollected,
          totalRegistrations,
          platformFeePercent,
          platformFeeAmount,
          organizerShare,
          payout50Percent1,
          payout50Percent2,
          payout50Status1: 'pending',
          payout50Status2: 'pending'
        }
      });
    }
  } catch (error) {
    console.error('Error in createOrUpdateTournamentPayment:', error);
    throw error;
  }
}

export async function markPayoutPaid(tournamentId, payoutNumber) {
  try {
    const statusField = payoutNumber === 1 ? 'payout50Status1' : 'payout50Status2';
    const dateField = payoutNumber === 1 ? 'payout50Date1' : 'payout50Date2';

    return await prisma.tournamentPayment.update({
      where: { tournamentId },
      data: {
        [statusField]: 'paid',
        [dateField]: new Date()
      }
    });
  } catch (error) {
    console.error('Error in markPayoutPaid:', error);
    throw error;
  }
}

export async function getTournamentPayment(tournamentId) {
  try {
    return await prisma.tournamentPayment.findUnique({
      where: { tournamentId },
      include: {
        tournament: {
          select: {
            name: true,
            startDate: true,
            endDate: true
          }
        },
        organizer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error in getTournamentPayment:', error);
    throw error;
  }
}

export async function getAllTournamentPayments() {
  try {
    return await prisma.tournamentPayment.findMany({
      include: {
        tournament: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            status: true
          }
        },
        organizer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Error in getAllTournamentPayments:', error);
    throw error;
  }
}
